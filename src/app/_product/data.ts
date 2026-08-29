import { cache } from 'react';

import type { ProductSession } from '../../platform/auth/session.ts';
import { readDatabaseConnectionConfig } from '../../platform/persistence/config.ts';
import {
  PostgresAlphaBusinessRepository,
  type AlphaBusinessSummary,
} from '../../platform/persistence/alpha-business-repository.ts';
import { PostgresPersistence } from '../../platform/persistence/database.ts';

export type ProductDataState = 'CONNECTED' | 'NOT_CONFIGURED' | 'UNAVAILABLE';

export interface OwnedBusinessesView {
  readonly businesses: readonly AlphaBusinessSummary[];
  readonly state: ProductDataState;
}

function hasRuntimeDatabaseConfiguration(): boolean {
  return Boolean(process.env['INOMASA_ENV']?.trim() && process.env['DATABASE_URL']?.trim());
}

export const loadOwnedBusinesses = cache(
  async (session: ProductSession): Promise<OwnedBusinessesView> => {
    if (!hasRuntimeDatabaseConfiguration()) {
      return { businesses: [], state: 'NOT_CONFIGURED' };
    }

    let persistence: PostgresPersistence | undefined;
    try {
      persistence = new PostgresPersistence(readDatabaseConnectionConfig('runtime'));
      return {
        businesses: await new PostgresAlphaBusinessRepository(persistence).listBusinesses(
          session.principalId,
        ),
        state: 'CONNECTED',
      };
    } catch {
      return { businesses: [], state: 'UNAVAILABLE' };
    } finally {
      await persistence?.close();
    }
  },
);
