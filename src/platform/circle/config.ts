import type { InomasaEnvironment } from '../../shared/environment.ts';

export interface CircleDeveloperWalletConfig {
  readonly apiKey: string;
  readonly entitySecret: string;
  readonly environment: Exclude<InomasaEnvironment, 'MAINNET'>;
  readonly walletSetId: string;
}

export class CircleConfigurationError extends Error {
  override readonly name = 'CircleConfigurationError';
}

function requireSecret(
  environment: Readonly<Record<string, string | undefined>>,
  name: 'CIRCLE_API_KEY' | 'CIRCLE_ENTITY_SECRET',
): string {
  const value = environment[name]?.trim();

  if (value === undefined || value.length === 0) {
    throw new CircleConfigurationError(`${name} is required for Circle wallet operations.`);
  }

  return value;
}

export function readCircleDeveloperWalletConfig(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): CircleDeveloperWalletConfig {
  const inomasaEnvironment = environment['INOMASA_ENV']?.trim();

  if (
    inomasaEnvironment !== 'LOCAL_DEVELOPMENT' &&
    inomasaEnvironment !== 'AUTOMATED_TEST' &&
    inomasaEnvironment !== 'PRIVATE_ARC_TESTNET' &&
    inomasaEnvironment !== 'CLOSED_ARC_TESTNET' &&
    inomasaEnvironment !== 'PUBLIC_DEMO_TESTNET'
  ) {
    throw new CircleConfigurationError(
      'Circle Alpha wallet operations require an explicit non-mainnet INOMASA_ENV.',
    );
  }

  const walletSetId = environment['CIRCLE_WALLET_SET_ID']?.trim();
  if (walletSetId === undefined || walletSetId.length === 0) {
    throw new CircleConfigurationError(
      'CIRCLE_WALLET_SET_ID is required; wallet-set creation is a separate operator action.',
    );
  }

  return {
    apiKey: requireSecret(environment, 'CIRCLE_API_KEY'),
    entitySecret: requireSecret(environment, 'CIRCLE_ENTITY_SECRET'),
    environment: inomasaEnvironment,
    walletSetId,
  };
}
