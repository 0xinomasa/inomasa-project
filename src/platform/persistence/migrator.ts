import { promises as fileSystem } from 'node:fs';
import path from 'node:path';

import {
  FileMigrationProvider,
  Migrator,
  type MigrationInfo,
} from 'kysely/migration';

import type { DatabaseConnectionConfig } from './config.ts';
import { createPostgresDatabase } from './database.ts';

export interface MigrationExecutionSummary {
  readonly applied: readonly string[];
  readonly state: readonly {
    readonly executed: boolean;
    readonly name: string;
  }[];
}

export class MigrationExecutionError extends Error {
  override readonly name = 'MigrationExecutionError';
  readonly failedMigration: string | undefined;

  constructor(failedMigration: string | undefined) {
    super(
      failedMigration === undefined
        ? 'Database migration failed before a migration could be identified.'
        : `Database migration failed at ${failedMigration}.`,
    );
    this.failedMigration = failedMigration;
  }
}

function migrationState(migrations: readonly MigrationInfo[]): MigrationExecutionSummary['state'] {
  return migrations.map(({ executedAt, name }) => ({
    executed: executedAt !== undefined,
    name,
  }));
}

export async function migrateToLatest(
  config: DatabaseConnectionConfig,
  migrationFolder: string,
): Promise<MigrationExecutionSummary> {
  if (config.purpose !== 'administrative') {
    throw new Error('Migrations require the administrative database connection.');
  }

  const database = createPostgresDatabase(config);

  try {
    const migrator = new Migrator({
      db: database,
      provider: new FileMigrationProvider({
        fs: fileSystem,
        migrationFolder: path.resolve(migrationFolder),
        path,
      }),
    });

    const { error, results } = await migrator.migrateToLatest();
    if (error !== undefined) {
      const failedMigration = results?.find(({ status }) => status === 'Error')?.migrationName;
      throw new MigrationExecutionError(failedMigration);
    }

    const state = migrationState(await migrator.getMigrations());
    return {
      applied: (results ?? [])
        .filter(({ status }) => status === 'Success')
        .map(({ migrationName }) => migrationName),
      state,
    };
  } finally {
    await database.destroy();
  }
}
