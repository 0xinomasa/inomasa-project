export const inomasaEnvironments = [
  'LOCAL_DEVELOPMENT',
  'AUTOMATED_TEST',
  'PRIVATE_ARC_TESTNET',
  'CLOSED_ARC_TESTNET',
  'PUBLIC_DEMO_TESTNET',
  'MAINNET',
] as const;

export type InomasaEnvironment = (typeof inomasaEnvironments)[number];

export function isInomasaEnvironment(value: string): value is InomasaEnvironment {
  return (inomasaEnvironments as readonly string[]).includes(value);
}
