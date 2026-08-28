import { cache } from 'react';

import { readDatabaseConnectionConfig } from '../../platform/persistence/config.ts';
import {
  PostgresCapitalRepository,
  type CapitalPathSummary,
} from '../../platform/persistence/capital-repository.ts';
import { PostgresPersistence } from '../../platform/persistence/database.ts';

export interface CapitalView {
  readonly paths: readonly CapitalPathSummary[];
  readonly state: 'CONNECTED' | 'NOT_CONFIGURED' | 'UNAVAILABLE';
}

function configured(): boolean {
  return Boolean(process.env['INOMASA_ENV']?.trim() && process.env['DATABASE_URL']?.trim());
}

export const loadCapitalPaths = cache(async (): Promise<CapitalView> => {
  if (!configured()) return { paths: [], state: 'NOT_CONFIGURED' };
  const persistence = new PostgresPersistence(readDatabaseConnectionConfig('runtime'));
  try {
    return {
      paths: await new PostgresCapitalRepository(persistence).listCapitalPaths(),
      state: 'CONNECTED',
    };
  } catch {
    return { paths: [], state: 'UNAVAILABLE' };
  } finally {
    await persistence.close();
  }
});
