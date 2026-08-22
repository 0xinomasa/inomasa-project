import { fileURLToPath } from 'node:url';

import {
  DatabaseConfigurationError,
  readDatabaseConnectionConfig,
} from '../src/platform/persistence/config.ts';
import {
  migrateToLatest,
  MigrationExecutionError,
} from '../src/platform/persistence/migrator.ts';

const migrationsDirectory = fileURLToPath(new URL('../migrations', import.meta.url));

async function main(): Promise<void> {
  const config = readDatabaseConnectionConfig('administrative');
  const summary = await migrateToLatest(config, migrationsDirectory);

  for (const migration of summary.applied) {
    console.log(`migration=${migration} status=APPLIED`);
  }

  if (summary.applied.length === 0) {
    console.log('migration=none status=ALREADY_CURRENT');
  }

  for (const migration of summary.state) {
    console.log(`migration_state=${migration.name} executed=${String(migration.executed)}`);
  }
}

main().catch((error: unknown) => {
  const stage =
    error instanceof MigrationExecutionError || error instanceof DatabaseConfigurationError
      ? error.message
      : 'Database migration failed.';
  console.error(`${stage} Connection details were not logged.`);
  process.exitCode = 1;
});
