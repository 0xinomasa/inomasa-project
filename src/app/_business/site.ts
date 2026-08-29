import { cache } from 'react';

import { readDatabaseConnectionConfig } from '../../platform/persistence/config.ts';
import {
  PostgresAlphaBusinessRepository,
  type BusinessSiteView,
} from '../../platform/persistence/alpha-business-repository.ts';
import {
  PostgresAgentRepository,
  type AgentDetail,
  type AgentListItem,
} from '../../platform/persistence/agent-repository.ts';
import { PostgresPersistence } from '../../platform/persistence/database.ts';

function hasRuntimeDatabaseConfiguration(): boolean {
  return Boolean(process.env['INOMASA_ENV']?.trim() && process.env['DATABASE_URL']?.trim());
}

export const loadBusinessSite = cache(async (
  slug: string,
  controllerPrincipalId?: `usr_${string}`,
): Promise<BusinessSiteView | undefined> => {
  if (!hasRuntimeDatabaseConfiguration()) {
    return undefined;
  }

  const persistence = new PostgresPersistence(readDatabaseConnectionConfig('runtime'));

  try {
    return await new PostgresAlphaBusinessRepository(persistence).getBusinessSiteBySlug(
      slug,
      controllerPrincipalId,
    );
  } finally {
    await persistence.close();
  }
});

export const loadBusinessAgents = cache(
  async (slug: string, controllerPrincipalId?: `usr_${string}`): Promise<readonly AgentListItem[]> => {
    if (!hasRuntimeDatabaseConfiguration()) return [];
    const site = await loadBusinessSite(slug, controllerPrincipalId);
    if (site === undefined) return [];
    const persistence = new PostgresPersistence(readDatabaseConnectionConfig('runtime'));
    try {
      return await new PostgresAgentRepository(persistence).listAgentsForBusiness(site.businessId);
    } finally {
      await persistence.close();
    }
  },
);

export const loadBusinessAgent = cache(
  async (
    slug: string,
    agentPrincipalId: string,
    controllerPrincipalId?: `usr_${string}`,
  ): Promise<AgentDetail | undefined> => {
    if (!hasRuntimeDatabaseConfiguration() || !agentPrincipalId.startsWith('agt_')) return undefined;
    const site = await loadBusinessSite(slug, controllerPrincipalId);
    if (site === undefined) return undefined;
    const persistence = new PostgresPersistence(readDatabaseConnectionConfig('runtime'));
    try {
      return await new PostgresAgentRepository(persistence).getAgentDetail({
        agentPrincipalId: agentPrincipalId as `agt_${string}`,
        businessId: site.businessId,
      });
    } finally {
      await persistence.close();
    }
  },
);
