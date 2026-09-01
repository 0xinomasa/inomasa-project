import type { BusinessAgent } from '../src/modules/agent/model.ts';
import {
  buildErc8004RegistrationFile,
  encodeRegistrationDataUri,
  erc8004ReconciliationLeg,
} from '../src/modules/agent/erc8004.ts';
import { ArcErc8004Rpc, arcErc8004 } from '../src/platform/arc/erc8004.ts';
import { readCircleDeveloperWalletConfig } from '../src/platform/circle/config.ts';
import { CircleContractExecutionAdapter } from '../src/platform/circle/contract-execution.ts';
import { PostgresAgentRepository } from '../src/platform/persistence/agent-repository.ts';
import { PostgresAlphaBusinessRepository } from '../src/platform/persistence/alpha-business-repository.ts';
import { readDatabaseConnectionConfig } from '../src/platform/persistence/config.ts';
import { PostgresPersistence } from '../src/platform/persistence/database.ts';
import { PostgresErc8004Repository } from '../src/platform/persistence/erc8004-repository.ts';
import { checkpointGIdentity } from '../src/modules/reference-economy/fixtures.ts';

const buyerAgent: BusinessAgent = {
  agentPrincipalId: 'agt_ops_pilot_buyer_v1',
  businessId: 'biz_ops_pilot',
  capabilities: ['purchase-service'],
  displayName: 'Ops Pilot Buyer Agent',
  environment: 'PRIVATE_ARC_TESTNET',
  providerOfRecordPrincipalId: 'biz_ops_pilot',
  role: 'BUYER_AGENT',
  runtimeClass: 'OPERATOR_INVOKED',
  softwareVersion: 'deterministic-buyer@1',
  status: 'ACTIVE',
};
const observerAgent: BusinessAgent = {
  agentPrincipalId: 'agt_ops_pilot_observer_v1',
  businessId: 'biz_ops_pilot',
  capabilities: ['observe-economic-state'],
  displayName: 'Ops Pilot Observer Agent',
  environment: 'PRIVATE_ARC_TESTNET',
  providerOfRecordPrincipalId: 'biz_ops_pilot',
  role: 'ECONOMIC_OBSERVER',
  runtimeClass: 'OPERATOR_INVOKED',
  softwareVersion: 'deterministic-observer@1',
  status: 'ACTIVE',
};
const identityId = 'aid_ops_pilot_buyer_arc_8004_v1' as const;
const referenceEconomy = process.argv.includes('--reference-economy');
const identityProfile = referenceEconomy
  ? checkpointGIdentity
  : {
      agent: buyerAgent,
      identityId,
      metadataIdempotencyKey: '879f031d-6018-4241-94ef-b4152ca5c2ce',
      registrationIdempotencyKey: '4d239f0d-28d8-42a7-b7f6-5f69fc3918c3',
    };

function requireAddress(value: string | null): `0x${string}` {
  if (value === null || !/^0x[0-9a-fA-F]{40}$/.test(value)) {
    throw new Error('Ops Pilot requires an active Arc EOA execution account.');
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
    throw new Error('ERC-8004 registration is restricted to PRIVATE_ARC_TESTNET.');
  }

  const persistence = new PostgresPersistence(databaseConfig);
  try {
    const businesses = new PostgresAlphaBusinessRepository(persistence);
    const agents = new PostgresAgentRepository(persistence);
    const identities = new PostgresErc8004Repository(persistence);
    const execution = new CircleContractExecutionAdapter(circleConfig);
    const rpc = new ArcErc8004Rpc();
    const summaries = await businesses.listBusinesses();
    const ownerAddress = requireAddress(
      summaries.find(({ businessId }) => businessId === identityProfile.agent.businessId)?.address ?? null,
    );

    await agents.ensureAgent(identityProfile.agent);
    if (!referenceEconomy) await agents.ensureAgent(observerAgent);
    let operation = await identities.ensureIdentity({
      agentPrincipalId: identityProfile.agent.agentPrincipalId,
      identityId: identityProfile.identityId,
      ownerAddress,
      registry: arcErc8004,
    });

    if (operation.state === 'REGISTER_AUTHORIZED') {
      await identities.recordHandoffStarted({ identityId: identityProfile.identityId, leg: 'REGISTRATION' });
      const submission = await execution.submit({
        abiFunctionSignature: 'register()',
        abiParameters: [],
        contractAddress: arcErc8004.identityRegistryAddress,
        idempotencyKey: identityProfile.registrationIdempotencyKey,
        referenceId: identityProfile.identityId,
        sourceAddress: ownerAddress,
      });
      await identities.recordRegistrationSubmitted({
        identityId: identityProfile.identityId,
        providerTransactionId: submission.providerTransactionId,
      });
      operation = await identities.getIdentity(identityProfile.identityId);
      console.log(`erc8004_identity=${identityProfile.identityId} state=REGISTER_SUBMITTED`);
    }

    if (
      erc8004ReconciliationLeg({
        hasMetadataSubmission: operation.metadataProviderTransactionId !== null,
        state: operation.state,
      }) === 'REGISTRATION'
    ) {
      if (operation.registrationProviderTransactionId === null) {
        throw new Error('Registration provider transaction is missing; manual reconciliation required.');
      }
      const outcome = await execution.observe(operation.registrationProviderTransactionId);
      if (outcome.state === 'PENDING') {
        console.log(`erc8004_identity=${identityProfile.identityId} state=PENDING provider=${outcome.providerState}`);
        return;
      }
      if (outcome.state !== 'COMPLETE' || outcome.transactionHash === undefined) {
        await identities.recordOutcome({
          identityId: identityProfile.identityId,
          providerState: outcome.providerState,
          state: outcome.state === 'FAILED' ? 'FAILED' : 'OUTCOME_UNKNOWN',
        });
        throw new Error(`ERC-8004 registration outcome is ${outcome.state}.`);
      }
      const identity = await rpc.verifyRegistration({ ownerAddress, transactionHash: outcome.transactionHash });
      await identities.recordIdentityRegistered({
        identity,
        identityId: identityProfile.identityId,
        providerState: outcome.providerState,
        transactionHash: outcome.transactionHash,
      });
      operation = await identities.getIdentity(identityProfile.identityId);
      console.log(
        `erc8004_identity=${identityProfile.identityId} state=IDENTITY_REGISTERED agent_id=${identity.agentId} tx=${outcome.transactionHash}`,
      );
    }

    if (operation.state === 'IDENTITY_REGISTERED') {
      if (operation.agentId === null || operation.agentRegistry === null) {
        throw new Error('Registered ERC-8004 identity is incomplete.');
      }
      const registrationUri = encodeRegistrationDataUri(
        buildErc8004RegistrationFile({
          agent: identityProfile.agent,
          identity: {
            ...operation.registry,
            agentId: operation.agentId,
            agentRegistry: operation.agentRegistry as `eip155:${number}:0x${string}`,
          },
          image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+PHJlY3QgZmlsbD0iIzA4MGEwOSIgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0Ii8+PHBhdGggZmlsbD0iI2M4ZmY1MiIgZD0iTTE2IDEwaDh2NDRoLTh6TTI4IDEwaDh2NDRoLTh6TTQwIDEwaDh2NDRoLTh6Ii8+PC9zdmc+',
          serviceEndpoint: `inomasa://agent/${identityProfile.agent.agentPrincipalId}`,
          x402Support: true,
        }),
      );
      await identities.recordHandoffStarted({ identityId: identityProfile.identityId, leg: 'METADATA' });
      const submission = await execution.submit({
        abiFunctionSignature: 'setAgentURI(uint256,string)',
        abiParameters: [operation.agentId.toString(), registrationUri],
        contractAddress: arcErc8004.identityRegistryAddress,
        idempotencyKey: identityProfile.metadataIdempotencyKey,
        referenceId: `${identityProfile.identityId}:metadata`,
        sourceAddress: ownerAddress,
      });
      await identities.recordMetadataSubmitted({
        identityId: identityProfile.identityId,
        providerTransactionId: submission.providerTransactionId,
        registrationUri,
      });
      operation = await identities.getIdentity(identityProfile.identityId);
      console.log(`erc8004_identity=${identityProfile.identityId} state=METADATA_SUBMITTED`);
    }

    if (
      erc8004ReconciliationLeg({
        hasMetadataSubmission: operation.metadataProviderTransactionId !== null,
        state: operation.state,
      }) === 'METADATA'
    ) {
      if (
        operation.metadataProviderTransactionId === null ||
        operation.registrationUri === null ||
        operation.agentId === null
      ) {
        throw new Error('Metadata provider transaction is incomplete; manual reconciliation required.');
      }
      const outcome = await execution.observe(operation.metadataProviderTransactionId);
      if (outcome.state === 'PENDING') {
        console.log(`erc8004_identity=${identityProfile.identityId} state=PENDING provider=${outcome.providerState}`);
        return;
      }
      if (outcome.state !== 'COMPLETE' || outcome.transactionHash === undefined) {
        await identities.recordOutcome({
          identityId: identityProfile.identityId,
          providerState: outcome.providerState,
          state: outcome.state === 'FAILED' ? 'FAILED' : 'OUTCOME_UNKNOWN',
        });
        throw new Error(`ERC-8004 metadata outcome is ${outcome.state}.`);
      }
      await rpc.verifyMetadata({
        agentId: operation.agentId,
        expectedOwner: ownerAddress,
        expectedUri: operation.registrationUri,
        transactionHash: outcome.transactionHash,
      });
      await identities.recordVerified({
        identityId: identityProfile.identityId,
        providerState: outcome.providerState,
        transactionHash: outcome.transactionHash,
        verifiedAt: new Date().toISOString(),
      });
      operation = await identities.getIdentity(identityProfile.identityId);
    }

    if (operation.state !== 'VERIFIED') {
      throw new Error(`ERC-8004 identity is not verified from state ${operation.state}.`);
    }
    await identities.ensureVerifiedEvidence(identityProfile.identityId);
    console.log(
      `erc8004_identity=${identityProfile.identityId} state=VERIFIED registry=${operation.agentRegistry} agent_id=${operation.agentId} provenance=${operation.provenance}`,
    );
  } finally {
    await persistence.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Checkpoint C ERC-8004 execution failed.');
  process.exitCode = 1;
});
