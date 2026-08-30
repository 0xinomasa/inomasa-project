import { strict as assert } from 'node:assert';

import { loadProductEconomicRequests } from '../src/app/_commerce/application.ts';
import { ArcErc8183Rpc } from '../src/platform/arc/erc8183.ts';
import { readDatabaseConnectionConfig } from '../src/platform/persistence/config.ts';
import { applicationSchema, PostgresPersistence } from '../src/platform/persistence/database.ts';
import { PostgresErc8183Repository } from '../src/platform/persistence/erc8183-repository.ts';

const expectedLegs = ['CREATE', 'SET_BUDGET', 'APPROVE', 'FUND', 'SUBMIT', 'COMPLETE'] as const;

async function main(): Promise<void> {
  const businessSlug = process.argv[2]?.trim();
  if (!businessSlug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(businessSlug)) {
    throw new Error('Usage: npm run product:work3:proof -- <business-slug>');
  }
  const config = readDatabaseConnectionConfig('runtime');
  if (config.environment !== 'PRIVATE_ARC_TESTNET') {
    throw new Error('Work 3 product proof is restricted to PRIVATE_ARC_TESTNET.');
  }
  const persistence = new PostgresPersistence(config);
  try {
    const database = persistence.databaseForApplication.withSchema(applicationSchema);
    const business = await database
      .selectFrom('businesses as business')
      .innerJoin('business_controls as control', (join) =>
        join
          .onRef('control.business_id', '=', 'business.business_id')
          .on('control.status', '=', 'ACTIVE'),
      )
      .select([
        'business.business_id as businessId',
        'control.controller_principal_id as controllerPrincipalId',
      ])
      .where('business.slug', '=', businessSlug)
      .where('business.status', '=', 'ACTIVE')
      .executeTakeFirstOrThrow();
    assert.match(business.controllerPrincipalId, /^usr_/);

    const requests = await loadProductEconomicRequests({
      businessSlug,
      controllerPrincipalId: business.controllerPrincipalId as `usr_${string}`,
    });
    assert.ok(requests !== undefined, 'Controller-scoped application read must resolve the Business.');
    const completedX402 = requests.find((request) =>
      request.kind === 'X402_PURCHASE' &&
      request.amountMicroUsdc === '10000' &&
      request.paymentState === 'COMPLETE' &&
      request.settlementState === 'COMPLETE' &&
      request.deliveryState === 'COMPLETE' &&
      request.gatewayFundingState === 'DEPOSIT_COMPLETE',
    );
    const failedX402 = requests.find((request) =>
      request.kind === 'X402_PURCHASE' &&
      request.amountMicroUsdc === '10000' &&
      request.paymentState === 'REQUIRED' &&
      request.settlementState === 'AUTHORIZED' &&
      request.deliveryState === null &&
      request.gatewayFundingState === 'FAILED',
    );
    const completedJob = requests.find((request) =>
      request.kind === 'ERC8183_JOB' &&
      request.amountMicroUsdc === '50000' &&
      request.jobStatus === 'COMPLETED' &&
      request.settlementState === 'COMPLETE' &&
      request.deliveryState === 'COMPLETE',
    );
    assert.ok(completedX402, 'One exact completed product x402 request is required.');
    assert.ok(failedX402, 'One honest failed rail-preparation request is required.');
    assert.ok(completedJob, 'One exact completed product ERC-8183 request is required.');
    assert.ok(completedX402.paymentProviderReference, 'Completed x402 requires a provider receipt.');
    assert.equal(completedX402.settlementTransactionHash, null, 'x402 receipt must not impersonate an Arc tx hash.');
    assert.ok(completedJob.settlementTransactionHash, 'Completed ERC-8183 requires its Arc payout hash.');
    assert.ok(completedJob.jobId, 'Completed ERC-8183 requires a persisted job.');

    const completedObligationIds = [completedX402.obligationId, completedJob.obligationId];
    const economicEntries = await database
      .selectFrom('economic_entries')
      .select(['amount_micro_usdc as amountMicroUsdc', 'category', 'direction', 'obligation_id as obligationId'])
      .where('obligation_id', 'in', completedObligationIds)
      .execute();
    assert.equal(economicEntries.length, 4, 'Each completed obligation must post one buyer and one seller entry.');
    for (const obligationId of completedObligationIds) {
      const entries = economicEntries.filter((entry) => entry.obligationId === obligationId);
      assert.deepEqual(
        entries.map(({ category, direction }) => `${category}:${direction}`).sort(),
        ['REVENUE:INFLOW', 'SERVICE_COST:OUTFLOW'],
      );
    }
    assert.equal(
      await database
        .selectFrom('economic_entries')
        .select('entry_id')
        .where('obligation_id', '=', failedX402.obligationId)
        .executeTakeFirst(),
      undefined,
      'Failed rail preparation must post no economic entry.',
    );

    const x402Evidence = await database
      .selectFrom('evidence_facts')
      .select(['source_reference as sourceReference', 'source_type as sourceType', 'verification'])
      .where('subject_id', '=', completedX402.settlementId)
      .where('fact_type', '=', 'GATEWAY_X402_USDC_PAYMENT_SETTLED')
      .executeTakeFirstOrThrow();
    assert.equal(x402Evidence.sourceType, 'CIRCLE_GATEWAY_X402');
    assert.equal(x402Evidence.verification, 'PROVIDER_REPORTED');
    assert.equal(x402Evidence.sourceReference, completedX402.paymentProviderReference);

    const ercEvidence = await database
      .selectFrom('evidence_facts')
      .select(['source_reference as sourceReference', 'source_type as sourceType', 'verification'])
      .where('subject_id', '=', completedJob.settlementId)
      .where('fact_type', '=', 'ERC8183_USDC_PAYOUT_FINALIZED')
      .executeTakeFirstOrThrow();
    assert.equal(ercEvidence.sourceType, 'ARC_TESTNET_TRANSACTION');
    assert.equal(ercEvidence.verification, 'CHAIN_VERIFIED');
    assert.equal(ercEvidence.sourceReference, completedJob.settlementTransactionHash);

    const jobs = new PostgresErc8183Repository(persistence);
    const job = await jobs.getJob(completedJob.jobId as `job_${string}`);
    const operations = await jobs.listOperations(job.jobId);
    assert.deepEqual(operations.map(({ leg }) => leg), expectedLegs);
    assert.ok(operations.every(({ state, transactionHash }) => state === 'COMPLETE' && transactionHash !== null));
    assert.ok(job.protocolJobId !== null);
    const operation = (leg: typeof expectedLegs[number]) => {
      const match = operations.find((candidate) => candidate.leg === leg);
      assert.ok(match?.transactionHash, `ERC-8183 ${leg} requires a transaction hash.`);
      return match;
    };
    const rpc = new ArcErc8183Rpc();
    const expiredAtUnix = BigInt(Math.floor(Date.parse(job.expiredAt) / 1_000));
    const common = {
      budgetMicroUsdc: job.budgetMicroUsdc,
      client: job.clientAddress,
      description: job.description,
      evaluator: job.evaluatorAddress,
      expiredAtUnix,
      jobId: job.protocolJobId,
      provider: job.providerAddress,
    } as const;
    const created = await rpc.verifyCreate({
      client: job.clientAddress,
      description: job.description,
      evaluator: job.evaluatorAddress,
      expiredAtUnix,
      provider: job.providerAddress,
      transactionHash: operation('CREATE').transactionHash!,
    });
    assert.equal(created.jobId, job.protocolJobId);
    await rpc.verifyJobState({ ...common, expectedStatus: 'OPEN', transactionHash: operation('SET_BUDGET').transactionHash! });
    await rpc.verifyApproval({
      amountMicroUsdc: job.budgetMicroUsdc,
      owner: job.clientAddress,
      transactionHash: operation('APPROVE').transactionHash!,
    });
    await rpc.verifyJobState({ ...common, expectedStatus: 'FUNDED', transactionHash: operation('FUND').transactionHash!, transfer: 'TO_ESCROW' });
    await rpc.verifyJobState({ ...common, expectedStatus: 'SUBMITTED', transactionHash: operation('SUBMIT').transactionHash! });
    await rpc.verifyJobState({ ...common, expectedStatus: 'COMPLETED', transactionHash: operation('COMPLETE').transactionHash!, transfer: 'PAYOUT' });

    console.log(
      `work_3_product_proof=PASS business=${businessSlug} x402_request=${completedX402.requestId} x402_provider_receipt=${completedX402.paymentProviderReference} failed_request=${failedX402.requestId} erc8183_request=${completedJob.requestId} erc8183_job=${job.protocolJobId} erc8183_payout_tx=${completedJob.settlementTransactionHash} product_activities=${requests.length} provenance=COMMON_CONTROL_TEST`,
    );
  } finally {
    await persistence.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Work 3 product proof failed.');
  process.exitCode = 1;
});
