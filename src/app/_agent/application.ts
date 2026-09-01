import {
  buildErc8004RegistrationFile,
  deriveProductErc8004Identity,
  encodeRegistrationDataUri,
} from '../../modules/agent/erc8004.ts';
import type { BusinessAgent } from '../../modules/agent/model.ts';
import { ArcErc8004Rpc, arcErc8004 } from '../../platform/arc/erc8004.ts';
import { readCircleDeveloperWalletConfig } from '../../platform/circle/config.ts';
import { CircleContractExecutionAdapter } from '../../platform/circle/contract-execution.ts';
import { PostgresAgentRepository } from '../../platform/persistence/agent-repository.ts';
import { readDatabaseConnectionConfig } from '../../platform/persistence/config.ts';
import { PostgresPersistence } from '../../platform/persistence/database.ts';
import {
  type Erc8004IdentityOperation,
  PostgresErc8004Repository,
} from '../../platform/persistence/erc8004-repository.ts';
import { PostgresOperationalWorkspaceRepository } from '../../platform/persistence/operational-workspace-repository.ts';

const identityImage = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+PHJlY3QgZmlsbD0iIzA4MGEwOSIgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0Ii8+PHBhdGggZmlsbD0iI2M4ZmY1MiIgZD0iTTE2IDEwaDh2NDRoLTh6TTI4IDEwaDh2NDRoLTh6TTQwIDEwaDh2NDRoLTh6Ii8+PC9zdmc+';

export type ProductAgentIdentityAction = 'ADVANCE_IDENTITY' | 'PREPARE_IDENTITY';

export interface ProductAgentIdentityResult {
  readonly identityId: string;
  readonly message: string;
  readonly state: string;
}

function address(value: string | null): `0x${string}` {
  if (value === null || !/^0x[0-9a-fA-F]{40}$/.test(value)) {
    throw new Error('A connected Business Treasury is required before onchain identity activation.');
  }
  return value as `0x${string}`;
}

function result(operation: Erc8004IdentityOperation, message: string): ProductAgentIdentityResult {
  return { identityId: operation.identityId, message, state: operation.state };
}

export async function executeProductAgentIdentityAction(input: {
  readonly action: ProductAgentIdentityAction;
  readonly agentPrincipalId: `agt_${string}`;
  readonly businessSlug: string;
  readonly controllerPrincipalId: `usr_${string}`;
}): Promise<ProductAgentIdentityResult> {
  const config = readDatabaseConnectionConfig('runtime');
  if (config.environment !== 'PRIVATE_ARC_TESTNET') {
    throw new Error('ERC-8004 product identity is restricted to PRIVATE_ARC_TESTNET.');
  }
  const persistence = new PostgresPersistence(config);
  try {
    const workspaces = new PostgresOperationalWorkspaceRepository(persistence);
    const business = await workspaces.getBusinessForController({
      controllerPrincipalId: input.controllerPrincipalId,
      slug: input.businessSlug,
    });
    if (business === undefined) throw new Error('Business control is required for Agent identity.');
    const [agent, treasury] = await Promise.all([
      new PostgresAgentRepository(persistence).getAgentDetail({
        agentPrincipalId: input.agentPrincipalId,
        businessId: business.businessId,
      }),
      workspaces.getTreasury({
        controllerPrincipalId: input.controllerPrincipalId,
        slug: input.businessSlug,
      }),
    ]);
    if (
      agent === undefined ||
      agent.status !== 'ACTIVE' ||
      agent.runtimeClass !== 'OPERATOR_INVOKED' ||
      !agent.capabilities.includes('purchase-service')
    ) {
      throw new Error('Only an active bounded purchase-service Agent can activate onchain identity here.');
    }
    if (treasury?.status !== 'ACTIVE') {
      throw new Error('Connect the Business Treasury before activating Agent onchain identity.');
    }
    const ownerAddress = address(treasury.address);
    const identity = deriveProductErc8004Identity({
      agentPrincipalId: input.agentPrincipalId,
      businessId: business.businessId,
      controllerPrincipalId: input.controllerPrincipalId,
    });
    const identities = new PostgresErc8004Repository(persistence);
    let operation = await identities.ensureIdentity({
      agentPrincipalId: input.agentPrincipalId,
      identityId: identity.identityId,
      ownerAddress,
      registry: arcErc8004,
    });
    if (input.action === 'PREPARE_IDENTITY') {
      return result(operation, operation.state === 'REGISTER_AUTHORIZED'
        ? 'Onchain identity intent prepared. No provider or Arc transaction was submitted.'
        : 'The existing onchain identity intent was recovered; no duplicate was created.');
    }
    if (operation.state === 'VERIFIED') {
      await identities.ensureVerifiedEvidence(operation.identityId);
      return result(operation, 'Onchain identity is active and chain-verified.');
    }
    if (operation.state === 'FAILED') return result(operation, 'Onchain identity activation failed terminally. No retry was submitted.');

    const execution = new CircleContractExecutionAdapter(readCircleDeveloperWalletConfig());
    const rpc = new ArcErc8004Rpc();
    const ambiguousLeg = operation.providerState === 'METADATA_HANDOFF_STARTED' ||
      operation.metadataProviderTransactionId !== null
      ? 'METADATA'
      : 'REGISTRATION';
    if (operation.state === 'REGISTER_SUBMITTED' || operation.state === 'METADATA_SUBMITTED' || operation.state === 'OUTCOME_UNKNOWN') {
      const leg = operation.state === 'REGISTER_SUBMITTED'
        ? 'REGISTRATION'
        : operation.state === 'METADATA_SUBMITTED'
          ? 'METADATA'
          : ambiguousLeg;
      const providerTransactionId = leg === 'REGISTRATION'
        ? operation.registrationProviderTransactionId
        : operation.metadataProviderTransactionId;
      if (providerTransactionId === null) {
        return result(operation, `${leg === 'REGISTRATION' ? 'Registration' : 'Metadata'} handoff is outcome unknown without a provider transaction reference. No replacement submission occurred; owner review is required.`);
      }
      const outcome = await execution.observe(providerTransactionId);
      if (outcome.state === 'PENDING') return result(operation, 'Existing onchain identity transaction remains pending. No replacement was submitted.');
      if (outcome.state !== 'COMPLETE' || outcome.transactionHash === undefined) {
        await identities.recordOutcome({
          identityId: operation.identityId,
          providerState: outcome.providerState,
          state: outcome.state === 'FAILED' ? 'FAILED' : 'OUTCOME_UNKNOWN',
        });
        operation = await identities.getIdentity(operation.identityId);
        return result(operation, `Onchain identity ${leg.toLowerCase()} outcome is ${outcome.state.toLowerCase()}. No replacement was submitted.`);
      }
      if (leg === 'REGISTRATION') {
        const verified = await rpc.verifyRegistration({ ownerAddress, transactionHash: outcome.transactionHash });
        await identities.recordIdentityRegistered({
          identity: verified,
          identityId: operation.identityId,
          providerState: outcome.providerState,
          transactionHash: outcome.transactionHash,
        });
        operation = await identities.getIdentity(operation.identityId);
        return result(operation, 'Onchain identity registration is verified. Continue once to publish its bounded Agent metadata.');
      }
      if (operation.agentId === null || operation.registrationUri === null) {
        throw new Error('ERC-8004 metadata reconciliation lacks its persisted identity commitment.');
      }
      await rpc.verifyMetadata({
        agentId: operation.agentId,
        expectedOwner: ownerAddress,
        expectedUri: operation.registrationUri,
        transactionHash: outcome.transactionHash,
      });
      await identities.recordVerified({
        identityId: operation.identityId,
        providerState: outcome.providerState,
        transactionHash: outcome.transactionHash,
        verifiedAt: new Date().toISOString(),
      });
      await identities.ensureVerifiedEvidence(operation.identityId);
      operation = await identities.getIdentity(operation.identityId);
      return result(operation, 'Onchain identity is active and chain-verified for bounded economic use.');
    }

    if (operation.state === 'REGISTER_AUTHORIZED') {
      await identities.recordHandoffStarted({ identityId: operation.identityId, leg: 'REGISTRATION' });
      try {
        const submission = await execution.submit({
          abiFunctionSignature: 'register()',
          abiParameters: [],
          contractAddress: arcErc8004.identityRegistryAddress,
          idempotencyKey: identity.registrationIdempotencyKey,
          referenceId: operation.identityId,
          sourceAddress: ownerAddress,
        });
        await identities.recordRegistrationSubmitted({
          identityId: operation.identityId,
          providerTransactionId: submission.providerTransactionId,
        });
      } catch {
        operation = await identities.getIdentity(operation.identityId);
        return result(operation, 'Onchain identity registration handoff is outcome unknown. Its intent is durable and no replacement submission will occur.');
      }
      operation = await identities.getIdentity(operation.identityId);
      return result(operation, 'Onchain identity registration submitted. Continue to reconcile the existing provider transaction.');
    }

    if (operation.state !== 'IDENTITY_REGISTERED' || operation.agentId === null || operation.agentRegistry === null) {
      throw new Error(`ERC-8004 identity cannot advance from ${operation.state}.`);
    }
    const businessAgent: BusinessAgent = {
      agentPrincipalId: input.agentPrincipalId,
      businessId: business.businessId,
      capabilities: agent.capabilities,
      displayName: agent.displayName,
      environment: business.environment,
      providerOfRecordPrincipalId: agent.providerOfRecordPrincipalId as `biz_${string}`,
      role: agent.role,
      runtimeClass: 'OPERATOR_INVOKED',
      softwareVersion: agent.softwareVersion,
      status: 'ACTIVE',
    };
    const registrationUri = encodeRegistrationDataUri(buildErc8004RegistrationFile({
      agent: businessAgent,
      identity: {
        ...operation.registry,
        agentId: operation.agentId,
        agentRegistry: operation.agentRegistry as `eip155:${number}:0x${string}`,
      },
      image: identityImage,
      serviceEndpoint: `inomasa://agent/${input.agentPrincipalId}`,
      x402Support: true,
    }));
    await identities.recordHandoffStarted({ identityId: operation.identityId, leg: 'METADATA' });
    try {
      const submission = await execution.submit({
        abiFunctionSignature: 'setAgentURI(uint256,string)',
        abiParameters: [operation.agentId.toString(), registrationUri],
        contractAddress: arcErc8004.identityRegistryAddress,
        idempotencyKey: identity.metadataIdempotencyKey,
        referenceId: `${operation.identityId}:metadata`,
        sourceAddress: ownerAddress,
      });
      await identities.recordMetadataSubmitted({
        identityId: operation.identityId,
        providerTransactionId: submission.providerTransactionId,
        registrationUri,
      });
    } catch {
      operation = await identities.getIdentity(operation.identityId);
      return result(operation, 'Onchain identity metadata handoff is outcome unknown. Its intent is durable and no replacement submission will occur.');
    }
    operation = await identities.getIdentity(operation.identityId);
    return result(operation, 'Bounded Agent metadata submitted. Continue to reconcile the existing provider transaction.');
  } finally {
    await persistence.close();
  }
}
