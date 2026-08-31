import { createHash } from 'node:crypto';

import { sql } from 'kysely';

import type { CapitalTransferOutcome } from '../../modules/capital/execution-port.ts';
import type {
  CapitalAllocation,
  CapitalDecision,
  CapitalDecisionMaterial,
  CapitalMandate,
  CapitalProvider,
} from '../../modules/capital/model.ts';
import { deriveCapitalProvenance } from '../../modules/capital/model.ts';
import type { UsdcMicroAmount } from '../../modules/commerce/money.ts';
import { canonicalJson } from '../../shared/canonical-json.ts';
import type { PersistenceTransaction, PostgresPersistence } from './database.ts';
import { applicationSchema } from './database.ts';

export interface PendingCapitalAccount {
  readonly displayName: string;
  readonly providerAccountId: `cpa_${string}`;
  readonly providerId: `cap_${string}`;
}

export interface CapitalAllocationExecutionContext {
  readonly allocationId: `cal_${string}`;
  readonly amountMicroUsdc: UsdcMicroAmount;
  readonly destinationAddress: `0x${string}`;
  readonly idempotencyKey: string;
  readonly providerTransactionId: string | null;
  readonly providerWalletId: string;
  readonly recipientBusinessId: `biz_${string}`;
  readonly sourceAddress: `0x${string}`;
  readonly state: string;
}

export interface CapitalUseSummary {
  readonly amountMicroUsdc: string;
  readonly capitalUseId: string;
  readonly linkedAt: string;
  readonly obligationId: string;
  readonly obligationState: string;
  readonly settlementState: string | null;
}

export interface CapitalPathSummary {
  readonly acceptedAt: string | null;
  readonly allocationId: string | null;
  readonly allocationProvenance: string | null;
  readonly allocationState: string | null;
  readonly allocationTransactionHash: string | null;
  readonly approvedMicroUsdc: string | null;
  readonly businessId: string;
  readonly businessName: string;
  readonly businessSlug: string;
  readonly completedAt: string | null;
  readonly decidedAt: string;
  readonly decisionId: string;
  readonly instrument: string | null;
  readonly mandateCriteria: unknown;
  readonly mandateId: string;
  readonly mandateMaximumMicroUsdc: string;
  readonly mandateMinimumMicroUsdc: string;
  readonly mandateName: string;
  readonly mandateStrategy: string;
  readonly mandateVersion: number;
  readonly materialSha256: string;
  readonly observedAt: string;
  readonly outcome: string;
  readonly providerDisplayName: string;
  readonly providerAccountAssurance: string | null;
  readonly providerAccountBlockchain: string | null;
  readonly providerAccountCustodyModel: string | null;
  readonly providerAccountInfrastructure: string | null;
  readonly providerAccountStatus: string | null;
  readonly providerId: string;
  readonly providerProvenance: string;
  readonly providerRiskBearerClassification: string;
  readonly rationale: string;
  readonly reasonCode: string;
  readonly reviewId: string;
  readonly requestedMicroUsdc: string;
  readonly returnProfile: string | null;
  readonly terms: unknown | null;
  readonly uses: readonly CapitalUseSummary[];
}

function materialDigest(material: CapitalDecisionMaterial): string {
  return createHash('sha256').update(canonicalJson(material)).digest('hex');
}

function requireAddress(value: string | null, label: string): `0x${string}` {
  if (value === null || !/^0x[0-9a-fA-F]{40}$/.test(value)) {
    throw new Error(`${label} does not have an active Arc EOA address.`);
  }
  return value as `0x${string}`;
}

export class PostgresCapitalRepository {
  readonly #persistence: PostgresPersistence;

  constructor(persistence: PostgresPersistence) {
    this.#persistence = persistence;
  }

  async prepareProvider(
    input: {
      readonly mandate: CapitalMandate;
      readonly pendingProviderAccountId?: `cpa_${string}`;
      readonly provider: CapitalProvider;
    },
    transaction?: PersistenceTransaction,
  ): Promise<void> {
    if (input.mandate.providerId !== input.provider.providerId) {
      throw new Error('Capital mandate must belong to the supplied provider.');
    }
    if (transaction === undefined) {
      await this.#persistence.transaction((activeTransaction) =>
        this.prepareProvider(input, activeTransaction),
      );
      return;
    }

    const database = transaction.withSchema(applicationSchema);
    await database
      .insertInto('capital_providers')
      .values({
        controller_principal_id: input.provider.controllerPrincipalId,
        display_name: input.provider.displayName,
        environment: input.provider.environment,
        provenance: input.provider.provenance,
        provider_id: input.provider.providerId,
        risk_bearer_classification: input.provider.riskBearerClassification,
        status: input.provider.status,
      })
      .onConflict((conflict) => conflict.column('provider_id').doNothing())
      .execute();
    const storedProvider = await database
      .selectFrom('capital_providers')
      .selectAll()
      .where('provider_id', '=', input.provider.providerId)
      .executeTakeFirstOrThrow();
    if (
      storedProvider.controller_principal_id !== input.provider.controllerPrincipalId ||
      storedProvider.display_name !== input.provider.displayName ||
      storedProvider.environment !== input.provider.environment ||
      storedProvider.provenance !== input.provider.provenance ||
      storedProvider.risk_bearer_classification !== input.provider.riskBearerClassification ||
      storedProvider.status !== input.provider.status
    ) {
      throw new Error('Capital Provider ID already exists with different semantics.');
    }

    await database
      .insertInto('capital_mandates')
      .values({
        criteria: input.mandate.criteria,
        mandate_id: input.mandate.mandateId,
        maximum_micro_usdc: input.mandate.maximumMicroUsdc.toString(),
        minimum_micro_usdc: input.mandate.minimumMicroUsdc.toString(),
        name: input.mandate.name,
        provider_id: input.mandate.providerId,
        status: input.mandate.status,
        strategy: input.mandate.strategy,
        version: input.mandate.version,
      })
      .onConflict((conflict) => conflict.column('mandate_id').doNothing())
      .execute();
    const storedMandate = await database
      .selectFrom('capital_mandates')
      .selectAll()
      .where('mandate_id', '=', input.mandate.mandateId)
      .executeTakeFirstOrThrow();
    if (
      canonicalJson(storedMandate.criteria) !== canonicalJson(input.mandate.criteria) ||
      storedMandate.maximum_micro_usdc !== input.mandate.maximumMicroUsdc.toString() ||
      storedMandate.minimum_micro_usdc !== input.mandate.minimumMicroUsdc.toString() ||
      storedMandate.name !== input.mandate.name ||
      storedMandate.provider_id !== input.mandate.providerId ||
      storedMandate.status !== input.mandate.status ||
      storedMandate.strategy !== input.mandate.strategy ||
      storedMandate.version !== input.mandate.version
    ) {
      throw new Error('Capital mandate ID already exists with different semantics.');
    }

    if (input.pendingProviderAccountId !== undefined) {
      await database
        .insertInto('capital_provider_accounts')
        .values({
          account_assurance: 'PLATFORM_CONTROLLED_EXTERNAL',
          account_type: 'EOA',
          address: null,
          blockchain: 'ARC-TESTNET',
          custody_model: 'DEVELOPER_CONTROLLED',
          environment: 'PRIVATE_ARC_TESTNET',
          provider: 'CIRCLE',
          provider_account_id: input.pendingProviderAccountId,
          provider_id: input.provider.providerId,
          provider_wallet_id: null,
          status: 'PENDING',
          updated_at: new Date(),
        })
        .onConflict((conflict) => conflict.column('provider_account_id').doNothing())
        .execute();
      const storedAccount = await database
        .selectFrom('capital_provider_accounts')
        .select(['provider_id', 'status'])
        .where('provider_account_id', '=', input.pendingProviderAccountId)
        .executeTakeFirstOrThrow();
      if (storedAccount.provider_id !== input.provider.providerId || storedAccount.status === 'ENDED') {
        throw new Error('Capital Provider account ID already exists with different semantics.');
      }
    }
  }

  async recordReviewDecision(input: {
    readonly decidedAt: string;
    readonly decidedByPrincipalId: `usr_${string}`;
    readonly decision: CapitalDecision;
    readonly material: CapitalDecisionMaterial;
    readonly requestedMicroUsdc: UsdcMicroAmount;
  }): Promise<void> {
    if (
      input.decision.providerId.length === 0 ||
      !Number.isFinite(Date.parse(input.decidedAt)) ||
      !Number.isFinite(Date.parse(input.material.observedAt)) ||
      Date.parse(input.decidedAt) < Date.parse(input.material.observedAt) ||
      input.requestedMicroUsdc <= 0n
    ) {
      throw new Error('Capital decision requires a provider, valid timestamps, and a positive request.');
    }
    const digest = materialDigest(input.material);
    await this.#persistence.transaction(async (transaction) => {
      const database = transaction.withSchema(applicationSchema);
      const mandate = await database
        .selectFrom('capital_mandates as mandate')
        .innerJoin('capital_providers as provider', 'provider.provider_id', 'mandate.provider_id')
        .select([
          'mandate.maximum_micro_usdc as maximumMicroUsdc',
          'mandate.minimum_micro_usdc as minimumMicroUsdc',
          'mandate.provider_id as providerId',
          'provider.controller_principal_id as controllerPrincipalId',
        ])
        .where('mandate_id', '=', input.decision.mandateId)
        .executeTakeFirstOrThrow();
      if (
        mandate.providerId !== input.decision.providerId ||
        mandate.controllerPrincipalId !== input.decidedByPrincipalId
      ) {
        throw new Error('Capital decision does not match its provider mandate.');
      }
      if (
        input.decision.outcome === 'APPROVED' &&
        (input.decision.approvedMicroUsdc !== input.requestedMicroUsdc ||
          input.decision.terms === null ||
          input.decision.asset !== 'USDC' ||
          input.decision.terms.instrument !== 'CONTROLLED_TEST_ALLOCATION' ||
          input.decision.terms.returnProfile !== 'NONE' ||
          BigInt(input.decision.terms.useCapMicroUsdc) <= 0n ||
          input.requestedMicroUsdc < BigInt(mandate.minimumMicroUsdc) ||
          input.requestedMicroUsdc > BigInt(mandate.maximumMicroUsdc) ||
          BigInt(input.decision.terms.useCapMicroUsdc) > input.requestedMicroUsdc)
      ) {
        throw new Error('Approved Capital decision violates its request, mandate, or use cap.');
      }
      await database
        .insertInto('capital_reviews')
        .values({
          business_id: input.material.businessId,
          decision_material: input.material,
          mandate_id: input.decision.mandateId,
          material_sha256: digest,
          observed_at: input.material.observedAt,
          provider_id: input.decision.providerId,
          requested_micro_usdc: input.requestedMicroUsdc.toString(),
          review_id: input.decision.reviewId,
        })
        .onConflict((conflict) => conflict.column('review_id').doNothing())
        .execute();
      const storedReview = await database
        .selectFrom('capital_reviews')
        .select([
          'business_id',
          'decision_material',
          'mandate_id',
          'material_sha256',
          'observed_at',
          'provider_id',
          'requested_micro_usdc',
        ])
        .where('review_id', '=', input.decision.reviewId)
        .executeTakeFirstOrThrow();
      if (
        storedReview.business_id !== input.material.businessId ||
        canonicalJson(storedReview.decision_material) !== canonicalJson(input.material) ||
        storedReview.mandate_id !== input.decision.mandateId ||
        storedReview.material_sha256 !== digest ||
        storedReview.observed_at.toISOString() !== new Date(input.material.observedAt).toISOString() ||
        storedReview.provider_id !== input.decision.providerId ||
        storedReview.requested_micro_usdc !== input.requestedMicroUsdc.toString()
      ) {
        throw new Error('Capital review ID already exists with different decision material.');
      }

      await database
        .insertInto('capital_decisions')
        .values({
          approved_micro_usdc: input.decision.approvedMicroUsdc?.toString() ?? null,
          asset: input.decision.asset,
          decided_at: input.decidedAt,
          decided_by_principal_id: input.decidedByPrincipalId,
          decision_id: input.decision.decisionId,
          outcome: input.decision.outcome,
          rationale: input.decision.rationale,
          reason_code: input.decision.reasonCode,
          review_id: input.decision.reviewId,
          terms: input.decision.terms,
        })
        .onConflict((conflict) => conflict.column('decision_id').doNothing())
        .execute();
      const storedDecision = await database
        .selectFrom('capital_decisions')
        .select([
          'approved_micro_usdc',
          'asset',
          'decided_at',
          'decided_by_principal_id',
          'outcome',
          'rationale',
          'reason_code',
          'review_id',
          'terms',
        ])
        .where('decision_id', '=', input.decision.decisionId)
        .executeTakeFirstOrThrow();
      if (
        storedDecision.approved_micro_usdc !== input.decision.approvedMicroUsdc?.toString() &&
        !(storedDecision.approved_micro_usdc === null && input.decision.approvedMicroUsdc === null)
      ) {
        throw new Error('Capital decision ID already exists with a different approved amount.');
      }
      if (
        storedDecision.asset !== input.decision.asset ||
        storedDecision.decided_at.toISOString() !== new Date(input.decidedAt).toISOString() ||
        storedDecision.decided_by_principal_id !== input.decidedByPrincipalId ||
        storedDecision.outcome !== input.decision.outcome ||
        storedDecision.rationale !== input.decision.rationale ||
        storedDecision.reason_code !== input.decision.reasonCode ||
        storedDecision.review_id !== input.decision.reviewId ||
        canonicalJson(storedDecision.terms) !== canonicalJson(input.decision.terms)
      ) {
        throw new Error('Capital decision ID already exists with different semantics.');
      }
    });
  }

  async prepareOfferedAllocation(input: {
    readonly allocation: CapitalAllocation;
    readonly idempotencyKey: string;
  }): Promise<void> {
    if (input.allocation.state !== 'OFFERED') {
      throw new Error('Only an OFFERED Capital allocation can be prepared.');
    }
    const database = this.#persistence.databaseForApplication.withSchema(applicationSchema);
    const decision = await database
      .selectFrom('capital_decisions as decision')
      .innerJoin('capital_reviews as review', 'review.review_id', 'decision.review_id')
      .innerJoin('capital_provider_accounts as account', (join) =>
        join
          .on('account.provider_account_id', '=', input.allocation.providerAccountId)
          .onRef('account.provider_id', '=', 'review.provider_id'),
      )
      .select([
        'decision.approved_micro_usdc as approvedMicroUsdc',
        'decision.outcome',
        'decision.terms',
        'review.business_id as businessId',
        'review.decision_material as decisionMaterial',
        'account.provider_id as providerAccountProviderId',
      ])
      .where('decision.decision_id', '=', input.allocation.decisionId)
      .executeTakeFirstOrThrow();
    const material = decision.decisionMaterial as { readonly provenance?: unknown };
    const terms = decision.terms as {
      readonly instrument?: unknown;
      readonly returnProfile?: unknown;
    } | null;
    const provider = await database
      .selectFrom('capital_providers')
      .select('provenance')
      .where('provider_id', '=', decision.providerAccountProviderId)
      .executeTakeFirstOrThrow();
    if (
      material.provenance !== 'COMMON_CONTROL_TEST' &&
      material.provenance !== 'INDEPENDENT'
    ) {
      throw new Error('Capital decision material has no valid provenance.');
    }
    if (provider.provenance !== 'COMMON_CONTROL_TEST' && provider.provenance !== 'INDEPENDENT') {
      throw new Error('Capital Provider has no valid provenance.');
    }
    const expectedProvenance = deriveCapitalProvenance({
      decisionMaterialProvenance: material.provenance,
      providerProvenance: provider.provenance,
    });
    if (
      decision.outcome !== 'APPROVED' ||
      decision.approvedMicroUsdc !== input.allocation.amountMicroUsdc.toString() ||
      decision.businessId !== input.allocation.recipientBusinessId ||
      input.allocation.provenance !== expectedProvenance ||
      terms?.instrument !== input.allocation.instrument ||
      terms?.returnProfile !== input.allocation.returnProfile
    ) {
      throw new Error('Capital allocation does not match its approved provider decision.');
    }
    await database
      .insertInto('capital_allocations')
      .values({
        accepted_at: null,
        accepted_by_principal_id: null,
        allocation_id: input.allocation.allocationId,
        amount_micro_usdc: input.allocation.amountMicroUsdc.toString(),
        asset: input.allocation.asset,
        block_number: null,
        completed_at: null,
        decision_id: input.allocation.decisionId,
        idempotency_key: input.idempotencyKey,
        instrument: input.allocation.instrument,
        provenance: input.allocation.provenance,
        provider_account_id: input.allocation.providerAccountId,
        provider_state: null,
        provider_transaction_id: null,
        recipient_business_id: input.allocation.recipientBusinessId,
        return_profile: input.allocation.returnProfile,
        state: 'OFFERED',
        transaction_hash: null,
        updated_at: new Date(),
      })
      .onConflict((conflict) => conflict.column('allocation_id').doNothing())
      .execute();
    const stored = await database
      .selectFrom('capital_allocations')
      .select([
        'amount_micro_usdc',
        'decision_id',
        'idempotency_key',
        'instrument',
        'provenance',
        'provider_account_id',
        'recipient_business_id',
        'return_profile',
      ])
      .where('allocation_id', '=', input.allocation.allocationId)
      .executeTakeFirstOrThrow();
    if (
      stored.amount_micro_usdc !== input.allocation.amountMicroUsdc.toString() ||
      stored.decision_id !== input.allocation.decisionId ||
      stored.idempotency_key !== input.idempotencyKey ||
      stored.instrument !== input.allocation.instrument ||
      stored.provenance !== input.allocation.provenance ||
      stored.provider_account_id !== input.allocation.providerAccountId ||
      stored.recipient_business_id !== input.allocation.recipientBusinessId ||
      stored.return_profile !== input.allocation.returnProfile
    ) {
      throw new Error('Capital allocation ID already exists with different semantics.');
    }
  }

  async acceptAllocation(input: {
    readonly acceptedAt: string;
    readonly acceptedByPrincipalId: `usr_${string}`;
    readonly allocationId: `cal_${string}`;
    readonly businessSlug?: string;
  }): Promise<void> {
    if (!Number.isFinite(Date.parse(input.acceptedAt))) {
      throw new Error('Capital acceptance requires a valid timestamp.');
    }
    await this.#persistence.transaction(async (transaction) => {
      const database = transaction.withSchema(applicationSchema);
      const allocation = await database
        .selectFrom('capital_allocations as allocation')
        .innerJoin('capital_decisions as decision', 'decision.decision_id', 'allocation.decision_id')
        .innerJoin('business_controls as control', (join) =>
          join
            .onRef('control.business_id', '=', 'allocation.recipient_business_id')
            .on('control.status', '=', 'ACTIVE'),
        )
        .innerJoin('businesses as business', 'business.business_id', 'allocation.recipient_business_id')
        .select([
          'allocation.accepted_at as acceptedAt',
          'allocation.accepted_by_principal_id as acceptedByPrincipalId',
          'allocation.state',
          'control.controller_principal_id as controllerPrincipalId',
          'decision.decided_at as decidedAt',
          'business.slug as businessSlug',
        ])
        .where('allocation.allocation_id', '=', input.allocationId)
        .forUpdate()
        .executeTakeFirstOrThrow();
      if (
        allocation.controllerPrincipalId !== input.acceptedByPrincipalId ||
        (input.businessSlug !== undefined && allocation.businessSlug !== input.businessSlug)
      ) {
        throw new Error('Only the active Business controller may accept an offered allocation.');
      }
      if (allocation.state !== 'OFFERED') {
        if (allocation.acceptedByPrincipalId === input.acceptedByPrincipalId) {
          return;
        }
        throw new Error('Capital allocation was already accepted with different semantics.');
      }
      if (
        allocation.state !== 'OFFERED' ||
        new Date(input.acceptedAt) < allocation.decidedAt
      ) {
        throw new Error('Only the active Business controller may accept an offered allocation.');
      }
      await database
        .updateTable('capital_allocations')
        .set({
          accepted_at: input.acceptedAt,
          accepted_by_principal_id: input.acceptedByPrincipalId,
          state: 'AUTHORIZED',
          updated_at: input.acceptedAt,
        })
        .where('allocation_id', '=', input.allocationId)
        .executeTakeFirstOrThrow();
    });
  }

  async listPendingAccounts(): Promise<readonly PendingCapitalAccount[]> {
    const rows = await this.#persistence.databaseForApplication
      .withSchema(applicationSchema)
      .selectFrom('capital_provider_accounts as account')
      .innerJoin('capital_providers as provider', 'provider.provider_id', 'account.provider_id')
      .select([
        'provider.display_name as displayName',
        'account.provider_account_id as providerAccountId',
        'provider.provider_id as providerId',
      ])
      .where('account.status', '=', 'PENDING')
      .orderBy('account.provider_account_id')
      .execute();
    return rows as readonly PendingCapitalAccount[];
  }

  async activateProviderAccount(input: {
    readonly address: `0x${string}`;
    readonly providerAccountId: `cpa_${string}`;
    readonly providerWalletId: string;
  }): Promise<void> {
    await this.#persistence.transaction(async (transaction) => {
      const database = transaction.withSchema(applicationSchema);
      const account = await database
        .selectFrom('capital_provider_accounts')
        .select(['address', 'provider_wallet_id', 'status'])
        .where('provider_account_id', '=', input.providerAccountId)
        .forUpdate()
        .executeTakeFirstOrThrow();
      if (account.status === 'ACTIVE') {
        if (
          account.address?.toLowerCase() === input.address.toLowerCase() &&
          account.provider_wallet_id === input.providerWalletId
        ) {
          return;
        }
        throw new Error('Active Capital Provider account cannot be rebound to another wallet.');
      }
      if (account.status !== 'PENDING') {
        throw new Error('Only a pending Capital Provider account can be activated.');
      }
      await database
        .updateTable('capital_provider_accounts')
        .set({
          address: input.address,
          provider_wallet_id: input.providerWalletId,
          status: 'ACTIVE',
          updated_at: new Date(),
        })
        .where('provider_account_id', '=', input.providerAccountId)
        .executeTakeFirstOrThrow();
    });
  }

  async getAllocationExecutionContext(
    allocationId: `cal_${string}`,
  ): Promise<CapitalAllocationExecutionContext> {
    const row = await this.#persistence.databaseForApplication
      .withSchema(applicationSchema)
      .selectFrom('capital_allocations as allocation')
      .innerJoin(
        'capital_provider_accounts as account',
        'account.provider_account_id',
        'allocation.provider_account_id',
      )
      .innerJoin('treasury_bindings as treasury', (join) =>
        join
          .onRef('treasury.business_id', '=', 'allocation.recipient_business_id')
          .on('treasury.status', '=', 'ACTIVE'),
      )
      .select([
        'allocation.allocation_id as allocationId',
        'allocation.amount_micro_usdc as amountMicroUsdc',
        'treasury.address as destinationAddress',
        'allocation.idempotency_key as idempotencyKey',
        'allocation.provider_transaction_id as providerTransactionId',
        'account.provider_wallet_id as providerWalletId',
        'allocation.recipient_business_id as recipientBusinessId',
        'account.address as sourceAddress',
        'allocation.state',
      ])
      .where('allocation.allocation_id', '=', allocationId)
      .where('account.status', '=', 'ACTIVE')
      .executeTakeFirstOrThrow();
    if (row.providerWalletId === null) throw new Error('Capital Provider account has no Circle wallet ID.');
    return {
      allocationId: row.allocationId as `cal_${string}`,
      amountMicroUsdc: BigInt(row.amountMicroUsdc) as UsdcMicroAmount,
      destinationAddress: requireAddress(row.destinationAddress, 'Recipient Treasury'),
      idempotencyKey: row.idempotencyKey,
      providerTransactionId: row.providerTransactionId,
      providerWalletId: row.providerWalletId,
      recipientBusinessId: row.recipientBusinessId as `biz_${string}`,
      sourceAddress: requireAddress(row.sourceAddress, 'Capital Provider account'),
      state: row.state,
    };
  }

  async recordSubmitted(input: {
    readonly allocationId: `cal_${string}`;
    readonly providerTransactionId: string;
  }): Promise<void> {
    if (input.providerTransactionId.trim().length === 0) {
      throw new Error('Capital submission requires a provider transaction ID.');
    }
    const result = await this.#persistence.databaseForApplication
      .withSchema(applicationSchema)
      .updateTable('capital_allocations')
      .set({
        provider_state: 'SUBMITTED',
        provider_transaction_id: input.providerTransactionId,
        state: 'SUBMITTED',
        updated_at: new Date(),
      })
      .where('allocation_id', '=', input.allocationId)
      .where('state', 'in', ['AUTHORIZED', 'OUTCOME_UNKNOWN'])
      .where('provider_transaction_id', 'is', null)
      .executeTakeFirstOrThrow();
    if (result.numUpdatedRows !== 1n) {
      throw new Error('Capital allocation submission was not recorded from an admissible state.');
    }
  }

  async recordOutcomeUnknown(input: {
    readonly allocationId: `cal_${string}`;
    readonly providerState: string;
    readonly providerTransactionId?: string;
  }): Promise<void> {
    if (
      input.providerState.trim().length === 0 ||
      input.providerTransactionId?.trim().length === 0
    ) {
      throw new Error('Capital ambiguity requires non-empty provider state and transaction ID when present.');
    }
    await this.#persistence.transaction(async (transaction) => {
      const database = transaction.withSchema(applicationSchema);
      const allocation = await database
        .selectFrom('capital_allocations')
        .select(['provider_transaction_id', 'state'])
        .where('allocation_id', '=', input.allocationId)
        .forUpdate()
        .executeTakeFirstOrThrow();
      if (!['AUTHORIZED', 'SUBMITTED', 'OUTCOME_UNKNOWN'].includes(allocation.state)) {
        throw new Error('Capital ambiguity was not recorded from an admissible state.');
      }
      if (
        allocation.provider_transaction_id !== null &&
        input.providerTransactionId !== undefined &&
        allocation.provider_transaction_id !== input.providerTransactionId
      ) {
        throw new Error('Capital ambiguity cannot replace an existing provider transaction ID.');
      }
      await database
        .updateTable('capital_allocations')
        .set({
          provider_state: input.providerState,
          ...(allocation.provider_transaction_id === null && input.providerTransactionId !== undefined
            ? { provider_transaction_id: input.providerTransactionId }
            : {}),
          state: 'OUTCOME_UNKNOWN',
          updated_at: new Date(),
        })
        .where('allocation_id', '=', input.allocationId)
        .executeTakeFirstOrThrow();
    });
  }

  async recordObservedOutcome(input: {
    readonly allocationId: `cal_${string}`;
    readonly blockNumber?: bigint;
    readonly observedAt: string;
    readonly outcome: CapitalTransferOutcome;
  }): Promise<void> {
    if (!Number.isFinite(Date.parse(input.observedAt))) {
      throw new Error('Capital observation requires a valid timestamp.');
    }
    if (input.outcome.state !== 'COMPLETE') {
      const nextState = input.outcome.state === 'PENDING' ? undefined : input.outcome.state;
      const result = await this.#persistence.databaseForApplication
        .withSchema(applicationSchema)
        .updateTable('capital_allocations')
        .set({
          provider_state: input.outcome.providerState,
          ...(nextState === undefined ? {} : { state: nextState }),
          updated_at: input.observedAt,
        })
        .where('allocation_id', '=', input.allocationId)
        .where('state', 'in', ['SUBMITTED', 'OUTCOME_UNKNOWN'])
        .executeTakeFirstOrThrow();
      if (result.numUpdatedRows !== 1n) {
        const current = await this.#persistence.databaseForApplication
          .withSchema(applicationSchema)
          .selectFrom('capital_allocations')
          .select('state')
          .where('allocation_id', '=', input.allocationId)
          .executeTakeFirstOrThrow();
        if (current.state === 'COMPLETE') return;
        throw new Error('Capital observation updated no reconcilable allocation.');
      }
      return;
    }
    if (input.blockNumber === undefined) {
      throw new Error('A chain-confirmed Capital allocation requires an Arc block number.');
    }
    const blockNumber = input.blockNumber;
    const completed = input.outcome;
    await this.#persistence.transaction(async (transaction) => {
      const database = transaction.withSchema(applicationSchema);
      const allocation = await database
        .selectFrom('capital_allocations')
        .select([
          'amount_micro_usdc',
          'block_number',
          'provenance',
          'provider_state',
          'provider_transaction_id',
          'recipient_business_id',
          'state',
          'transaction_hash',
        ])
        .where('allocation_id', '=', input.allocationId)
        .forUpdate()
        .executeTakeFirstOrThrow();
      if (allocation.state === 'COMPLETE') {
        if (
          allocation.block_number === blockNumber.toString() &&
          allocation.provider_state === completed.providerState &&
          allocation.transaction_hash?.toLowerCase() === completed.transactionHash.toLowerCase()
        ) {
          return;
        }
        throw new Error('Completed Capital allocation cannot be reconciled to different chain proof.');
      }
      if (
        (allocation.state !== 'SUBMITTED' && allocation.state !== 'OUTCOME_UNKNOWN') ||
        allocation.provider_transaction_id === null
      ) {
        throw new Error('Capital allocation is not in a reconcilable state.');
      }
      await database
        .updateTable('capital_allocations')
        .set({
          block_number: blockNumber.toString(),
          completed_at: input.observedAt,
          provider_state: completed.providerState,
          state: 'COMPLETE',
          transaction_hash: completed.transactionHash,
          updated_at: input.observedAt,
        })
        .where('allocation_id', '=', input.allocationId)
        .executeTakeFirstOrThrow();
      await database
        .insertInto('economic_entries')
        .values({
          amount_micro_usdc: allocation.amount_micro_usdc,
          asset: 'USDC',
          business_id: allocation.recipient_business_id,
          capital_allocation_id: input.allocationId,
          category: 'CAPITAL',
          direction: 'INFLOW',
          entry_id: `ent_${input.allocationId}_capital`,
          obligation_id: null,
          occurred_at: input.observedAt,
          provenance: allocation.provenance,
          settlement_id: null,
        })
        .onConflict((conflict) => conflict.column('entry_id').doNothing())
        .execute();
      await database
        .insertInto('evidence_facts')
        .values({
          coverage: 'CAPITAL_ALLOCATION_ONLY',
          environment: 'PRIVATE_ARC_TESTNET',
          evidence_id: `evi_${input.allocationId}_arc`,
          fact_type: 'CAPITAL_ALLOCATION_FINALIZED',
          observed_at: input.observedAt,
          payload: {
            amountMicroUsdc: allocation.amount_micro_usdc,
            commonControl: allocation.provenance === 'COMMON_CONTROL_TEST',
            recipientBusinessId: allocation.recipient_business_id,
            transactionHash: completed.transactionHash,
          },
          provenance: allocation.provenance,
          source_reference: completed.transactionHash,
          source_type: 'ARC_TESTNET_TRANSACTION',
          subject_id: input.allocationId,
          subject_type: 'CAPITAL_ALLOCATION',
          verification: 'CHAIN_VERIFIED',
        })
        .onConflict((conflict) => conflict.column('evidence_id').doNothing())
        .execute();
    });
  }

  async linkCapitalUse(input: {
    readonly allocationId: `cal_${string}`;
    readonly amountMicroUsdc: UsdcMicroAmount;
    readonly capitalUseId: `cpu_${string}`;
    readonly linkedAt: string;
    readonly linkedByPrincipalId: `usr_${string}`;
    readonly obligationId: `obl_${string}`;
  }): Promise<void> {
    await this.#persistence.transaction(async (transaction) => {
      const database = transaction.withSchema(applicationSchema);
      const context = await database
        .selectFrom('capital_allocations as allocation')
        .innerJoin('capital_decisions as decision', 'decision.decision_id', 'allocation.decision_id')
        .innerJoin('obligations as obligation', (join) =>
          join.on('obligation.obligation_id', '=', input.obligationId),
        )
        .innerJoin('business_controls as control', (join) =>
          join
            .onRef('control.business_id', '=', 'allocation.recipient_business_id')
            .on('control.status', '=', 'ACTIVE'),
        )
        .select([
          'allocation.amount_micro_usdc as allocationAmount',
          'allocation.completed_at as completedAt',
          'allocation.recipient_business_id as recipientBusinessId',
          'allocation.state',
          'control.controller_principal_id as controllerPrincipalId',
          'decision.terms',
          'obligation.amount_micro_usdc as obligationAmount',
          'obligation.buyer_business_id as buyerBusinessId',
          'obligation.created_at as obligationCreatedAt',
        ])
        .where('allocation.allocation_id', '=', input.allocationId)
        .forUpdate()
        .executeTakeFirstOrThrow();
      const terms = context.terms as { readonly useCapMicroUsdc?: unknown } | null;
      const useCap = terms?.useCapMicroUsdc;
      const linkedAt = new Date(input.linkedAt);
      if (
        context.state !== 'COMPLETE' ||
        context.completedAt === null ||
        context.obligationCreatedAt <= context.completedAt ||
        !Number.isFinite(linkedAt.getTime()) ||
        linkedAt < context.completedAt ||
        linkedAt < context.obligationCreatedAt ||
        context.buyerBusinessId !== context.recipientBusinessId ||
        context.controllerPrincipalId !== input.linkedByPrincipalId ||
        context.obligationAmount !== input.amountMicroUsdc.toString() ||
        typeof useCap !== 'string'
      ) {
        throw new Error('Capital use must be a later, controlled obligation of the recipient Business.');
      }
      const existing = await database
        .selectFrom('capital_use_links')
        .select(['allocation_id', 'amount_micro_usdc', 'obligation_id'])
        .where('capital_use_id', '=', input.capitalUseId)
        .executeTakeFirst();
      if (existing !== undefined) {
        if (
          existing.allocation_id === input.allocationId &&
          existing.amount_micro_usdc === input.amountMicroUsdc.toString() &&
          existing.obligation_id === input.obligationId
        ) {
          return;
        }
        throw new Error('Capital use ID already exists with different semantics.');
      }
      const alreadyLinked = await database
        .selectFrom('capital_use_links')
        .select(sql<string>`coalesce(sum(amount_micro_usdc), 0)`.as('total'))
        .where('allocation_id', '=', input.allocationId)
        .executeTakeFirstOrThrow();
      const nextTotal = BigInt(alreadyLinked.total) + input.amountMicroUsdc;
      if (nextTotal > BigInt(context.allocationAmount) || nextTotal > BigInt(useCap)) {
        throw new Error('Capital use exceeds the allocation or provider-approved use cap.');
      }
      await database
        .insertInto('capital_use_links')
        .values({
          allocation_id: input.allocationId,
          amount_micro_usdc: input.amountMicroUsdc.toString(),
          capital_use_id: input.capitalUseId,
          linked_at: input.linkedAt,
          linked_by_principal_id: input.linkedByPrincipalId,
          obligation_id: input.obligationId,
        })
        .onConflict((conflict) => conflict.column('capital_use_id').doNothing())
        .execute();
    });
  }

  async listCapitalPaths(input?: {
    readonly businessSlug?: string;
    readonly controllerPrincipalId: `usr_${string}`;
  }): Promise<readonly CapitalPathSummary[]> {
    const database = this.#persistence.databaseForApplication.withSchema(applicationSchema);
    const controllerPrincipalId = input?.controllerPrincipalId;
    const businessSlug = input?.businessSlug;
    const paths = await database
        .selectFrom('capital_decisions as decision')
        .innerJoin('capital_reviews as review', 'review.review_id', 'decision.review_id')
        .innerJoin('capital_providers as provider', 'provider.provider_id', 'review.provider_id')
        .innerJoin('capital_mandates as mandate', 'mandate.mandate_id', 'review.mandate_id')
        .innerJoin('businesses as business', 'business.business_id', 'review.business_id')
        .leftJoin('capital_allocations as allocation', 'allocation.decision_id', 'decision.decision_id')
        .leftJoin(
          'capital_provider_accounts as provider_account',
          'provider_account.provider_account_id',
          'allocation.provider_account_id',
        )
        .select([
          'allocation.accepted_at as acceptedAt',
          'allocation.allocation_id as allocationId',
          'allocation.provenance as allocationProvenance',
          'allocation.state as allocationState',
          'allocation.transaction_hash as allocationTransactionHash',
          'decision.approved_micro_usdc as approvedMicroUsdc',
          'review.business_id as businessId',
          'business.display_name as businessName',
          'business.slug as businessSlug',
          'allocation.completed_at as completedAt',
          'decision.decided_at as decidedAt',
          'decision.decision_id as decisionId',
          'allocation.instrument',
          'mandate.criteria as mandateCriteria',
          'mandate.mandate_id as mandateId',
          'mandate.maximum_micro_usdc as mandateMaximumMicroUsdc',
          'mandate.minimum_micro_usdc as mandateMinimumMicroUsdc',
          'mandate.name as mandateName',
          'mandate.strategy as mandateStrategy',
          'mandate.version as mandateVersion',
          'review.material_sha256 as materialSha256',
          'review.observed_at as observedAt',
          'decision.outcome',
          'provider.display_name as providerDisplayName',
          'provider_account.account_assurance as providerAccountAssurance',
          'provider_account.blockchain as providerAccountBlockchain',
          'provider_account.custody_model as providerAccountCustodyModel',
          'provider_account.provider as providerAccountInfrastructure',
          'provider_account.status as providerAccountStatus',
          'provider.provider_id as providerId',
          'provider.provenance as providerProvenance',
          'provider.risk_bearer_classification as providerRiskBearerClassification',
          'decision.rationale',
          'decision.reason_code as reasonCode',
          'review.review_id as reviewId',
          'review.requested_micro_usdc as requestedMicroUsdc',
          'allocation.return_profile as returnProfile',
          'decision.terms',
        ])
        .$if(controllerPrincipalId !== undefined, (query) =>
          query
            .innerJoin('business_controls as active_control', (join) =>
              join
                .onRef('active_control.business_id', '=', 'business.business_id')
                .on('active_control.status', '=', 'ACTIVE'),
            )
            .where('active_control.controller_principal_id', '=', controllerPrincipalId as string),
        )
        .$if(businessSlug !== undefined, (query) =>
          query.where('business.slug', '=', businessSlug as string),
        )
        .orderBy('provider.display_name')
        .execute();
    const uses = await database
        .selectFrom('capital_use_links as use')
        .innerJoin('obligations as obligation', 'obligation.obligation_id', 'use.obligation_id')
        .leftJoin('settlement_operations as settlement', 'settlement.obligation_id', 'obligation.obligation_id')
        .select([
          'use.allocation_id as allocationId',
          'use.amount_micro_usdc as amountMicroUsdc',
          'use.capital_use_id as capitalUseId',
          'use.linked_at as linkedAt',
          'use.obligation_id as obligationId',
          'obligation.state as obligationState',
          'settlement.state as settlementState',
        ])
        .orderBy('use.linked_at')
        .execute();
    return paths.map((path) => ({
      ...path,
      acceptedAt: path.acceptedAt?.toISOString() ?? null,
      completedAt: path.completedAt?.toISOString() ?? null,
      decidedAt: path.decidedAt.toISOString(),
      observedAt: path.observedAt.toISOString(),
      uses: uses
        .filter((use) => use.allocationId === path.allocationId)
        .map((use) => ({
          amountMicroUsdc: use.amountMicroUsdc,
          capitalUseId: use.capitalUseId,
          linkedAt: use.linkedAt.toISOString(),
          obligationId: use.obligationId,
          obligationState: use.obligationState,
          settlementState: use.settlementState,
        })),
    }));
  }
}
