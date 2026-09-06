import type { ProductEconomicOperationKind } from '../../modules/commerce/product-operations.ts';
import type { PersistenceTransaction, PostgresPersistence } from './database.ts';
import { applicationSchema } from './database.ts';

export interface ProductEconomicRequestInput {
  readonly agentPrincipalId: `agt_${string}` | null;
  readonly buyerBusinessId: `biz_${string}`;
  readonly controllerPrincipalId: `usr_${string}`;
  readonly gatewayFundingId: `gwf_${string}` | null;
  readonly jobId: `job_${string}` | null;
  readonly kind: ProductEconomicOperationKind;
  readonly obligationId: `obl_${string}`;
  readonly offerId: `off_${string}`;
  readonly paymentId: `pay_${string}` | null;
  readonly requestId: string;
  readonly requestedAt: string;
  readonly serviceExecutionId: `svc_${string}`;
  readonly settlementId: `set_${string}`;
}

export interface ProductEconomicRequestSummary {
  readonly agentPrincipalId: string | null;
  readonly amountMicroUsdc: string;
  readonly deliverySourceReference: string | null;
  readonly deliveryState: string | null;
  readonly deliveryOutput?: unknown;
  readonly gatewayFundingState: string | null;
  readonly jobId: string | null;
  readonly jobOperations: readonly {
    readonly leg: string;
    readonly providerState: string | null;
    readonly state: string;
    readonly transactionHash: string | null;
  }[];
  readonly jobProtocolId: string | null;
  readonly jobStatus: string | null;
  readonly kind: ProductEconomicOperationKind;
  readonly obligationId: string;
  readonly offerCapabilityId: string;
  readonly offerDescription: string;
  readonly offerId: string;
  readonly paymentId: string | null;
  readonly paymentProviderReference: string | null;
  readonly paymentProviderState: string | null;
  readonly paymentState: string | null;
  readonly providerBusinessId: string;
  readonly providerDisplayName: string;
  readonly requestId: string;
  readonly requestedAt: string;
  readonly serviceExecutionId: string;
  readonly settlementId: string;
  readonly settlementProviderState: string | null;
  readonly settlementState: string;
  readonly settlementTransactionHash: string | null;
}

export interface ProductEconomicExecutionContext {
  readonly agentPrincipalId: `agt_${string}` | null;
  readonly amountMicroUsdc: string;
  readonly buyerAddress: `0x${string}`;
  readonly buyerBusinessId: `biz_${string}`;
  readonly buyerProviderWalletId: string;
  readonly gatewayFundingId: `gwf_${string}` | null;
  readonly jobId: `job_${string}` | null;
  readonly kind: ProductEconomicOperationKind;
  readonly obligationId: `obl_${string}`;
  readonly offerDescription: string;
  readonly offerId: `off_${string}`;
  readonly paymentId: `pay_${string}` | null;
  readonly providerAddress: `0x${string}`;
  readonly providerBusinessId: `biz_${string}`;
  readonly providerProviderWalletId: string;
  readonly requestId: string;
  readonly requestedAt: string;
  readonly serviceExecutionId: `svc_${string}`;
  readonly settlementId: `set_${string}`;
}

function address(value: string | null, label: string): `0x${string}` {
  if (value === null || !/^0x[0-9a-fA-F]{40}$/.test(value)) {
    throw new Error(`${label} requires an active Arc EOA Treasury.`);
  }
  return value as `0x${string}`;
}

function operationKind(value: string): ProductEconomicOperationKind {
  if (value !== 'X402_PURCHASE' && value !== 'ERC8183_JOB') {
    throw new Error('Stored product economic operation kind is invalid.');
  }
  return value;
}

export class PostgresProductEconomicOperationRepository {
  readonly #persistence: PostgresPersistence;

  constructor(persistence: PostgresPersistence) {
    this.#persistence = persistence;
  }

  async ensureRequestInTransaction(
    transaction: PersistenceTransaction,
    input: ProductEconomicRequestInput,
  ): Promise<{ readonly created: boolean }> {
    const database = transaction.withSchema(applicationSchema);
    const created = await database
      .insertInto('product_economic_requests')
      .values({
        agent_principal_id: input.agentPrincipalId,
        buyer_business_id: input.buyerBusinessId,
        controller_principal_id: input.controllerPrincipalId,
        gateway_funding_id: input.gatewayFundingId,
        job_id: input.jobId,
        obligation_id: input.obligationId,
        offer_id: input.offerId,
        operation_kind: input.kind,
        payment_id: input.paymentId,
        request_id: input.requestId,
        requested_at: input.requestedAt,
        service_execution_id: input.serviceExecutionId,
        settlement_id: input.settlementId,
      })
      .onConflict((conflict) => conflict.column('request_id').doNothing())
      .returning('request_id')
      .executeTakeFirst();
    const stored = await database
      .selectFrom('product_economic_requests')
      .selectAll()
      .where('request_id', '=', input.requestId)
      .executeTakeFirstOrThrow();
    if (
      stored.agent_principal_id !== input.agentPrincipalId ||
      stored.buyer_business_id !== input.buyerBusinessId ||
      stored.controller_principal_id !== input.controllerPrincipalId ||
      stored.gateway_funding_id !== input.gatewayFundingId ||
      stored.job_id !== input.jobId ||
      stored.obligation_id !== input.obligationId ||
      stored.offer_id !== input.offerId ||
      stored.operation_kind !== input.kind ||
      stored.payment_id !== input.paymentId ||
      stored.requested_at.toISOString() !== input.requestedAt ||
      stored.service_execution_id !== input.serviceExecutionId ||
      stored.settlement_id !== input.settlementId
    ) {
      throw new Error('Economic request ID already exists with different confirmation semantics.');
    }
    return { created: created !== undefined };
  }

  async listRequests(input: {
    readonly controllerPrincipalId: `usr_${string}`;
    readonly slug: string;
  }): Promise<readonly ProductEconomicRequestSummary[] | undefined> {
    const database = this.#persistence.databaseForApplication.withSchema(applicationSchema);
    const business = await database
      .selectFrom('businesses as business')
      .innerJoin('business_controls as control', (join) =>
        join
          .onRef('control.business_id', '=', 'business.business_id')
          .on('control.status', '=', 'ACTIVE'),
      )
      .select('business.business_id as businessId')
      .where('business.slug', '=', input.slug)
      .where('business.status', '=', 'ACTIVE')
      .where('control.controller_principal_id', '=', input.controllerPrincipalId)
      .executeTakeFirst();
    if (business === undefined) return undefined;

    const rows = await database
      .selectFrom('product_economic_requests as request')
      .innerJoin('service_offers as offer', 'offer.offer_id', 'request.offer_id')
      .innerJoin('businesses as provider', 'provider.business_id', 'offer.provider_business_id')
      .innerJoin('settlement_operations as settlement', 'settlement.settlement_id', 'request.settlement_id')
      .leftJoin('x402_payment_operations as payment', 'payment.payment_id', 'request.payment_id')
      .leftJoin('erc8183_jobs as job', 'job.job_id', 'request.job_id')
      .leftJoin('service_executions as execution', 'execution.execution_id', 'request.service_execution_id')
      .leftJoin('gateway_funding_operations as funding', 'funding.funding_id', 'request.gateway_funding_id')
      .select([
        'request.agent_principal_id as agentPrincipalId',
        'offer.price_micro_usdc as amountMicroUsdc',
        'execution.source_reference as deliverySourceReference',
        'execution.state as deliveryState',
        'execution.output as deliveryOutput',
        'funding.state as gatewayFundingState',
        'request.job_id as jobId',
        'job.protocol_job_id as jobProtocolId',
        'job.protocol_status as jobStatus',
        'request.obligation_id as obligationId',
        'offer.capability_id as offerCapabilityId',
        'offer.description as offerDescription',
        'request.offer_id as offerId',
        'request.operation_kind as kind',
        'request.payment_id as paymentId',
        'payment.provider_state as paymentProviderState',
        'payment.provider_transaction_id as paymentProviderReference',
        'payment.state as paymentState',
        'provider.business_id as providerBusinessId',
        'provider.display_name as providerDisplayName',
        'request.request_id as requestId',
        'request.requested_at as requestedAt',
        'request.service_execution_id as serviceExecutionId',
        'request.settlement_id as settlementId',
        'settlement.provider_state as settlementProviderState',
        'settlement.state as settlementState',
        'settlement.transaction_hash as settlementTransactionHash',
      ])
      .where('request.buyer_business_id', '=', business.businessId)
      .where('request.controller_principal_id', '=', input.controllerPrincipalId)
      .orderBy('request.requested_at', 'desc')
      .execute();

    const jobIds = rows.flatMap(({ jobId }) => jobId === null ? [] : [jobId]);
    const operations = jobIds.length === 0 ? [] : await database
      .selectFrom('erc8183_job_operations')
      .select(['job_id as jobId', 'leg', 'provider_state as providerState', 'state', 'transaction_hash as transactionHash'])
      .where('job_id', 'in', jobIds)
      .orderBy('created_at', 'asc')
      .execute();
    return rows.map((row) => ({
      ...row,
      jobOperations: operations.filter(({ jobId }) => jobId === row.jobId),
      kind: operationKind(row.kind),
      requestedAt: row.requestedAt.toISOString(),
    }));
  }

  async getExecutionContext(input: {
    readonly controllerPrincipalId: `usr_${string}`;
    readonly requestId: string;
    readonly slug: string;
  }): Promise<ProductEconomicExecutionContext | undefined> {
    const row = await this.#persistence.databaseForApplication
      .withSchema(applicationSchema)
      .selectFrom('product_economic_requests as request')
      .innerJoin('businesses as buyer', 'buyer.business_id', 'request.buyer_business_id')
      .innerJoin('business_controls as control', (join) =>
        join
          .onRef('control.business_id', '=', 'buyer.business_id')
          .on('control.status', '=', 'ACTIVE'),
      )
      .innerJoin('service_offers as offer', 'offer.offer_id', 'request.offer_id')
      .innerJoin('treasury_bindings as buyer_treasury', (join) =>
        join
          .onRef('buyer_treasury.business_id', '=', 'buyer.business_id')
          .on('buyer_treasury.status', '=', 'ACTIVE'),
      )
      .innerJoin('treasury_bindings as provider_treasury', (join) =>
        join
          .onRef('provider_treasury.business_id', '=', 'offer.provider_business_id')
          .on('provider_treasury.status', '=', 'ACTIVE'),
      )
      .select([
        'request.agent_principal_id as agentPrincipalId',
        'offer.price_micro_usdc as amountMicroUsdc',
        'buyer_treasury.address as buyerAddress',
        'buyer.business_id as buyerBusinessId',
        'buyer_treasury.provider_wallet_id as buyerProviderWalletId',
        'request.gateway_funding_id as gatewayFundingId',
        'request.job_id as jobId',
        'request.operation_kind as kind',
        'request.obligation_id as obligationId',
        'offer.description as offerDescription',
        'request.offer_id as offerId',
        'request.payment_id as paymentId',
        'provider_treasury.address as providerAddress',
        'offer.provider_business_id as providerBusinessId',
        'provider_treasury.provider_wallet_id as providerProviderWalletId',
        'request.request_id as requestId',
        'request.requested_at as requestedAt',
        'request.service_execution_id as serviceExecutionId',
        'request.settlement_id as settlementId',
      ])
      .where('request.request_id', '=', input.requestId)
      .where('buyer.slug', '=', input.slug)
      .where('buyer.status', '=', 'ACTIVE')
      .where('control.controller_principal_id', '=', input.controllerPrincipalId)
      .executeTakeFirst();
    if (row === undefined) return undefined;
    if (row.buyerProviderWalletId === null || row.providerProviderWalletId === null) {
      throw new Error('Economic operation requires active Circle execution accounts on both Businesses.');
    }
    return {
      ...row,
      agentPrincipalId: row.agentPrincipalId as `agt_${string}` | null,
      buyerAddress: address(row.buyerAddress, 'Buyer'),
      buyerBusinessId: row.buyerBusinessId as `biz_${string}`,
      buyerProviderWalletId: row.buyerProviderWalletId,
      gatewayFundingId: row.gatewayFundingId as `gwf_${string}` | null,
      jobId: row.jobId as `job_${string}` | null,
      kind: operationKind(row.kind),
      obligationId: row.obligationId as `obl_${string}`,
      offerId: row.offerId as `off_${string}`,
      paymentId: row.paymentId as `pay_${string}` | null,
      providerAddress: address(row.providerAddress, 'Provider'),
      providerBusinessId: row.providerBusinessId as `biz_${string}`,
      providerProviderWalletId: row.providerProviderWalletId,
      requestedAt: row.requestedAt.toISOString(),
      serviceExecutionId: row.serviceExecutionId as `svc_${string}`,
      settlementId: row.settlementId as `set_${string}`,
    };
  }
}
