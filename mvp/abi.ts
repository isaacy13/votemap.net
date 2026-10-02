import { parseAbi } from "viem";

export const voteMapAbi = parseAbi([
    "function usdc() view returns (address)",
    "function treasury() view returns (address)",
    "function votemapSigner() view returns (address)",
    "function owner() view returns (address)",
    "function issueCount() view returns (uint256)",
    "function issueIds(uint256) view returns (bytes32)",
    "function issueUrl(bytes32) view returns (string)",
    "function issueTotal(bytes32) view returns (uint256)",
    "function liveBounty(bytes32 id) view returns (uint256)",
    "function liveBountyByCountry(bytes32 id, bytes2 iso) view returns (uint256)",
    "function stakerCount(bytes32 id) view returns (uint256)",
    "function getStakerAt(bytes32 id, uint256 i) view returns (address wallet, uint256 amount, uint64 expiry, bytes2 country, bool closed)",
    "function countryOf(address wallet) view returns (bytes2)",
    "function countryAllowed(address wallet) view returns (bool)",
    "function allowedCountry(bytes2 iso) view returns (bool)",
    "function identityOf(address) view returns (bytes32 oidcSubHash, string email, string name, uint8 gender, uint16 birthYear, bytes32 phoneHash, bool phoneVerified, bool exists)",
    "function nonces(address) view returns (uint256)",
    "function issueIdOf(string url) pure returns (bytes32)",
    "function domainSeparator() view returns (bytes32)",
    "function stake(string url, uint64 expiry, uint256 amount, uint256 nonce, uint256 deadline, bytes votemapSig)",
    "function pay(bytes32 id, address solver, uint256 nonce, uint256 deadline, bytes votemapSig)",
    "function claim(bytes32 oidcSubHash, string email, string name, uint8 gender, uint16 birthYear, bytes32 phoneHash, bool phoneVerified, uint256 nonce, uint256 deadline, bytes votemapSig)",
    "function withdrawEarly(bytes32 id)",
    "function withdrawExpired(bytes32 id)",
]);

export const erc20Abi = parseAbi([
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
]);
