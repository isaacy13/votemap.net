// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

interface IIndexer {
    function getAttestationUid(address recipient, bytes32 schemaUid) external view returns (bytes32);
}

interface IEAS {
    struct Attestation {
        bytes32 uid;
        bytes32 schema;
        uint64 time;
        uint64 expirationTime;
        uint64 revocationTime;
        bytes32 refUID;
        address recipient;
        address attester;
        bool revocable;
        bytes data;
    }

    function getAttestation(bytes32 uid) external view returns (Attestation memory);
}

/// @title VoteMap
/// @notice One factory on Base. Pots keyed by X, Threads, Instagram, or TikTok URL.
///         Country is read from Coinbase EAS for msg.sender — never a calldata argument.
///         stake / pay / claim need a votemap EIP-712 sig. withdraw / expiry are wallet-only.
contract VoteMap {
    IERC20 public immutable usdc;
    address public immutable treasury;
    IEAS public immutable eas;
    IIndexer public immutable indexer;
    address public immutable countryAttester;
    bytes32 public immutable countrySchema;

    address public owner;
    address public votemapSigner;

    uint256 public constant MIN_STAKE = 1_000_000; // 1 USDC, 6 decimals
    uint256 public constant PAY_FEE_BPS = 150; // 1.5%
    uint256 public constant EARLY_FEE_BPS = 1000; // 10%
    uint256 public constant EXPIRY_FEE_BPS = 500; // 5%
    uint256 public constant SIG_TTL = 1 hours;

    bytes32 public constant DOMAIN_TYPEHASH =
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
    bytes32 public constant NAME_HASH = keccak256("votemap");
    bytes32 public constant VERSION_HASH = keccak256("1");
    bytes32 public constant STAKE_TYPEHASH =
        keccak256("Stake(address staker,string url,uint256 amount,uint64 expiry,uint256 nonce,uint256 deadline)");
    bytes32 public constant PAY_TYPEHASH =
        keccak256("Pay(address staker,bytes32 issueId,address solver,uint256 nonce,uint256 deadline)");
    bytes32 public constant CLAIM_TYPEHASH = keccak256(
        "Claim(address wallet,bytes32 oidcSubHash,string email,string name,uint8 gender,uint16 birthYear,bytes32 phoneHash,bool phoneVerified,uint256 nonce,uint256 deadline)"
    );

    uint256 private locked;

    struct Stake {
        uint256 amount;
        uint64 expiry;
        bytes2 country; // ISO 3166-1 alpha-2 snapshot at stake time
        bool closed;
        bool listed;
    }

    struct Identity {
        bytes32 oidcSubHash;
        string email;
        string name;
        uint8 gender;
        uint16 birthYear;
        bytes32 phoneHash;
        bool phoneVerified;
        bool exists;
    }

    bytes32[] public issueIds;
    mapping(bytes32 => string) public issueUrl;
    mapping(bytes32 => uint256) public issueTotal; // open (including expired until withdrawn)
    mapping(bytes32 => address[]) private stakerList;
    mapping(bytes32 => mapping(address => Stake)) public stakes;
    mapping(bytes2 => bool) public allowedCountry;
    mapping(address => Identity) public identityOf;
    mapping(address => uint256) public nonces;

    event IssueCreated(bytes32 indexed id, string url, address indexed staker);
    event Staked(bytes32 indexed id, address indexed staker, uint256 amount, uint64 expiry, bytes2 country);
    event Paid(bytes32 indexed id, address indexed staker, address indexed solver, uint256 paid, uint256 fee);
    event WithdrawnEarly(bytes32 indexed id, address indexed staker, uint256 refund, uint256 fee);
    event WithdrawnExpired(bytes32 indexed id, address indexed staker, uint256 refund, uint256 fee);
    event Claimed(address indexed wallet, bytes32 oidcSubHash, uint8 gender, uint16 birthYear, bool phoneVerified);
    event CountryAllowed(bytes2 iso, bool allowed);
    event SignerRotated(address indexed prev, address indexed next);
    event OwnerTransferred(address indexed prev, address indexed next);

    /// @param usdc_ Native USDC (6 decimals)
    /// @param treasury_ Fee recipient. Required — no dummy default.
    /// @param signer_ Address of the votemap EIP-712 signer (env key; owner can rotate)
    /// @param indexer_ Coinbase Verifications indexer
    /// @param countryAttester_ Coinbase attester
    /// @param countrySchema_ Verified Country schema UID (`string verifiedCountry`)
    /// Schema UIDs (from coinbase/verifications):
    /// Base:    schema 0x1801901fabd0e6189356b4fb52bb0ab855276d84f7ec140839fbd1f6801ca065
    ///          indexer 0x2c7eE1E5f416dfF40054c27A62f7B357C4E8619C
    ///          attester 0x357458739F90461b99789350868CD7CF330Dd7EE
    /// Sepolia: schema 0xef54ae90f47a187acc050ce631c55584fd4273c0ca9456ab21750921c3a84028
    ///          indexer 0xd147a19c3B085Fb9B0c15D2EAAFC6CB086ea849B
    ///          attester 0xB5644397a9733f86Cacd928478B29b4cD6041C45
    constructor(
        address usdc_,
        address treasury_,
        address signer_,
        address indexer_,
        address countryAttester_,
        bytes32 countrySchema_
    ) {
        require(
            usdc_ != address(0) && treasury_ != address(0) && signer_ != address(0) && indexer_ != address(0)
                && countryAttester_ != address(0) && countrySchema_ != bytes32(0),
            "zero"
        );
        usdc = IERC20(usdc_);
        treasury = treasury_;
        votemapSigner = signer_;
        owner = msg.sender;
        eas = IEAS(0x4200000000000000000000000000000000000021); // OP Stack EAS predeploy
        indexer = IIndexer(indexer_);
        countryAttester = countryAttester_;
        countrySchema = countrySchema_;
        allowedCountry[bytes2("US")] = true;
        emit CountryAllowed(bytes2("US"), true);
    }

    modifier lock() {
        require(locked == 0, "locked");
        locked = 1;
        _;
        locked = 0;
    }

    function issueCount() external view returns (uint256) {
        return issueIds.length;
    }

    function stakerCount(bytes32 id) external view returns (uint256) {
        return stakerList[id].length;
    }

    function getStakerAt(bytes32 id, uint256 i)
        external
        view
        returns (address wallet, uint256 amount, uint64 expiry, bytes2 country, bool closed)
    {
        wallet = stakerList[id][i];
        Stake storage s = stakes[id][wallet];
        return (wallet, s.amount, s.expiry, s.country, s.closed);
    }

    function issueIdOf(string calldata url) public pure returns (bytes32) {
        return keccak256(bytes(url));
    }

    function domainSeparator() public view returns (bytes32) {
        return keccak256(abi.encode(DOMAIN_TYPEHASH, NAME_HASH, VERSION_HASH, block.chainid, address(this)));
    }

    /// @notice Live Coinbase Verified Country for `wallet` (empty if missing / revoked / not allowlisted).
    function countryOf(address wallet) public view returns (bytes2) {
        bytes32 uid = indexer.getAttestationUid(wallet, countrySchema);
        if (uid == bytes32(0)) return bytes2(0);
        IEAS.Attestation memory a = eas.getAttestation(uid);
        if (a.attester != countryAttester || a.recipient != wallet || a.schema != countrySchema) return bytes2(0);
        if (a.revocationTime != 0) return bytes2(0);
        if (a.expirationTime != 0 && a.expirationTime <= block.timestamp) return bytes2(0);
        return _iso(a.data);
    }

    function countryAllowed(address wallet) public view returns (bool) {
        bytes2 iso = countryOf(wallet);
        return iso != bytes2(0) && allowedCountry[iso];
    }

    /// @notice Unexpired open USDC. Does not re-query EAS — uses the snapshot on each line.
    function liveBounty(bytes32 id) external view returns (uint256 total) {
        address[] storage list = stakerList[id];
        uint256 n = list.length;
        for (uint256 i; i < n; i++) {
            Stake storage s = stakes[id][list[i]];
            if (!s.closed && s.amount > 0 && s.expiry > block.timestamp) total += s.amount;
        }
    }

    function liveBountyByCountry(bytes32 id, bytes2 iso) external view returns (uint256 total) {
        address[] storage list = stakerList[id];
        uint256 n = list.length;
        for (uint256 i; i < n; i++) {
            Stake storage s = stakes[id][list[i]];
            if (!s.closed && s.amount > 0 && s.expiry > block.timestamp && s.country == iso) total += s.amount;
        }
    }

    function setAllowedCountry(bytes2 iso, bool allowed) external {
        require(msg.sender == owner || msg.sender == treasury, "admin");
        require(iso != bytes2(0), "iso");
        allowedCountry[iso] = allowed;
        emit CountryAllowed(iso, allowed);
    }

    function setSigner(address next) external {
        require(msg.sender == owner, "owner");
        require(next != address(0), "zero");
        emit SignerRotated(votemapSigner, next);
        votemapSigner = next;
    }

    function transferOwnership(address next) external {
        require(msg.sender == owner, "owner");
        require(next != address(0), "zero");
        emit OwnerTransferred(owner, next);
        owner = next;
    }

    /// @notice Bind this wallet to votemap identity. Remix without a votemap sig reverts.
    function claim(
        bytes32 oidcSubHash,
        string calldata email,
        string calldata name,
        uint8 gender,
        uint16 birthYear,
        bytes32 phoneHash,
        bool phoneVerified,
        uint256 nonce,
        uint256 deadline,
        bytes calldata votemapSig
    ) external lock {
        _needSig(
            keccak256(
                abi.encode(
                    CLAIM_TYPEHASH,
                    msg.sender,
                    oidcSubHash,
                    keccak256(bytes(email)),
                    keccak256(bytes(name)),
                    gender,
                    birthYear,
                    phoneHash,
                    phoneVerified,
                    nonce,
                    deadline
                )
            ),
            nonce,
            deadline,
            votemapSig
        );
        Identity storage idn = identityOf[msg.sender];
        idn.oidcSubHash = oidcSubHash;
        idn.email = email;
        idn.name = name;
        idn.gender = gender;
        idn.birthYear = birthYear;
        idn.phoneHash = phoneHash;
        idn.phoneVerified = phoneVerified;
        idn.exists = true;
        emit Claimed(msg.sender, oidcSubHash, gender, birthYear, phoneVerified);
    }

    function stake(string calldata url, uint64 expiry, uint256 amount, uint256 nonce, uint256 deadline, bytes calldata votemapSig)
        external
        lock
    {
        _needSig(
            keccak256(
                abi.encode(STAKE_TYPEHASH, msg.sender, keccak256(bytes(url)), amount, expiry, nonce, deadline)
            ),
            nonce,
            deadline,
            votemapSig
        );
        require(amount >= MIN_STAKE, "min 1 USDC");
        require(expiry > block.timestamp, "expiry");
        _okUrl(url);

        bytes2 iso = countryOf(msg.sender);
        require(iso != bytes2(0) && allowedCountry[iso], "country");

        bytes32 id = issueIdOf(url);
        if (bytes(issueUrl[id]).length == 0) {
            issueUrl[id] = url;
            issueIds.push(id);
            emit IssueCreated(id, url, msg.sender);
        }

        Stake storage s = stakes[id][msg.sender];
        require(s.amount == 0, "already");
        if (!s.listed) {
            stakerList[id].push(msg.sender);
            s.listed = true;
        }
        s.amount = amount;
        s.expiry = expiry;
        s.country = iso;
        s.closed = false;
        issueTotal[id] += amount;

        _pull(msg.sender, amount);
        emit Staked(id, msg.sender, amount, expiry, iso);
    }

    /// @notice Pay only this wallet's unexpired line to a claimed solver wallet (not a social handle).
    function pay(bytes32 id, address solver, uint256 nonce, uint256 deadline, bytes calldata votemapSig) external lock {
        _needSig(keccak256(abi.encode(PAY_TYPEHASH, msg.sender, id, solver, nonce, deadline)), nonce, deadline, votemapSig);
        require(identityOf[solver].exists, "unclaimed");

        Stake storage s = stakes[id][msg.sender];
        require(s.amount > 0 && !s.closed, "no stake");
        require(block.timestamp < s.expiry, "expired");
        uint256 amount = _close(id);
        uint256 fee = (amount * PAY_FEE_BPS) / 10_000;
        _push(treasury, fee);
        _push(solver, amount - fee);
        emit Paid(id, msg.sender, solver, amount - fee, fee);
    }

    /// @notice Wallet-only. No votemap sig, so we cannot freeze USDC if the signer is down.
    function withdrawEarly(bytes32 id) external lock {
        Stake storage s = stakes[id][msg.sender];
        require(s.amount > 0 && !s.closed, "no stake");
        require(block.timestamp < s.expiry, "expired");
        uint256 amount = _close(id);
        uint256 fee = (amount * EARLY_FEE_BPS) / 10_000;
        _push(treasury, fee);
        _push(msg.sender, amount - fee);
        emit WithdrawnEarly(id, msg.sender, amount - fee, fee);
    }

    /// @notice Wallet-only. No votemap sig.
    function withdrawExpired(bytes32 id) external lock {
        Stake storage s = stakes[id][msg.sender];
        require(s.amount > 0 && !s.closed, "no stake");
        require(block.timestamp >= s.expiry, "not yet");
        uint256 amount = _close(id);
        uint256 fee = (amount * EXPIRY_FEE_BPS) / 10_000;
        _push(treasury, fee);
        _push(msg.sender, amount - fee);
        emit WithdrawnExpired(id, msg.sender, amount - fee, fee);
    }

    function _needSig(bytes32 structHash, uint256 nonce, uint256 deadline, bytes calldata sig) internal {
        require(nonce == nonces[msg.sender], "nonce");
        require(deadline >= block.timestamp && deadline <= block.timestamp + SIG_TTL, "deadline");
        nonces[msg.sender] = nonce + 1;
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSeparator(), structHash));
        require(_recover(digest, sig) == votemapSigner, "sig");
    }

    function _recover(bytes32 digest, bytes calldata sig) internal pure returns (address) {
        require(sig.length == 65, "siglen");
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := calldataload(sig.offset)
            s := calldataload(add(sig.offset, 32))
            v := byte(0, calldataload(add(sig.offset, 64)))
        }
        if (v < 27) v += 27;
        require(v == 27 || v == 28, "v");
        address recovered = ecrecover(digest, v, r, s);
        require(recovered != address(0), "recover");
        return recovered;
    }

    function _close(bytes32 id) internal returns (uint256 amount) {
        Stake storage s = stakes[id][msg.sender];
        amount = s.amount;
        require(amount > 0 && !s.closed, "no stake");
        s.amount = 0;
        s.closed = true;
        issueTotal[id] -= amount;
    }

    function _okUrl(string calldata url) internal pure {
        bytes memory b = bytes(url);
        require(b.length > 20 && b.length < 512, "url");
        for (uint256 i; i < b.length; i++) {
            require(uint8(b[i]) >= 0x20 && uint8(b[i]) < 0x7f, "char");
        }
        bool ok = _prefix(b, "https://x.com/") || _prefix(b, "https://www.x.com/")
            || _prefix(b, "https://threads.net/") || _prefix(b, "https://www.threads.net/")
            || _prefix(b, "https://threads.com/") || _prefix(b, "https://www.threads.com/")
            || _prefix(b, "https://instagram.com/") || _prefix(b, "https://www.instagram.com/")
            || _prefix(b, "https://tiktok.com/") || _prefix(b, "https://www.tiktok.com/");
        require(ok, "host");
    }

    function _prefix(bytes memory b, bytes memory p) internal pure returns (bool) {
        if (b.length < p.length) return false;
        for (uint256 i; i < p.length; i++) {
            if (b[i] != p[i]) return false;
        }
        return true;
    }

    function _iso(bytes memory data) internal pure returns (bytes2) {
        if (data.length < 64) return bytes2(0);
        uint256 offset;
        assembly {
            offset := mload(add(data, 32))
        }
        if (offset + 34 > data.length) return bytes2(0);
        uint256 len;
        assembly {
            len := mload(add(add(data, 32), offset))
        }
        if (len < 2) return bytes2(0);
        bytes32 word;
        assembly {
            word := mload(add(add(add(data, 32), offset), 32))
        }
        bytes1 a = bytes1(word);
        bytes1 b = bytes1(word << 8);
        if (uint8(a) >= 0x61 && uint8(a) <= 0x7a) a = bytes1(uint8(a) - 32);
        if (uint8(b) >= 0x61 && uint8(b) <= 0x7a) b = bytes1(uint8(b) - 32);
        if (uint8(a) < 0x41 || uint8(a) > 0x5a || uint8(b) < 0x41 || uint8(b) > 0x5a) return bytes2(0);
        return bytes2(abi.encodePacked(a, b));
    }

    function _pull(address from, uint256 amount) internal {
        _xfer(abi.encodeWithSelector(IERC20.transferFrom.selector, from, address(this), amount));
    }

    function _push(address to, uint256 amount) internal {
        if (amount == 0) return;
        _xfer(abi.encodeWithSelector(IERC20.transfer.selector, to, amount));
    }

    function _xfer(bytes memory data) internal {
        (bool ok, bytes memory ret) = address(usdc).call(data);
        require(ok && (ret.length == 0 || abi.decode(ret, (bool))), "usdc");
    }
}
