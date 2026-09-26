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

/// @title VoteMap — one factory, x.com pots only. No attester key.
contract VoteMap {
    IERC20 public immutable usdc;
    address public immutable treasury;
    IEAS public immutable eas;
    IIndexer public immutable indexer;
    address public immutable countryAttester;
    bytes32 public immutable countrySchema;

    uint256 public constant MIN_STAKE = 1_000_000; // 1 USDC, 6 decimals
    uint256 public constant PAY_FEE_BPS = 150;
    uint256 public constant EARLY_FEE_BPS = 1000;
    uint256 public constant EXPIRY_FEE_BPS = 500;

    uint8 public constant NET_X = 0;
    uint8 public constant NET_THREADS = 1;

    uint256 private locked;

    struct Stake {
        uint256 amount;
        uint64 expiry;
        bool closed;
        bool listed;
    }

    bytes32[] public issueIds;
    mapping(bytes32 => string) public issueUrl;
    mapping(bytes32 => uint256) public issueTotal;
    mapping(bytes32 => address[]) private stakerList;
    mapping(bytes32 => mapping(address => Stake)) public stakes;

    mapping(address => string) public xHandle;
    mapping(address => string) public threadsHandle;
    mapping(bytes32 => address) public walletOfHandle;

    event IssueCreated(bytes32 indexed id, string url, address indexed staker);
    event Staked(bytes32 indexed id, address indexed staker, uint256 amount, uint64 expiry);
    event Paid(
        bytes32 indexed id,
        address indexed staker,
        address indexed solver,
        string handle,
        uint256 paid,
        uint256 fee
    );
    event WithdrawnEarly(bytes32 indexed id, address indexed staker, uint256 refund, uint256 fee);
    event WithdrawnExpired(bytes32 indexed id, address indexed staker, uint256 refund, uint256 fee);
    event HandleRegistered(address indexed wallet, uint8 network, string handle);

    /// @param usdc_ Native USDC (6 decimals)
    /// @param treasury_ Fee recipient. Required — no dummy default.
    /// @param indexer_ Coinbase Verifications indexer
    /// @param countryAttester_ Coinbase attester (not a votemap key)
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
        address indexer_,
        address countryAttester_,
        bytes32 countrySchema_
    ) {
        require(
            usdc_ != address(0) && treasury_ != address(0) && indexer_ != address(0) && countryAttester_ != address(0)
                && countrySchema_ != bytes32(0),
            "zero"
        );
        usdc = IERC20(usdc_);
        treasury = treasury_;
        eas = IEAS(0x4200000000000000000000000000000000000021); // OP Stack EAS predeploy (Base + Base Sepolia)
        indexer = IIndexer(indexer_);
        countryAttester = countryAttester_;
        countrySchema = countrySchema_;
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
        returns (address wallet, uint256 amount, uint64 expiry, bool closed)
    {
        wallet = stakerList[id][i];
        Stake storage s = stakes[id][wallet];
        return (wallet, s.amount, s.expiry, s.closed);
    }

    function handlesOf(address wallet) external view returns (string memory x, string memory threads) {
        return (xHandle[wallet], threadsHandle[wallet]);
    }

    function issueIdOf(string calldata url) public pure returns (bytes32) {
        return keccak256(bytes(url));
    }

    function handleKey(uint8 network, string memory handle) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(network, keccak256(bytes(handle))));
    }

    /// @notice Coinbase Verified Country (EAS). Empty / missing country fails.
    function countryOk(address wallet) public view returns (bool) {
        bytes32 uid = indexer.getAttestationUid(wallet, countrySchema);
        if (uid == bytes32(0)) return false;
        IEAS.Attestation memory a = eas.getAttestation(uid);
        if (a.attester != countryAttester || a.recipient != wallet || a.schema != countrySchema) return false;
        if (a.revocationTime != 0) return false;
        if (a.expirationTime != 0 && a.expirationTime <= block.timestamp) return false;
        return _countryLen(a.data) >= 2;
    }

    /// @notice First wallet to claim a handle owns it. No server signer.
    function registerHandle(uint8 network, string calldata handle) external {
        require(network <= NET_THREADS, "network");
        string memory h = _normHandle(handle);
        bytes32 key = handleKey(network, h);
        address existing = walletOfHandle[key];
        require(existing == address(0) || existing == msg.sender, "taken");

        string memory prev = network == NET_X ? xHandle[msg.sender] : threadsHandle[msg.sender];
        if (bytes(prev).length > 0) delete walletOfHandle[handleKey(network, prev)];

        walletOfHandle[key] = msg.sender;
        if (network == NET_X) xHandle[msg.sender] = h;
        else threadsHandle[msg.sender] = h;
        emit HandleRegistered(msg.sender, network, h);
    }

    function stake(string calldata url, uint64 expiry, uint256 amount) external lock {
        _needCountry();
        require(_linked(msg.sender), "handle");
        require(amount >= MIN_STAKE, "min 1 USDC");
        require(expiry > block.timestamp, "expiry");
        _okUrl(url);

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
        s.closed = false;
        issueTotal[id] += amount;

        _pull(msg.sender, amount);
        emit Staked(id, msg.sender, amount, expiry);
    }

    /// @notice Pay only this wallet's unexpired stake. Cannot drain the pot.
    function paySolver(bytes32 id, uint8 network, string calldata handle) external lock {
        _needCountry();
        require(network <= NET_THREADS, "network");
        string memory h = _normHandle(handle);
        address solver = walletOfHandle[handleKey(network, h)];
        require(solver != address(0), "unbound");

        Stake storage s = stakes[id][msg.sender];
        require(s.amount > 0 && !s.closed, "no stake");
        require(block.timestamp < s.expiry, "expired");
        uint256 amount = _close(id);
        uint256 fee = (amount * PAY_FEE_BPS) / 10_000;
        _push(treasury, fee);
        _push(solver, amount - fee);
        emit Paid(id, msg.sender, solver, h, amount - fee, fee);
    }

    function withdrawEarly(bytes32 id) external lock {
        _needCountry();
        Stake storage s = stakes[id][msg.sender];
        require(s.amount > 0 && !s.closed, "no stake");
        require(block.timestamp < s.expiry, "expired");
        uint256 amount = _close(id);
        uint256 fee = (amount * EARLY_FEE_BPS) / 10_000;
        _push(treasury, fee);
        _push(msg.sender, amount - fee);
        emit WithdrawnEarly(id, msg.sender, amount - fee, fee);
    }

    function withdrawExpired(bytes32 id) external lock {
        _needCountry();
        Stake storage s = stakes[id][msg.sender];
        require(s.amount > 0 && !s.closed, "no stake");
        require(block.timestamp >= s.expiry, "not yet");
        uint256 amount = _close(id);
        uint256 fee = (amount * EXPIRY_FEE_BPS) / 10_000;
        _push(treasury, fee);
        _push(msg.sender, amount - fee);
        emit WithdrawnExpired(id, msg.sender, amount - fee, fee);
    }

    function _needCountry() internal view {
        require(countryOk(msg.sender), "country");
    }

    function _close(bytes32 id) internal returns (uint256 amount) {
        Stake storage s = stakes[id][msg.sender];
        amount = s.amount;
        require(amount > 0 && !s.closed, "no stake");
        s.amount = 0;
        s.closed = true;
        issueTotal[id] -= amount;
    }

    function _linked(address wallet) internal view returns (bool) {
        return bytes(xHandle[wallet]).length > 0 || bytes(threadsHandle[wallet]).length > 0;
    }

    function _okUrl(string calldata url) internal pure {
        bytes memory b = bytes(url);
        require(b.length > 16 && b.length < 512, "url");
        require(_prefix(b, "https://x.com/"), "host");
    }

    function _prefix(bytes memory b, bytes memory p) internal pure returns (bool) {
        if (b.length < p.length) return false;
        for (uint256 i; i < p.length; i++) if (b[i] != p[i]) return false;
        return true;
    }

    function _countryLen(bytes memory data) internal pure returns (uint256) {
        if (data.length < 64) return 0;
        uint256 offset;
        assembly {
            offset := mload(add(data, 32))
        }
        if (offset + 32 > data.length) return 0;
        uint256 len;
        assembly {
            len := mload(add(add(data, 32), offset))
        }
        return len;
    }

    function _normHandle(string calldata raw) internal pure returns (string memory) {
        bytes memory b = bytes(raw);
        uint256 start = 0;
        if (b.length > 0 && b[0] == "@") start = 1;
        uint256 n = b.length - start;
        require(n > 0 && n <= 30, "handle");
        bytes memory out = new bytes(n);
        for (uint256 i; i < n; i++) {
            bytes1 c = b[i + start];
            if (c >= 0x41 && c <= 0x5A) c = bytes1(uint8(c) + 32);
            require((c >= 0x30 && c <= 0x39) || (c >= 0x61 && c <= 0x7A) || c == 0x5F, "char");
            out[i] = c;
        }
        return string(out);
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
