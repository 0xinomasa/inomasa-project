import assert from 'node:assert/strict';

import {
  createBusinessGenesis,
  type HumanPrincipal,
} from '../src/modules/business/model.ts';
import { createPendingCircleTreasuryBinding } from '../src/modules/business/treasury.ts';
import {
  checkpointGAgents,
  checkpointGBusinesses,
} from '../src/modules/reference-economy/fixtures.ts';
import { readDatabaseConnectionConfig } from '../src/platform/persistence/config.ts';
import { PostgresAgentRepository } from '../src/platform/persistence/agent-repository.ts';
import { PostgresAlphaBusinessRepository } from '../src/platform/persistence/alpha-business-repository.ts';
import { PostgresPersistence } from '../src/platform/persistence/database.ts';
import type { CapitalMandate, CapitalProvider } from '../src/modules/capital/model.ts';
import { parseUsdcAmount } from '../src/modules/commerce/money.ts';
import { PostgresCapitalRepository } from '../src/platform/persistence/capital-repository.ts';

const referenceProviders = [
  {
    accountId: 'cpa_reference_seed_v1' as const,
    allowedProvenance: ['COMMON_CONTROL_TEST'] as const,
    displayName: 'Reference Seed Capital',
    mandateId: 'cmt_reference_seed_v1' as const,
    providerId: 'cap_reference_seed_v1' as const,
  },
  {
    allowedProvenance: ['INDEPENDENT'] as const,
    displayName: 'Reference Independent Capital',
    mandateId: 'cmt_reference_independent_v1' as const,
    providerId: 'cap_reference_independent_v1' as const,
  },
] as const;

async function main(): Promise<void> {
  const config = readDatabaseConnectionConfig('runtime');
  if (config.environment !== 'PRIVATE_ARC_TESTNET') {
    throw new Error('Checkpoint G bootstrap is restricted to PRIVATE_ARC_TESTNET.');
  }
  const persistence = new PostgresPersistence(config);
  try {
    const businesses = new PostgresAlphaBusinessRepository(persistence);
    const agents = new PostgresAgentRepository(persistence);
    const capital = new PostgresCapitalRepository(persistence);
    for (const input of checkpointGBusinesses) {
      const controller: HumanPrincipal = {
        actorClassification: 'COMMON_CONTROL_TEST',
        displayName: input.controllerDisplayName,
        environment: config.environment,
        principalId: input.controllerId,
      };
      const genesis = createBusinessGenesis(
        {
          commonControlGroupId: 'ccg_reference_economy_v1',
          controller,
          displayName: input.displayName,
          genesisRequestId: input.genesisRequestId,
          slug: input.slug,
          summary: input.summary,
          templateId: input.templateId,
        },
        {
          businessId: input.businessId,
          controlId: input.controlId,
          eventId: input.eventId,
        },
        '2026-08-28T08:00:00.000Z',
      );
      const result = await businesses.registerGenesis({
        controller,
        genesis,
        treasuryBinding: createPendingCircleTreasuryBinding({
          bindingId: input.bindingId,
          business: genesis.business,
        }),
      });
      console.log(
        `reference_business=${input.businessId} state=${result.created ? 'CREATED' : 'ALREADY_EXISTS'} template=${input.templateId} provenance=COMMON_CONTROL_TEST`,
      );
    }
    for (const agent of checkpointGAgents) {
      const result = await agents.ensureAgent(agent);
      console.log(
        `reference_agent=${agent.agentPrincipalId} state=${result.created ? 'CREATED' : 'ALREADY_EXISTS'} business=${agent.businessId}`,
      );
    }
    for (const fixture of referenceProviders) {
      const provider: CapitalProvider = {
        controllerPrincipalId: 'usr_reference_workbench',
        displayName: fixture.displayName,
        environment: 'PRIVATE_ARC_TESTNET',
        provenance: 'COMMON_CONTROL_TEST',
        providerId: fixture.providerId,
        riskBearerClassification: 'PROVIDER_RISK_BEARER',
        status: 'ACTIVE',
      };
      const mandate: CapitalMandate = {
        criteria: {
          allowedProvenance: fixture.allowedProvenance,
          minimumCompletedCommerceActivities: 2,
          minimumCompletedCommerceVolumeMicroUsdc: '60000',
          requireNoUnresolvedActivity: true,
        },
        mandateId: fixture.mandateId,
        maximumMicroUsdc: parseUsdcAmount('0.50'),
        minimumMicroUsdc: parseUsdcAmount('0.10'),
        name: `${fixture.displayName} reference mandate`,
        providerId: fixture.providerId,
        status: 'ACTIVE',
        strategy: 'Provider-specific reference-economy mandate; no score, entitlement, or independent-demand claim.',
        version: 1,
      };
      await capital.prepareProvider({
        mandate,
        ...('accountId' in fixture ? { pendingProviderAccountId: fixture.accountId } : {}),
        provider,
      });
      console.log(`reference_provider=${fixture.providerId} mandate=${fixture.mandateId} provenance=COMMON_CONTROL_TEST`);
    }
    const summaries = await businesses.listBusinesses();
    const reference = summaries.filter(({ businessId }) =>
      checkpointGBusinesses.some((fixture) => fixture.businessId === businessId),
    );
    assert.equal(reference.length, 4);
    assert.equal(new Set(checkpointGBusinesses.map(({ controllerId }) => controllerId)).size, 4);
    assert.equal(new Set(checkpointGBusinesses.map(({ templateId }) => templateId)).size, 4);
    console.log('checkpoint_g_bootstrap=PASS businesses=4 users=4 agents=4 providers=2 templates=4 provenance=COMMON_CONTROL_TEST');
  } finally {
    await persistence.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Checkpoint G bootstrap failed.');
  process.exitCode = 1;
});
