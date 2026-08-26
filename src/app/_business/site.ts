import { cache } from 'react';

import { readDatabaseConnectionConfig } from '../../platform/persistence/config.ts';
import {
  PostgresAlphaBusinessRepository,
  type BusinessSiteView,
} from '../../platform/persistence/alpha-business-repository.ts';
import { PostgresPersistence } from '../../platform/persistence/database.ts';

function hasRuntimeDatabaseConfiguration(): boolean {
  return Boolean(process.env['INOMASA_ENV']?.trim() && process.env['DATABASE_URL']?.trim());
}

export const loadBusinessSite = cache(async (slug: string): Promise<BusinessSiteView | undefined> => {
  if (!hasRuntimeDatabaseConfiguration()) {
    return undefined;
  }

  const persistence = new PostgresPersistence(readDatabaseConnectionConfig('runtime'));

  try {
    return await new PostgresAlphaBusinessRepository(persistence).getBusinessSiteBySlug(slug);
  } finally {
    await persistence.close();
  }
});
