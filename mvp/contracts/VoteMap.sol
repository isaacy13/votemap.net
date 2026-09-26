// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Minimal ERC-20 (native USDC on Base).
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/// @title VoteMap — one factory for every X/Threads post URL (not one contract per post).
/// @dev Stake native USDC. Each staker sets their own expiry. Fees go to a treasury address.
contract VoteMap {
    IERC20 public immutable usdc;
    address public immutable treasury;
    /// @dev OAuth serverless attester. Signs handle↔wallet binds; no database.
    address public immutable attester;

    uint256 public constant MIN_STAKE = 1_000_000; // 1 USDC (6 decimals)
    uint256 public constant PAY_FEE_BPS = 150; // 1.5%
    uint256 public constant EARLY_FEE_BPS = 1000; // 10%
    uint256 public constant EXPIRY_FEE_BPS = 500; // 5%
    uint256 public constant BPS = 10_000;

    uint8 public constant NET_X = 0;
    uint8 public constant NET_THREADS = 1;

    struct Stake {
        uint256 amount;
        uint64 expiry;
        bool closed;
        bool listed;
    }

    bytes32[] public issueIds;
    mapping(bytes32 => string) public issueUrl;
    mapping(bytes32 => uint256) public issueTotal;
    mapping(bytes32 => address[]) private _stakers;
    mapping(bytes32 => mapping(address => Stake)) public stakes;

    mapping(address => string) public xHandle;
    mapping(address => string) public threadsHandle;
    /// @dev keccak256(network, keccak256(bytes(handle))) => wallet
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
    event HandleBound(address indexed wallet, uint8 network, string handle);

    constructor(address usdc_, address treasury_, address attester_) {
        require(usdc_ != address(0) && treasury_ != address(0) && attester_ != address(0), "zero");
        usdc = IERC20(usdc_);
        treasury = treasury_;
        attester = attester_;
    }

    function issueCount() external view returns (uint256) {
        return issueIds.length;
    }

    function stakerCount(bytes32 id) external view returns (uint256) {
        return _stakers[id].length;
    }

    function getStake(bytes32 id, address wallet)
        external
        view
        returns (uint256 amount, uint64 expiry, bool closed)
    {
        Stake storage s = stakes[id][wallet];
        return (s.amount, s.expiry, s.closed);
    }

    function getStakerAt(bytes32 id, uint256 i)
        external
        view
        returns (address wallet, uint256 amount, uint64 expiry, bool closed)
    {
        wallet = _stakers[id][i];
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

    /// @notice Bind an OAuth'd X or Threads handle to msg.sender. Signature from the attester.
    function bindHandle(uint8 network, string calldata handle, uint64 deadline, bytes calldata signature)
        external
    {
        require(network <= NET_THREADS, "network");
        require(block.timestamp <= deadline, "deadline");
        string memory h = _norm(handle);
        require(bytes(h).length > 0, "handle");

        bytes32 inner = keccak256(
            abi.encode(msg.sender, network, keccak256(bytes(h)), deadline, address(this), block.chainid)
        );
        require(_recover(inner, signature) == attester, "attester");

        bytes32 key = handleKey(network, h);
        address existing = walletOfHandle[key];
        require(existing == address(0) || existing == msg.sender, "taken");

        string memory prev = network == NET_X ? xHandle[msg.sender] : threadsHandle[msg.sender];
        if (bytes(prev).length > 0) {
            delete walletOfHandle[handleKey(network, prev)];
        }

        walletOfHandle[key] = msg.sender;
        if (network == NET_X) xHandle[msg.sender] = h;
        else threadsHandle[msg.sender] = h;

        emit HandleBound(msg.sender, network, h);
    }

    /// @notice First stake on a canonical post URL creates the issue; later stakes join it.
    ///         Caller must pick their own expiry (unix seconds, in the future). Min 1 USDC.
    function stake(string calldata url, uint64 expiry, uint256 amount) external {
        require(amount >= MIN_STAKE, "min 1 USDC");
        require(expiry > block.timestamp, "expiry");
        uint256 urlLen = bytes(url).length;
        require(urlLen > 0 && urlLen < 512, "url");

        bytes32 id = issueIdOf(url);
        if (bytes(issueUrl[id]).length == 0) {
            issueUrl[id] = url;
            issueIds.push(id);
            emit IssueCreated(id, url, msg.sender);
        }

        Stake storage s = stakes[id][msg.sender];
        require(s.amount == 0, "already");

        require(usdc.transferFrom(msg.sender, address(this), amount), "pull");

        if (!s.listed) {
            _stakers[id].push(msg.sender);
            s.listed = true;
        }
        s.amount = amount;
        s.expiry = expiry;
        s.closed = false;
        issueTotal[id] += amount;

        emit Staked(id, msg.sender, amount, expiry);
    }

    /// @notice Pay this staker's USDC to an OAuth-bound handle. 1.5% treasury fee.
    function paySolver(bytes32 id, uint8 network, string calldata handle) external {
        require(network <= NET_THREADS, "network");
        Stake storage s = stakes[id][msg.sender];
        uint256 amount = s.amount;
        require(amount > 0 && !s.closed, "no stake");

        string memory h = _norm(handle);
        address solver = walletOfHandle[handleKey(network, h)];
        require(solver != address(0), "unbound");

        s.amount = 0;
        s.closed = true;
        issueTotal[id] -= amount;

        uint256 fee = (amount * PAY_FEE_BPS) / BPS;
        require(usdc.transfer(treasury, fee), "fee");
        require(usdc.transfer(solver, amount - fee), "pay");

        emit Paid(id, msg.sender, solver, h, amount - fee, fee);
    }

    /// @notice Withdraw before this staker's expiry. 10% treasury fee.
    function withdrawEarly(bytes32 id) external {
        Stake storage s = stakes[id][msg.sender];
        uint256 amount = s.amount;
        require(amount > 0 && !s.closed, "no stake");
        require(block.timestamp < s.expiry, "expired");

        s.amount = 0;
        s.closed = true;
        issueTotal[id] -= amount;

        uint256 fee = (amount * EARLY_FEE_BPS) / BPS;
        require(usdc.transfer(treasury, fee), "fee");
        require(usdc.transfer(msg.sender, amount - fee), "refund");

        emit WithdrawnEarly(id, msg.sender, amount - fee, fee);
    }

    /// @notice Withdraw after this staker's expiry. 5% treasury fee.
    function withdrawExpired(bytes32 id) external {
        Stake storage s = stakes[id][msg.sender];
        uint256 amount = s.amount;
        require(amount > 0 && !s.closed, "no stake");
        require(block.timestamp >= s.expiry, "not yet");

        s.amount = 0;
        s.closed = true;
        issueTotal[id] -= amount;

        uint256 fee = (amount * EXPIRY_FEE_BPS) / BPS;
        require(usdc.transfer(treasury, fee), "fee");
        require(usdc.transfer(msg.sender, amount - fee), "refund");

        emit WithdrawnExpired(id, msg.sender, amount - fee, fee);
    }

    function _norm(string calldata s) internal pure returns (string memory) {
        bytes memory b = bytes(s);
        uint256 start = 0;
        if (b.length > 0 && b[0] == "@") start = 1;
        bytes memory out = new bytes(b.length - start);
        for (uint256 i = 0; i < out.length; i++) {
            bytes1 c = b[i + start];
            if (c >= 0x41 && c <= 0x5A) out[i] = bytes1(uint8(c) + 32);
            else out[i] = c;
        }
        return string(out);
    }

    function _recover(bytes32 inner, bytes calldata signature) internal pure returns (address) {
        require(signature.length == 65, "sig");
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := calldataload(signature.offset)
            s := calldataload(add(signature.offset, 32))
            v := byte(0, calldataload(add(signature.offset, 64)))
        }
        if (v < 27) v += 27;
        bytes32 digest = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", inner));
        return ecrecover(digest, v, r, s);
    }
}
