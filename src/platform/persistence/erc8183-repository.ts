import { createHash } from 'node:crypto';

import type { TransactionHash } from '../../modules/agent/erc8004.ts';
import {
  assertErc8183Transition,
  type Erc8183JobCommitment,
  type Erc8183JobStatus,
  type Erc8183Leg,
  type Erc8183OperationState,
} from '../../modules/commerce/erc8183.ts';
import type { ServiceOffer } from '../../modules/commerce/model.ts';
import type { UsdcMicroAmount } from '../../modules/commerce/money.ts';
import { canonicalJson } from '../../shared/canonical-json.ts';
import { arcErc8183 } from '../arc/erc8183.ts';
import type { PostgresPersistence } from './database.ts';
import { applicationSchema } from './database.ts';

export type PersistedErc8183Status = 'UNCREATED' | Erc8183JobStatus;

export interface Erc8183JobOperation {
  readonly actorAddress: `0x${string}`;
  readonly blockNumber: bigint | null;
  readonly idempotencyKey: string;
  readonly jobId: `job_${string}`;
  readonly leg: Erc8183Leg;
  readonly operationId: `jop_${string}`;
  readonly providerState: string | null;
  readonly providerTransactionId: string | null;
  readonly sourceProviderWalletId: string;
  readonly state: Erc8183OperationState;
  readonly transactionHash: TransactionHash | null;
}

export interface Erc8183JobRecord extends Erc8183JobCommitment {
  readonly deliverableHash: TransactionHash | null;
  readonly evaluationHash: TransactionHash | null;
  readonly protocolJobId: bigint | null;
  readonly protocolStatus: PersistedErc8183Status;
  readonly terminalAt: Date | null;
}

function requireAddress(value: string, label: string): `0x${string}` {
  if (!/^0x[0-9a-fA-F]{40}$/.test(value)) throw new Error(`${label} is not an EVM address.`);
  return value as `0x${string}`;
}

function transactionHash(value: string | null): TransactionHash | null {
  if (value === null) return null;
  if (!/^0x[0-9a-fA-F]{64}$/.test(value)) throw new Error('Stored transaction hash is invalid.');
  return value as TransactionHash;
}

function asJob(row: {
  readonly budget_micro_usdc: string;
  readonly client_address: string;
  readonly client_business_id: string;
  readonly deliverable_hash: string | null;
  readonly description: string;
  readonly evaluator_address: string;
  readonly evaluation_hash: string | null;
  readonly expired_at: Date;
  readonly hook_address: string;
  readonly job_id: string;
  readonly obligation_id: string;
  readonly protocol_job_id: string | null;
  readonly protocol_status: string;
  readonly provenance: string;
  readonly provider_address: string;
  readonly provider_business_id: string;
  readonly settlement_id: string;
  readonly terminal_at: Date | null;
}): Erc8183JobRecord {
  return {
    budgetMicroUsdc: BigInt(row.budget_micro_usdc) as UsdcMicroAmount,
    clientAddress: requireAddress(row.client_address, 'ERC-8183 client'),
    clientBusinessId: row.client_business_id as `biz_${string}`,
    deliverableHash: transactionHash(row.deliverable_hash),
    description: row.description,
    evaluatorAddress: requireAddress(row.evaluator_address, 'ERC-8183 evaluator'),
    evaluationHash: transactionHash(row.evaluation_hash),
    expiredAt: row.expired_at.toISOString(),
    hookAddress: requireAddress(row.hook_address, 'ERC-8183 hook') as Erc8183JobCommitment['hookAddress'],
    jobId: row.job_id as `job_${string}`,
    obligationId: row.obligation_id as `obl_${string}`,
    protocolJobId: row.protocol_job_id === null ? null : BigInt(row.protocol_job_id),
    protocolStatus: row.protocol_status as PersistedErc8183Status,
    provenance: row.provenance as Erc8183JobCommitment['provenance'],
    providerAddress: requireAddress(row.provider_address, 'ERC-8183 provider'),
    providerBusinessId: row.provider_business_id as `biz_${string}`,
    settlementId: row.settlement_id as `set_${string}`,
    terminalAt: row.terminal_at,
  };
}

function asOperation(row: {
  readonly actor_address: string;
  readonly block_number: string | null;
  readonly idempotency_key: string;
  readonly job_id: string;
  readonly leg: string;
  readonly operation_id: string;
  readonly provider_state: string | null;
  readonly provider_transaction_id: string | null;
  readonly source_provider_wallet_id: string;
  readonly state: string;
  readonly transaction_hash: string | null;
}): Erc8183JobOperation {
  return {
    actorAddress: requireAddress(row.actor_address, 'ERC-8183 operation actor'),
    blockNumber: row.block_number === null ? null : BigInt(row.block_number),
    idempotencyKey: row.idempotency_key,
    jobId: row.job_id as `job_${string}`,
    leg: row.leg as Erc8183Leg,
    operationId: row.operation_id as `jop_${string}`,
    providerState: row.provider_state,
    providerTransactionId: row.provider_transaction_id,
    sourceProviderWalletId: row.source_provider_wallet_id,
    state: row.state as Erc8183OperationState,
    transactionHash: transactionHash(row.transaction_hash),
  };
}

export class PostgresErc8183Repository {
  readonly #persistence: PostgresPersistence;

  constructor(persistence: PostgresPersistence) {
    this.#persistence = persistence;
  }

  async ensureJob(input: {
    readonly commitment: Erc8183JobCommitment;
    readonly offer: ServiceOffer;
  }): Promise<Erc8183JobRecord> {
    const { commitment, offer } = input;
    if (
      offer.offerId !== (await this.#offerIdForObligation(commitment.obligationId)) ||
      offer.priceMicroUsdc !== commitment.budgetMicroUsdc ||
      offer.providerBusinessId !== commitment.providerBusinessId
    ) {
      throw new Error('ERC-8183 job does not match its accepted service offer and obligation.');
    }
    const database = this.#persistence.databaseForApplication.withSchema(applicationSchema);
    await database
      .insertInto('erc8183_jobs')
      .values({
        budget_micro_usdc: commitment.budgetMicroUsdc.toString(),
        chain_id: arcErc8183.chainId,
        client_address: commitment.clientAddress,
        client_business_id: commitment.clientBusinessId,
        contract_address: arcErc8183.contractAddress,
        deliverable_hash: null,
        description: commitment.description,
        evaluator_address: commitment.evaluatorAddress,
        evaluation_hash: null,
        expired_at: commitment.expiredAt,
        hook_address: commitment.hookAddress,
        job_id: commitment.jobId,
        obligation_id: commitment.obligationId,
        offer_id: offer.offerId,
        payment_token_address: arcErc8183.paymentTokenAddress,
        protocol_job_id: null,
        protocol_status: 'UNCREATED',
        provenance: commitment.provenance,
        provider_address: commitment.providerAddress,
        provider_business_id: commitment.providerBusinessId,
        settlement_id: commitment.settlementId,
        terminal_at: null,
        updated_at: new Date(),
      })
      .onConflict((conflict) => conflict.column('job_id').doNothing())
      .execute();
    const stored = await this.getJob(commitment.jobId);
    if (
      stored.budgetMicroUsdc !== commitment.budgetMicroUsdc ||
      stored.clientAddress.toLowerCase() !== commitment.clientAddress.toLowerCase() ||
      stored.clientBusinessId !== commitment.clientBusinessId ||
      stored.description !== commitment.description ||
      stored.evaluatorAddress.toLowerCase() !== commitment.evaluatorAddress.toLowerCase() ||
      stored.expiredAt !== commitment.expiredAt ||
      stored.hookAddress.toLowerCase() !== commitment.hookAddress.toLowerCase() ||
      stored.obligationId !== commitment.obligationId ||
      stored.providerAddress.toLowerCase() !== commitment.providerAddress.toLowerCase() ||
      stored.providerBusinessId !== commitment.providerBusinessId ||
      stored.settlementId !== commitment.settlementId
    ) {
      throw new Error('ERC-8183 job ID already exists with different commitment semantics.');
    }
    return stored;
  }

  async ensureOperation(input: {
    readonly actorAddress: `0x${string}`;
    readonly idempotencyKey: string;
    readonly jobId: `job_${string}`;
    readonly leg: Erc8183Leg;
    readonly operationId: `jop_${string}`;
    readonly sourceProviderWalletId: string;
  }): Promise<Erc8183JobOperation> {
    const database = this.#persistence.databaseForApplication.withSchema(applicationSchema);
    await database
      .insertInto('erc8183_job_operations')
      .values({
        actor_address: input.actorAddress,
        block_number: null,
        idempotency_key: input.idempotencyKey,
        job_id: input.jobId,
        leg: input.leg,
        operation_id: input.operationId,
        provider_state: null,
        provider_transaction_id: null,
        source_provider_wallet_id: input.sourceProviderWalletId,
        state: 'AUTHORIZED',
        transaction_hash: null,
        updated_at: new Date(),
      })
      .onConflict((conflict) => conflict.column('operation_id').doNothing())
      .execute();
    const stored = await this.getOperation(input.operationId);
    if (
      stored.actorAddress.toLowerCase() !== input.actorAddress.toLowerCase() ||
      stored.idempotencyKey !== input.idempotencyKey ||
      stored.jobId !== input.jobId ||
      stored.leg !== input.leg ||
      stored.sourceProviderWalletId !== input.sourceProviderWalletId
    ) {
      throw new Error('ERC-8183 operation ID already exists with different execution semantics.');
    }
    return stored;
  }

  async getJob(jobId: `job_${string}`): Promise<Erc8183JobRecord> {
    const row = await this.#persistence.databaseForApplication
      .withSchema(applicationSchema)
      .selectFrom('erc8183_jobs')
      .selectAll()
      .where('job_id', '=', jobId)
      .executeTakeFirstOrThrow();
    return asJob(row);
  }

  async getOperation(operationId: `jop_${string}`): Promise<Erc8183JobOperation> {
    const row = await this.#persistence.databaseForApplication
      .withSchema(applicationSchema)
      .selectFrom('erc8183_job_operations')
      .selectAll()
      .where('operation_id', '=', operationId)
      .executeTakeFirstOrThrow();
    return asOperation(row);
  }

  async listOperations(jobId: `job_${string}`): Promise<readonly Erc8183JobOperation[]> {
    const rows = await this.#persistence.databaseForApplication
      .withSchema(applicationSchema)
      .selectFrom('erc8183_job_operations')
      .selectAll()
      .where('job_id', '=', jobId)
      .orderBy('created_at')
      .execute();
    return rows.map(asOperation);
  }

  async recordSubmitted(input: {
    readonly operationId: `jop_${string}`;
    readonly providerTransactionId: string;
  }): Promise<void> {
    await this.#persistence.transaction(async (transaction) => {
      const database = transaction.withSchema(applicationSchema);
      const operation = await database
        .selectFrom('erc8183_job_operations')
        .select(['job_id', 'leg', 'provider_transaction_id', 'state'])
        .where('operation_id', '=', input.operationId)
        .forUpdate()
        .executeTakeFirstOrThrow();
      if (operation.state === 'SUBMITTED') {
        if (operation.provider_transaction_id !== input.providerTransactionId) {
          throw new Error('ERC-8183 operation is already committed to another provider transaction.');
        }
        return;
      }
      if (operation.state !== 'AUTHORIZED' && operation.state !== 'OUTCOME_UNKNOWN') {
        throw new Error('ERC-8183 operation is not admissible for submission.');
      }
      await database
        .updateTable('erc8183_job_operations')
        .set({
          provider_state: 'SUBMITTED',
          provider_transaction_id: input.providerTransactionId,
          state: 'SUBMITTED',
          updated_at: new Date(),
        })
        .where('operation_id', '=', input.operationId)
        .executeTakeFirstOrThrow();
      if (operation.leg === 'COMPLETE') {
        const job = await database
          .selectFrom('erc8183_jobs')
          .select('settlement_id')
          .where('job_id', '=', operation.job_id)
          .executeTakeFirstOrThrow();
        await database
          .updateTable('settlement_operations')
          .set({
            provider_state: 'SUBMITTED',
            provider_transaction_id: input.providerTransactionId,
            state: 'SUBMITTED',
            updated_at: new Date(),
          })
          .where('settlement_id', '=', job.settlement_id)
          .where('state', 'in', ['AUTHORIZED', 'OUTCOME_UNKNOWN'])
          .executeTakeFirstOrThrow();
      }
    });
  }

  async recordOutcome(input: {
    readonly operationId: `jop_${string}`;
    readonly providerState: string;
    readonly state: 'FAILED' | 'OUTCOME_UNKNOWN';
  }): Promise<void> {
    const result = await this.#persistence.databaseForApplication
      .withSchema(applicationSchema)
      .updateTable('erc8183_job_operations')
      .set({ provider_state: input.providerState, state: input.state, updated_at: new Date() })
      .where('operation_id', '=', input.operationId)
      .where('state', 'in', ['SUBMITTED', 'OUTCOME_UNKNOWN'])
      .executeTakeFirstOrThrow();
    if (result.numUpdatedRows !== 1n) throw new Error('ERC-8183 outcome was not recorded.');
  }

  async recordComplete(input: {
    readonly blockNumber: bigint;
    readonly evaluationHash?: TransactionHash;
    readonly deliverableHash?: TransactionHash;
    readonly nextStatus?: Erc8183JobStatus;
    readonly observedAt: string;
    readonly operationId: `jop_${string}`;
    readonly protocolJobId?: bigint;
    readonly providerState: string;
    readonly serviceExecutionId?: `svc_${string}`;
    readonly serviceOutput?: unknown;
    readonly serviceOutputSha256?: string;
    readonly transactionHash: TransactionHash;
  }): Promise<void> {
    await this.#persistence.transaction(async (transaction) => {
      const database = transaction.withSchema(applicationSchema);
      const operation = await database
        .selectFrom('erc8183_job_operations')
        .selectAll()
        .where('operation_id', '=', input.operationId)
        .forUpdate()
        .executeTakeFirstOrThrow();
      if (operation.state === 'COMPLETE') {
        if (operation.transaction_hash?.toLowerCase() !== input.transactionHash.toLowerCase()) {
          throw new Error('Completed ERC-8183 operation has a different Arc transaction.');
        }
        return;
      }
      if (operation.state !== 'SUBMITTED' && operation.state !== 'OUTCOME_UNKNOWN') {
        throw new Error('ERC-8183 operation is not reconcilable.');
      }
      const job = await database
        .selectFrom('erc8183_jobs')
        .selectAll()
        .where('job_id', '=', operation.job_id)
        .forUpdate()
        .executeTakeFirstOrThrow();
      if (operation.leg === 'CREATE') {
        if (job.protocol_status !== 'UNCREATED' || input.protocolJobId === undefined) {
          throw new Error('ERC-8183 create reconciliation lacks a new protocol job ID.');
        }
      } else if (input.protocolJobId !== undefined && job.protocol_job_id !== input.protocolJobId.toString()) {
        throw new Error('ERC-8183 protocol job ID changed after creation.');
      }
      if (input.nextStatus !== undefined && job.protocol_status !== 'UNCREATED') {
        assertErc8183Transition(job.protocol_status as Erc8183JobStatus, input.nextStatus);
      }
      const terminal = input.nextStatus === 'COMPLETED' || input.nextStatus === 'REJECTED' || input.nextStatus === 'EXPIRED';
      await database
        .updateTable('erc8183_job_operations')
        .set({
          block_number: input.blockNumber.toString(),
          provider_state: input.providerState,
          state: 'COMPLETE',
          transaction_hash: input.transactionHash,
          updated_at: input.observedAt,
        })
        .where('operation_id', '=', input.operationId)
        .executeTakeFirstOrThrow();
      await database
        .updateTable('erc8183_jobs')
        .set({
          ...(input.deliverableHash === undefined ? {} : { deliverable_hash: input.deliverableHash }),
          ...(input.evaluationHash === undefined ? {} : { evaluation_hash: input.evaluationHash }),
          ...(input.protocolJobId === undefined ? {} : { protocol_job_id: input.protocolJobId.toString() }),
          ...(input.nextStatus === undefined ? {} : { protocol_status: input.nextStatus }),
          ...(terminal ? { terminal_at: input.observedAt } : {}),
          updated_at: input.observedAt,
        })
        .where('job_id', '=', operation.job_id)
        .executeTakeFirstOrThrow();

      if (input.nextStatus === 'COMPLETED') {
        if (
          input.serviceExecutionId === undefined ||
          input.serviceOutput === undefined ||
          input.serviceOutputSha256 === undefined ||
          !/^[0-9a-f]{64}$/.test(input.serviceOutputSha256) ||
          job.deliverable_hash === null
        ) {
          throw new Error('Completed ERC-8183 work requires a persisted deliverable and execution ID.');
        }
        await this.#recordPayout(transaction.withSchema(applicationSchema), {
          blockNumber: input.blockNumber,
          job,
          observedAt: input.observedAt,
          serviceExecutionId: input.serviceExecutionId,
          serviceOutput: input.serviceOutput,
          serviceOutputSha256: input.serviceOutputSha256,
          transactionHash: input.transactionHash,
        });
      } else if (input.nextStatus === 'REJECTED' || input.nextStatus === 'EXPIRED') {
        await this.#recordRefund(transaction.withSchema(applicationSchema), {
          job,
          observedAt: input.observedAt,
          status: input.nextStatus,
          transactionHash: input.transactionHash,
        });
      }
    });
  }

  async ensureCompletedDeliveryIntegrity(input: {
    readonly deliverableHash: TransactionHash;
    readonly jobId: `job_${string}`;
    readonly output: unknown;
    readonly serviceExecutionId: `svc_${string}`;
  }): Promise<void> {
    const outputSha256 = createHash('sha256').update(canonicalJson(input.output)).digest('hex');
    await this.#persistence.transaction(async (transaction) => {
      const database = transaction.withSchema(applicationSchema);
      const job = await database
        .selectFrom('erc8183_jobs')
        .select(['deliverable_hash', 'obligation_id', 'protocol_status', 'settlement_id'])
        .where('job_id', '=', input.jobId)
        .forUpdate()
        .executeTakeFirstOrThrow();
      const delivery = await database
        .selectFrom('service_executions')
        .select(['obligation_id', 'settlement_id', 'state'])
        .where('execution_id', '=', input.serviceExecutionId)
        .forUpdate()
        .executeTakeFirstOrThrow();
      if (
        job.protocol_status !== 'COMPLETED' ||
        job.deliverable_hash?.toLowerCase() !== input.deliverableHash.toLowerCase() ||
        delivery.obligation_id !== job.obligation_id ||
        delivery.settlement_id !== job.settlement_id ||
        delivery.state !== 'COMPLETE'
      ) {
        throw new Error('Completed delivery does not match the chain-verified ERC-8183 job.');
      }
      await database
        .updateTable('service_executions')
        .set({ output: input.output, output_sha256: outputSha256 })
        .where('execution_id', '=', input.serviceExecutionId)
        .executeTakeFirstOrThrow();
    });
  }

  async #offerIdForObligation(obligationId: `obl_${string}`): Promise<string> {
    const row = await this.#persistence.databaseForApplication
      .withSchema(applicationSchema)
      .selectFrom('obligations')
      .select('offer_id')
      .where('obligation_id', '=', obligationId)
      .executeTakeFirstOrThrow();
    return row.offer_id;
  }

  async #recordPayout(
    database: ReturnType<PostgresPersistence['databaseForApplication']['withSchema']>,
    input: {
      readonly blockNumber: bigint;
      readonly job: {
        readonly budget_micro_usdc: string;
        readonly client_business_id: string;
        readonly deliverable_hash: string | null;
        readonly description: string;
        readonly job_id: string;
        readonly obligation_id: string;
        readonly offer_id: string;
        readonly protocol_job_id: string | null;
        readonly provenance: string;
        readonly provider_business_id: string;
        readonly settlement_id: string;
      };
      readonly observedAt: string;
      readonly serviceExecutionId: `svc_${string}`;
      readonly serviceOutput: unknown;
      readonly serviceOutputSha256: string;
      readonly transactionHash: TransactionHash;
    },
  ): Promise<void> {
    const job = input.job;
    if (job.protocol_job_id === null || job.deliverable_hash === null) {
      throw new Error('ERC-8183 payout lacks protocol job or deliverable identity.');
    }
    const offer = await database
      .selectFrom('service_offers')
      .select('capability_id')
      .where('offer_id', '=', job.offer_id)
      .executeTakeFirstOrThrow();
    await database
      .updateTable('settlement_operations')
      .set({
        provider_state: 'COMPLETE',
        state: 'COMPLETE',
        transaction_hash: input.transactionHash,
        updated_at: input.observedAt,
      })
      .where('settlement_id', '=', job.settlement_id)
      .where('state', 'in', ['SUBMITTED', 'OUTCOME_UNKNOWN'])
      .executeTakeFirstOrThrow();
    await database
      .updateTable('obligations')
      .set({ settled_at: input.observedAt, state: 'SETTLED' })
      .where('obligation_id', '=', job.obligation_id)
      .executeTakeFirstOrThrow();
    await database
      .insertInto('economic_entries')
      .values([
        {
          amount_micro_usdc: job.budget_micro_usdc,
          asset: 'USDC',
          business_id: job.provider_business_id,
          category: 'REVENUE',
          direction: 'INFLOW',
          entry_id: `ent_${job.settlement_id}_seller`,
          obligation_id: job.obligation_id,
          occurred_at: input.observedAt,
          provenance: job.provenance,
          settlement_id: job.settlement_id,
        },
        {
          amount_micro_usdc: job.budget_micro_usdc,
          asset: 'USDC',
          business_id: job.client_business_id,
          category: 'SERVICE_COST',
          direction: 'OUTFLOW',
          entry_id: `ent_${job.settlement_id}_buyer`,
          obligation_id: job.obligation_id,
          occurred_at: input.observedAt,
          provenance: job.provenance,
          settlement_id: job.settlement_id,
        },
      ])
      .onConflict((conflict) => conflict.column('entry_id').doNothing())
      .execute();
    await database
      .insertInto('service_executions')
      .values({
        capability_id: offer.capability_id,
        completed_at: input.observedAt,
        consumer_business_id: job.client_business_id,
        environment: 'PRIVATE_ARC_TESTNET',
        execution_id: input.serviceExecutionId,
        obligation_id: job.obligation_id,
        output: input.serviceOutput,
        output_sha256: input.serviceOutputSha256,
        provenance: job.provenance,
        provider_business_id: job.provider_business_id,
        settlement_id: job.settlement_id,
        source_reference: `erc8183:${arcErc8183.chainId}:${arcErc8183.contractAddress}:${job.protocol_job_id}`,
        state: 'COMPLETE',
      })
      .onConflict((conflict) => conflict.column('execution_id').doNothing())
      .execute();
    await database
      .insertInto('evidence_facts')
      .values([
        {
          coverage: 'JOB_LIFECYCLE',
          environment: 'PRIVATE_ARC_TESTNET',
          evidence_id: `evi_${job.job_id}_complete`,
          fact_type: 'ERC8183_JOB_COMPLETED',
          observed_at: input.observedAt,
          payload: {
            amountMicroUsdc: job.budget_micro_usdc,
            commonControl: job.provenance === 'COMMON_CONTROL_TEST',
            deliverableHash: job.deliverable_hash,
            protocolJobId: job.protocol_job_id,
          },
          provenance: job.provenance,
          source_reference: input.transactionHash,
          source_type: 'ARC_ERC8183_CONTRACT',
          subject_id: job.job_id,
          subject_type: 'ERC8183_JOB',
          verification: 'CHAIN_VERIFIED',
        },
        {
          coverage: 'SETTLEMENT_ONLY',
          environment: 'PRIVATE_ARC_TESTNET',
          evidence_id: `evi_${job.settlement_id}_erc8183`,
          fact_type: 'ERC8183_USDC_PAYOUT_FINALIZED',
          observed_at: input.observedAt,
          payload: {
            amountMicroUsdc: job.budget_micro_usdc,
            blockNumber: input.blockNumber.toString(),
            commonControl: job.provenance === 'COMMON_CONTROL_TEST',
            transactionHash: input.transactionHash,
          },
          provenance: job.provenance,
          source_reference: input.transactionHash,
          source_type: 'ARC_TESTNET_TRANSACTION',
          subject_id: job.settlement_id,
          subject_type: 'SETTLEMENT',
          verification: 'CHAIN_VERIFIED',
        },
      ])
      .onConflict((conflict) => conflict.column('evidence_id').doNothing())
      .execute();
  }

  async #recordRefund(
    database: ReturnType<PostgresPersistence['databaseForApplication']['withSchema']>,
    input: {
      readonly job: {
        readonly budget_micro_usdc: string;
        readonly job_id: string;
        readonly obligation_id: string;
        readonly provenance: string;
        readonly settlement_id: string;
      };
      readonly observedAt: string;
      readonly status: 'EXPIRED' | 'REJECTED';
      readonly transactionHash: TransactionHash;
    },
  ): Promise<void> {
    await database
      .updateTable('settlement_operations')
      .set({
        provider_state: input.status,
        state: 'REFUNDED',
        transaction_hash: input.transactionHash,
        updated_at: input.observedAt,
      })
      .where('settlement_id', '=', input.job.settlement_id)
      .where('state', 'in', ['AUTHORIZED', 'SUBMITTED', 'OUTCOME_UNKNOWN'])
      .executeTakeFirstOrThrow();
    await database
      .updateTable('obligations')
      .set({ settled_at: input.observedAt, state: 'CANCELLED' })
      .where('obligation_id', '=', input.job.obligation_id)
      .executeTakeFirstOrThrow();
    await database
      .insertInto('evidence_facts')
      .values({
        coverage: 'SETTLEMENT_ONLY',
        environment: 'PRIVATE_ARC_TESTNET',
        evidence_id: `evi_${input.job.settlement_id}_erc8183_refund`,
        fact_type: 'ERC8183_ESCROW_REFUNDED',
        observed_at: input.observedAt,
        payload: {
          amountMicroUsdc: input.job.budget_micro_usdc,
          commonControl: input.job.provenance === 'COMMON_CONTROL_TEST',
          terminalStatus: input.status,
        },
        provenance: input.job.provenance,
        source_reference: input.transactionHash,
        source_type: 'ARC_TESTNET_TRANSACTION',
        subject_id: input.job.settlement_id,
        subject_type: 'SETTLEMENT',
        verification: 'CHAIN_VERIFIED',
      })
      .onConflict((conflict) => conflict.column('evidence_id').doNothing())
      .execute();
  }
}
