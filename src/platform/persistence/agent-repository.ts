import type { BusinessAgent } from '../../modules/agent/model.ts';
import { validateBusinessAgent } from '../../modules/agent/model.ts';
import type { PostgresPersistence } from './database.ts';
import { applicationSchema, type PersistenceTransaction } from './database.ts';

export interface AgentListItem {
  readonly agentPrincipalId: string;
  readonly capabilities: readonly string[];
  readonly displayName: string;
  readonly identityId: string | null;
  readonly identityState: string | null;
  readonly role: string;
  readonly runtimeClass: string;
  readonly status: string;
}

export interface AgentDetail extends AgentListItem {
  readonly businessId: string;
  readonly environment: string;
  readonly identity: null | {
    readonly agentId: string | null;
    readonly agentRegistry: string | null;
    readonly identityRegistryAddress: string;
    readonly metadataTransactionHash: string | null;
    readonly ownerAddress: string;
    readonly provenance: string;
    readonly registrationTransactionHash: string | null;
    readonly reputationRegistryAddress: string;
    readonly state: string;
    readonly verifiedAt: Date | null;
  };
  readonly providerOfRecordPrincipalId: string;
  readonly recentEconomicActions: readonly {
    readonly amountMicroUsdc: string;
    readonly intentId: string;
    readonly paymentId: string | null;
    readonly providerTransactionId: string | null;
    readonly provenance: string;
    readonly settlementState: string | null;
  }[];
  readonly softwareVersion: string;
}

function capabilities(value: unknown): readonly string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error('Stored Agent capabilities are invalid.');
  }
  return value;
}

export class PostgresAgentRepository {
  readonly #persistence: PostgresPersistence;

  constructor(persistence: PostgresPersistence) {
    this.#persistence = persistence;
  }

  async ensureAgent(
    input: BusinessAgent,
    controllerPrincipalId?: `usr_${string}`,
    transaction?: PersistenceTransaction,
  ): Promise<{ readonly created: boolean }> {
    const agent = validateBusinessAgent(input);
    if (transaction === undefined) {
      return this.#persistence.transaction((activeTransaction) =>
        this.ensureAgent(agent, controllerPrincipalId, activeTransaction),
      );
    }
    const database = transaction.withSchema(applicationSchema);
    const business = await database
      .selectFrom('businesses')
      .select(['actor_classification', 'environment'])
      .where('business_id', '=', agent.businessId)
      .executeTakeFirstOrThrow();
    if (controllerPrincipalId !== undefined) {
      const control = await database
        .selectFrom('business_controls')
        .select('control_id')
        .where('business_id', '=', agent.businessId)
        .where('controller_principal_id', '=', controllerPrincipalId)
        .where('status', '=', 'ACTIVE')
        .executeTakeFirst();
      if (control === undefined) {
        throw new Error('Business control is required to create this Agent.');
      }
    }
    if (business.environment !== agent.environment) {
      throw new Error('Agent environment does not match its related Business.');
    }

    const created = await database
      .insertInto('principals')
      .values({
          actor_classification: business.actor_classification,
          display_name: agent.displayName,
          environment: agent.environment,
          principal_id: agent.agentPrincipalId,
          principal_kind: 'AGENT',
      })
      .onConflict((conflict) => conflict.column('principal_id').doNothing())
      .returning('principal_id')
      .executeTakeFirst();
    await database
      .insertInto('agent_registrations')
      .values({
          agent_principal_id: agent.agentPrincipalId,
          business_id: agent.businessId,
          capabilities: JSON.stringify(agent.capabilities),
          provider_of_record_principal_id: agent.providerOfRecordPrincipalId,
          role: agent.role,
          runtime_class: agent.runtimeClass,
          software_version: agent.softwareVersion,
          status: agent.status,
      })
      .onConflict((conflict) => conflict.column('agent_principal_id').doNothing())
      .execute();

    const stored = await database
      .selectFrom('agent_registrations as registration')
      .innerJoin('principals as principal', 'principal.principal_id', 'registration.agent_principal_id')
      .select([
          'registration.business_id',
          'registration.capabilities',
          'principal.display_name',
          'principal.environment',
          'registration.provider_of_record_principal_id',
          'registration.role',
          'registration.runtime_class',
          'registration.software_version',
          'registration.status',
      ])
      .where('registration.agent_principal_id', '=', agent.agentPrincipalId)
      .executeTakeFirstOrThrow();
    if (
      stored.business_id !== agent.businessId ||
      JSON.stringify(capabilities(stored.capabilities)) !== JSON.stringify(agent.capabilities) ||
      stored.display_name !== agent.displayName ||
      stored.environment !== agent.environment ||
      stored.provider_of_record_principal_id !== agent.providerOfRecordPrincipalId ||
      stored.role !== agent.role ||
      stored.runtime_class !== agent.runtimeClass ||
      stored.software_version !== agent.softwareVersion ||
      stored.status !== agent.status
    ) {
      throw new Error('Agent principal already exists with different Business semantics.');
    }
    return { created: created !== undefined };
  }

  async listAgentsForBusiness(businessId: `biz_${string}`): Promise<readonly AgentListItem[]> {
    const rows = await this.#persistence.databaseForApplication
      .withSchema(applicationSchema)
      .selectFrom('agent_registrations as registration')
      .innerJoin('principals as principal', 'principal.principal_id', 'registration.agent_principal_id')
      .leftJoin('erc8004_identity_operations as identity', 'identity.agent_principal_id', 'registration.agent_principal_id')
      .select([
        'registration.agent_principal_id as agentPrincipalId',
        'registration.capabilities',
        'principal.display_name as displayName',
        'identity.identity_id as identityId',
        'identity.state as identityState',
        'registration.role',
        'registration.runtime_class as runtimeClass',
        'registration.status',
      ])
      .where('registration.business_id', '=', businessId)
      .orderBy('registration.created_at', 'asc')
      .execute();
    return rows.map((row) => ({ ...row, capabilities: capabilities(row.capabilities) }));
  }

  async getAgentDetail(input: {
    readonly agentPrincipalId: `agt_${string}`;
    readonly businessId: `biz_${string}`;
  }): Promise<AgentDetail | undefined> {
    const database = this.#persistence.databaseForApplication.withSchema(applicationSchema);
    const row = await database
      .selectFrom('agent_registrations as registration')
      .innerJoin('principals as principal', 'principal.principal_id', 'registration.agent_principal_id')
      .leftJoin('erc8004_identity_operations as identity', 'identity.agent_principal_id', 'registration.agent_principal_id')
      .select([
        'registration.agent_principal_id as agentPrincipalId',
        'registration.business_id as businessId',
        'registration.capabilities',
        'principal.display_name as displayName',
        'principal.environment',
        'identity.agent_id as agentId',
        'identity.agent_registry as agentRegistry',
        'identity.identity_id as identityId',
        'identity.identity_registry_address as identityRegistryAddress',
        'identity.metadata_transaction_hash as metadataTransactionHash',
        'identity.owner_address as ownerAddress',
        'identity.provenance',
        'identity.registration_transaction_hash as registrationTransactionHash',
        'identity.reputation_registry_address as reputationRegistryAddress',
        'identity.state as identityState',
        'identity.verified_at as verifiedAt',
        'registration.provider_of_record_principal_id as providerOfRecordPrincipalId',
        'registration.role',
        'registration.runtime_class as runtimeClass',
        'registration.software_version as softwareVersion',
        'registration.status',
      ])
      .where('registration.business_id', '=', input.businessId)
      .where('registration.agent_principal_id', '=', input.agentPrincipalId)
      .executeTakeFirst();
    if (row === undefined) return undefined;

    const actions = await database
      .selectFrom('action_intents as intent')
      .innerJoin('execution_authorizations as authorization', 'authorization.intent_id', 'intent.intent_id')
      .leftJoin('obligations as obligation', 'obligation.execution_authorization_id', 'authorization.authorization_id')
      .leftJoin('settlement_operations as settlement', 'settlement.obligation_id', 'obligation.obligation_id')
      .leftJoin('x402_payment_operations as payment', 'payment.settlement_id', 'settlement.settlement_id')
      .select([
        'intent.amount_micro_usdc as amountMicroUsdc',
        'intent.intent_id as intentId',
        'payment.payment_id as paymentId',
        'payment.provider_transaction_id as providerTransactionId',
        'obligation.provenance',
        'settlement.state as settlementState',
      ])
      .where('intent.requester_principal_id', '=', input.agentPrincipalId)
      .where('intent.erc8004_identity_id', '=', row.identityId)
      .orderBy('intent.requested_at', 'desc')
      .limit(10)
      .execute();

    return {
      agentPrincipalId: row.agentPrincipalId,
      businessId: row.businessId,
      capabilities: capabilities(row.capabilities),
      displayName: row.displayName,
      environment: row.environment,
      identity:
        row.identityId === null
          ? null
          : {
              agentId: row.agentId,
              agentRegistry: row.agentRegistry,
              identityRegistryAddress: row.identityRegistryAddress as string,
              metadataTransactionHash: row.metadataTransactionHash,
              ownerAddress: row.ownerAddress as string,
              provenance: row.provenance as string,
              registrationTransactionHash: row.registrationTransactionHash,
              reputationRegistryAddress: row.reputationRegistryAddress as string,
              state: row.identityState as string,
              verifiedAt: row.verifiedAt,
            },
      identityId: row.identityId,
      identityState: row.identityState,
      providerOfRecordPrincipalId: row.providerOfRecordPrincipalId,
      recentEconomicActions: actions.map((action) => ({
        ...action,
        provenance: action.provenance ?? 'NOT_EXECUTED',
      })),
      role: row.role,
      runtimeClass: row.runtimeClass,
      softwareVersion: row.softwareVersion,
      status: row.status,
    };
  }
}
