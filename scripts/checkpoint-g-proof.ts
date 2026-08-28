import assert from 'node:assert/strict';

import { summarizeEconomicHistory } from '../src/modules/economic-history/model.ts';
import { parseUsdcAmount } from '../src/modules/commerce/money.ts';
import { checkpointGAgents, checkpointGBusinesses } from '../src/modules/reference-economy/fixtures.ts';
import { ArcErc8004Rpc } from '../src/platform/arc/erc8004.ts';
import { ArcErc8183Rpc } from '../src/platform/arc/erc8183.ts';
import { ArcTestnetRpc } from '../src/platform/arc/rpc.ts';
import { readDatabaseConnectionConfig } from '../src/platform/persistence/config.ts';
import { PostgresAlphaCommerceRepository } from '../src/platform/persistence/alpha-commerce-repository.ts';
import { PostgresCapitalRepository } from '../src/platform/persistence/capital-repository.ts';
import { applicationSchema, PostgresPersistence } from '../src/platform/persistence/database.ts';
import { PostgresEconomicHistoryRepository } from '../src/platform/persistence/economic-history-repository.ts';
import { PostgresErc8004Repository } from '../src/platform/persistence/erc8004-repository.ts';
import { PostgresErc8183Repository } from '../src/platform/persistence/erc8183-repository.ts';
import { PostgresGatewayX402Repository } from '../src/platform/persistence/gateway-x402-repository.ts';

async function main(): Promise<void> {
  const config = readDatabaseConnectionConfig('runtime');
  if (config.environment !== 'PRIVATE_ARC_TESTNET') {
    throw new Error('Checkpoint G proof is restricted to PRIVATE_ARC_TESTNET.');
  }
  const persistence = new PostgresPersistence(config);
  try {
    const database = persistence.databaseForApplication.withSchema(applicationSchema);
    const history = new PostgresEconomicHistoryRepository(persistence);
    const capital = new PostgresCapitalRepository(persistence);
    const commerce = new PostgresAlphaCommerceRepository(persistence);
    const identities = new PostgresErc8004Repository(persistence);
    const jobs = new PostgresErc8183Repository(persistence);
    const payments = new PostgresGatewayX402Repository(persistence);
    const [businessRows, agentRows, controllerRows] = await Promise.all([
      database
        .selectFrom('businesses')
        .select(['business_id', 'actor_classification', 'template_id'])
        .where('business_id', 'in', checkpointGBusinesses.map(({ businessId }) => businessId))
        .execute(),
      database
        .selectFrom('agent_registrations')
        .select(['agent_principal_id', 'business_id'])
        .where('agent_principal_id', 'in', checkpointGAgents.map(({ agentPrincipalId }) => agentPrincipalId))
        .execute(),
      database
        .selectFrom('business_controls')
        .select(['business_id', 'controller_principal_id'])
        .where('business_id', 'in', checkpointGBusinesses.map(({ businessId }) => businessId))
        .where('status', '=', 'ACTIVE')
        .execute(),
    ]);
    assert.equal(businessRows.length, 4);
    assert.equal(agentRows.length, 4);
    assert.equal(controllerRows.length, 4);
    assert.equal(new Set(controllerRows.map(({ controller_principal_id }) => controller_principal_id)).size, 4);
    assert.equal(new Set(businessRows.map(({ template_id }) => template_id)).size, 4);
    assert.ok(businessRows.every(({ actor_classification }) => actor_classification === 'COMMON_CONTROL_TEST'));

    const [setupSource, setupTreasuries, setupCapitalAccount] = await Promise.all([
      database
        .selectFrom('capital_provider_accounts')
        .select('address')
        .where('provider_account_id', '=', 'cpa_northstar_v1')
        .where('status', '=', 'ACTIVE')
        .executeTakeFirstOrThrow(),
      database
        .selectFrom('treasury_bindings')
        .select(['address', 'business_id'])
        .where('business_id', 'in', ['biz_reference_workbench', 'biz_reference_signal'])
        .where('status', '=', 'ACTIVE')
        .execute(),
      database
        .selectFrom('capital_provider_accounts')
        .select('address')
        .where('provider_account_id', '=', 'cpa_reference_seed_v1')
        .where('status', '=', 'ACTIVE')
        .executeTakeFirstOrThrow(),
    ]);
    assert.match(setupSource.address ?? '', /^0x[0-9a-f]{40}$/);
    assert.match(setupCapitalAccount.address ?? '', /^0x[0-9a-f]{40}$/);
    const workbenchAddress = setupTreasuries.find(
      ({ business_id }) => business_id === 'biz_reference_workbench',
    )?.address;
    const signalAddress = setupTreasuries.find(
      ({ business_id }) => business_id === 'biz_reference_signal',
    )?.address;
    assert.match(workbenchAddress ?? '', /^0x[0-9a-f]{40}$/);
    assert.match(signalAddress ?? '', /^0x[0-9a-f]{40}$/);
    const arcRpc = new ArcTestnetRpc();
    await Promise.all([
      arcRpc.verifyUsdcTransfer({
        amountMicroUsdc: parseUsdcAmount('0.60'),
        destinationAddress: workbenchAddress as `0x${string}`,
        sourceAddress: setupSource.address as `0x${string}`,
        transactionHash: '0x7301fb1853f6aaa3308206f2e3a9ddce3caa427e9c647e1e253e6fa7662416e7',
      }),
      arcRpc.verifyUsdcTransfer({
        amountMicroUsdc: parseUsdcAmount('0.10'),
        destinationAddress: signalAddress as `0x${string}`,
        sourceAddress: setupSource.address as `0x${string}`,
        transactionHash: '0x04fa322a74e0fe2f5a2dd7f6c12101f720f222f1e6e63b18d52b64cca839cf0f',
      }),
      arcRpc.verifyUsdcTransfer({
        amountMicroUsdc: parseUsdcAmount('0.50'),
        destinationAddress: setupCapitalAccount.address as `0x${string}`,
        sourceAddress: setupSource.address as `0x${string}`,
        transactionHash: '0x82c497171c0741db2ef1dc8f394b9855b65e25f16cb906630a4173b264fe49ff',
      }),
    ]);

    const identity = await identities.getIdentity('aid_reference_workbench_buyer_arc_8004_v1');
    assert.equal(identity.state, 'VERIFIED');
    assert.equal(identity.agentPrincipalId, 'agt_reference_workbench_buyer_v1');
    assert.ok(identity.agentId !== null);
    assert.ok(identity.registrationTransactionHash !== null);
    assert.ok(identity.metadataTransactionHash !== null);
    const identityRpc = new ArcErc8004Rpc();
    const registered = await identityRpc.verifyRegistration({
      ownerAddress: identity.ownerAddress,
      transactionHash: identity.registrationTransactionHash!,
    });
    assert.equal(registered.agentId, identity.agentId);
    await identityRpc.verifyMetadata({
      agentId: identity.agentId!,
      expectedOwner: identity.ownerAddress,
      expectedUri: identity.registrationUri!,
      transactionHash: identity.metadataTransactionHash!,
    });

    const payment = await payments.getPayment('pay_reference_arc_snapshot_x402_v1');
    assert.equal(payment.state, 'COMPLETE');
    assert.equal(payment.amountMicroUsdc, 10000n);
    assert.ok(payment.providerTransactionId !== null);
    const intent = await database
      .selectFrom('action_intents')
      .select(['erc8004_identity_id', 'requester_principal_id'])
      .where('intent_id', '=', 'int_reference_arc_snapshot_x402_v1')
      .executeTakeFirstOrThrow();
    assert.deepEqual(intent, {
      erc8004_identity_id: 'aid_reference_workbench_buyer_arc_8004_v1',
      requester_principal_id: 'agt_reference_workbench_buyer_v1',
    });

    const job = await jobs.getJob('job_reference_economy_8183_v1');
    const operations = await jobs.listOperations(job.jobId);
    assert.equal(job.protocolStatus, 'COMPLETED');
    assert.equal(job.budgetMicroUsdc, 50000n);
    assert.equal(operations.length, 6);
    assert.ok(operations.every(({ state }) => state === 'COMPLETE'));
    assert.equal(new Set(operations.map(({ transactionHash }) => transactionHash)).size, 6);
    assert.ok(job.protocolJobId !== null);
    const funding = operations.find(({ leg }) => leg === 'FUND');
    const completion = operations.find(({ leg }) => leg === 'COMPLETE');
    assert.ok(funding?.transactionHash !== null && funding !== undefined);
    assert.ok(completion?.transactionHash !== null && completion !== undefined);
    const jobRpc = new ArcErc8183Rpc();
    const expiredAtUnix = BigInt(Math.floor(Date.parse(job.expiredAt) / 1_000));
    await jobRpc.verifyJobState({
      budgetMicroUsdc: job.budgetMicroUsdc,
      client: job.clientAddress,
      description: job.description,
      evaluator: job.evaluatorAddress,
      expectedStatus: 'FUNDED',
      expiredAtUnix,
      jobId: job.protocolJobId!,
      provider: job.providerAddress,
      transactionHash: funding.transactionHash!,
      transfer: 'TO_ESCROW',
    });
    await jobRpc.verifyJobState({
      budgetMicroUsdc: job.budgetMicroUsdc,
      client: job.clientAddress,
      description: job.description,
      evaluator: job.evaluatorAddress,
      expectedStatus: 'COMPLETED',
      expiredAtUnix,
      jobId: job.protocolJobId!,
      provider: job.providerAddress,
      transactionHash: completion.transactionHash!,
      transfer: 'PAYOUT',
    });
    const onchainJob = await jobRpc.readJob(job.protocolJobId!);
    assert.equal(onchainJob.statusName, 'COMPLETED');

    const paths = (await capital.listCapitalPaths()).filter(({ providerId }) =>
      providerId.startsWith('cap_reference_'),
    );
    assert.equal(paths.length, 2);
    assert.equal(new Set(paths.map(({ materialSha256 }) => materialSha256)).size, 1);
    const approved = paths.find(({ outcome }) => outcome === 'APPROVED');
    const declined = paths.find(({ outcome }) => outcome === 'DECLINED');
    assert.ok(approved !== undefined && declined !== undefined);
    assert.equal(approved.providerId, 'cap_reference_seed_v1');
    assert.equal(declined.providerId, 'cap_reference_independent_v1');
    assert.equal(approved.allocationState, 'COMPLETE');
    assert.equal(approved.approvedMicroUsdc, '200000');
    assert.equal(approved.uses.length, 1);
    assert.equal(approved.uses[0]?.obligationId, 'obl_reference_capital_use_v1');
    assert.equal(approved.uses[0]?.settlementState, 'COMPLETE');
    assert.equal(declined.allocationId, null);
    const allocation = await capital.getAllocationExecutionContext('cal_reference_workbench_seed_v1');
    assert.ok(approved.allocationTransactionHash !== null);
    await arcRpc.verifyUsdcTransfer({
      amountMicroUsdc: allocation.amountMicroUsdc,
      destinationAddress: allocation.destinationAddress,
      sourceAddress: allocation.sourceAddress,
      transactionHash: approved.allocationTransactionHash as `0x${string}`,
    });
    const laterUse = await commerce.getSettlementExecutionContext('set_reference_capital_use_v1');
    const laterUseSettlement = await database
      .selectFrom('settlement_operations')
      .select('transaction_hash')
      .where('settlement_id', '=', laterUse.settlementId)
      .executeTakeFirstOrThrow();
    assert.equal(laterUse.state, 'COMPLETE');
    assert.match(laterUseSettlement.transaction_hash ?? '', /^0x[0-9a-f]{64}$/);
    await arcRpc.verifyUsdcTransfer({
      amountMicroUsdc: laterUse.amountMicroUsdc,
      destinationAddress: laterUse.destinationAddress,
      sourceAddress: laterUse.sourceAddress,
      transactionHash: laterUseSettlement.transaction_hash as `0x${string}`,
    });

    const activities = await history.listEconomicActivities({ businessId: 'biz_reference_workbench' });
    const summary = summarizeEconomicHistory(activities);
    assert.equal(summary.activityCount, 4);
    assert.equal(summary.commerceActivityCount, 3);
    assert.equal(summary.capitalActivityCount, 1);
    assert.equal(summary.completedVolumeMicroUsdc, '160000');
    assert.equal(summary.completedCapitalVolumeMicroUsdc, '200000');
    assert.equal(summary.statusCounts.COMPLETE, 4);
    assert.equal(summary.protocolCounts.X402, 1);
    assert.equal(summary.protocolCounts.ERC_8004, 1);
    assert.equal(summary.protocolCounts.ERC_8183, 1);
    assert.equal(summary.protocolCounts.ARC_USDC, 4);
    const referenceEntries = await database
      .selectFrom('economic_entries')
      .select(['amount_micro_usdc', 'business_id', 'category', 'direction'])
      .where('business_id', 'in', ['biz_reference_workbench', 'biz_reference_signal'])
      .execute();
    assert.equal(referenceEntries.length, 7);
    assert.equal(
      referenceEntries.filter(
        ({ business_id, category, direction }) =>
          business_id === 'biz_reference_workbench' &&
          category === 'SERVICE_COST' &&
          direction === 'OUTFLOW',
      ).length,
      3,
    );
    assert.equal(
      referenceEntries.filter(
        ({ business_id, category, direction }) =>
          business_id === 'biz_reference_workbench' &&
          category === 'CAPITAL' &&
          direction === 'INFLOW',
      ).length,
      1,
    );
    assert.equal(
      referenceEntries.filter(
        ({ business_id, category, direction }) =>
          business_id === 'biz_reference_signal' &&
          category === 'REVENUE' &&
          direction === 'INFLOW',
      ).length,
      3,
    );
    assert.ok(referenceEntries.every(({ amount_micro_usdc }) => amount_micro_usdc !== '600000'));
    console.log(
      `checkpoint_g=PASS businesses=4 users=4 agents=4 providers=2 identity_agent_id=${identity.agentId} x402_micro_usdc=10000 erc8183_job=${job.protocolJobId} erc8183_micro_usdc=50000 allocation_micro_usdc=200000 later_use_micro_usdc=100000 activities=${summary.activityCount} commerce_volume_micro_usdc=${summary.completedVolumeMicroUsdc} capital_volume_micro_usdc=${summary.completedCapitalVolumeMicroUsdc} provenance=COMMON_CONTROL_TEST`,
    );
  } finally {
    await persistence.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Checkpoint G proof failed.');
  process.exitCode = 1;
});
