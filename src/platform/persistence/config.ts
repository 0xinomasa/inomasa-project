import {
  inomasaEnvironments,
  isInomasaEnvironment,
  type InomasaEnvironment,
} from '../../shared/environment.ts';

export type { InomasaEnvironment } from '../../shared/environment.ts';
export type DatabaseConnectionPurpose = 'runtime' | 'administrative';
export type EnvironmentVariables = Readonly<Record<string, string | undefined>>;

export interface DatabaseConnectionConfig {
  readonly connectionString: string;
  readonly environment: InomasaEnvironment;
  readonly maxConnections?: number;
  readonly purpose: DatabaseConnectionPurpose;
}

export class DatabaseConfigurationError extends Error {
  override readonly name = 'DatabaseConfigurationError';
}

const nonTlsEnvironments = new Set<InomasaEnvironment>([
  'LOCAL_DEVELOPMENT',
  'AUTOMATED_TEST',
]);

function readEnvironment(environment: EnvironmentVariables): InomasaEnvironment {
  const value = environment['INOMASA_ENV']?.trim();

  if (value === undefined || value.length === 0) {
    throw new DatabaseConfigurationError('INOMASA_ENV is required for database access.');
  }

  if (!isInomasaEnvironment(value)) {
    throw new DatabaseConfigurationError(
      `INOMASA_ENV must be one of: ${inomasaEnvironments.join(', ')}.`,
    );
  }

  return value;
}

function readConnectionString(
  purpose: DatabaseConnectionPurpose,
  environment: EnvironmentVariables,
): string {
  const variableName = purpose === 'runtime' ? 'DATABASE_URL' : 'DATABASE_DIRECT_URL';
  const value = environment[variableName]?.trim();

  if (value === undefined || value.length === 0) {
    throw new DatabaseConfigurationError(`${variableName} is required for ${purpose} database access.`);
  }

  return value;
}

function validateConnectionString(
  connectionString: string,
  inomasaEnvironment: InomasaEnvironment,
): void {
  let parsed: URL;

  try {
    parsed = new URL(connectionString);
  } catch {
    throw new DatabaseConfigurationError('The selected database connection URL is invalid.');
  }

  if (parsed.protocol !== 'postgres:' && parsed.protocol !== 'postgresql:') {
    throw new DatabaseConfigurationError('Database connections must use PostgreSQL.');
  }

  if (nonTlsEnvironments.has(inomasaEnvironment)) {
    return;
  }

  const sslMode = parsed.searchParams.get('sslmode');
  if (sslMode !== 'require' && sslMode !== 'verify-ca' && sslMode !== 'verify-full') {
    throw new DatabaseConfigurationError(
      'Non-local database connections must explicitly require secure transport.',
    );
  }
}

function readMaxConnections(environment: EnvironmentVariables): number | undefined {
  const value = environment['DATABASE_POOL_MAX']?.trim();

  if (value === undefined || value.length === 0) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new DatabaseConfigurationError('DATABASE_POOL_MAX must be a positive integer when set.');
  }

  return parsed;
}

export function readDatabaseConnectionConfig(
  purpose: DatabaseConnectionPurpose,
  environment: EnvironmentVariables = process.env,
): DatabaseConnectionConfig {
  const inomasaEnvironment = readEnvironment(environment);
  const connectionString = readConnectionString(purpose, environment);
  validateConnectionString(connectionString, inomasaEnvironment);

  const maxConnections = purpose === 'runtime' ? readMaxConnections(environment) : 1;

  return {
    connectionString,
    environment: inomasaEnvironment,
    ...(maxConnections === undefined ? {} : { maxConnections }),
    purpose,
  };
}
