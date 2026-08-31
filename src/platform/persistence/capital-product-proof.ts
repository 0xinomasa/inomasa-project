import { randomUUID } from 'node:crypto';

import {
  decideCapitalRequest,
  offerCapitalAllocation,
  type CapitalDecisionMaterial,
  type CapitalMandate,
  type CapitalProvider,
} from '../../modules/capital/model.ts';
import { parseUsdcAmount } from '../../modules/commerce/money.ts';
import type { PostgresPersistence } from './database.ts';
import { applicationSchema } from './database.ts';
import { PostgresCapitalRepository } from './capital-repository.ts';

export interface CapitalProductPersistenceProof {
  readonly acceptanceReplayVerified: boolean;
  readonly businessContextVerified: boolean;
  readonly explicitAcceptanceVerified: boolean;
  readonly selfCleaningVerified: boolean;
  readonly tenantIsolationVerified: boolean;
}

interface CapitalProductFixture {
  readonly allocationId: `cal_${string}`;
  readonly businessId: `biz_${string}`;
  readonly controllerPrincipalId: `usr_${string}`;
  readonly decisionId: `cpd_${string}`;
  readonly genesisId: string;
  readonly mandateId: `cmt_${string}`;
  readonly providerAccountId: `cpa_${string}`;
  readonly providerControllerPrincipalId: `usr_${string}`;
  readonly providerId: `cap_${string}`;
  readonly reviewId: `cpr_${string}`;
  readonly slug: string;
}

function createFixture(): CapitalProductFixture {
  const suffix = randomUUID().replaceAll('-', '').slice(0, 16);
  return {
    allocationId: `cal_w4_${suffix}`,
    businessId: `biz_w4_${suffix}`,
    controllerPrincipalId: `usr_w4_${suffix}`,
    decisionId: `cpd_w4_${suffix}`,
    genesisId: `genesis-w4-${suffix}`,
    mandateId: `cmt_w4_${suffix}`,
    providerAccountId: `cpa_w4_${suffix}`,
    providerControllerPrincipalId: `usr_w4_provider_${suffix}`,
    providerId: `cap_w4_${suffix}`,
    reviewId: `cpr_w4_${suffix}`,
    slug: `work-4-proof-${suffix}`,
  };
}

async function insertBusiness(
  persistence: PostgresPersistence,
  fixture: CapitalProductFixture,
): Promise<void> {
  const database = persistence.databaseForApplication.withSchema(applicationSchema);
  const createdAt = new Date('2026-08-31T01:00:00.000Z');
  await persistence.transaction(async (transaction) => {
    const scoped = transaction.withSchema(applicationSchema);
    await scoped.insertInto('principals').values([
      {
        actor_classification: 'COMMON_CONTROL_TEST',
        display_name: 'Work 4 proof owner',
        environment: 'PRIVATE_ARC_TESTNET',
        principal_id: fixture.controllerPrincipalId,
        principal_kind: 'HUMAN',
      },
      {
        actor_classification: 'COMMON_CONTROL_TEST',
        display_name: 'Work 4 proof provider controller',
        environment: 'PRIVATE_ARC_TESTNET',
        principal_id: fixture.providerControllerPrincipalId,
        principal_kind: 'HUMAN',
      },
      {
        actor_classification: 'COMMON_CONTROL_TEST',
        display_name: 'Work 4 proof Business',
        environment: 'PRIVATE_ARC_TESTNET',
        principal_id: fixture.businessId,
        principal_kind: 'BUSINESS',
      },
    ]).execute();
    await scoped.insertInto('genesis_requests').values({
      consumed_at: createdAt,
      genesis_request_id: fixture.genesisId,
      requester_principal_id: fixture.controllerPrincipalId,
      state: 'CONSUMED',
      template_id: 'api-data-compute',
      template_version: 1,
    }).execute();
    await scoped.insertInto('businesses').values({
      actor_classification: 'COMMON_CONTROL_TEST',
      business_id: fixture.businessId,
      business_principal_id: fixture.businessId,
      common_control_group_id: 'ccg_work_4_proof',
      display_name: 'Work 4 proof Business',
      entry_route: 'BUILD',
      environment: 'PRIVATE_ARC_TESTNET',
      genesis_request_id: fixture.genesisId,
      slug: fixture.slug,
      status: 'ACTIVE',
      summary: 'Controller-scoped Work 4 Capital product proof.',
      template_id: 'api-data-compute',
      template_version: 1,
    }).execute();
    await scoped.insertInto('business_controls').values({
      accepted_at: createdAt,
      business_id: fixture.businessId,
      control_id: `ctl_w4_${fixture.allocationId.slice(7)}`,
      control_version: 1,
      controller_principal_id: fixture.controllerPrincipalId,
      ended_at: null,
      status: 'ACTIVE',
    }).execute();
    await scoped.insertInto('business_sites').values({
      business_id: fixture.businessId,
      description: 'Work 4 proof site.',
      headline: 'Work 4 Capital proof',
      site_id: `site_w4_${fixture.allocationId.slice(7)}`,
      slug: fixture.slug,
      status: 'PUBLISHED',
      updated_at: createdAt,
      visibility: 'PROTECTED_ALPHA',
    }).execute();
  });
  await database.selectFrom('businesses').select('business_id').where('business_id', '=', fixture.businessId).executeTakeFirstOrThrow();
}

async function insertCapitalPath(
  persistence: PostgresPersistence,
  fixture: CapitalProductFixture,
): Promise<void> {
  const repository = new PostgresCapitalRepository(persistence);
  const provider: CapitalProvider = {
    controllerPrincipalId: fixture.providerControllerPrincipalId,
    displayName: 'Work 4 proof provider',
    environment: 'PRIVATE_ARC_TESTNET',
    provenance: 'COMMON_CONTROL_TEST',
    providerId: fixture.providerId,
    riskBearerClassification: 'PROVIDER_RISK_BEARER',
    status: 'ACTIVE',
  };
  const mandate: CapitalMandate = {
    criteria: {
      allowedProvenance: ['COMMON_CONTROL_TEST'],
      minimumCompletedCommerceActivities: 1,
      minimumCompletedCommerceVolumeMicroUsdc: '100000',
      requireNoUnresolvedActivity: true,
    },
    mandateId: fixture.mandateId,
    maximumMicroUsdc: parseUsdcAmount('0.50'),
    minimumMicroUsdc: parseUsdcAmount('0.10'),
    name: 'Work 4 controlled proof mandate',
    providerId: fixture.providerId,
    status: 'ACTIVE',
    strategy: 'Provider-specific testnet operating allocation.',
    version: 1,
  };
  const material: CapitalDecisionMaterial = {
    businessId: fixture.businessId,
    businessTemplateId: 'api-data-compute',
    completedCommerceActivityCount: 1,
    completedCommerceVolumeMicroUsdc: '100000',
    failedActivityCount: 0,
    observedAt: '2026-08-31T01:01:00.000Z',
    outcomeUnknownActivityCount: 0,
    pendingActivityCount: 0,
    provenance: 'COMMON_CONTROL_TEST',
  };
  const decision = decideCapitalRequest({
    decisionId: fixture.decisionId,
    mandate,
    material,
    requestedMicroUsdc: parseUsdcAmount('0.20'),
    reviewId: fixture.reviewId,
    terms: {
      instrument: 'CONTROLLED_TEST_ALLOCATION',
      purpose: 'Bounded Work 4 persistence proof.',
      returnProfile: 'NONE',
      useCapMicroUsdc: '100000',
    },
  });
  await repository.prepareProvider({
    mandate,
    pendingProviderAccountId: fixture.providerAccountId,
    provider,
  });
  await repository.activateProviderAccount({
    address: `0x${fixture.allocationId.slice(7).padEnd(40, '4')}` as `0x${string}`,
    providerAccountId: fixture.providerAccountId,
    providerWalletId: `work-4-proof-wallet-${fixture.allocationId.slice(7)}`,
  });
  await repository.recordReviewDecision({
    decidedAt: '2026-08-31T01:02:00.000Z',
    decidedByPrincipalId: fixture.providerControllerPrincipalId,
    decision,
    material,
    requestedMicroUsdc: parseUsdcAmount('0.20'),
  });
  await repository.prepareOfferedAllocation({
    allocation: offerCapitalAllocation({
      allocationId: fixture.allocationId,
      decision,
      providerAccountId: fixture.providerAccountId,
      provenance: 'COMMON_CONTROL_TEST',
      recipientBusinessId: fixture.businessId,
    }),
    idempotencyKey: randomUUID(),
  });
}

async function deleteFixture(
  persistence: PostgresPersistence,
  fixture: CapitalProductFixture,
): Promise<void> {
  const database = persistence.databaseForApplication.withSchema(applicationSchema);
  await database.deleteFrom('capital_allocations').where('allocation_id', '=', fixture.allocationId).execute();
  await database.deleteFrom('capital_decisions').where('decision_id', '=', fixture.decisionId).execute();
  await database.deleteFrom('capital_reviews').where('review_id', '=', fixture.reviewId).execute();
  await database.deleteFrom('capital_provider_accounts').where('provider_account_id', '=', fixture.providerAccountId).execute();
  await database.deleteFrom('capital_mandates').where('mandate_id', '=', fixture.mandateId).execute();
  await database.deleteFrom('capital_providers').where('provider_id', '=', fixture.providerId).execute();
  await database.deleteFrom('business_sites').where('business_id', '=', fixture.businessId).execute();
  await database.deleteFrom('business_controls').where('business_id', '=', fixture.businessId).execute();
  await database.deleteFrom('businesses').where('business_id', '=', fixture.businessId).execute();
  await database.deleteFrom('genesis_requests').where('genesis_request_id', '=', fixture.genesisId).execute();
  await database.deleteFrom('principals').where('principal_id', 'in', [
    fixture.businessId,
    fixture.controllerPrincipalId,
    fixture.providerControllerPrincipalId,
  ]).execute();
}

async function rejects(operation: () => Promise<unknown>): Promise<boolean> {
  try {
    await operation();
    return false;
  } catch {
    return true;
  }
}

export async function runCapitalProductPersistenceProof(
  persistence: PostgresPersistence,
): Promise<CapitalProductPersistenceProof> {
  const fixture = createFixture();
  const repository = new PostgresCapitalRepository(persistence);
  let verified: Omit<CapitalProductPersistenceProof, 'selfCleaningVerified'> | undefined;

  try {
    await insertBusiness(persistence, fixture);
    await insertCapitalPath(persistence, fixture);

    const scoped = await repository.listCapitalPaths({
      businessSlug: fixture.slug,
      controllerPrincipalId: fixture.controllerPrincipalId,
    });
    const businessContextVerified = scoped.length === 1 &&
      scoped[0]?.allocationId === fixture.allocationId &&
      scoped[0]?.allocationState === 'OFFERED';

    const intruder = `usr_w4_intruder_${fixture.allocationId.slice(7)}` as const;
    const intruderPaths = await repository.listCapitalPaths({
      businessSlug: fixture.slug,
      controllerPrincipalId: intruder,
    });
    const intruderRejected = await rejects(() => repository.acceptAllocation({
      acceptedAt: '2026-08-31T01:03:00.000Z',
      acceptedByPrincipalId: intruder,
      allocationId: fixture.allocationId,
      businessSlug: fixture.slug,
    }));
    const wrongContextRejected = await rejects(() => repository.acceptAllocation({
      acceptedAt: '2026-08-31T01:03:00.000Z',
      acceptedByPrincipalId: fixture.controllerPrincipalId,
      allocationId: fixture.allocationId,
      businessSlug: `${fixture.slug}-wrong`,
    }));
    const tenantIsolationVerified = intruderPaths.length === 0 && intruderRejected && wrongContextRejected;

    await repository.acceptAllocation({
      acceptedAt: '2026-08-31T01:03:00.000Z',
      acceptedByPrincipalId: fixture.controllerPrincipalId,
      allocationId: fixture.allocationId,
      businessSlug: fixture.slug,
    });
    const authorized = await repository.listCapitalPaths({
      businessSlug: fixture.slug,
      controllerPrincipalId: fixture.controllerPrincipalId,
    });
    const explicitAcceptanceVerified = authorized[0]?.allocationState === 'AUTHORIZED' &&
      authorized[0]?.acceptedAt === '2026-08-31T01:03:00.000Z';

    await repository.acceptAllocation({
      acceptedAt: '2026-08-31T01:04:00.000Z',
      acceptedByPrincipalId: fixture.controllerPrincipalId,
      allocationId: fixture.allocationId,
      businessSlug: fixture.slug,
    });
    const replayed = await repository.listCapitalPaths({
      businessSlug: fixture.slug,
      controllerPrincipalId: fixture.controllerPrincipalId,
    });
    const acceptanceReplayVerified = replayed[0]?.allocationState === 'AUTHORIZED' &&
      replayed[0]?.acceptedAt === '2026-08-31T01:03:00.000Z';
    verified = {
      acceptanceReplayVerified,
      businessContextVerified,
      explicitAcceptanceVerified,
      tenantIsolationVerified,
    };
  } finally {
    await deleteFixture(persistence, fixture);
  }

  if (verified === undefined) {
    throw new Error('Work 4 Capital product proof did not complete its assertions.');
  }

  const remaining = await persistence.databaseForApplication
    .withSchema(applicationSchema)
    .selectFrom('businesses')
    .select(({ fn }) => fn.countAll<number>().as('count'))
    .where('business_id', '=', fixture.businessId)
    .executeTakeFirstOrThrow();

  return {
    ...verified,
    selfCleaningVerified: Number(remaining.count) === 0,
  };
}
