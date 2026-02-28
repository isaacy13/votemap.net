export const USDC_MINT_MAINNET = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
export const USDC_MINT_DEVNET  = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
export const USDC_DECIMALS = 6;
// 1 USDC = 1_000_000 micro-units
export const USDC_UNIT = 1_000_000;

// Minimum SOL in escrow to cover rent + fees (~0.01 SOL)
export const ESCROW_MIN_SOL_LAMPORTS = 10_000_000;

export const BOUNTY_CATEGORIES = [
  { value: 'politics', label: 'Politics' },
  { value: 'local',    label: 'Local Issues' },
  { value: 'business', label: 'Business' },
  { value: 'nonprofit',label: 'Nonprofit' },
  { value: 'tech',     label: 'Tech' },
  { value: 'general',  label: 'General' },
] as const;

export const BRAND_GRADIENT = 'linear(to-r, #3b82f6, #8b5cf6, #ef4444)';
export const BRAND_GRADIENT_CSS = 'linear-gradient(to right, #3b82f6, #8b5cf6, #ef4444)';
export const BRAND_BLUE   = '#3b82f6';
export const BRAND_PURPLE = '#8b5cf6';
export const BRAND_RED    = '#ef4444';
