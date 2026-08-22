import {
  type Generated,
  Kysely,
  PostgresDialect,
  type Transaction,
} from 'kysely';
import { Pool, type PoolConfig } from 'pg';

import type { DatabaseConnectionConfig } from './config.ts';

export const engineeringSchema = 'inomasa_engineering';
export const engineeringProbeTable = 'persistence_probe';

interface EngineeringPersistenceProbeTable {
  readonly created_at: Generated<Date>;
  readonly probe_id: string;
  readonly probe_value: string;
}

export interface PersistenceDatabase {
  readonly persistence_probe: EngineeringPersistenceProbeTable;
}

export type PersistenceTransaction = Transaction<PersistenceDatabase>;

function createPoolConfig(config: DatabaseConnectionConfig): PoolConfig {
  return {
    connectionString: config.connectionString,
    ...(config.maxConnections === undefined ? {} : { max: config.maxConnections }),
  };
}

export function createPostgresDatabase(
  config: DatabaseConnectionConfig,
): Kysely<PersistenceDatabase> {
  return new Kysely<PersistenceDatabase>({
    dialect: new PostgresDialect({
      pool: new Pool(createPoolConfig(config)),
    }),
  });
}

export class PostgresPersistence {
  readonly #database: Kysely<PersistenceDatabase>;

  constructor(config: DatabaseConnectionConfig) {
    if (config.purpose !== 'runtime') {
      throw new Error('PostgresPersistence requires a runtime database connection.');
    }

    this.#database = createPostgresDatabase(config);
  }

  async close(): Promise<void> {
    await this.#database.destroy();
  }

  async transaction<T>(
    operation: (transaction: PersistenceTransaction) => Promise<T>,
  ): Promise<T> {
    return this.#database.transaction().execute(operation);
  }

  async verifyConnection(): Promise<void> {
    await this.#database.selectNoFrom((expression) => expression.val(1).as('value')).executeTakeFirstOrThrow();
  }

  get databaseForEngineeringProof(): Kysely<PersistenceDatabase> {
    return this.#database;
  }
}
