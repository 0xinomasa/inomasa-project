import { ArcErc8183Rpc } from '../src/platform/arc/erc8183.ts';
import { readDatabaseConnectionConfig } from '../src/platform/persistence/config.ts';
import { applicationSchema, PostgresPersistence } from '../src/platform/persistence/database.ts';
import { PostgresErc8183Repository } from '../src/platform/persistence/erc8183-repository.ts';
import { PostgresGatewayX402Repository } from '../src/platform/persistence/gateway-x402-repository.ts';

const jobId = 'job_commerce_readiness_8183_v1' as const;

async function main(): Promise<void> {
  const config = readDatabaseConnectionConfig('runtime');
  if (config.environment !== 'PRIVATE_ARC_TESTNET') {
    throw new Error('Checkpoint D proof is restricted to PRIVATE_ARC_TESTNET.');
  }
  const persistence = new PostgresPersistence(config);
  try {
    const jobs = new PostgresErc8183Repository(persistence);
    const x402 = new PostgresGatewayX402Repository(persistence);
    const job = await jobs.getJob(jobId);
    const operations = await jobs.listOperations(jobId);
    if (
      job.protocolJobId === null ||
      job.protocolStatus !== 'COMPLETED' ||
      job.deliverableHash === null ||
      job.evaluationHash === null ||
      job.terminalAt === null
    ) {
      throw new Error('ERC-8183 job is not terminal with complete deliverable evidence.');
    }
    const expectedLegs = ['CREATE', 'SET_BUDGET', 'APPROVE', 'FUND', 'SUBMIT', 'COMPLETE'];
    if (
      operations.length !== expectedLegs.length ||
      expectedLegs.some((leg) => !operations.some((operation) => operation.leg === leg && operation.state === 'COMPLETE')) ||
      new Set(operations.map(({ transactionHash }) => transactionHash)).size !== operations.length
    ) {
      throw new Error('ERC-8183 operation ledger is incomplete or contains duplicate Arc transactions.');
    }
    const funding = operations.find(({ leg }) => leg === 'FUND');
    const completion = operations.find(({ leg }) => leg === 'COMPLETE');
    if (funding?.transactionHash === null || funding === undefined || completion?.transactionHash === null || completion === undefined) {
      throw new Error('ERC-8183 funding or completion transaction is unavailable.');
    }
    const expiredAtUnix = BigInt(Math.floor(Date.parse(job.expiredAt) / 1_000));
    const rpc = new ArcErc8183Rpc();
    await rpc.verifyJobState({
      budgetMicroUsdc: job.budgetMicroUsdc,
      client: job.clientAddress,
      description: job.description,
      evaluator: job.evaluatorAddress,
      expectedStatus: 'FUNDED',
      expiredAtUnix,
      jobId: job.protocolJobId,
      provider: job.providerAddress,
      transactionHash: funding.transactionHash,
      transfer: 'TO_ESCROW',
    });
    await rpc.verifyJobState({
      budgetMicroUsdc: job.budgetMicroUsdc,
      client: job.clientAddress,
      description: job.description,
      evaluator: job.evaluatorAddress,
      expectedStatus: 'COMPLETED',
      expiredAtUnix,
      jobId: job.protocolJobId,
      provider: job.providerAddress,
      transactionHash: completion.transactionHash,
      transfer: 'PAYOUT',
    });

    const database = persistence.databaseForApplication.withSchema(applicationSchema);
    const [settlement, obligation, entries, delivery, evidence, priorPayments] = await Promise.all([
      database
        .selectFrom('settlement_operations')
        .select(['amount_micro_usdc', 'provider', 'state', 'transaction_hash'])
        .where('settlement_id', '=', job.settlementId)
        .executeTakeFirstOrThrow(),
      database
        .selectFrom('obligations')
        .select(['provenance', 'state'])
        .where('obligation_id', '=', job.obligationId)
        .executeTakeFirstOrThrow(),
      database
        .selectFrom('economic_entries')
        .select(['amount_micro_usdc', 'category', 'direction'])
        .where('settlement_id', '=', job.settlementId)
        .orderBy('category')
        .execute(),
      database
        .selectFrom('service_executions')
        .select(['output_sha256', 'state'])
        .where('obligation_id', '=', job.obligationId)
        .executeTakeFirstOrThrow(),
      database
        .selectFrom('evidence_facts')
        .select(['fact_type', 'source_type', 'verification'])
        .where('subject_id', 'in', [job.jobId, job.settlementId])
        .execute(),
      Promise.all([
        x402.getPayment('pay_arc_snapshot_x402_v1'),
        x402.getPayment('pay_arc_snapshot_x402_8004_v1'),
      ]),
    ]);
    if (
      settlement.amount_micro_usdc !== job.budgetMicroUsdc.toString() ||
      settlement.provider !== 'ERC8183' ||
      settlement.state !== 'COMPLETE' ||
      settlement.transaction_hash?.toLowerCase() !== completion.transactionHash.toLowerCase() ||
      obligation.provenance !== 'COMMON_CONTROL_TEST' ||
      obligation.state !== 'SETTLED'
    ) {
      throw new Error('ERC-8183 terminal state is not reconciled to the exact obligation and settlement.');
    }
    if (
      entries.length !== 2 ||
      !entries.some(({ amount_micro_usdc, category, direction }) =>
        amount_micro_usdc === '50000' && category === 'REVENUE' && direction === 'INFLOW') ||
      !entries.some(({ amount_micro_usdc, category, direction }) =>
        amount_micro_usdc === '50000' && category === 'SERVICE_COST' && direction === 'OUTFLOW')
    ) {
      throw new Error('ERC-8183 payout did not create one exact Revenue/Service Cost pair.');
    }
    if (
      delivery.state !== 'COMPLETE' ||
      !/^[0-9a-f]{64}$/.test(delivery.output_sha256) ||
      !evidence.some(({ fact_type, source_type, verification }) =>
        fact_type === 'ERC8183_JOB_COMPLETED' &&
        source_type === 'ARC_ERC8183_CONTRACT' &&
        verification === 'CHAIN_VERIFIED') ||
      !evidence.some(({ fact_type, source_type, verification }) =>
        fact_type === 'ERC8183_USDC_PAYOUT_FINALIZED' &&
        source_type === 'ARC_TESTNET_TRANSACTION' &&
        verification === 'CHAIN_VERIFIED')
    ) {
      throw new Error('ERC-8183 delivery or source-scoped Evidence is incomplete.');
    }
    if (priorPayments.some(({ state }) => state !== 'COMPLETE')) {
      throw new Error('Accepted x402 regression payment is no longer complete.');
    }

    console.log(
      [
        'checkpoint_d=PASS',
        `erc8183_job=${job.jobId}`,
        `protocol_job=${job.protocolJobId}`,
        `amount_micro_usdc=${job.budgetMicroUsdc}`,
        `fund_tx=${funding.transactionHash}`,
        `complete_tx=${completion.transactionHash}`,
        `deliverable=${job.deliverableHash}`,
        `economic_entries=${entries.length}`,
        `x402_regression_payments=${priorPayments.length}`,
        'provenance=COMMON_CONTROL_TEST',
      ].join(' '),
    );
  } finally {
    await persistence.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Checkpoint D proof failed.');
  process.exitCode = 1;
});
