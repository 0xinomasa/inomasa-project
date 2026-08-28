import { createHash } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';

import { keccak256, toBytes } from 'viem';

import type { ContractExecutionOutcome } from '../src/modules/agent/erc8004.ts';
import type { Erc8183Leg } from '../src/modules/commerce/erc8183.ts';
import { acceptServiceOffer, authorizeSettlement } from '../src/modules/commerce/model.ts';
import { alphaServiceCatalog } from '../src/modules/commerce/service-catalog.ts';
import { canonicalJson } from '../src/shared/canonical-json.ts';
import { ArcErc8183Rpc, arcErc8183 } from '../src/platform/arc/erc8183.ts';
import { readCircleDeveloperWalletConfig } from '../src/platform/circle/config.ts';
import { CircleContractExecutionAdapter } from '../src/platform/circle/contract-execution.ts';
import { PostgresAlphaBusinessRepository } from '../src/platform/persistence/alpha-business-repository.ts';
import { PostgresAlphaCommerceRepository } from '../src/platform/persistence/alpha-commerce-repository.ts';
import { readDatabaseConnectionConfig } from '../src/platform/persistence/config.ts';
import { applicationSchema, PostgresPersistence } from '../src/platform/persistence/database.ts';
import {
  PostgresErc8183Repository,
} from '../src/platform/persistence/erc8183-repository.ts';

const referenceEconomy = process.argv.includes('--reference-economy');
const profile = referenceEconomy
  ? {
      clientBusinessId: 'biz_reference_workbench' as const,
      executionIds: {
        APPROVE: { idempotencyKey: '0b5e7462-8e42-4d5c-b9d6-16ee0c42d28a', operationId: 'jop_reference_8183_approve_v1' as const },
        COMPLETE: { idempotencyKey: '2143feb4-d230-407e-b7ba-77a986bb62a5', operationId: 'jop_reference_8183_complete_v1' as const },
        CREATE: { idempotencyKey: '2021b351-0542-46c6-96ed-80e98f18c399', operationId: 'jop_reference_8183_create_v1' as const },
        FUND: { idempotencyKey: 'cbaf4044-7d9b-42a4-af45-5005761963b5', operationId: 'jop_reference_8183_fund_v1' as const },
        SET_BUDGET: { idempotencyKey: 'ba42a6bb-d354-4b25-8dd3-f8ce88194610', operationId: 'jop_reference_8183_budget_v1' as const },
        SUBMIT: { idempotencyKey: '416ce9e4-e7dd-4ecb-a58f-b9d194d4d2b4', operationId: 'jop_reference_8183_submit_v1' as const },
      },
      jobId: 'job_reference_economy_8183_v1' as const,
      obligationId: 'obl_reference_economy_8183_v1' as const,
      offer: alphaServiceCatalog.referenceEvaluatedWork.offer,
      providerBusinessId: 'biz_reference_signal' as const,
      serviceExecutionId: 'svc_reference_economy_8183_v1' as const,
      settlementId: 'set_reference_economy_8183_v1' as const,
      settlementIdempotencyKey: 'ea542c7b-cf9b-4a93-88d2-fc076a48d653',
    }
  : null;
const jobId = profile?.jobId ?? ('job_commerce_readiness_8183_v1' as const);
const obligationId = profile?.obligationId ?? ('obl_commerce_readiness_8183_v1' as const);
const settlementId = profile?.settlementId ?? ('set_commerce_readiness_8183_v1' as const);
const serviceExecutionId = profile?.serviceExecutionId ?? ('svc_commerce_readiness_8183_v1' as const);
const expiredAt = '2026-09-30T00:00:00.000Z';
const zeroBytes = '0x';

const baselineExecutionIds = {
  APPROVE: {
    idempotencyKey: '86b58566-5008-408e-b459-770155ab1ad1',
    operationId: 'jop_commerce_readiness_8183_approve_v1',
  },
  COMPLETE: {
    idempotencyKey: 'e35a478f-a5d3-4f21-a9da-99e36156d079',
    operationId: 'jop_commerce_readiness_8183_complete_v1',
  },
  CREATE: {
    idempotencyKey: 'b08ad7f9-ce27-4554-8b68-d0d313070787',
    operationId: 'jop_commerce_readiness_8183_create_v1',
  },
  FUND: {
    idempotencyKey: 'd4ab404b-9ad0-4efa-b409-1a8b0fe6d3a7',
    operationId: 'jop_commerce_readiness_8183_fund_v1',
  },
  SET_BUDGET: {
    idempotencyKey: 'ac2062af-76a6-499c-8c28-ad95f91249ce',
    operationId: 'jop_commerce_readiness_8183_budget_v1',
  },
  SUBMIT: {
    idempotencyKey: '42e9fbf4-5075-43bd-bac2-50fb97cb4b26',
    operationId: 'jop_commerce_readiness_8183_submit_v1',
  },
} as const;
const executionIds = profile?.executionIds ?? baselineExecutionIds;

function requireAddress(value: string | null, label: string): `0x${string}` {
  if (value === null || !/^0x[0-9a-fA-F]{40}$/.test(value)) {
    throw new Error(`${label} requires an active Arc EOA Treasury.`);
  }
  return value as `0x${string}`;
}

async function awaitProviderOutcome(
  execution: CircleContractExecutionAdapter,
  providerTransactionId: string,
): Promise<ContractExecutionOutcome> {
  for (let attempt = 0; attempt < 90; attempt += 1) {
    const outcome = await execution.observe(providerTransactionId);
    if (outcome.state !== 'PENDING') return outcome;
    await delay(2_000);
  }
  return { providerState: 'POLL_TIMEOUT', state: 'OUTCOME_UNKNOWN' };
}

async function executeLeg(input: {
  readonly abiFunctionSignature: string;
  readonly abiParameters: readonly string[];
  readonly actorAddress: `0x${string}`;
  readonly contractAddress: `0x${string}`;
  readonly execution: CircleContractExecutionAdapter;
  readonly leg: keyof typeof executionIds;
  readonly referenceId: string;
  readonly repository: PostgresErc8183Repository;
  readonly sourceProviderWalletId: string;
  readonly verify: (
    transactionHash: `0x${string}`,
    providerState: string,
  ) => Promise<void>;
}): Promise<void> {
  const identifiers = executionIds[input.leg];
  let operation = await input.repository.ensureOperation({
    actorAddress: input.actorAddress,
    idempotencyKey: identifiers.idempotencyKey,
    jobId,
    leg: input.leg as Erc8183Leg,
    operationId: identifiers.operationId,
    sourceProviderWalletId: input.sourceProviderWalletId,
  });
  if (operation.state === 'COMPLETE') {
    console.log(`erc8183_job=${jobId} leg=${input.leg} state=ALREADY_COMPLETE`);
    return;
  }
  if (operation.state === 'FAILED') {
    throw new Error(`ERC-8183 ${input.leg} is terminally failed (${operation.providerState}).`);
  }
  if (operation.state === 'AUTHORIZED') {
    const submission = await input.execution.submit({
      abiFunctionSignature: input.abiFunctionSignature,
      abiParameters: input.abiParameters,
      contractAddress: input.contractAddress,
      idempotencyKey: operation.idempotencyKey,
      referenceId: input.referenceId,
      sourceAddress: input.actorAddress,
    });
    await input.repository.recordSubmitted({
      operationId: operation.operationId,
      providerTransactionId: submission.providerTransactionId,
    });
    operation = await input.repository.getOperation(operation.operationId);
    console.log(`erc8183_job=${jobId} leg=${input.leg} state=SUBMITTED`);
  }
  if (operation.providerTransactionId === null) {
    throw new Error(`ERC-8183 ${input.leg} has no provider transaction to reconcile.`);
  }
  const outcome = await awaitProviderOutcome(input.execution, operation.providerTransactionId);
  if (outcome.state !== 'COMPLETE' || outcome.transactionHash === undefined) {
    await input.repository.recordOutcome({
      operationId: operation.operationId,
      providerState: outcome.providerState,
      state: outcome.state === 'FAILED' ? 'FAILED' : 'OUTCOME_UNKNOWN',
    });
    throw new Error(`ERC-8183 ${input.leg} outcome is ${outcome.state}.`);
  }
  await input.verify(outcome.transactionHash, outcome.providerState);
  console.log(`erc8183_job=${jobId} leg=${input.leg} state=COMPLETE tx=${outcome.transactionHash}`);
}

async function main(): Promise<void> {
  const databaseConfig = readDatabaseConnectionConfig('runtime');
  const circleConfig = readCircleDeveloperWalletConfig();
  if (
    databaseConfig.environment !== 'PRIVATE_ARC_TESTNET' ||
    circleConfig.environment !== 'PRIVATE_ARC_TESTNET'
  ) {
    throw new Error('Checkpoint D ERC-8183 execution is restricted to PRIVATE_ARC_TESTNET.');
  }

  const persistence = new PostgresPersistence(databaseConfig);
  try {
    const businesses = new PostgresAlphaBusinessRepository(persistence);
    const commerce = new PostgresAlphaCommerceRepository(persistence);
    const jobs = new PostgresErc8183Repository(persistence);
    const execution = new CircleContractExecutionAdapter(circleConfig);
    const rpc = new ArcErc8183Rpc();
    const provider = await businesses.getBusiness(profile?.providerBusinessId ?? 'biz_signal_forge');
    const client = await businesses.getBusiness(profile?.clientBusinessId ?? 'biz_ops_pilot');
    const bindings = await persistence.databaseForApplication
      .withSchema(applicationSchema)
      .selectFrom('treasury_bindings')
      .select(['address', 'business_id', 'provider_wallet_id'])
      .where('business_id', 'in', [client.businessId, provider.businessId])
      .where('status', '=', 'ACTIVE')
      .execute();
    const clientBinding = bindings.find(({ business_id }) => business_id === client.businessId);
    const providerBinding = bindings.find(({ business_id }) => business_id === provider.businessId);
    if (clientBinding?.provider_wallet_id === null || clientBinding?.provider_wallet_id === undefined) {
      throw new Error('ERC-8183 client has no active Circle execution account.');
    }
    if (providerBinding?.provider_wallet_id === null || providerBinding?.provider_wallet_id === undefined) {
      throw new Error('ERC-8183 provider has no active Circle execution account.');
    }
    const clientAddress = requireAddress(clientBinding.address, 'ERC-8183 client');
    const providerAddress = requireAddress(providerBinding.address, 'ERC-8183 provider');
    const offer = profile?.offer ?? alphaServiceCatalog.commerceReadinessJob.offer;
    const obligation = acceptServiceOffer({ buyer: client, offer, obligationId, provider });
    const settlement = authorizeSettlement({
      idempotencyKey: profile?.settlementIdempotencyKey ?? 'c8d0a73d-c972-4619-8e2c-38f03faef007',
      obligation,
      provider: 'ERC8183',
      settlementId,
    });
    await commerce.prepareCommerce({ obligation, offer, settlement });
    let job = await jobs.ensureJob({
      commitment: {
        budgetMicroUsdc: offer.priceMicroUsdc,
        clientAddress,
        clientBusinessId: client.businessId,
        description: offer.description,
        evaluatorAddress: clientAddress,
        expiredAt,
        hookAddress: arcErc8183.hookAddress,
        jobId,
        obligationId,
        provenance: obligation.provenance,
        providerAddress,
        providerBusinessId: provider.businessId,
        settlementId,
      },
      offer,
    });
    await rpc.verifyContractProfile();
    const expiredAtUnix = BigInt(Math.floor(Date.parse(expiredAt) / 1_000));

    await executeLeg({
      abiFunctionSignature: 'createJob(address,address,uint256,string,address)',
      abiParameters: [providerAddress, clientAddress, expiredAtUnix.toString(), offer.description, arcErc8183.hookAddress],
      actorAddress: clientAddress,
      contractAddress: arcErc8183.contractAddress,
      execution,
      leg: 'CREATE',
      referenceId: `${jobId}:create`,
      repository: jobs,
      sourceProviderWalletId: clientBinding.provider_wallet_id,
      verify: async (transactionHash, providerState) => {
        const observed = await rpc.verifyCreate({
          client: clientAddress,
          description: offer.description,
          evaluator: clientAddress,
          expiredAtUnix,
          provider: providerAddress,
          transactionHash,
        });
        await jobs.recordComplete({
          blockNumber: observed.blockNumber,
          nextStatus: 'OPEN',
          observedAt: new Date().toISOString(),
          operationId: executionIds.CREATE.operationId,
          protocolJobId: observed.jobId,
          providerState,
          transactionHash,
        });
      },
    });
    job = await jobs.getJob(jobId);
    if (job.protocolJobId === null) throw new Error('ERC-8183 protocol job ID is unavailable.');
    const protocolJobId = job.protocolJobId;

    await executeLeg({
      abiFunctionSignature: 'setBudget(uint256,uint256,bytes)',
      abiParameters: [protocolJobId.toString(), offer.priceMicroUsdc.toString(), zeroBytes],
      actorAddress: providerAddress,
      contractAddress: arcErc8183.contractAddress,
      execution,
      leg: 'SET_BUDGET',
      referenceId: `${jobId}:budget`,
      repository: jobs,
      sourceProviderWalletId: providerBinding.provider_wallet_id,
      verify: async (transactionHash, providerState) => {
        const observed = await rpc.verifyJobState({
          budgetMicroUsdc: offer.priceMicroUsdc,
          client: clientAddress,
          description: offer.description,
          evaluator: clientAddress,
          expectedStatus: 'OPEN',
          expiredAtUnix,
          jobId: protocolJobId,
          provider: providerAddress,
          transactionHash,
        });
        await jobs.recordComplete({
          blockNumber: observed.blockNumber,
          observedAt: new Date().toISOString(),
          operationId: executionIds.SET_BUDGET.operationId,
          providerState,
          transactionHash,
        });
      },
    });

    await executeLeg({
      abiFunctionSignature: 'approve(address,uint256)',
      abiParameters: [arcErc8183.contractAddress, offer.priceMicroUsdc.toString()],
      actorAddress: clientAddress,
      contractAddress: arcErc8183.paymentTokenAddress,
      execution,
      leg: 'APPROVE',
      referenceId: `${jobId}:approve`,
      repository: jobs,
      sourceProviderWalletId: clientBinding.provider_wallet_id,
      verify: async (transactionHash, providerState) => {
        const observed = await rpc.verifyApproval({
          amountMicroUsdc: offer.priceMicroUsdc,
          owner: clientAddress,
          transactionHash,
        });
        await jobs.recordComplete({
          blockNumber: observed.blockNumber,
          observedAt: new Date().toISOString(),
          operationId: executionIds.APPROVE.operationId,
          providerState,
          transactionHash,
        });
      },
    });

    await executeLeg({
      abiFunctionSignature: 'fund(uint256,bytes)',
      abiParameters: [protocolJobId.toString(), zeroBytes],
      actorAddress: clientAddress,
      contractAddress: arcErc8183.contractAddress,
      execution,
      leg: 'FUND',
      referenceId: `${jobId}:fund`,
      repository: jobs,
      sourceProviderWalletId: clientBinding.provider_wallet_id,
      verify: async (transactionHash, providerState) => {
        const observed = await rpc.verifyJobState({
          budgetMicroUsdc: offer.priceMicroUsdc,
          client: clientAddress,
          description: offer.description,
          evaluator: clientAddress,
          expectedStatus: 'FUNDED',
          expiredAtUnix,
          jobId: protocolJobId,
          provider: providerAddress,
          transactionHash,
          transfer: 'TO_ESCROW',
        });
        await jobs.recordComplete({
          blockNumber: observed.blockNumber,
          nextStatus: 'FUNDED',
          observedAt: new Date().toISOString(),
          operationId: executionIds.FUND.operationId,
          providerState,
          transactionHash,
        });
      },
    });

    const deliverableOutput = {
      chainId: arcErc8183.chainId,
      conclusion: referenceEconomy
        ? 'The fresh reference economy composed bounded Arc commerce primitives.'
        : 'Arc commerce capability is ready for bounded testnet execution.',
      jobId,
      provenance: 'COMMON_CONTROL_TEST',
      scope: referenceEconomy ? 'reference-economy-brief' : 'commerce-readiness-brief',
    } as const;
    const deliverable = JSON.stringify(deliverableOutput);
    const deliverableHash = keccak256(toBytes(deliverable));
    const outputSha256 = createHash('sha256').update(canonicalJson(deliverableOutput)).digest('hex');
    await executeLeg({
      abiFunctionSignature: 'submit(uint256,bytes32,bytes)',
      abiParameters: [protocolJobId.toString(), deliverableHash, zeroBytes],
      actorAddress: providerAddress,
      contractAddress: arcErc8183.contractAddress,
      execution,
      leg: 'SUBMIT',
      referenceId: `${jobId}:submit`,
      repository: jobs,
      sourceProviderWalletId: providerBinding.provider_wallet_id,
      verify: async (transactionHash, providerState) => {
        const observed = await rpc.verifyJobState({
          budgetMicroUsdc: offer.priceMicroUsdc,
          client: clientAddress,
          description: offer.description,
          evaluator: clientAddress,
          expectedStatus: 'SUBMITTED',
          expiredAtUnix,
          jobId: protocolJobId,
          provider: providerAddress,
          transactionHash,
        });
        await jobs.recordComplete({
          blockNumber: observed.blockNumber,
          deliverableHash,
          nextStatus: 'SUBMITTED',
          observedAt: new Date().toISOString(),
          operationId: executionIds.SUBMIT.operationId,
          providerState,
          transactionHash,
        });
      },
    });

    const evaluationHash = keccak256(toBytes(`accepted:${deliverableHash}`));
    await executeLeg({
      abiFunctionSignature: 'complete(uint256,bytes32,bytes)',
      abiParameters: [protocolJobId.toString(), evaluationHash, zeroBytes],
      actorAddress: clientAddress,
      contractAddress: arcErc8183.contractAddress,
      execution,
      leg: 'COMPLETE',
      referenceId: `${jobId}:complete`,
      repository: jobs,
      sourceProviderWalletId: clientBinding.provider_wallet_id,
      verify: async (transactionHash, providerState) => {
        const observed = await rpc.verifyJobState({
          budgetMicroUsdc: offer.priceMicroUsdc,
          client: clientAddress,
          description: offer.description,
          evaluator: clientAddress,
          expectedStatus: 'COMPLETED',
          expiredAtUnix,
          jobId: protocolJobId,
          provider: providerAddress,
          transactionHash,
          transfer: 'PAYOUT',
        });
        await jobs.recordComplete({
          blockNumber: observed.blockNumber,
          evaluationHash,
          nextStatus: 'COMPLETED',
          observedAt: new Date().toISOString(),
          operationId: executionIds.COMPLETE.operationId,
          providerState,
          serviceExecutionId,
          serviceOutput: deliverableOutput,
          serviceOutputSha256: outputSha256,
          transactionHash,
        });
      },
    });

    await jobs.ensureCompletedDeliveryIntegrity({
      deliverableHash,
      jobId,
      output: deliverableOutput,
      serviceExecutionId,
    });

    job = await jobs.getJob(jobId);
    console.log(
      `${referenceEconomy ? 'checkpoint_g_erc8183' : 'checkpoint_d_erc8183'}=PASS job=${job.jobId} protocol_job=${job.protocolJobId} state=${job.protocolStatus} amount_micro_usdc=${job.budgetMicroUsdc} deliverable=${job.deliverableHash} provenance=${job.provenance}`,
    );
  } finally {
    await persistence.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Checkpoint D ERC-8183 execution failed.');
  process.exitCode = 1;
});
