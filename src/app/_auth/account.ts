import { AccountRepository } from '../../platform/persistence/account-repository.ts';
import { PostgresPersistence } from '../../platform/persistence/database.ts';
import { readDatabaseConnectionConfig } from '../../platform/persistence/config.ts';
import { localEntryEnabled } from '../../platform/auth/local-entry.ts';

export async function withAccountRepository<T>(operation: (repository: AccountRepository) => Promise<T>): Promise<T> {
  if (!localEntryEnabled()) throw new Error('Local entry is unavailable.');
  const config = readDatabaseConnectionConfig('runtime');
  const persistence = new PostgresPersistence(config);
  try { return await operation(new AccountRepository(persistence, config.environment)); }
  finally { await persistence.close(); }
}
