import { ArcErc8004Rpc } from '../src/platform/arc/erc8004.ts';
import { readCircleDeveloperWalletConfig } from '../src/platform/circle/config.ts';
import { CircleGatewayX402Adapter } from '../src/platform/circle/gateway-x402.ts';
import { PostgresAgentRepository } from '../src/platform/persistence/agent-repository.ts';
import { PostgresAlphaBusinessRepository } from '../src/platform/persistence/alpha-business-repository.ts';
import { readDatabaseConnectionConfig } from '../src/platform/persistence/config.ts';
import { applicationSchema, PostgresPersistence } from '../src/platform/persistence/database.ts';
import {
  erc8004EvidenceId,
  PostgresErc8004Repository,
} from '../src/platform/persistence/erc8004-repository.ts';
import { PostgresGatewayX402Repository } from '../src/platform/persistence/gateway-x402-repository.ts';
import { PostgresAlphaServiceRepository } from '../src/platform/persistence/alpha-service-repository.ts';

const identityId = 'aid_ops_pilot_buyer_arc_8004_v1' as const;
const paymentId = 'pay_arc_snapshot_x402_8004_v1' as const;

function requireAddress(value: string | null, label: string): `0x${string}` {
  if (value === null || !/^0x[0-9a-fA-F]{40}$/.test(value)) {
    throw new Error(`${label} has no active Arc EOA execution account.`);
  }
  return value as `0x${string}`;
}

async function main(): Promise<void> {
  const databaseConfig = readDatabaseConnectionConfig('runtime');
  const circleConfig = readCircleDeveloperWalletConfig();
  if (databaseConfig.environment !== 'PRIVATE_ARC_TESTNET') {
    throw new Error('Checkpoint C proof is restricted to PRIVATE_ARC_TESTNET.');
  }
  const persistence = new PostgresPersistence(databaseConfig);
  try {
    const businesses = new PostgresAlphaBusinessRepository(persistence);
    const agents = new PostgresAgentRepository(persistence);
    const identities = new PostgresErc8004Repository(persistence);
    const payments = new PostgresGatewayX402Repository(persistence);
    const services = new PostgresAlphaServiceRepository(persistence);
    const identity = await identities.getIdentity(identityId);
    const payment = await payments.getPayment(paymentId);
    if (
      identity.state !== 'VERIFIED' ||
      identity.agentId === null ||
      identity.registrationUri === null ||
      identity.registrationTransactionHash === null ||
      identity.metadataTransactionHash === null
    ) {
      throw new Error('ERC-8004 identity does not have complete verified evidence.');
    }
    if (payment.state !== 'COMPLETE' || payment.providerTransactionId === null) {
      throw new Error('Identity-bound x402 payment is not complete.');
    }
    const delivery = (await services.listServiceDeliveries()).find(
      ({ obligationId }) => obligationId === 'obl_arc_snapshot_x402_8004_v1',
    );
    if (delivery?.state !== 'COMPLETE') {
      throw new Error('Identity-bound paid action has no complete service delivery.');
    }
    await identities.ensureVerifiedEvidence(identityId);

    const opsPilotAgents = await agents.listAgentsForBusiness('biz_ops_pilot');
    if (opsPilotAgents.length < 2) throw new Error('Generic Business must retain multiple Agents.');
    const action = await persistence.databaseForApplication
      .withSchema(applicationSchema)
      .selectFrom('action_intents as intent')
      .innerJoin('execution_authorizations as authorization', 'authorization.intent_id', 'intent.intent_id')
      .innerJoin('obligations as obligation', 'obligation.execution_authorization_id', 'authorization.authorization_id')
      .innerJoin('settlement_operations as settlement', 'settlement.obligation_id', 'obligation.obligation_id')
      .select([
        'intent.erc8004_identity_id as identityId',
        'intent.requester_principal_id as requesterPrincipalId',
        'obligation.provenance',
        'settlement.state as settlementState',
      ])
      .where('intent.intent_id', '=', 'int_arc_snapshot_x402_8004_v1')
      .executeTakeFirstOrThrow();
    const evidence = await persistence.databaseForApplication
      .withSchema(applicationSchema)
      .selectFrom('evidence_facts')
      .select(['fact_type', 'provenance', 'verification'])
      .where('evidence_id', '=', erc8004EvidenceId(identityId))
      .executeTakeFirstOrThrow();
    if (
      action.identityId !== identityId ||
      action.requesterPrincipalId !== identity.agentPrincipalId ||
      action.provenance !== 'COMMON_CONTROL_TEST' ||
      action.settlementState !== 'COMPLETE'
    ) {
      throw new Error('Economic action does not preserve the verified identity and provenance chain.');
    }
    if (
      evidence.fact_type !== 'ERC8004_AGENT_IDENTITY_VERIFIED' ||
      evidence.provenance !== 'COMMON_CONTROL_TEST' ||
      evidence.verification !== 'CHAIN_VERIFIED'
    ) {
      throw new Error('ERC-8004 Evidence classification is incomplete.');
    }

    const rpc = new ArcErc8004Rpc();
    await rpc.verifyRegistration({
      ownerAddress: identity.ownerAddress,
      transactionHash: identity.registrationTransactionHash,
    });
    await rpc.verifyMetadata({
      agentId: identity.agentId,
      expectedOwner: identity.ownerAddress,
      expectedUri: identity.registrationUri,
      transactionHash: identity.metadataTransactionHash,
    });

    const summaries = await businesses.listBusinesses();
    const payer = requireAddress(
      summaries.find(({ businessId }) => businessId === 'biz_ops_pilot')?.address ?? null,
      'Ops Pilot',
    );
    const seller = requireAddress(
      summaries.find(({ businessId }) => businessId === 'biz_signal_forge')?.address ?? null,
      'Signal Forge',
    );
    const gateway = new CircleGatewayX402Adapter(circleConfig, payer);
    const [payerBalance, sellerBalance] = await Promise.all([
      gateway.getBalance(payer),
      gateway.getBalance(seller),
    ]);

    console.log(
      [
        'checkpoint_c=PASS',
        `agents=${opsPilotAgents.length}`,
        `agent=${identity.agentPrincipalId}`,
        `erc8004_agent_id=${identity.agentId}`,
        `registry=${identity.agentRegistry}`,
        `registration_tx=${identity.registrationTransactionHash}`,
        `metadata_tx=${identity.metadataTransactionHash}`,
        `payment=${payment.paymentId}`,
        `amount_micro_usdc=${payment.amountMicroUsdc}`,
        `provider_receipt=${payment.providerTransactionId}`,
        `service_execution=${delivery.executionId}`,
        `service_output_sha256=${delivery.outputSha256}`,
        `gateway_payer_balance_micro_usdc=${payerBalance.availableMicroUsdc}`,
        `gateway_payer_pending_micro_usdc=${payerBalance.pendingMicroUsdc}`,
        `gateway_seller_balance_micro_usdc=${sellerBalance.availableMicroUsdc}`,
        `gateway_seller_pending_micro_usdc=${sellerBalance.pendingMicroUsdc}`,
        'provenance=COMMON_CONTROL_TEST',
        'inomasa_feedback=NONE_INGESTED',
      ].join(' '),
    );
  } finally {
    await persistence.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Checkpoint C proof failed.');
  process.exitCode = 1;
});
