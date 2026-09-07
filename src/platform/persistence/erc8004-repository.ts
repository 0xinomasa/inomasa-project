import type {
  Erc8004IdentityReference,
  Erc8004RegistryReference,
  EvmAddress,
  TransactionHash,
} from '../../modules/agent/erc8004.ts';
import { agentRegistry } from '../../modules/agent/erc8004.ts';
import type { ActorClassification } from '../../modules/business/model.ts';
import type { PostgresPersistence } from './database.ts';
import { applicationSchema } from './database.ts';

export type Erc8004IdentityState =
  | 'REGISTER_AUTHORIZED'
  | 'REGISTER_SUBMITTED'
  | 'IDENTITY_REGISTERED'
  | 'METADATA_SUBMITTED'
  | 'VERIFIED'
  | 'OUTCOME_UNKNOWN'
  | 'FAILED';

export interface Erc8004IdentityOperation {
  readonly agentId: bigint | null;
  readonly agentPrincipalId: `agt_${string}`;
  readonly agentRegistry: string | null;
  readonly identityId: `aid_${string}`;
  readonly metadataProviderTransactionId: string | null;
  readonly metadataTransactionHash: TransactionHash | null;
  readonly ownerAddress: EvmAddress;
  readonly providerState: string | null;
  readonly provenance: ActorClassification;
  readonly registrationProviderTransactionId: string | null;
  readonly registrationTransactionHash: TransactionHash | null;
  readonly registrationUri: string | null;
  readonly registry: Erc8004RegistryReference;
  readonly state: Erc8004IdentityState;
}

export function erc8004EvidenceId(identityId: `aid_${string}`): `evi_${string}` {
  return `evi_${identityId.slice(4)}`;
}

function requireAddress(value: string): EvmAddress {
  if (!/^0x[0-9a-fA-F]{40}$/.test(value)) throw new Error('Stored ERC-8004 address is invalid.');
  return value as EvmAddress;
}

function requireHash(value: string | null): TransactionHash | null {
  if (value === null) return null;
  if (!/^0x[0-9a-fA-F]{64}$/.test(value)) throw new Error('Stored ERC-8004 hash is invalid.');
  return value as TransactionHash;
}

function asOperation(row: {
  readonly agent_id: string | null;
  readonly agent_principal_id: string;
  readonly agent_registry: string | null;
  readonly chain_id: number;
  readonly identity_id: string;
  readonly identity_registry_address: string;
  readonly metadata_provider_transaction_id: string | null;
  readonly metadata_transaction_hash: string | null;
  readonly owner_address: string;
  readonly provider_state: string | null;
  readonly provenance: string;
  readonly registration_provider_transaction_id: string | null;
  readonly registration_transaction_hash: string | null;
  readonly registration_uri: string | null;
  readonly reputation_registry_address: string;
  readonly state: string;
}): Erc8004IdentityOperation {
  return {
    agentId: row.agent_id === null ? null : BigInt(row.agent_id),
    agentPrincipalId: row.agent_principal_id as `agt_${string}`,
    agentRegistry: row.agent_registry,
    identityId: row.identity_id as `aid_${string}`,
    metadataProviderTransactionId: row.metadata_provider_transaction_id,
    metadataTransactionHash: requireHash(row.metadata_transaction_hash),
    ownerAddress: requireAddress(row.owner_address),
    providerState: row.provider_state,
    provenance: row.provenance as ActorClassification,
    registrationProviderTransactionId: row.registration_provider_transaction_id,
    registrationTransactionHash: requireHash(row.registration_transaction_hash),
    registrationUri: row.registration_uri,
    registry: {
      chainId: row.chain_id,
      identityRegistryAddress: requireAddress(row.identity_registry_address),
      reputationRegistryAddress: requireAddress(row.reputation_registry_address),
    },
    state: row.state as Erc8004IdentityState,
  };
}

export class PostgresErc8004Repository {
  readonly #persistence: PostgresPersistence;

  constructor(persistence: PostgresPersistence) {
    this.#persistence = persistence;
  }

  async ensureIdentity(input: {
    readonly agentPrincipalId: `agt_${string}`;
    readonly identityId: `aid_${string}`;
    readonly ownerAddress: EvmAddress;
    readonly registry: Erc8004RegistryReference;
  }): Promise<Erc8004IdentityOperation> {
    const database = this.#persistence.databaseForApplication.withSchema(applicationSchema);
    const agent = await database
      .selectFrom('agent_registrations as registration')
      .innerJoin('businesses as business', 'business.business_id', 'registration.business_id')
      .select('business.actor_classification as provenance')
      .where('registration.agent_principal_id', '=', input.agentPrincipalId)
      .executeTakeFirstOrThrow();
    if (agent.provenance !== 'COMMON_CONTROL_TEST' && agent.provenance !== 'INDEPENDENT') {
      throw new Error('Agent Business has an unsupported provenance classification.');
    }
    await database
      .insertInto('erc8004_identity_operations')
      .values({
        agent_id: null,
        agent_principal_id: input.agentPrincipalId,
        agent_registry: null,
        chain_id: input.registry.chainId,
        identity_id: input.identityId,
        identity_registry_address: input.registry.identityRegistryAddress,
        metadata_provider_transaction_id: null,
        metadata_transaction_hash: null,
        owner_address: input.ownerAddress,
        provenance: agent.provenance,
        provider_state: null,
        registration_provider_transaction_id: null,
        registration_transaction_hash: null,
        registration_uri: null,
        reputation_registry_address: input.registry.reputationRegistryAddress,
        state: 'REGISTER_AUTHORIZED',
        updated_at: new Date(),
        verified_at: null,
      })
      .onConflict((conflict) => conflict.column('identity_id').doNothing())
      .execute();
    const operation = await this.getIdentity(input.identityId);
    if (
      operation.agentPrincipalId !== input.agentPrincipalId ||
      operation.ownerAddress.toLowerCase() !== input.ownerAddress.toLowerCase() ||
      operation.provenance !== agent.provenance ||
      operation.registry.chainId !== input.registry.chainId ||
      operation.registry.identityRegistryAddress.toLowerCase() !==
        input.registry.identityRegistryAddress.toLowerCase() ||
      operation.registry.reputationRegistryAddress.toLowerCase() !==
        input.registry.reputationRegistryAddress.toLowerCase()
    ) {
      throw new Error('ERC-8004 identity ID already exists with different semantics.');
    }
    return operation;
  }

  async getIdentity(identityId: `aid_${string}`): Promise<Erc8004IdentityOperation> {
    const row = await this.#persistence.databaseForApplication
      .withSchema(applicationSchema)
      .selectFrom('erc8004_identity_operations')
      .selectAll()
      .where('identity_id', '=', identityId)
      .executeTakeFirstOrThrow();
    return asOperation(row);
  }

  async recordRegistrationSubmitted(input: {
    readonly identityId: `aid_${string}`;
    readonly providerTransactionId: string;
  }): Promise<void> {
    const result = await this.#persistence.databaseForApplication
      .withSchema(applicationSchema)
      .updateTable('erc8004_identity_operations')
      .set({
        provider_state: 'SUBMITTED',
        registration_provider_transaction_id: input.providerTransactionId,
        state: 'REGISTER_SUBMITTED',
        updated_at: new Date(),
      })
      .where('identity_id', '=', input.identityId)
      .where('state', '=', 'OUTCOME_UNKNOWN')
      .where('provider_state', '=', 'REGISTRATION_HANDOFF_STARTED')
      .executeTakeFirstOrThrow();
    if (result.numUpdatedRows !== 1n) throw new Error('ERC-8004 registration submission raced.');
  }

  async recordIdentityRegistered(input: {
    readonly identity: Erc8004IdentityReference;
    readonly identityId: `aid_${string}`;
    readonly providerState: string;
    readonly transactionHash: TransactionHash;
  }): Promise<void> {
    if (input.identity.agentRegistry !== agentRegistry(input.identity)) {
      throw new Error('ERC-8004 portable registry reference is inconsistent.');
    }
    const result = await this.#persistence.databaseForApplication
      .withSchema(applicationSchema)
      .updateTable('erc8004_identity_operations')
      .set({
        agent_id: input.identity.agentId.toString(),
        agent_registry: input.identity.agentRegistry,
        provider_state: input.providerState,
        registration_transaction_hash: input.transactionHash,
        state: 'IDENTITY_REGISTERED',
        updated_at: new Date(),
      })
      .where('identity_id', '=', input.identityId)
      .where('chain_id', '=', input.identity.chainId)
      .where('identity_registry_address', '=', input.identity.identityRegistryAddress)
      .where('reputation_registry_address', '=', input.identity.reputationRegistryAddress)
      .where('state', 'in', ['REGISTER_SUBMITTED', 'OUTCOME_UNKNOWN'])
      .executeTakeFirstOrThrow();
    if (result.numUpdatedRows !== 1n) throw new Error('ERC-8004 registration outcome was not recorded.');
  }

  async recordMetadataSubmitted(input: {
    readonly identityId: `aid_${string}`;
    readonly providerTransactionId: string;
    readonly registrationUri: string;
  }): Promise<void> {
    const result = await this.#persistence.databaseForApplication
      .withSchema(applicationSchema)
      .updateTable('erc8004_identity_operations')
      .set({
        metadata_provider_transaction_id: input.providerTransactionId,
        provider_state: 'SUBMITTED',
        registration_uri: input.registrationUri,
        state: 'METADATA_SUBMITTED',
        updated_at: new Date(),
      })
      .where('identity_id', '=', input.identityId)
      .where('state', '=', 'OUTCOME_UNKNOWN')
      .where('provider_state', '=', 'METADATA_HANDOFF_STARTED')
      .executeTakeFirstOrThrow();
    if (result.numUpdatedRows !== 1n) throw new Error('ERC-8004 metadata submission raced.');
  }

  async recordVerified(input: {
    readonly identityId: `aid_${string}`;
    readonly providerState: string;
    readonly transactionHash: TransactionHash;
    readonly verifiedAt: string;
  }): Promise<void> {
    const result = await this.#persistence.databaseForApplication
      .withSchema(applicationSchema)
      .updateTable('erc8004_identity_operations')
      .set({
        metadata_transaction_hash: input.transactionHash,
        provider_state: input.providerState,
        state: 'VERIFIED',
        updated_at: input.verifiedAt,
        verified_at: input.verifiedAt,
      })
      .where('identity_id', '=', input.identityId)
      .where('state', 'in', ['METADATA_SUBMITTED', 'OUTCOME_UNKNOWN'])
      .executeTakeFirstOrThrow();
    if (result.numUpdatedRows !== 1n) throw new Error('ERC-8004 verification was not recorded.');
  }

  async recordOutcome(input: {
    readonly identityId: `aid_${string}`;
    readonly providerState: string;
    readonly state: 'FAILED' | 'OUTCOME_UNKNOWN';
  }): Promise<void> {
    await this.#persistence.databaseForApplication
      .withSchema(applicationSchema)
      .updateTable('erc8004_identity_operations')
      .set({ provider_state: input.providerState, state: input.state, updated_at: new Date() })
      .where('identity_id', '=', input.identityId)
      .where('state', 'in', ['REGISTER_SUBMITTED', 'METADATA_SUBMITTED', 'OUTCOME_UNKNOWN'])
      .executeTakeFirstOrThrow();
  }

  async recordHandoffStarted(input: {
    readonly identityId: `aid_${string}`;
    readonly leg: 'METADATA' | 'REGISTRATION';
  }): Promise<void> {
    const expectedState = input.leg === 'REGISTRATION' ? 'REGISTER_AUTHORIZED' : 'IDENTITY_REGISTERED';
    const providerState = `${input.leg}_HANDOFF_STARTED`;
    const database = this.#persistence.databaseForApplication.withSchema(applicationSchema);
    const existing = await database
      .selectFrom('erc8004_identity_operations')
      .select(['provider_state', 'state'])
      .where('identity_id', '=', input.identityId)
      .executeTakeFirstOrThrow();
    if (existing.state === 'OUTCOME_UNKNOWN' && existing.provider_state === providerState) return;
    const result = await database
      .updateTable('erc8004_identity_operations')
      .set({ provider_state: providerState, state: 'OUTCOME_UNKNOWN', updated_at: new Date() })
      .where('identity_id', '=', input.identityId)
      .where('state', '=', expectedState)
      .executeTakeFirstOrThrow();
    if (result.numUpdatedRows !== 1n) throw new Error(`ERC-8004 ${input.leg.toLowerCase()} handoff is not admissible.`);
  }

  async ensureVerifiedEvidence(identityId: `aid_${string}`): Promise<void> {
    const database = this.#persistence.databaseForApplication.withSchema(applicationSchema);
    const identity = await database
      .selectFrom('erc8004_identity_operations as identity')
      .innerJoin('principals as principal', 'principal.principal_id', 'identity.agent_principal_id')
      .selectAll('identity')
      .select('principal.environment as environment')
      .where('identity.identity_id', '=', identityId)
      .executeTakeFirstOrThrow();
    if (
      identity.state !== 'VERIFIED' ||
      identity.agent_id === null ||
      identity.agent_registry === null ||
      identity.registration_transaction_hash === null ||
      identity.metadata_transaction_hash === null ||
      identity.verified_at === null
    ) {
      throw new Error('Only a complete chain-verified ERC-8004 identity can produce Evidence.');
    }
    await database
      .insertInto('evidence_facts')
      .values({
        coverage: 'IDENTITY_AND_METADATA',
        environment: identity.environment,
        evidence_id: erc8004EvidenceId(identityId),
        fact_type: 'ERC8004_AGENT_IDENTITY_VERIFIED',
        observed_at: identity.verified_at,
        payload: {
          agentId: identity.agent_id,
          agentPrincipalId: identity.agent_principal_id,
          agentRegistry: identity.agent_registry,
          commonControl: identity.provenance === 'COMMON_CONTROL_TEST',
          identityRegistryAddress: identity.identity_registry_address,
          metadataTransactionHash: identity.metadata_transaction_hash,
          ownerAddress: identity.owner_address,
          registrationTransactionHash: identity.registration_transaction_hash,
          reputationRegistryAddress: identity.reputation_registry_address,
        },
        provenance: identity.provenance,
        source_reference: identity.metadata_transaction_hash,
        source_type: 'ARC_ERC8004',
        subject_id: identityId,
        subject_type: 'AGENT_IDENTITY',
        verification: 'CHAIN_VERIFIED',
      })
      .onConflict((conflict) => conflict.column('evidence_id').doNothing())
      .execute();
  }
}
