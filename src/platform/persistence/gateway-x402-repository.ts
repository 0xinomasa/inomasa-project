import { createHash } from 'node:crypto';

import type {
  GatewayFundingTransactionOutcome,
  X402PaymentPayload,
  X402PaymentRequired,
  X402PaymentRequirements,
} from '../../modules/commerce/x402-port.ts';
import type { UsdcMicroAmount } from '../../modules/commerce/money.ts';
import type { PersistenceTransaction, PostgresPersistence } from './database.ts';
import { applicationSchema } from './database.ts';

export type GatewayFundingState =
  | 'APPROVAL_AUTHORIZED'
  | 'APPROVAL_SUBMITTED'
  | 'APPROVAL_COMPLETE'
  | 'DEPOSIT_SUBMITTED'
  | 'DEPOSIT_COMPLETE'
  | 'OUTCOME_UNKNOWN'
  | 'FAILED';

export function nextGatewayFundingState(
  leg: 'APPROVAL' | 'DEPOSIT',
  outcome: GatewayFundingTransactionOutcome['state'],
): GatewayFundingState {
  if (outcome === 'COMPLETE') {
    return leg === 'APPROVAL' ? 'APPROVAL_COMPLETE' : 'DEPOSIT_COMPLETE';
  }
  if (outcome === 'PENDING') {
    return leg === 'APPROVAL' ? 'APPROVAL_SUBMITTED' : 'DEPOSIT_SUBMITTED';
  }
  return outcome;
}

export interface GatewayFundingOperation {
  readonly amountMicroUsdc: UsdcMicroAmount;
  readonly approvalIdempotencyKey: string;
  readonly approvalProviderTransactionId: string | null;
  readonly businessId: `biz_${string}`;
  readonly depositIdempotencyKey: string;
  readonly depositProviderTransactionId: string | null;
  readonly depositorAddress: `0x${string}`;
  readonly fundingId: `gwf_${string}`;
  readonly state: GatewayFundingState;
}

export type X402PaymentState =
  | 'REQUIRED'
  | 'SIGNED'
  | 'VERIFIED'
  | 'OUTCOME_UNKNOWN'
  | 'COMPLETE'
  | 'FAILED';

export interface X402PaymentOperation {
  readonly amountMicroUsdc: UsdcMicroAmount;
  readonly obligationId: `obl_${string}`;
  readonly paymentId: `pay_${string}`;
  readonly paymentPayload: X402PaymentPayload | null;
  readonly paymentRequired: X402PaymentRequired;
  readonly providerState: string | null;
  readonly providerTransactionId: string | null;
  readonly requirements: X402PaymentRequirements;
  readonly settlementId: `set_${string}`;
  readonly state: X402PaymentState;
}

export interface GatewayFundingSummary {
  readonly amountMicroUsdc: string;
  readonly businessId: string;
  readonly fundingId: string;
  readonly state: string;
}

export interface X402PaymentSummary {
  readonly amountMicroUsdc: string;
  readonly network: string;
  readonly paymentId: string;
  readonly providerState: string | null;
  readonly providerTransactionId: string | null;
  readonly scheme: string;
  readonly state: string;
}

export function sha256Json(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function requireAddress(value: string, label: string): `0x${string}` {
  if (!/^0x[0-9a-fA-F]{40}$/.test(value)) throw new Error(`${label} is not an EVM address.`);
  return value as `0x${string}`;
}

function asFunding(row: {
  readonly amount_micro_usdc: string;
  readonly approval_idempotency_key: string;
  readonly approval_provider_transaction_id: string | null;
  readonly business_id: string;
  readonly deposit_idempotency_key: string;
  readonly deposit_provider_transaction_id: string | null;
  readonly depositor_address: string;
  readonly funding_id: string;
  readonly state: string;
}): GatewayFundingOperation {
  return {
    amountMicroUsdc: BigInt(row.amount_micro_usdc) as UsdcMicroAmount,
    approvalIdempotencyKey: row.approval_idempotency_key,
    approvalProviderTransactionId: row.approval_provider_transaction_id,
    businessId: row.business_id as `biz_${string}`,
    depositIdempotencyKey: row.deposit_idempotency_key,
    depositProviderTransactionId: row.deposit_provider_transaction_id,
    depositorAddress: requireAddress(row.depositor_address, 'Gateway depositor'),
    fundingId: row.funding_id as `gwf_${string}`,
    state: row.state as GatewayFundingState,
  };
}

function asPayment(row: {
  readonly amount_micro_usdc: string;
  readonly obligation_id: string;
  readonly payment_id: string;
  readonly payment_payload: unknown | null;
  readonly payment_required: unknown;
  readonly provider_state: string | null;
  readonly provider_transaction_id: string | null;
  readonly settlement_id: string;
  readonly state: string;
}): X402PaymentOperation {
  const paymentRequired = row.payment_required as X402PaymentRequired;
  const requirements = paymentRequired.accepts[0];
  if (requirements === undefined) throw new Error('Stored x402 payment has no accepted requirements.');
  return {
    amountMicroUsdc: BigInt(row.amount_micro_usdc) as UsdcMicroAmount,
    obligationId: row.obligation_id as `obl_${string}`,
    paymentId: row.payment_id as `pay_${string}`,
    paymentPayload: row.payment_payload as X402PaymentPayload | null,
    paymentRequired,
    providerState: row.provider_state,
    providerTransactionId: row.provider_transaction_id,
    requirements,
    settlementId: row.settlement_id as `set_${string}`,
    state: row.state as X402PaymentState,
  };
}

export class PostgresGatewayX402Repository {
  readonly #persistence: PostgresPersistence;

  constructor(persistence: PostgresPersistence) {
    this.#persistence = persistence;
  }

  async ensureFunding(input: {
    readonly amountMicroUsdc: UsdcMicroAmount;
    readonly approvalIdempotencyKey: string;
    readonly businessId: `biz_${string}`;
    readonly depositIdempotencyKey: string;
    readonly depositorAddress: `0x${string}`;
    readonly fundingId: `gwf_${string}`;
    readonly gatewayContractAddress: `0x${string}`;
  }): Promise<GatewayFundingOperation> {
    const database = this.#persistence.databaseForApplication.withSchema(applicationSchema);
    await database
      .insertInto('gateway_funding_operations')
      .values({
        amount_micro_usdc: input.amountMicroUsdc.toString(),
        approval_idempotency_key: input.approvalIdempotencyKey,
        approval_provider_transaction_id: null,
        approval_transaction_hash: null,
        business_id: input.businessId,
        deposit_idempotency_key: input.depositIdempotencyKey,
        deposit_provider_transaction_id: null,
        deposit_transaction_hash: null,
        depositor_address: input.depositorAddress,
        funding_id: input.fundingId,
        gateway_contract_address: input.gatewayContractAddress,
        provider_state: null,
        state: 'APPROVAL_AUTHORIZED',
        updated_at: new Date(),
      })
      .onConflict((conflict) => conflict.column('funding_id').doNothing())
      .execute();

    const row = await database
      .selectFrom('gateway_funding_operations')
      .selectAll()
      .where('funding_id', '=', input.fundingId)
      .executeTakeFirstOrThrow();
    if (
      row.amount_micro_usdc !== input.amountMicroUsdc.toString() ||
      row.approval_idempotency_key !== input.approvalIdempotencyKey ||
      row.business_id !== input.businessId ||
      row.deposit_idempotency_key !== input.depositIdempotencyKey ||
      row.depositor_address.toLowerCase() !== input.depositorAddress.toLowerCase() ||
      row.gateway_contract_address.toLowerCase() !== input.gatewayContractAddress.toLowerCase()
    ) {
      throw new Error('Gateway funding ID already exists with different semantics.');
    }
    return asFunding(row);
  }

  async getFunding(fundingId: `gwf_${string}`): Promise<GatewayFundingOperation> {
    const row = await this.#persistence.databaseForApplication
      .withSchema(applicationSchema)
      .selectFrom('gateway_funding_operations')
      .selectAll()
      .where('funding_id', '=', fundingId)
      .executeTakeFirstOrThrow();
    return asFunding(row);
  }

  async findFunding(fundingId: `gwf_${string}`): Promise<GatewayFundingOperation | undefined> {
    const row = await this.#persistence.databaseForApplication
      .withSchema(applicationSchema)
      .selectFrom('gateway_funding_operations')
      .selectAll()
      .where('funding_id', '=', fundingId)
      .executeTakeFirst();
    return row === undefined ? undefined : asFunding(row);
  }

  async recordFundingSubmitted(input: {
    readonly leg: 'APPROVAL' | 'DEPOSIT';
    readonly providerTransactionId: string;
    readonly fundingId: `gwf_${string}`;
  }): Promise<void> {
    const database = this.#persistence.databaseForApplication.withSchema(applicationSchema);
    const result = await database
      .updateTable('gateway_funding_operations')
      .set(
        input.leg === 'APPROVAL'
          ? {
              approval_provider_transaction_id: input.providerTransactionId,
              provider_state: 'SUBMITTED',
              state: 'APPROVAL_SUBMITTED',
              updated_at: new Date(),
            }
          : {
              deposit_provider_transaction_id: input.providerTransactionId,
              provider_state: 'SUBMITTED',
              state: 'DEPOSIT_SUBMITTED',
              updated_at: new Date(),
            },
      )
      .where('funding_id', '=', input.fundingId)
      .where(
        'state',
        'in',
        input.leg === 'APPROVAL'
          ? ['APPROVAL_AUTHORIZED', 'OUTCOME_UNKNOWN']
          : ['APPROVAL_COMPLETE', 'OUTCOME_UNKNOWN'],
      )
      .executeTakeFirstOrThrow();
    if (result.numUpdatedRows !== 1n) {
      throw new Error(`Gateway ${input.leg.toLowerCase()} submission is not admissible.`);
    }
  }

  async recordFundingOutcome(input: {
    readonly fundingId: `gwf_${string}`;
    readonly leg: 'APPROVAL' | 'DEPOSIT';
    readonly outcome: GatewayFundingTransactionOutcome;
  }): Promise<void> {
    const nextState = nextGatewayFundingState(input.leg, input.outcome.state);
    const result = await this.#persistence.databaseForApplication
      .withSchema(applicationSchema)
      .updateTable('gateway_funding_operations')
      .set({
        ...(input.outcome.state === 'COMPLETE'
          ? input.leg === 'APPROVAL'
            ? { approval_transaction_hash: input.outcome.transactionHash }
            : { deposit_transaction_hash: input.outcome.transactionHash }
          : {}),
        provider_state: input.outcome.providerState,
        state: nextState,
        updated_at: new Date(),
      })
      .where('funding_id', '=', input.fundingId)
      .where('state', 'in', [
        input.leg === 'APPROVAL' ? 'APPROVAL_SUBMITTED' : 'DEPOSIT_SUBMITTED',
        'OUTCOME_UNKNOWN',
      ])
      .executeTakeFirstOrThrow();
    if (result.numUpdatedRows !== 1n) throw new Error('Gateway funding outcome was not recorded.');
  }

  async preparePaymentInTransaction(
    transaction: PersistenceTransaction,
    input: {
      readonly executionAuthorizationId: `xau_${string}`;
      readonly obligationId: `obl_${string}`;
      readonly payerAddress: `0x${string}`;
      readonly paymentId: `pay_${string}`;
      readonly paymentRequired: X402PaymentRequired;
      readonly settlementId: `set_${string}`;
    },
  ): Promise<{ readonly created: boolean }> {
    const requirements = input.paymentRequired.accepts[0];
    const database = transaction.withSchema(applicationSchema);
    const payment = await database
      .insertInto('x402_payment_operations')
      .values({
        amount_micro_usdc: requirements.amount,
        asset_address: requirements.asset,
        execution_authorization_id: input.executionAuthorizationId,
        network: requirements.network,
        obligation_id: input.obligationId,
        pay_to_address: requirements.payTo,
        payer_address: input.payerAddress,
        payment_id: input.paymentId,
        payment_payload: null,
        payment_payload_sha256: null,
        payment_required: input.paymentRequired,
        payment_required_sha256: sha256Json(input.paymentRequired),
        protocol_version: input.paymentRequired.x402Version,
        provider_state: null,
        provider_transaction_id: null,
        scheme: requirements.scheme,
        settlement_id: input.settlementId,
        state: 'REQUIRED',
        updated_at: new Date(),
      })
      .onConflict((conflict) => conflict.column('payment_id').doNothing())
      .returning('payment_id')
      .executeTakeFirst();

    const stored = await database
      .selectFrom('x402_payment_operations')
      .selectAll()
      .where('payment_id', '=', input.paymentId)
      .executeTakeFirstOrThrow();
    if (
      stored.execution_authorization_id !== input.executionAuthorizationId ||
      stored.obligation_id !== input.obligationId ||
      stored.payer_address.toLowerCase() !== input.payerAddress.toLowerCase() ||
      stored.payment_required_sha256 !== sha256Json(input.paymentRequired) ||
      stored.settlement_id !== input.settlementId
    ) {
      throw new Error('x402 payment ID already exists with different commitment semantics.');
    }
    return { created: payment !== undefined };
  }

  async getPayment(paymentId: `pay_${string}`): Promise<X402PaymentOperation> {
    const row = await this.#persistence.databaseForApplication
      .withSchema(applicationSchema)
      .selectFrom('x402_payment_operations')
      .selectAll()
      .where('payment_id', '=', paymentId)
      .executeTakeFirstOrThrow();
    return asPayment(row);
  }

  async getPaymentOfferId(paymentId: `pay_${string}`): Promise<`off_${string}`> {
    const row = await this.#persistence.databaseForApplication
      .withSchema(applicationSchema)
      .selectFrom('x402_payment_operations as payment')
      .innerJoin('obligations as obligation', 'obligation.obligation_id', 'payment.obligation_id')
      .select('obligation.offer_id as offerId')
      .where('payment.payment_id', '=', paymentId)
      .executeTakeFirstOrThrow();
    if (!row.offerId.startsWith('off_')) throw new Error('Stored x402 offer ID is invalid.');
    return row.offerId as `off_${string}`;
  }

  async recordSigned(input: {
    readonly paymentId: `pay_${string}`;
    readonly paymentPayload: X402PaymentPayload;
  }): Promise<void> {
    const database = this.#persistence.databaseForApplication.withSchema(applicationSchema);
    const existing = await database
      .selectFrom('x402_payment_operations')
      .select(['payment_payload_sha256', 'state'])
      .where('payment_id', '=', input.paymentId)
      .executeTakeFirstOrThrow();
    const digest = sha256Json(input.paymentPayload);
    if (existing.state !== 'REQUIRED') {
      if (existing.payment_payload_sha256 !== digest) {
        throw new Error('x402 payment already committed to a different signed payload.');
      }
      return;
    }
    const result = await database
      .updateTable('x402_payment_operations')
      .set({
        payment_payload: input.paymentPayload,
        payment_payload_sha256: digest,
        provider_state: 'SIGNED_NOT_HANDED_OFF',
        state: 'SIGNED',
        updated_at: new Date(),
      })
      .where('payment_id', '=', input.paymentId)
      .where('state', '=', 'REQUIRED')
      .executeTakeFirstOrThrow();
    if (result.numUpdatedRows !== 1n) throw new Error('x402 signature commitment raced.');
  }

  async ensureResourceEnvelope(paymentId: `pay_${string}`): Promise<void> {
    const database = this.#persistence.databaseForApplication.withSchema(applicationSchema);
    const stored = await database
      .selectFrom('x402_payment_operations')
      .select(['payment_payload', 'payment_required', 'state'])
      .where('payment_id', '=', paymentId)
      .executeTakeFirstOrThrow();
    if (stored.payment_payload === null) return;
    const payload = stored.payment_payload as Omit<X402PaymentPayload, 'resource'> & {
      readonly resource?: X402PaymentPayload['resource'];
    };
    const required = stored.payment_required as X402PaymentRequired;
    if (payload.resource !== undefined) {
      if (sha256Json(payload.resource) !== sha256Json(required.resource)) {
        throw new Error('Signed x402 envelope names a different resource.');
      }
      return;
    }
    if (
      stored.state !== 'SIGNED' ||
      sha256Json(payload.accepted) !== sha256Json(required.accepts[0])
    ) {
      throw new Error('Missing x402 resource envelope cannot be repaired safely.');
    }
    const repaired: X402PaymentPayload = { ...payload, resource: required.resource };
    const result = await database
      .updateTable('x402_payment_operations')
      .set({
        payment_payload: repaired,
        payment_payload_sha256: sha256Json(repaired),
        provider_state: 'SIGNED_RESOURCE_ENVELOPE_REPAIRED',
        updated_at: new Date(),
      })
      .where('payment_id', '=', paymentId)
      .where('state', '=', 'SIGNED')
      .executeTakeFirstOrThrow();
    if (result.numUpdatedRows !== 1n) throw new Error('x402 envelope repair raced.');
  }

  async recordVerified(paymentId: `pay_${string}`): Promise<void> {
    const result = await this.#persistence.databaseForApplication
      .withSchema(applicationSchema)
      .updateTable('x402_payment_operations')
      .set({ provider_state: 'VERIFIED', state: 'VERIFIED', updated_at: new Date() })
      .where('payment_id', '=', paymentId)
      .where('state', 'in', ['SIGNED', 'VERIFIED', 'OUTCOME_UNKNOWN'])
      .executeTakeFirstOrThrow();
    if (result.numUpdatedRows !== 1n) throw new Error('x402 verification state was not recorded.');
  }

  async recordOutcomeUnknown(paymentId: `pay_${string}`, providerState: string): Promise<void> {
    const result = await this.#persistence.databaseForApplication
      .withSchema(applicationSchema)
      .updateTable('x402_payment_operations')
      .set({ provider_state: providerState, state: 'OUTCOME_UNKNOWN', updated_at: new Date() })
      .where('payment_id', '=', paymentId)
      .where('state', 'in', ['SIGNED', 'VERIFIED', 'OUTCOME_UNKNOWN'])
      .executeTakeFirstOrThrow();
    if (result.numUpdatedRows !== 1n) throw new Error('x402 ambiguity was not recorded.');
  }

  async recordFailed(paymentId: `pay_${string}`, providerState: string): Promise<void> {
    const result = await this.#persistence.databaseForApplication
      .withSchema(applicationSchema)
      .updateTable('x402_payment_operations')
      .set({ provider_state: providerState, state: 'FAILED', updated_at: new Date() })
      .where('payment_id', '=', paymentId)
      .where('state', 'in', ['SIGNED', 'VERIFIED', 'OUTCOME_UNKNOWN'])
      .executeTakeFirstOrThrow();
    if (result.numUpdatedRows !== 1n) throw new Error('x402 failure was not recorded.');
  }

  async recordComplete(input: {
    readonly observedAt: string;
    readonly paymentId: `pay_${string}`;
    readonly providerTransactionId: string;
  }): Promise<void> {
    if (input.providerTransactionId.trim().length === 0) {
      throw new Error('Gateway settlement returned no provider transaction reference.');
    }
    await this.#persistence.transaction(async (transaction) => {
      const database = transaction.withSchema(applicationSchema);
      const payment = await database
        .selectFrom('x402_payment_operations as payment')
        .innerJoin('settlement_operations as settlement', 'settlement.settlement_id', 'payment.settlement_id')
        .innerJoin('obligations as obligation', 'obligation.obligation_id', 'payment.obligation_id')
        .select([
          'payment.amount_micro_usdc as amountMicroUsdc',
          'obligation.buyer_business_id as buyerBusinessId',
          'payment.obligation_id as obligationId',
          'obligation.provenance as provenance',
          'obligation.seller_business_id as sellerBusinessId',
          'payment.settlement_id as settlementId',
          'payment.state as state',
        ])
        .where('payment.payment_id', '=', input.paymentId)
        .forUpdate()
        .executeTakeFirstOrThrow();
      if (payment.state === 'COMPLETE') return;
      if (payment.state !== 'VERIFIED' && payment.state !== 'OUTCOME_UNKNOWN') {
        throw new Error('Only verified or ambiguous x402 payments can become complete.');
      }

      await database
        .updateTable('x402_payment_operations')
        .set({
          provider_state: 'SETTLED',
          provider_transaction_id: input.providerTransactionId,
          state: 'COMPLETE',
          updated_at: input.observedAt,
        })
        .where('payment_id', '=', input.paymentId)
        .executeTakeFirstOrThrow();
      await database
        .updateTable('settlement_operations')
        .set({
          provider_state: 'SETTLED',
          provider_transaction_id: input.providerTransactionId,
          state: 'COMPLETE',
          updated_at: input.observedAt,
        })
        .where('settlement_id', '=', payment.settlementId)
        .where('provider', '=', 'CIRCLE_GATEWAY_X402')
        .executeTakeFirstOrThrow();
      await database
        .updateTable('obligations')
        .set({ settled_at: input.observedAt, state: 'SETTLED' })
        .where('obligation_id', '=', payment.obligationId)
        .executeTakeFirstOrThrow();
      await database
        .insertInto('economic_entries')
        .values([
          {
            amount_micro_usdc: payment.amountMicroUsdc,
            asset: 'USDC',
            business_id: payment.sellerBusinessId,
            category: 'REVENUE',
            direction: 'INFLOW',
            entry_id: `ent_${payment.settlementId}_seller`,
            obligation_id: payment.obligationId,
            occurred_at: input.observedAt,
            provenance: payment.provenance,
            settlement_id: payment.settlementId,
          },
          {
            amount_micro_usdc: payment.amountMicroUsdc,
            asset: 'USDC',
            business_id: payment.buyerBusinessId,
            category: 'SERVICE_COST',
            direction: 'OUTFLOW',
            entry_id: `ent_${payment.settlementId}_buyer`,
            obligation_id: payment.obligationId,
            occurred_at: input.observedAt,
            provenance: payment.provenance,
            settlement_id: payment.settlementId,
          },
        ])
        .onConflict((conflict) => conflict.column('entry_id').doNothing())
        .execute();
      await database
        .insertInto('evidence_facts')
        .values({
          coverage: 'SETTLEMENT_ONLY',
          environment: 'PRIVATE_ARC_TESTNET',
          evidence_id: `evi_${payment.settlementId}_x402`,
          fact_type: 'GATEWAY_X402_USDC_PAYMENT_SETTLED',
          observed_at: input.observedAt,
          payload: {
            amountMicroUsdc: payment.amountMicroUsdc,
            buyerBusinessId: payment.buyerBusinessId,
            commonControl: payment.provenance === 'COMMON_CONTROL_TEST',
            facilitatorVerified: true,
            protocol: 'x402-v2-exact',
            sellerBusinessId: payment.sellerBusinessId,
          },
          provenance: payment.provenance,
          source_reference: input.providerTransactionId,
          source_type: 'CIRCLE_GATEWAY_X402',
          subject_id: payment.settlementId,
          subject_type: 'SETTLEMENT',
          verification: 'PROVIDER_REPORTED',
        })
        .onConflict((conflict) => conflict.column('evidence_id').doNothing())
        .execute();
    });
  }

  async listFunding(): Promise<readonly GatewayFundingSummary[]> {
    return this.#persistence.databaseForApplication
      .withSchema(applicationSchema)
      .selectFrom('gateway_funding_operations')
      .select([
        'amount_micro_usdc as amountMicroUsdc',
        'business_id as businessId',
        'funding_id as fundingId',
        'state',
      ])
      .orderBy('created_at', 'desc')
      .execute();
  }

  async listPayments(): Promise<readonly X402PaymentSummary[]> {
    return this.#persistence.databaseForApplication
      .withSchema(applicationSchema)
      .selectFrom('x402_payment_operations')
      .select([
        'amount_micro_usdc as amountMicroUsdc',
        'network',
        'payment_id as paymentId',
        'provider_state as providerState',
        'provider_transaction_id as providerTransactionId',
        'scheme',
        'state',
      ])
      .orderBy('created_at', 'desc')
      .execute();
  }
}
