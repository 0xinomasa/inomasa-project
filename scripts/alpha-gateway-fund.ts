import { parseUsdcAmount } from '../src/modules/commerce/money.ts';
import { readCircleDeveloperWalletConfig } from '../src/platform/circle/config.ts';
import { arcGatewayTestnet, CircleGatewayX402Adapter } from '../src/platform/circle/gateway-x402.ts';
import { PostgresAlphaBusinessRepository } from '../src/platform/persistence/alpha-business-repository.ts';
import { readDatabaseConnectionConfig } from '../src/platform/persistence/config.ts';
import { PostgresPersistence } from '../src/platform/persistence/database.ts';
import { PostgresGatewayX402Repository } from '../src/platform/persistence/gateway-x402-repository.ts';

const fundingId = 'gwf_ops_pilot_v1' as const;
const fundingAmount = parseUsdcAmount('1.00');

function requireAddress(value: string | null): `0x${string}` {
  if (value === null || !/^0x[0-9a-fA-F]{40}$/.test(value)) {
    throw new Error('Ops Pilot requires an active Arc EOA Treasury.');
  }
  return value as `0x${string}`;
}

async function main(): Promise<void> {
  const databaseConfig = readDatabaseConnectionConfig('runtime');
  const circleConfig = readCircleDeveloperWalletConfig();
  if (
    databaseConfig.environment !== 'PRIVATE_ARC_TESTNET' ||
    circleConfig.environment !== 'PRIVATE_ARC_TESTNET'
  ) {
    throw new Error('Gateway funding is restricted to PRIVATE_ARC_TESTNET.');
  }

  const persistence = new PostgresPersistence(databaseConfig);
  const businesses = new PostgresAlphaBusinessRepository(persistence);
  const funding = new PostgresGatewayX402Repository(persistence);

  try {
    const buyer = (await businesses.listBusinesses()).find(
      (business) => business.businessId === 'biz_ops_pilot',
    );
    if (buyer === undefined) throw new Error('Ops Pilot Business is not initialized.');
    const depositorAddress = requireAddress(buyer.address);
    const gateway = new CircleGatewayX402Adapter(circleConfig, depositorAddress);
    let operation = await funding.ensureFunding({
      amountMicroUsdc: fundingAmount,
      approvalIdempotencyKey: 'b2f6845a-5f61-4d50-b7b9-23ed206a6a1e',
      businessId: 'biz_ops_pilot',
      depositIdempotencyKey: '8de11918-123d-4465-aeb3-4dbf82ea1f7d',
      depositorAddress,
      fundingId,
      gatewayContractAddress: arcGatewayTestnet.contractAddress,
    });

    if (operation.state === 'APPROVAL_AUTHORIZED') {
      const submission = await gateway.submitApproval({
        amountMicroUsdc: operation.amountMicroUsdc,
        idempotencyKey: operation.approvalIdempotencyKey,
        referenceId: `${fundingId}:approval`,
        sourceAddress: operation.depositorAddress,
      });
      await funding.recordFundingSubmitted({
        fundingId,
        leg: 'APPROVAL',
        providerTransactionId: submission.providerTransactionId,
      });
      console.log(`funding=${fundingId} leg=APPROVAL state=SUBMITTED`);
      return;
    }

    if (operation.state === 'APPROVAL_SUBMITTED') {
      if (operation.approvalProviderTransactionId === null) {
        throw new Error('Submitted Gateway approval has no Circle transaction ID.');
      }
      const outcome = await gateway.observeFundingTransaction(
        operation.approvalProviderTransactionId,
      );
      await funding.recordFundingOutcome({ fundingId, leg: 'APPROVAL', outcome });
      console.log(
        `funding=${fundingId} leg=APPROVAL state=${outcome.state} provider_state=${outcome.providerState}`,
      );
      return;
    }

    if (operation.state === 'APPROVAL_COMPLETE') {
      const submission = await gateway.submitDeposit({
        amountMicroUsdc: operation.amountMicroUsdc,
        idempotencyKey: operation.depositIdempotencyKey,
        referenceId: `${fundingId}:deposit`,
        sourceAddress: operation.depositorAddress,
      });
      await funding.recordFundingSubmitted({
        fundingId,
        leg: 'DEPOSIT',
        providerTransactionId: submission.providerTransactionId,
      });
      console.log(`funding=${fundingId} leg=DEPOSIT state=SUBMITTED`);
      return;
    }

    if (operation.state === 'DEPOSIT_SUBMITTED') {
      if (operation.depositProviderTransactionId === null) {
        throw new Error('Submitted Gateway deposit has no Circle transaction ID.');
      }
      const outcome = await gateway.observeFundingTransaction(operation.depositProviderTransactionId);
      await funding.recordFundingOutcome({ fundingId, leg: 'DEPOSIT', outcome });
      console.log(
        `funding=${fundingId} leg=DEPOSIT state=${outcome.state} provider_state=${outcome.providerState}`,
      );
      return;
    }

    if (operation.state === 'DEPOSIT_COMPLETE') {
      const balance = await gateway.getBalance(operation.depositorAddress);
      console.log(
        `funding=${fundingId} state=COMPLETE gateway_available_micro_usdc=${balance.availableMicroUsdc} gateway_pending_micro_usdc=${balance.pendingMicroUsdc}`,
      );
      return;
    }

    operation = await funding.getFunding(fundingId);
    throw new Error(`Gateway funding requires reconciliation from state ${operation.state}.`);
  } finally {
    await persistence.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Gateway funding failed.');
  process.exitCode = 1;
});
