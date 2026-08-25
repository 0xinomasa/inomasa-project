export const usdcDecimals = 6;
const usdcScale = 10n ** BigInt(usdcDecimals);

export type UsdcMicroAmount = bigint & { readonly __brand: 'UsdcMicroAmount' };

export function parseUsdcAmount(value: string): UsdcMicroAmount {
  if (!/^(0|[1-9]\d*)(\.\d{1,6})?$/.test(value)) {
    throw new Error('USDC amount must be a non-negative decimal with at most 6 fractional digits.');
  }

  const [whole = '0', fractional = ''] = value.split('.');
  const amount = BigInt(whole) * usdcScale + BigInt(fractional.padEnd(usdcDecimals, '0'));
  return amount as UsdcMicroAmount;
}

export function formatUsdcAmount(amount: UsdcMicroAmount): string {
  if (amount < 0n) {
    throw new Error('USDC amount must not be negative.');
  }

  const whole = amount / usdcScale;
  const fractional = (amount % usdcScale).toString().padStart(usdcDecimals, '0');
  return `${whole}.${fractional}`;
}
