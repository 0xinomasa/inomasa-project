import {
  type ColumnType,
  type Generated,
  Kysely,
  PostgresDialect,
  type Transaction,
} from 'kysely';
import { Pool, type PoolConfig } from 'pg';

import type { DatabaseConnectionConfig } from './config.ts';

export const engineeringSchema = 'inomasa_engineering';
export const engineeringProbeTable = 'persistence_probe';
export const applicationSchema = 'inomasa_app';

type Timestamp = ColumnType<Date, Date | string, Date | string>;

interface EngineeringPersistenceProbeTable {
  readonly created_at: Generated<Date>;
  readonly probe_id: string;
  readonly probe_value: string;
}

interface PrincipalTable {
  readonly actor_classification: string;
  readonly created_at: Generated<Date>;
  readonly display_name: string;
  readonly environment: string;
  readonly principal_id: string;
  readonly principal_kind: string;
}

interface AgentRegistrationTable {
  readonly agent_principal_id: string;
  readonly created_at: Generated<Date>;
  readonly provider_of_record_principal_id: string;
  readonly runtime_class: string;
  readonly software_version: string;
  readonly status: string;
}

interface StandingAuthorityGrantTable {
  readonly action_type: string;
  readonly allowance_consumed_micro_usdc: string;
  readonly allowance_total_micro_usdc: string;
  readonly allowed_counterparty_business_id: string;
  readonly allowed_offer_id: string;
  readonly asset: string;
  readonly authority_domain_business_id: string;
  readonly control_version: number;
  readonly created_at: Generated<Date>;
  readonly delegation_allowed: boolean;
  readonly environment: string;
  readonly expires_at: Timestamp;
  readonly grantee_principal_id: string;
  readonly grant_id: string;
  readonly grant_version: number;
  readonly grantor_principal_id: string;
  readonly max_per_action_micro_usdc: string;
  readonly represented_business_id: string;
  readonly revoked_at: Timestamp | null;
  readonly status: string;
  readonly valid_from: Timestamp;
}

interface ActionIntentTable {
  readonly action_type: string;
  readonly amount_micro_usdc: string;
  readonly asset: string;
  readonly authority_domain_business_id: string;
  readonly counterparty_business_id: string;
  readonly grant_id: string;
  readonly intent_id: string;
  readonly offer_id: string;
  readonly purpose: string;
  readonly represented_business_id: string;
  readonly requested_at: Timestamp;
  readonly requester_principal_id: string;
  readonly state: string;
}

interface AuthorityPolicyDecisionTable {
  readonly decided_at: Timestamp;
  readonly decision_id: string;
  readonly grant_id: string;
  readonly grant_version: number;
  readonly intent_id: string;
  readonly outcome: string;
  readonly policy_version: number;
  readonly reason: string;
}

interface ExecutionAuthorizationTable {
  readonly authorization_id: string;
  readonly consumed_at: Timestamp | null;
  readonly control_version: number;
  readonly decision_id: string;
  readonly expires_at: Timestamp;
  readonly grant_id: string;
  readonly grant_version: number;
  readonly intent_id: string;
  readonly issued_at: Timestamp;
  readonly obligation_id: string | null;
  readonly policy_version: number;
  readonly state: string;
}

interface GenesisRequestTable {
  readonly consumed_at: Timestamp | null;
  readonly created_at: Generated<Date>;
  readonly genesis_request_id: string;
  readonly requester_principal_id: string;
  readonly state: string;
  readonly template_id: string;
  readonly template_version: number;
}

interface BusinessTable {
  readonly actor_classification: string;
  readonly business_id: string;
  readonly business_principal_id: string;
  readonly common_control_group_id: string | null;
  readonly created_at: Generated<Date>;
  readonly display_name: string;
  readonly environment: string;
  readonly genesis_request_id: string;
  readonly status: string;
  readonly template_id: string;
  readonly template_version: number;
}

interface BusinessControlTable {
  readonly accepted_at: Timestamp;
  readonly business_id: string;
  readonly control_id: string;
  readonly control_version: number;
  readonly controller_principal_id: string;
  readonly ended_at: Timestamp | null;
  readonly status: string;
}

interface BusinessEventTable {
  readonly actor_principal_id: string;
  readonly business_id: string;
  readonly event_id: string;
  readonly event_type: string;
  readonly occurred_at: Timestamp;
  readonly payload: unknown;
  readonly request_id: string;
}

interface TreasuryBindingTable {
  readonly account_assurance: string;
  readonly account_type: string;
  readonly address: string | null;
  readonly binding_id: string;
  readonly binding_version: number;
  readonly blockchain: string;
  readonly business_id: string;
  readonly created_at: Generated<Date>;
  readonly custody_model: string;
  readonly ended_at: Timestamp | null;
  readonly environment: string;
  readonly provider: string;
  readonly provider_wallet_id: string | null;
  readonly status: string;
}

interface ServiceOfferTable {
  readonly capability_id: string;
  readonly created_at: Generated<Date>;
  readonly description: string;
  readonly offer_id: string;
  readonly price_micro_usdc: string;
  readonly provider_business_id: string;
  readonly status: string;
  readonly terms_version: number;
}

interface ServiceExecutionTable {
  readonly capability_id: string;
  readonly completed_at: Timestamp;
  readonly consumer_business_id: string;
  readonly created_at: Generated<Date>;
  readonly environment: string;
  readonly execution_id: string;
  readonly obligation_id: string;
  readonly output: unknown;
  readonly output_sha256: string;
  readonly provenance: string;
  readonly provider_business_id: string;
  readonly settlement_id: string;
  readonly source_reference: string;
  readonly state: string;
}

interface ObligationTable {
  readonly amount_micro_usdc: string;
  readonly asset: string;
  readonly buyer_business_id: string;
  readonly created_at: Generated<Date>;
  readonly environment: string;
  readonly execution_authorization_id: string | null;
  readonly obligation_id: string;
  readonly offer_id: string;
  readonly provenance: string;
  readonly represented_business_id: string | null;
  readonly requester_principal_id: string | null;
  readonly seller_business_id: string;
  readonly settled_at: Timestamp | null;
  readonly state: string;
  readonly terms_version: number;
}

interface SettlementOperationTable {
  readonly amount_micro_usdc: string;
  readonly asset_address: string;
  readonly chain_id: number;
  readonly created_at: Generated<Date>;
  readonly idempotency_key: string;
  readonly obligation_id: string;
  readonly provider: string;
  readonly provider_state: string | null;
  readonly provider_transaction_id: string | null;
  readonly settlement_id: string;
  readonly state: string;
  readonly transaction_hash: string | null;
  readonly updated_at: Timestamp;
}

interface GatewayFundingOperationTable {
  readonly amount_micro_usdc: string;
  readonly approval_idempotency_key: string;
  readonly approval_provider_transaction_id: string | null;
  readonly approval_transaction_hash: string | null;
  readonly business_id: string;
  readonly created_at: Generated<Date>;
  readonly deposit_idempotency_key: string;
  readonly deposit_provider_transaction_id: string | null;
  readonly deposit_transaction_hash: string | null;
  readonly depositor_address: string;
  readonly funding_id: string;
  readonly gateway_contract_address: string;
  readonly provider_state: string | null;
  readonly state: string;
  readonly updated_at: Timestamp;
}

interface X402PaymentOperationTable {
  readonly amount_micro_usdc: string;
  readonly asset_address: string;
  readonly created_at: Generated<Date>;
  readonly execution_authorization_id: string;
  readonly network: string;
  readonly obligation_id: string;
  readonly pay_to_address: string;
  readonly payer_address: string;
  readonly payment_id: string;
  readonly payment_payload: unknown | null;
  readonly payment_payload_sha256: string | null;
  readonly payment_required: unknown;
  readonly payment_required_sha256: string;
  readonly protocol_version: number;
  readonly provider_state: string | null;
  readonly provider_transaction_id: string | null;
  readonly scheme: string;
  readonly settlement_id: string;
  readonly state: string;
  readonly updated_at: Timestamp;
}

interface EconomicEntryTable {
  readonly amount_micro_usdc: string;
  readonly asset: string;
  readonly business_id: string;
  readonly category: string;
  readonly direction: string;
  readonly entry_id: string;
  readonly obligation_id: string;
  readonly occurred_at: Timestamp;
  readonly provenance: string;
  readonly settlement_id: string;
}

interface EvidenceFactTable {
  readonly coverage: string;
  readonly created_at: Generated<Date>;
  readonly environment: string;
  readonly evidence_id: string;
  readonly fact_type: string;
  readonly observed_at: Timestamp;
  readonly payload: unknown;
  readonly provenance: string;
  readonly source_reference: string;
  readonly source_type: string;
  readonly subject_id: string;
  readonly subject_type: string;
  readonly verification: string;
}

export interface PersistenceDatabase {
  readonly action_intents: ActionIntentTable;
  readonly agent_registrations: AgentRegistrationTable;
  readonly authority_policy_decisions: AuthorityPolicyDecisionTable;
  readonly business_controls: BusinessControlTable;
  readonly business_events: BusinessEventTable;
  readonly businesses: BusinessTable;
  readonly economic_entries: EconomicEntryTable;
  readonly evidence_facts: EvidenceFactTable;
  readonly execution_authorizations: ExecutionAuthorizationTable;
  readonly gateway_funding_operations: GatewayFundingOperationTable;
  readonly genesis_requests: GenesisRequestTable;
  readonly obligations: ObligationTable;
  readonly principals: PrincipalTable;
  readonly persistence_probe: EngineeringPersistenceProbeTable;
  readonly service_offers: ServiceOfferTable;
  readonly service_executions: ServiceExecutionTable;
  readonly settlement_operations: SettlementOperationTable;
  readonly standing_authority_grants: StandingAuthorityGrantTable;
  readonly treasury_bindings: TreasuryBindingTable;
  readonly x402_payment_operations: X402PaymentOperationTable;
}

export type PersistenceTransaction = Transaction<PersistenceDatabase>;

function createPoolConfig(config: DatabaseConnectionConfig): PoolConfig {
  return {
    connectionString: config.connectionString,
    ...(config.maxConnections === undefined ? {} : { max: config.maxConnections }),
  };
}

export function createPostgresDatabase(
  config: DatabaseConnectionConfig,
): Kysely<PersistenceDatabase> {
  return new Kysely<PersistenceDatabase>({
    dialect: new PostgresDialect({
      pool: new Pool(createPoolConfig(config)),
    }),
  });
}

export class PostgresPersistence {
  readonly #database: Kysely<PersistenceDatabase>;

  constructor(config: DatabaseConnectionConfig) {
    if (config.purpose !== 'runtime') {
      throw new Error('PostgresPersistence requires a runtime database connection.');
    }

    this.#database = createPostgresDatabase(config);
  }

  async close(): Promise<void> {
    await this.#database.destroy();
  }

  async transaction<T>(
    operation: (transaction: PersistenceTransaction) => Promise<T>,
  ): Promise<T> {
    return this.#database.transaction().execute(operation);
  }

  async verifyConnection(): Promise<void> {
    await this.#database.selectNoFrom((expression) => expression.val(1).as('value')).executeTakeFirstOrThrow();
  }

  get databaseForEngineeringProof(): Kysely<PersistenceDatabase> {
    return this.#database;
  }

  get databaseForApplication(): Kysely<PersistenceDatabase> {
    return this.#database;
  }
}
