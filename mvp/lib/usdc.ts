import { MIN_STAKE_UNITS, USDC_DECIMALS } from "./fees";

export function parseUsdc(input: string): bigint {
    const t = input.trim();
    if (!t || !/^\d+(\.\d+)?$/.test(t)) throw new Error("amount must be a number");
    const [whole, frac = ""] = t.split(".");
    if (frac.length > USDC_DECIMALS) throw new Error("USDC has 6 decimals");
    const fracPad = (frac + "000000").slice(0, USDC_DECIMALS);
    return BigInt(whole) * BigInt(10) ** BigInt(USDC_DECIMALS) + BigInt(fracPad);
}

export function formatUsdc(amount: bigint): string {
    const neg = amount < BigInt(0);
    const x = neg ? -amount : amount;
    const whole = x / MIN_STAKE_UNITS;
    const frac = (x % MIN_STAKE_UNITS).toString().padStart(USDC_DECIMALS, "0").replace(/0+$/, "");
    return `${neg ? "-" : ""}${whole.toString()}${frac ? `.${frac}` : ""}`;
}
