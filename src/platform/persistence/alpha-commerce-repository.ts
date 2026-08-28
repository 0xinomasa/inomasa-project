import type { EconomicObligation, ServiceOffer, SettlementOperation } from '../../modules/commerce/model.ts';
import type { TreasuryTransferOutcome } from '../../modules/business/treasury-port.ts';
import type { UsdcMicroAmount } from '../../modules/commerce/money.ts';
import type { PersistenceTransaction, PostgresPersistence } from './database.ts';
import { applicationSchema } from './database.ts';

export interface AlphaSettlementExecutionContext {
  readonly amountMicroUsdc: UsdcMicroAmount;
  readonly buyerBusinessId: `biz_${string}`;
  readonly destinationAddress: `0x${string}`;
  readonly idempotencyKey: string;
  readonly obligationId: `obl_${string}`;
  readonly providerTransactionId: string | null;
  readonly sellerBusinessId: `biz_${string}`;
  readonly settlementId: `set_${string}`;
  readonly sourceAddress: `0x${string}`;
  readonly sourceProviderWalletId: string;
  readonly state: string;
}

export interface AlphaCommerceSummary {
  readonly amountMicroUsdc: string;
  readonly buyerBusinessId: string;
  readonly obligationId: string;
  readonly provenance: string;
  readonly provider: string | null;
  readonly providerTransactionId: string | null;
  readonly sellerBusinessId: string;
  readonly settlementId: string | null;
  readonly settlementState: string | null;
  readonly transactionHash: string | null;
}

export interface AlphaEconomicEntrySummary {
  readonly amountMicroUsdc: string;
  readonly businessId: string;
  readonly capitalAllocationId: string | null;
  readonly category: string;
  readonly direction: string;
  readonly provenance: string;
  readonly settlementId: string | null;
}

export interface AlphaEvidenceSummary {
  readonly coverage: string;
  readonly environment: string;
  readonly evidenceId: string;
  readonly factType: string;
  readonly observedAt: Date;
  readonly provenance: string;
  readonly sourceReference: string;
  readonly sourceType: string;
  readonly verification: string;
}

function requireAddress(value: string | null, label: string): `0x${string}` {
  if (value === null || !/^0x[0-9a-fA-F]{40}$/.test(value)) {
    throw new Error(`${label} does not have an active Arc EOA address.`);
  }
  return value as `0x${string}`;
}

export class PostgresAlphaCommerceRepository {
  readonly #persistence: PostgresPersistence;

  constructor(persistence: PostgresPersistence) {
    this.#persistence = persistence;
  }

  async prepareCommerce(
    input: {
      readonly obligation: EconomicObligation;
      readonly offer: ServiceOffer;
      readonly settlement: SettlementOperation;
    },
    transaction?: PersistenceTransaction,
  ): Promise<{ readonly created: boolean }> {
    if (
      input.obligation.offerId !== input.offer.offerId ||
      input.settlement.obligationId !== input.obligation.obligationId ||
      input.settlement.amountMicroUsdc !== input.obligation.amountMicroUsdc
    ) {
      throw new Error('Offer, obligation, and settlement do not form one economic commitment.');
    }

    if (transaction === undefined) {
      return this.#persistence.transaction((activeTransaction) =>
        this.prepareCommerce(input, activeTransaction),
      );
    }

    const database = transaction.withSchema(applicationSchema);

      await database
        .insertInto('service_offers')
        .values({
          capability_id: input.offer.capabilityId,
          description: input.offer.description,
          offer_id: input.offer.offerId,
          price_micro_usdc: input.offer.priceMicroUsdc.toString(),
          provider_business_id: input.offer.providerBusinessId,
          status: input.offer.status,
          terms_version: input.offer.termsVersion,
        })
        .onConflict((conflict) => conflict.column('offer_id').doNothing())
        .execute();

      const storedOffer = await database
        .selectFrom('service_offers')
        .select([
          'capability_id',
          'price_micro_usdc',
          'provider_business_id',
          'status',
          'terms_version',
        ])
        .where('offer_id', '=', input.offer.offerId)
        .executeTakeFirstOrThrow();
      if (
        storedOffer.capability_id !== input.offer.capabilityId ||
        storedOffer.price_micro_usdc !== input.offer.priceMicroUsdc.toString() ||
        storedOffer.provider_business_id !== input.offer.providerBusinessId ||
        storedOffer.status !== input.offer.status ||
        storedOffer.terms_version !== input.offer.termsVersion
      ) {
        throw new Error('Offer ID already exists with different terms.');
      }

      const obligation = await database
        .insertInto('obligations')
        .values({
          amount_micro_usdc: input.obligation.amountMicroUsdc.toString(),
          asset: input.obligation.asset,
          buyer_business_id: input.obligation.buyerBusinessId,
          environment: input.obligation.environment,
          execution_authorization_id: input.obligation.executionAuthorizationId ?? null,
          obligation_id: input.obligation.obligationId,
          offer_id: input.obligation.offerId,
          provenance: input.obligation.provenance,
          represented_business_id: input.obligation.representedBusinessId ?? null,
          requester_principal_id: input.obligation.requesterPrincipalId ?? null,
          seller_business_id: input.obligation.sellerBusinessId,
          settled_at: null,
          state: input.obligation.state,
          terms_version: input.obligation.termsVersion,
        })
        .onConflict((conflict) => conflict.column('obligation_id').doNothing())
        .returning('obligation_id')
        .executeTakeFirst();

      const storedObligation = await database
        .selectFrom('obligations')
        .select([
          'amount_micro_usdc',
          'asset',
          'buyer_business_id',
          'environment',
          'execution_authorization_id',
          'offer_id',
          'provenance',
          'represented_business_id',
          'requester_principal_id',
          'seller_business_id',
          'terms_version',
        ])
        .where('obligation_id', '=', input.obligation.obligationId)
        .executeTakeFirstOrThrow();
      if (
        storedObligation.amount_micro_usdc !== input.obligation.amountMicroUsdc.toString() ||
        storedObligation.asset !== input.obligation.asset ||
        storedObligation.buyer_business_id !== input.obligation.buyerBusinessId ||
        storedObligation.environment !== input.obligation.environment ||
        storedObligation.execution_authorization_id !==
          (input.obligation.executionAuthorizationId ?? null) ||
        storedObligation.offer_id !== input.obligation.offerId ||
        storedObligation.provenance !== input.obligation.provenance ||
        storedObligation.represented_business_id !==
          (input.obligation.representedBusinessId ?? null) ||
        storedObligation.requester_principal_id !==
          (input.obligation.requesterPrincipalId ?? null) ||
        storedObligation.seller_business_id !== input.obligation.sellerBusinessId ||
        storedObligation.terms_version !== input.obligation.termsVersion
      ) {
        throw new Error('Obligation ID already exists with different economic terms.');
      }

      await database
        .insertInto('settlement_operations')
        .values({
          amount_micro_usdc: input.settlement.amountMicroUsdc.toString(),
          asset_address: input.settlement.assetAddress,
          chain_id: input.settlement.chainId,
          idempotency_key: input.settlement.idempotencyKey,
          obligation_id: input.settlement.obligationId,
          provider: input.settlement.provider,
          provider_state: null,
          provider_transaction_id: null,
          settlement_id: input.settlement.settlementId,
          state: input.settlement.state,
          transaction_hash: null,
          updated_at: new Date(),
        })
        .onConflict((conflict) => conflict.column('settlement_id').doNothing())
        .execute();

      const storedSettlement = await database
        .selectFrom('settlement_operations')
        .select([
          'amount_micro_usdc',
          'asset_address',
          'chain_id',
          'idempotency_key',
          'obligation_id',
          'provider',
        ])
        .where('settlement_id', '=', input.settlement.settlementId)
        .executeTakeFirstOrThrow();
      if (
        storedSettlement.amount_micro_usdc !== input.settlement.amountMicroUsdc.toString() ||
        storedSettlement.asset_address.toLowerCase() !== input.settlement.assetAddress.toLowerCase() ||
        storedSettlement.chain_id !== input.settlement.chainId ||
        storedSettlement.idempotency_key !== input.settlement.idempotencyKey ||
        storedSettlement.obligation_id !== input.settlement.obligationId ||
        storedSettlement.provider !== input.settlement.provider
      ) {
        throw new Error('Settlement ID already exists with different execution semantics.');
      }

    return { created: obligation !== undefined };
  }

  async getSettlementExecutionContext(
    settlementId: `set_${string}`,
  ): Promise<AlphaSettlementExecutionContext> {
    const database = this.#persistence.databaseForApplication.withSchema(applicationSchema);
    const row = await database
      .selectFrom('settlement_operations as settlement')
      .innerJoin('obligations as obligation', 'obligation.obligation_id', 'settlement.obligation_id')
      .innerJoin('treasury_bindings as buyer_treasury', (join) =>
        join
          .onRef('buyer_treasury.business_id', '=', 'obligation.buyer_business_id')
          .on('buyer_treasury.status', '=', 'ACTIVE'),
      )
      .innerJoin('treasury_bindings as seller_treasury', (join) =>
        join
          .onRef('seller_treasury.business_id', '=', 'obligation.seller_business_id')
          .on('seller_treasury.status', '=', 'ACTIVE'),
      )
      .select([
        'settlement.amount_micro_usdc as amountMicroUsdc',
        'obligation.buyer_business_id as buyerBusinessId',
        'seller_treasury.address as destinationAddress',
        'settlement.idempotency_key as idempotencyKey',
        'settlement.obligation_id as obligationId',
        'settlement.provider_transaction_id as providerTransactionId',
        'obligation.seller_business_id as sellerBusinessId',
        'settlement.settlement_id as settlementId',
        'buyer_treasury.address as sourceAddress',
        'buyer_treasury.provider_wallet_id as sourceProviderWalletId',
        'settlement.state as state',
      ])
      .where('settlement.settlement_id', '=', settlementId)
      .executeTakeFirstOrThrow();

    if (row.sourceProviderWalletId === null) {
      throw new Error('Buyer Treasury has no active Circle wallet ID.');
    }

    return {
      amountMicroUsdc: BigInt(row.amountMicroUsdc) as UsdcMicroAmount,
      buyerBusinessId: row.buyerBusinessId as `biz_${string}`,
      destinationAddress: requireAddress(row.destinationAddress, 'Seller Treasury'),
      idempotencyKey: row.idempotencyKey,
      obligationId: row.obligationId as `obl_${string}`,
      providerTransactionId: row.providerTransactionId,
      sellerBusinessId: row.sellerBusinessId as `biz_${string}`,
      settlementId: row.settlementId as `set_${string}`,
      sourceAddress: requireAddress(row.sourceAddress, 'Buyer Treasury'),
      sourceProviderWalletId: row.sourceProviderWalletId,
      state: row.state,
    };
  }

  async recordSubmitted(input: {
    readonly providerTransactionId: string;
    readonly settlementId: `set_${string}`;
  }): Promise<void> {
    const result = await this.#persistence.databaseForApplication
      .withSchema(applicationSchema)
      .updateTable('settlement_operations')
      .set({
        provider_state: 'SUBMITTED',
        provider_transaction_id: input.providerTransactionId,
        state: 'SUBMITTED',
        updated_at: new Date(),
      })
      .where('settlement_id', '=', input.settlementId)
      .where('state', 'in', ['AUTHORIZED', 'OUTCOME_UNKNOWN'])
      .executeTakeFirstOrThrow();

    if (result.numUpdatedRows !== 1n) {
      throw new Error('Settlement submission was not recorded from an admissible state.');
    }
  }

  async recordOutcomeUnknown(input: {
    readonly providerState: string;
    readonly providerTransactionId?: string;
    readonly settlementId: `set_${string}`;
  }): Promise<void> {
    const result = await this.#persistence.databaseForApplication
      .withSchema(applicationSchema)
      .updateTable('settlement_operations')
      .set({
        provider_state: input.providerState,
        ...(input.providerTransactionId === undefined
          ? {}
          : { provider_transaction_id: input.providerTransactionId }),
        state: 'OUTCOME_UNKNOWN',
        updated_at: new Date(),
      })
      .where('settlement_id', '=', input.settlementId)
      .where('state', 'in', ['AUTHORIZED', 'SUBMITTED', 'OUTCOME_UNKNOWN'])
      .executeTakeFirstOrThrow();

    if (result.numUpdatedRows !== 1n) {
      throw new Error('Settlement ambiguity was not recorded from an admissible state.');
    }
  }

  async recordObservedOutcome(input: {
    readonly observedAt: string;
    readonly outcome: TreasuryTransferOutcome;
    readonly settlementId: `set_${string}`;
  }): Promise<void> {
    if (input.outcome.state !== 'COMPLETE') {
      if (input.outcome.state === 'PENDING') {
        const result = await this.#persistence.databaseForApplication
          .withSchema(applicationSchema)
          .updateTable('settlement_operations')
          .set({ provider_state: input.outcome.providerState, updated_at: input.observedAt })
          .where('settlement_id', '=', input.settlementId)
          .executeTakeFirstOrThrow();
        if (result.numUpdatedRows !== 1n) {
          throw new Error('Pending settlement observation did not update one settlement.');
        }
        return;
      }

      const result = await this.#persistence.databaseForApplication
        .withSchema(applicationSchema)
        .updateTable('settlement_operations')
        .set({
          provider_state: input.outcome.providerState,
          state: input.outcome.state,
          updated_at: input.observedAt,
        })
        .where('settlement_id', '=', input.settlementId)
        .where('state', 'in', ['SUBMITTED', 'OUTCOME_UNKNOWN'])
        .executeTakeFirstOrThrow();
      if (result.numUpdatedRows !== 1n) {
        throw new Error('Terminal settlement observation did not update one settlement.');
      }
      return;
    }

    const completedOutcome = input.outcome;

    await this.#persistence.transaction(async (transaction) => {
      const database = transaction.withSchema(applicationSchema);
      const settlement = await database
        .selectFrom('settlement_operations as settlement')
        .innerJoin('obligations as obligation', 'obligation.obligation_id', 'settlement.obligation_id')
        .select([
          'settlement.amount_micro_usdc as amountMicroUsdc',
          'obligation.buyer_business_id as buyerBusinessId',
          'settlement.obligation_id as obligationId',
          'obligation.provenance as provenance',
          'obligation.seller_business_id as sellerBusinessId',
          'settlement.state as settlementState',
        ])
        .where('settlement.settlement_id', '=', input.settlementId)
        .forUpdate()
        .executeTakeFirstOrThrow();

      if (settlement.settlementState === 'COMPLETE') return;
      if (settlement.settlementState !== 'SUBMITTED' && settlement.settlementState !== 'OUTCOME_UNKNOWN') {
        throw new Error('Settlement is not in a reconcilable state.');
      }

      await database
        .updateTable('settlement_operations')
        .set({
          provider_state: completedOutcome.providerState,
          state: 'COMPLETE',
          transaction_hash: completedOutcome.transactionHash,
          updated_at: input.observedAt,
        })
        .where('settlement_id', '=', input.settlementId)
        .executeTakeFirstOrThrow();

      await database
        .updateTable('obligations')
        .set({ settled_at: input.observedAt, state: 'SETTLED' })
        .where('obligation_id', '=', settlement.obligationId)
        .executeTakeFirstOrThrow();

      await database
        .insertInto('economic_entries')
        .values([
          {
            amount_micro_usdc: settlement.amountMicroUsdc,
            asset: 'USDC',
            business_id: settlement.sellerBusinessId,
            category: 'REVENUE',
            direction: 'INFLOW',
            entry_id: `ent_${input.settlementId}_seller`,
            obligation_id: settlement.obligationId,
            occurred_at: input.observedAt,
            provenance: settlement.provenance,
            settlement_id: input.settlementId,
          },
          {
            amount_micro_usdc: settlement.amountMicroUsdc,
            asset: 'USDC',
            business_id: settlement.buyerBusinessId,
            category: 'SERVICE_COST',
            direction: 'OUTFLOW',
            entry_id: `ent_${input.settlementId}_buyer`,
            obligation_id: settlement.obligationId,
            occurred_at: input.observedAt,
            provenance: settlement.provenance,
            settlement_id: input.settlementId,
          },
        ])
        .onConflict((conflict) => conflict.column('entry_id').doNothing())
        .execute();

      await database
        .insertInto('evidence_facts')
        .values({
          coverage: 'SETTLEMENT_ONLY',
          environment: 'PRIVATE_ARC_TESTNET',
          evidence_id: `evi_${input.settlementId}_arc`,
          fact_type: 'ARC_USDC_SETTLEMENT_FINALIZED',
          observed_at: input.observedAt,
          payload: {
            amountMicroUsdc: settlement.amountMicroUsdc,
            buyerBusinessId: settlement.buyerBusinessId,
            commonControl: settlement.provenance === 'COMMON_CONTROL_TEST',
            sellerBusinessId: settlement.sellerBusinessId,
            transactionHash: completedOutcome.transactionHash,
          },
          provenance: settlement.provenance,
          source_reference: completedOutcome.transactionHash,
          source_type: 'ARC_TESTNET_TRANSACTION',
          subject_id: input.settlementId,
          subject_type: 'SETTLEMENT',
          verification: 'CHAIN_VERIFIED',
        })
        .onConflict((conflict) => conflict.column('evidence_id').doNothing())
        .execute();
    });
  }

  async listCommerce(): Promise<readonly AlphaCommerceSummary[]> {
    return this.#persistence.databaseForApplication
      .withSchema(applicationSchema)
      .selectFrom('obligations as obligation')
      .leftJoin('settlement_operations as settlement', 'settlement.obligation_id', 'obligation.obligation_id')
      .select([
        'obligation.amount_micro_usdc as amountMicroUsdc',
        'obligation.buyer_business_id as buyerBusinessId',
        'obligation.obligation_id as obligationId',
        'obligation.provenance as provenance',
        'settlement.provider as provider',
        'settlement.provider_transaction_id as providerTransactionId',
        'obligation.seller_business_id as sellerBusinessId',
        'settlement.settlement_id as settlementId',
        'settlement.state as settlementState',
        'settlement.transaction_hash as transactionHash',
      ])
      .orderBy('obligation.created_at', 'desc')
      .execute();
  }

  async listEconomicEntries(): Promise<readonly AlphaEconomicEntrySummary[]> {
    return this.#persistence.databaseForApplication
      .withSchema(applicationSchema)
      .selectFrom('economic_entries')
      .select([
        'amount_micro_usdc as amountMicroUsdc',
        'business_id as businessId',
        'capital_allocation_id as capitalAllocationId',
        'category',
        'direction',
        'provenance',
        'settlement_id as settlementId',
      ])
      .orderBy('occurred_at', 'desc')
      .execute();
  }

  async listEvidenceFacts(): Promise<readonly AlphaEvidenceSummary[]> {
    return this.#persistence.databaseForApplication
      .withSchema(applicationSchema)
      .selectFrom('evidence_facts')
      .select([
        'coverage',
        'environment',
        'evidence_id as evidenceId',
        'fact_type as factType',
        'observed_at as observedAt',
        'provenance',
        'source_reference as sourceReference',
        'source_type as sourceType',
        'verification',
      ])
      .orderBy('observed_at', 'desc')
      .execute();
  }
}
