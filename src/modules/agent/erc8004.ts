import type { BusinessAgent } from './model.ts';

export type EvmAddress = `0x${string}`;
export type TransactionHash = `0x${string}`;

export interface Erc8004RegistryReference {
  readonly chainId: number;
  readonly identityRegistryAddress: EvmAddress;
  readonly reputationRegistryAddress: EvmAddress;
}

export interface Erc8004IdentityReference extends Erc8004RegistryReference {
  readonly agentId: bigint;
  readonly agentRegistry: `eip155:${number}:${EvmAddress}`;
}

export interface Erc8004RegistrationFile {
  readonly active: boolean;
  readonly description: string;
  readonly image: string;
  readonly name: string;
  readonly registrations: readonly {
    readonly agentId: number;
    readonly agentRegistry: string;
  }[];
  readonly services: readonly {
    readonly endpoint: string;
    readonly name: string;
  }[];
  readonly supportedTrust: readonly ['reputation'];
  readonly type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1';
  readonly x402Support: boolean;
}

export interface ContractExecutionOutcome {
  readonly providerState: string;
  readonly state: 'COMPLETE' | 'FAILED' | 'OUTCOME_UNKNOWN' | 'PENDING';
  readonly transactionHash?: TransactionHash;
}

export interface ContractExecutionPort {
  observe(providerTransactionId: string): Promise<ContractExecutionOutcome>;
  submit(input: {
    readonly abiFunctionSignature: string;
    readonly abiParameters: readonly string[];
    readonly contractAddress: EvmAddress;
    readonly idempotencyKey: string;
    readonly referenceId: string;
    readonly sourceAddress: EvmAddress;
  }): Promise<{ readonly providerTransactionId: string }>;
}

export function erc8004ReconciliationLeg(input: {
  readonly hasMetadataSubmission: boolean;
  readonly state: string;
}): 'METADATA' | 'REGISTRATION' | null {
  if (input.state === 'REGISTER_SUBMITTED') return 'REGISTRATION';
  if (input.state === 'METADATA_SUBMITTED') return 'METADATA';
  if (input.state !== 'OUTCOME_UNKNOWN') return null;
  return input.hasMetadataSubmission ? 'METADATA' : 'REGISTRATION';
}

export function agentRegistry(reference: Erc8004RegistryReference): Erc8004IdentityReference['agentRegistry'] {
  return `eip155:${reference.chainId}:${reference.identityRegistryAddress}`;
}

export function buildErc8004RegistrationFile(input: {
  readonly agent: BusinessAgent;
  readonly identity: Erc8004IdentityReference;
  readonly image: string;
  readonly serviceEndpoint: string;
  readonly x402Support: boolean;
}): Erc8004RegistrationFile {
  if (!Number.isSafeInteger(Number(input.identity.agentId)) || input.identity.agentId < 0n) {
    throw new Error('ERC-8004 agent ID must fit the registration JSON numeric profile.');
  }
  return {
    active: input.agent.status === 'ACTIVE',
    description: `${input.agent.role} for ${input.agent.businessId}; capabilities: ${input.agent.capabilities.join(', ')}. Controlled Arc Testnet Alpha.`,
    image: input.image,
    name: input.agent.displayName,
    registrations: [
      {
        agentId: Number(input.identity.agentId),
        agentRegistry: input.identity.agentRegistry,
      },
    ],
    services: [{ endpoint: input.serviceEndpoint, name: 'web' }],
    supportedTrust: ['reputation'],
    type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
    x402Support: input.x402Support,
  };
}

export function encodeRegistrationDataUri(file: Erc8004RegistrationFile): string {
  return `data:application/json;base64,${Buffer.from(JSON.stringify(file)).toString('base64')}`;
}
