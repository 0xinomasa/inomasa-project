import type { ArcNetworkSnapshot } from '../arc/rpc.ts';
import { serviceCapabilityForOffer } from '../../modules/commerce/service-catalog.ts';
import type { PostgresPersistence } from './database.ts';
import { applicationSchema } from './database.ts';

export interface AlphaServiceDeliverySummary {
  readonly capabilityId: string;
  readonly completedAt: Date;
  readonly consumerBusinessId: string;
  readonly executionId: string;
  readonly obligationId: string;
  readonly output: unknown;
  readonly outputSha256: string;
  readonly provenance: string;
  readonly providerBusinessId: string;
  readonly sourceReference: string;
  readonly state: string;
}

export interface AlphaServiceExecutionAuthorization {
  readonly alreadyComplete: boolean;
  readonly buyerBusinessId: string;
  readonly capabilityId: string;
  readonly environment: string;
  readonly offerId: string;
  readonly provenance: string;
  readonly sellerBusinessId: string;
  readonly settlementId: string;
}

export class PostgresAlphaServiceRepository {
  readonly #persistence: PostgresPersistence;

  constructor(persistence: PostgresPersistence) {
    this.#persistence = persistence;
  }

  async getExecutionAuthorization(
    executionId: `svc_${string}`,
    obligationId: `obl_${string}`,
  ): Promise<AlphaServiceExecutionAuthorization> {
    const database = this.#persistence.databaseForApplication.withSchema(applicationSchema);
    const existing = await database
      .selectFrom('service_executions')
      .select('execution_id')
      .where('execution_id', '=', executionId)
      .executeTakeFirst();
    const row = await database
      .selectFrom('obligations as obligation')
      .innerJoin('service_offers as offer', 'offer.offer_id', 'obligation.offer_id')
      .innerJoin('settlement_operations as settlement', 'settlement.obligation_id', 'obligation.obligation_id')
      .select([
        'obligation.buyer_business_id as buyerBusinessId',
        'offer.capability_id as capabilityId',
        'obligation.environment as environment',
        'offer.offer_id as offerId',
        'obligation.provenance as provenance',
        'obligation.seller_business_id as sellerBusinessId',
        'settlement.settlement_id as settlementId',
        'settlement.state as settlementState',
        'obligation.state as obligationState',
      ])
      .where('obligation.obligation_id', '=', obligationId)
      .executeTakeFirstOrThrow();

    if (row.obligationState !== 'SETTLED' || row.settlementState !== 'COMPLETE') {
      throw new Error('Paid service execution requires a reconciled COMPLETE settlement.');
    }
    const capability = serviceCapabilityForOffer(row.offerId);
    if (capability === null || capability.deliveryKind !== 'ARC_NETWORK_SNAPSHOT') {
      throw new Error('The Alpha executor does not support this service offer.');
    }

    return {
      alreadyComplete: existing !== undefined,
      buyerBusinessId: row.buyerBusinessId,
      capabilityId: row.capabilityId,
      environment: row.environment,
      offerId: row.offerId,
      provenance: row.provenance,
      sellerBusinessId: row.sellerBusinessId,
      settlementId: row.settlementId,
    };
  }

  async recordCompletedSnapshot(input: {
    readonly authorization: AlphaServiceExecutionAuthorization;
    readonly executionId: `svc_${string}`;
    readonly obligationId: `obl_${string}`;
    readonly outputSha256: string;
    readonly snapshot: ArcNetworkSnapshot;
  }): Promise<{ readonly created: boolean }> {
    if (!/^[0-9a-f]{64}$/.test(input.outputSha256)) {
      throw new Error('Service output digest must be a lowercase SHA-256 value.');
    }

    return this.#persistence.transaction(async (transaction) => {
      const database = transaction.withSchema(applicationSchema);
      const state = await database
        .selectFrom('obligations as obligation')
        .innerJoin('settlement_operations as settlement', 'settlement.obligation_id', 'obligation.obligation_id')
        .select([
          'obligation.state as obligationState',
          'settlement.state as settlementState',
        ])
        .where('obligation.obligation_id', '=', input.obligationId)
        .forUpdate()
        .executeTakeFirstOrThrow();

      if (state.obligationState !== 'SETTLED' || state.settlementState !== 'COMPLETE') {
        throw new Error('Settlement ceased to authorize this paid service execution.');
      }

      const execution = await database
        .insertInto('service_executions')
        .values({
          capability_id: input.authorization.capabilityId,
          completed_at: input.snapshot.observedAt,
          consumer_business_id: input.authorization.buyerBusinessId,
          environment: input.authorization.environment,
          execution_id: input.executionId,
          obligation_id: input.obligationId,
          output: {
            blockNumber: input.snapshot.blockNumber.toString(),
            chainId: input.snapshot.chainId,
            gasPriceWei: input.snapshot.gasPriceWei.toString(),
            observedAt: input.snapshot.observedAt,
            usdcCodeSha256: input.snapshot.usdcCodeSha256,
          },
          output_sha256: input.outputSha256,
          provenance: input.authorization.provenance,
          provider_business_id: input.authorization.sellerBusinessId,
          settlement_id: input.authorization.settlementId,
          source_reference: `arc-block:${input.snapshot.blockNumber}`,
          state: 'COMPLETE',
        })
        .onConflict((conflict) => conflict.column('execution_id').doNothing())
        .returning('execution_id')
        .executeTakeFirst();

      if (execution === undefined) return { created: false };

      await database
        .insertInto('evidence_facts')
        .values({
          coverage: 'SERVICE_OUTPUT',
          environment: input.authorization.environment,
          evidence_id: `evi_${input.executionId}_delivery`,
          fact_type: 'ARC_NETWORK_SNAPSHOT_DELIVERED',
          observed_at: input.snapshot.observedAt,
          payload: {
            capabilityId: input.authorization.capabilityId,
            commonControl: input.authorization.provenance === 'COMMON_CONTROL_TEST',
            consumerBusinessId: input.authorization.buyerBusinessId,
            outputSha256: input.outputSha256,
            providerBusinessId: input.authorization.sellerBusinessId,
          },
          provenance: input.authorization.provenance,
          source_reference: `arc-block:${input.snapshot.blockNumber}`,
          source_type: 'ARC_TESTNET_RPC',
          subject_id: input.executionId,
          subject_type: 'SERVICE_EXECUTION',
          verification: 'PROVIDER_REPORTED',
        })
        .executeTakeFirstOrThrow();

      return { created: true };
    });
  }

  async listServiceDeliveries(): Promise<readonly AlphaServiceDeliverySummary[]> {
    return this.#persistence.databaseForApplication
      .withSchema(applicationSchema)
      .selectFrom('service_executions')
      .select([
        'capability_id as capabilityId',
        'completed_at as completedAt',
        'consumer_business_id as consumerBusinessId',
        'execution_id as executionId',
        'obligation_id as obligationId',
        'output',
        'output_sha256 as outputSha256',
        'provenance',
        'provider_business_id as providerBusinessId',
        'source_reference as sourceReference',
        'state',
      ])
      .orderBy('completed_at', 'desc')
      .execute();
  }

  async getDeliveryForPaidOffer(input: {
    readonly offerId: `off_${string}`;
    readonly paymentId: `pay_${string}`;
  }): Promise<AlphaServiceDeliverySummary | null> {
    const row = await this.#persistence.databaseForApplication
      .withSchema(applicationSchema)
      .selectFrom('x402_payment_operations as payment')
      .innerJoin('obligations as obligation', 'obligation.obligation_id', 'payment.obligation_id')
      .innerJoin('service_offers as offer', 'offer.offer_id', 'obligation.offer_id')
      .leftJoin('service_executions as execution', 'execution.obligation_id', 'obligation.obligation_id')
      .select([
        'execution.capability_id as capabilityId',
        'execution.completed_at as completedAt',
        'execution.consumer_business_id as consumerBusinessId',
        'execution.execution_id as executionId',
        'execution.obligation_id as obligationId',
        'execution.output',
        'execution.output_sha256 as outputSha256',
        'execution.provenance',
        'execution.provider_business_id as providerBusinessId',
        'execution.source_reference as sourceReference',
        'execution.state',
        'payment.state as paymentState',
      ])
      .where('payment.payment_id', '=', input.paymentId)
      .where('offer.offer_id', '=', input.offerId)
      .executeTakeFirstOrThrow();
    if (row.paymentState !== 'COMPLETE') {
      throw new Error('x402 delivery requires a COMPLETE payment.');
    }
    if (
      row.capabilityId === null ||
      row.completedAt === null ||
      row.consumerBusinessId === null ||
      row.executionId === null ||
      row.obligationId === null ||
      row.outputSha256 === null ||
      row.provenance === null ||
      row.providerBusinessId === null ||
      row.sourceReference === null ||
      row.state === null
    ) {
      return null;
    }
    return {
      capabilityId: row.capabilityId,
      completedAt: row.completedAt,
      consumerBusinessId: row.consumerBusinessId,
      executionId: row.executionId,
      obligationId: row.obligationId,
      output: row.output,
      outputSha256: row.outputSha256,
      provenance: row.provenance,
      providerBusinessId: row.providerBusinessId,
      sourceReference: row.sourceReference,
      state: row.state,
    };
  }
}
