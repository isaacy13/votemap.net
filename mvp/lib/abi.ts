export const voteMapAbi = [
    {
        type: "constructor",
        inputs: [
            { name: "usdc_", type: "address" },
            { name: "treasury_", type: "address" },
            { name: "attester_", type: "address" },
        ],
    },
    {
        type: "function",
        name: "usdc",
        stateMutability: "view",
        inputs: [],
        outputs: [{ type: "address" }],
    },
    {
        type: "function",
        name: "treasury",
        stateMutability: "view",
        inputs: [],
        outputs: [{ type: "address" }],
    },
    {
        type: "function",
        name: "attester",
        stateMutability: "view",
        inputs: [],
        outputs: [{ type: "address" }],
    },
    {
        type: "function",
        name: "issueCount",
        stateMutability: "view",
        inputs: [],
        outputs: [{ type: "uint256" }],
    },
    {
        type: "function",
        name: "issueIds",
        stateMutability: "view",
        inputs: [{ name: "", type: "uint256" }],
        outputs: [{ type: "bytes32" }],
    },
    {
        type: "function",
        name: "issueUrl",
        stateMutability: "view",
        inputs: [{ name: "", type: "bytes32" }],
        outputs: [{ type: "string" }],
    },
    {
        type: "function",
        name: "issueTotal",
        stateMutability: "view",
        inputs: [{ name: "", type: "bytes32" }],
        outputs: [{ type: "uint256" }],
    },
    {
        type: "function",
        name: "stakerCount",
        stateMutability: "view",
        inputs: [{ name: "id", type: "bytes32" }],
        outputs: [{ type: "uint256" }],
    },
    {
        type: "function",
        name: "getStake",
        stateMutability: "view",
        inputs: [
            { name: "id", type: "bytes32" },
            { name: "wallet", type: "address" },
        ],
        outputs: [
            { name: "amount", type: "uint256" },
            { name: "expiry", type: "uint64" },
            { name: "closed", type: "bool" },
        ],
    },
    {
        type: "function",
        name: "getStakerAt",
        stateMutability: "view",
        inputs: [
            { name: "id", type: "bytes32" },
            { name: "i", type: "uint256" },
        ],
        outputs: [
            { name: "wallet", type: "address" },
            { name: "amount", type: "uint256" },
            { name: "expiry", type: "uint64" },
            { name: "closed", type: "bool" },
        ],
    },
    {
        type: "function",
        name: "handlesOf",
        stateMutability: "view",
        inputs: [{ name: "wallet", type: "address" }],
        outputs: [
            { name: "x", type: "string" },
            { name: "threads", type: "string" },
        ],
    },
    {
        type: "function",
        name: "walletOfHandle",
        stateMutability: "view",
        inputs: [{ name: "", type: "bytes32" }],
        outputs: [{ type: "address" }],
    },
    {
        type: "function",
        name: "handleKey",
        stateMutability: "pure",
        inputs: [
            { name: "network", type: "uint8" },
            { name: "handle", type: "string" },
        ],
        outputs: [{ type: "bytes32" }],
    },
    {
        type: "function",
        name: "issueIdOf",
        stateMutability: "pure",
        inputs: [{ name: "url", type: "string" }],
        outputs: [{ type: "bytes32" }],
    },
    {
        type: "function",
        name: "bindHandle",
        stateMutability: "nonpayable",
        inputs: [
            { name: "network", type: "uint8" },
            { name: "handle", type: "string" },
            { name: "deadline", type: "uint64" },
            { name: "signature", type: "bytes" },
        ],
        outputs: [],
    },
    {
        type: "function",
        name: "stake",
        stateMutability: "nonpayable",
        inputs: [
            { name: "url", type: "string" },
            { name: "expiry", type: "uint64" },
            { name: "amount", type: "uint256" },
        ],
        outputs: [],
    },
    {
        type: "function",
        name: "paySolver",
        stateMutability: "nonpayable",
        inputs: [
            { name: "id", type: "bytes32" },
            { name: "network", type: "uint8" },
            { name: "handle", type: "string" },
        ],
        outputs: [],
    },
    {
        type: "function",
        name: "withdrawEarly",
        stateMutability: "nonpayable",
        inputs: [{ name: "id", type: "bytes32" }],
        outputs: [],
    },
    {
        type: "function",
        name: "withdrawExpired",
        stateMutability: "nonpayable",
        inputs: [{ name: "id", type: "bytes32" }],
        outputs: [],
    },
] as const;

export const erc20Abi = [
    {
        type: "function",
        name: "approve",
        stateMutability: "nonpayable",
        inputs: [
            { name: "spender", type: "address" },
            { name: "amount", type: "uint256" },
        ],
        outputs: [{ type: "bool" }],
    },
    {
        type: "function",
        name: "allowance",
        stateMutability: "view",
        inputs: [
            { name: "owner", type: "address" },
            { name: "spender", type: "address" },
        ],
        outputs: [{ type: "uint256" }],
    },
    {
        type: "function",
        name: "balanceOf",
        stateMutability: "view",
        inputs: [{ name: "account", type: "address" }],
        outputs: [{ type: "uint256" }],
    },
    {
        type: "function",
        name: "decimals",
        stateMutability: "view",
        inputs: [],
        outputs: [{ type: "uint8" }],
    },
] as const;

export const indexerAbi = [
    {
        type: "function",
        name: "getAttestationUid",
        stateMutability: "view",
        inputs: [
            { name: "recipient", type: "address" },
            { name: "schemaUid", type: "bytes32" },
        ],
        outputs: [{ type: "bytes32" }],
    },
] as const;

export const easAbi = [
    {
        type: "function",
        name: "getAttestation",
        stateMutability: "view",
        inputs: [{ name: "uid", type: "bytes32" }],
        outputs: [
            {
                name: "",
                type: "tuple",
                components: [
                    { name: "uid", type: "bytes32" },
                    { name: "schema", type: "bytes32" },
                    { name: "time", type: "uint64" },
                    { name: "expirationTime", type: "uint64" },
                    { name: "revocationTime", type: "uint64" },
                    { name: "refUID", type: "bytes32" },
                    { name: "recipient", type: "address" },
                    { name: "attester", type: "address" },
                    { name: "revocable", type: "bool" },
                    { name: "data", type: "bytes" },
                ],
            },
        ],
    },
] as const;
