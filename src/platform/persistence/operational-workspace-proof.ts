import { randomUUID } from 'node:crypto';

import {
  createOperationalAgent,
  createProductOfferDraft,
} from '../../modules/business/operational-workspace.ts';
import type { PostgresPersistence } from './database.ts';
import { applicationSchema } from './database.ts';
import { PostgresAgentRepository } from './agent-repository.ts';
import { PostgresOperationalWorkspaceRepository } from './operational-workspace-repository.ts';

const rollbackSignal = Symbol('WORK_2_ROLLBACK_PROOF');

export interface OperationalWorkspacePersistenceProof {
  readonly activatedOfferBuyerVisibilityVerified: boolean;
  readonly activatedOfferReplayVerified: boolean;
  readonly agentReplayVerified: boolean;
  readonly offerReplayVerified: boolean;
  readonly rollbackVerified: boolean;
  readonly tenantIsolationVerified: boolean;
  readonly treasuryIsolationVerified: boolean;
}

export async function runOperationalWorkspacePersistenceProof(
  persistence: PostgresPersistence,
): Promise<OperationalWorkspacePersistenceProof> {
  const suffix = randomUUID().replaceAll('-', '').slice(0, 18);
  const owner = `usr_w2_${suffix}` as const;
  const intruder = `usr_w2_intruder_${suffix}` as const;
  const businessId = `biz_w2_${suffix}` as const;
  const buyerBusinessId = `biz_w2_buyer_${suffix}` as const;
  const buyerSlug = `work-2-buyer-proof-${suffix}`;
  const slug = `work-2-proof-${suffix}`;
  let activatedOfferBuyerVisibilityVerified = false;
  let activatedOfferReplayVerified = false;
  let agentReplayVerified = false;
  let offerReplayVerified = false;
  let tenantIsolationVerified = false;
  let treasuryIsolationVerified = false;

  try {
    await persistence.transaction(async (transaction) => {
      const database = transaction.withSchema(applicationSchema);
      await database.insertInto('principals').values([
        {
          actor_classification: 'COMMON_CONTROL_TEST',
          display_name: 'Work 2 proof owner',
          environment: 'AUTOMATED_TEST',
          principal_id: owner,
          principal_kind: 'HUMAN',
        },
        {
          actor_classification: 'COMMON_CONTROL_TEST',
          display_name: 'Work 2 proof intruder',
          environment: 'AUTOMATED_TEST',
          principal_id: intruder,
          principal_kind: 'HUMAN',
        },
        {
          actor_classification: 'COMMON_CONTROL_TEST',
          display_name: 'Work 2 proof Business',
          environment: 'AUTOMATED_TEST',
          principal_id: businessId,
          principal_kind: 'BUSINESS',
        },
        {
          actor_classification: 'COMMON_CONTROL_TEST',
          display_name: 'Work 2 proof buyer Business',
          environment: 'AUTOMATED_TEST',
          principal_id: buyerBusinessId,
          principal_kind: 'BUSINESS',
        },
      ]).execute();
      await database.insertInto('genesis_requests').values([
        {
          consumed_at: new Date(),
          genesis_request_id: `genesis-w2-${suffix}`,
          requester_principal_id: owner,
          state: 'CONSUMED',
          template_id: 'api-data-compute',
          template_version: 1,
        },
        {
          consumed_at: new Date(),
          genesis_request_id: `genesis-w2-buyer-${suffix}`,
          requester_principal_id: owner,
          state: 'CONSUMED',
          template_id: 'professional-service',
          template_version: 1,
        },
      ]).execute();
      await database.insertInto('businesses').values([
        {
          actor_classification: 'COMMON_CONTROL_TEST',
          business_id: businessId,
          business_principal_id: businessId,
          common_control_group_id: 'ccg_work_2_proof',
          display_name: 'Work 2 proof Business',
          entry_route: 'BUILD',
          environment: 'AUTOMATED_TEST',
          genesis_request_id: `genesis-w2-${suffix}`,
          slug,
          status: 'ACTIVE',
          summary: 'Transactional Work 2 persistence proof.',
          template_id: 'api-data-compute',
          template_version: 1,
        },
        {
          actor_classification: 'COMMON_CONTROL_TEST',
          business_id: buyerBusinessId,
          business_principal_id: buyerBusinessId,
          common_control_group_id: 'ccg_work_2_proof',
          display_name: 'Work 2 proof buyer Business',
          entry_route: 'BUILD',
          environment: 'AUTOMATED_TEST',
          genesis_request_id: `genesis-w2-buyer-${suffix}`,
          slug: buyerSlug,
          status: 'ACTIVE',
          summary: 'Controlled buyer for activated-offer persistence proof.',
          template_id: 'professional-service',
          template_version: 1,
        },
      ]).execute();
      await database.insertInto('business_controls').values([
        {
          accepted_at: new Date(),
          business_id: businessId,
          control_id: `ctl_w2_${suffix}`,
          control_version: 1,
          controller_principal_id: owner,
          ended_at: null,
          status: 'ACTIVE',
        },
        {
          accepted_at: new Date(),
          business_id: buyerBusinessId,
          control_id: `ctl_w2_buyer_${suffix}`,
          control_version: 1,
          controller_principal_id: owner,
          ended_at: null,
          status: 'ACTIVE',
        },
      ]).execute();
      await database.insertInto('business_sites').values({
        business_id: businessId,
        description: 'Work 2 proof site.',
        headline: 'Work 2 proof',
        site_id: `site_w2_${suffix}`,
        slug,
        status: 'PUBLISHED',
        updated_at: new Date(),
        visibility: 'PROTECTED_ALPHA',
      }).execute();
      await database.insertInto('treasury_bindings').values({
        account_assurance: 'PLATFORM_CONTROLLED_EXTERNAL',
        account_type: 'EOA',
        address: null,
        binding_id: `tbn_w2_${suffix}`,
        binding_version: 1,
        blockchain: 'ARC-TESTNET',
        business_id: businessId,
        custody_model: 'DEVELOPER_CONTROLLED',
        ended_at: null,
        environment: 'AUTOMATED_TEST',
        provider: 'CIRCLE',
        provider_wallet_id: null,
        status: 'PENDING',
      }).execute();

      const operational = new PostgresOperationalWorkspaceRepository(persistence);
      const draft = createProductOfferDraft({
        businessId,
        controllerPrincipalId: owner,
        description: 'A rollback-safe proof offer.',
        name: 'Work 2 proof offer',
        price: '0.010000',
        protocol: 'X402',
      });
      const firstOffer = await operational.ensureOffer(
        { ...draft, controllerPrincipalId: owner, slug },
        transaction,
      );
      const replayOffer = await operational.ensureOffer(
        { ...draft, controllerPrincipalId: owner, slug },
        transaction,
      );
      offerReplayVerified = firstOffer.created && !replayOffer.created;
      activatedOfferReplayVerified =
        await operational.activateOffer({
          controllerPrincipalId: owner,
          offerId: draft.offerId,
          slug,
        }, transaction) === 'ACTIVATED' &&
        await operational.activateOffer({
          controllerPrincipalId: owner,
          offerId: draft.offerId,
          slug,
        }, transaction) === 'ALREADY_ACTIVE';
      const activatedForBuyer = await operational.listActivatedProductOffersForBuyer({
        controllerPrincipalId: owner,
        slug: buyerSlug,
      }, transaction);
      const hiddenFromProvider = await operational.listActivatedProductOffersForBuyer({
        controllerPrincipalId: owner,
        slug,
      }, transaction);
      activatedOfferBuyerVisibilityVerified =
        activatedForBuyer?.some((offer) => offer.offerId === draft.offerId) === true &&
        hiddenFromProvider?.some((offer) => offer.offerId === draft.offerId) === false &&
        await operational.listActivatedProductOffersForBuyer({
          controllerPrincipalId: intruder,
          slug: buyerSlug,
        }, transaction) === undefined;

      const agent = createOperationalAgent({
        businessId,
        capability: 'research',
        displayName: 'Work 2 proof Agent',
        environment: 'AUTOMATED_TEST',
        role: 'RESEARCH_AGENT',
      });
      const agents = new PostgresAgentRepository(persistence);
      const firstAgent = await agents.ensureAgent(agent, owner, transaction);
      const replayAgent = await agents.ensureAgent(agent, owner, transaction);
      agentReplayVerified = firstAgent.created && !replayAgent.created;

      await assertRejects(() => operational.ensureOffer(
        { ...draft, controllerPrincipalId: intruder, slug },
        transaction,
      ));
      await assertRejects(() => agents.ensureAgent(agent, intruder, transaction));
      tenantIsolationVerified = (
        await operational.getBusinessForController({ controllerPrincipalId: owner, slug }, transaction)
      )?.businessId === businessId && (
        await operational.getBusinessForController({ controllerPrincipalId: intruder, slug }, transaction)
      ) === undefined;
      treasuryIsolationVerified = (
        await operational.getTreasury({ controllerPrincipalId: owner, slug }, transaction)
      )?.businessId === businessId && (
        await operational.getTreasury({ controllerPrincipalId: intruder, slug }, transaction)
      ) === undefined;

      throw rollbackSignal;
    });
  } catch (error: unknown) {
    if (error !== rollbackSignal) throw error;
  }

  const remaining = await persistence.databaseForApplication
    .withSchema(applicationSchema)
    .selectFrom('businesses')
    .select(({ fn }) => fn.countAll<number>().as('count'))
    .where('business_id', '=', businessId)
    .executeTakeFirstOrThrow();

  return {
    activatedOfferBuyerVisibilityVerified,
    activatedOfferReplayVerified,
    agentReplayVerified,
    offerReplayVerified,
    rollbackVerified: Number(remaining.count) === 0,
    tenantIsolationVerified,
    treasuryIsolationVerified,
  };
}

async function assertRejects(operation: () => Promise<unknown>): Promise<void> {
  let rejected = false;
  try {
    await operation();
  } catch {
    rejected = true;
  }
  if (!rejected) throw new Error('Expected tenant-isolated operation to fail closed.');
}
