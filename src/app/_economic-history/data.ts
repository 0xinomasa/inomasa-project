import { cache } from 'react';

import {
  summarizeEconomicHistory,
  type EconomicActivity,
  type EconomicHistoryInventory,
  type EconomicHistorySummary,
} from '../../modules/economic-history/model.ts';
import { readDatabaseConnectionConfig } from '../../platform/persistence/config.ts';
import { PostgresPersistence } from '../../platform/persistence/database.ts';
import { PostgresEconomicHistoryRepository } from '../../platform/persistence/economic-history-repository.ts';
import { loadBusinessSite } from '../_business/site.ts';

export type EconomicHistoryLoadState = 'CONNECTED' | 'NOT_CONFIGURED' | 'UNAVAILABLE';

export interface EconomicHistoryView {
  readonly activities: readonly EconomicActivity[];
  readonly inventory: EconomicHistoryInventory;
  readonly state: EconomicHistoryLoadState;
  readonly summary: EconomicHistorySummary;
}

const emptyInventory: EconomicHistoryInventory = {
  agentCount: 0,
  businessCount: 0,
  capitalProviderCount: 0,
  evidenceCount: 0,
  serviceDeliveryCount: 0,
};

function hasRuntimeDatabaseConfiguration(): boolean {
  return Boolean(process.env['INOMASA_ENV']?.trim() && process.env['DATABASE_URL']?.trim());
}

function emptyView(state: Exclude<EconomicHistoryLoadState, 'CONNECTED'>): EconomicHistoryView {
  const activities: readonly EconomicActivity[] = [];
  return {
    activities,
    inventory: emptyInventory,
    state,
    summary: summarizeEconomicHistory(activities),
  };
}

export const loadEconomicHistory = cache(
  async (businessId?: `biz_${string}`): Promise<EconomicHistoryView> => {
    if (!hasRuntimeDatabaseConfiguration()) return emptyView('NOT_CONFIGURED');
    const persistence = new PostgresPersistence(readDatabaseConnectionConfig('runtime'));
    try {
      const repository = new PostgresEconomicHistoryRepository(persistence);
      const [activities, inventory] = await Promise.all([
        repository.listEconomicActivities(businessId === undefined ? {} : { businessId }),
        repository.loadInventory(),
      ]);
      return {
        activities,
        inventory,
        state: 'CONNECTED',
        summary: summarizeEconomicHistory(activities),
      };
    } catch {
      return emptyView('UNAVAILABLE');
    } finally {
      await persistence.close();
    }
  },
);

export const loadBusinessEconomicHistory = cache(
  async (businessSlug: string): Promise<EconomicHistoryView> => {
    const site = await loadBusinessSite(businessSlug);
    return site === undefined
      ? emptyView(hasRuntimeDatabaseConfiguration() ? 'UNAVAILABLE' : 'NOT_CONFIGURED')
      : loadEconomicHistory(site.businessId);
  },
);
