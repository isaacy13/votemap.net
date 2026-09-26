/** Protocol fees (basis points, / 10_000). Gas in ETH is paid by the clicking user — not these. */
export const PAY_FEE_BPS = 150; // 1.5% when paying a solver
export const EARLY_FEE_BPS = 1000; // 10% early withdraw
export const EXPIRY_FEE_BPS = 500; // 5% after this staker's expiry
export const MIN_STAKE_USDC = 1;
export const USDC_DECIMALS = 6;
export const MIN_STAKE_UNITS = BigInt(1_000_000);

export function feeOn(amount: bigint, bps: number): bigint {
    return (amount * BigInt(bps)) / BigInt(10_000);
}
