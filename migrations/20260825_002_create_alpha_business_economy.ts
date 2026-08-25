import { sql, type Kysely } from 'kysely';

const schemaName = 'inomasa_app';

export async function up(database: Kysely<unknown>): Promise<void> {
  await database.schema.createSchema(schemaName).ifNotExists().execute();
  const schema = database.schema.withSchema(schemaName);

  await schema
    .createTable('principals')
    .addColumn('principal_id', 'varchar(80)', (column) => column.primaryKey())
    .addColumn('principal_kind', 'varchar(16)', (column) => column.notNull())
    .addColumn('display_name', 'varchar(160)', (column) => column.notNull())
    .addColumn('actor_classification', 'varchar(32)', (column) => column.notNull())
    .addColumn('environment', 'varchar(32)', (column) => column.notNull())
    .addColumn('created_at', 'timestamptz', (column) =>
      column.defaultTo(sql`current_timestamp`).notNull(),
    )
    .addCheckConstraint(
      'principals_kind_check',
      sql`principal_kind in ('HUMAN', 'BUSINESS', 'AGENT', 'SERVICE')`,
    )
    .addCheckConstraint(
      'principals_actor_classification_check',
      sql`actor_classification in ('COMMON_CONTROL_TEST', 'INDEPENDENT')`,
    )
    .execute();

  await schema
    .createTable('genesis_requests')
    .addColumn('genesis_request_id', 'varchar(96)', (column) => column.primaryKey())
    .addColumn('requester_principal_id', 'varchar(80)', (column) =>
      column.notNull().references(`${schemaName}.principals.principal_id`),
    )
    .addColumn('template_id', 'varchar(64)', (column) => column.notNull())
    .addColumn('template_version', 'integer', (column) => column.notNull())
    .addColumn('state', 'varchar(16)', (column) => column.notNull())
    .addColumn('consumed_at', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (column) =>
      column.defaultTo(sql`current_timestamp`).notNull(),
    )
    .addCheckConstraint('genesis_requests_state_check', sql`state in ('PENDING', 'CONSUMED')`)
    .execute();

  await schema
    .createTable('businesses')
    .addColumn('business_id', 'varchar(80)', (column) => column.primaryKey())
    .addColumn('business_principal_id', 'varchar(80)', (column) =>
      column.notNull().unique().references(`${schemaName}.principals.principal_id`),
    )
    .addColumn('genesis_request_id', 'varchar(96)', (column) =>
      column.notNull().unique().references(`${schemaName}.genesis_requests.genesis_request_id`),
    )
    .addColumn('template_id', 'varchar(64)', (column) => column.notNull())
    .addColumn('template_version', 'integer', (column) => column.notNull())
    .addColumn('display_name', 'varchar(160)', (column) => column.notNull())
    .addColumn('status', 'varchar(24)', (column) => column.notNull())
    .addColumn('actor_classification', 'varchar(32)', (column) => column.notNull())
    .addColumn('common_control_group_id', 'varchar(96)')
    .addColumn('environment', 'varchar(32)', (column) => column.notNull())
    .addColumn('created_at', 'timestamptz', (column) =>
      column.defaultTo(sql`current_timestamp`).notNull(),
    )
    .addCheckConstraint('businesses_status_check', sql`status in ('ACTIVE', 'SUSPENDED', 'RETIRED')`)
    .addCheckConstraint(
      'businesses_common_control_check',
      sql`actor_classification <> 'COMMON_CONTROL_TEST' or common_control_group_id is not null`,
    )
    .execute();

  await schema
    .createTable('business_controls')
    .addColumn('control_id', 'varchar(80)', (column) => column.primaryKey())
    .addColumn('business_id', 'varchar(80)', (column) =>
      column.notNull().references(`${schemaName}.businesses.business_id`),
    )
    .addColumn('controller_principal_id', 'varchar(80)', (column) =>
      column.notNull().references(`${schemaName}.principals.principal_id`),
    )
    .addColumn('control_version', 'integer', (column) => column.notNull())
    .addColumn('status', 'varchar(16)', (column) => column.notNull())
    .addColumn('accepted_at', 'timestamptz', (column) => column.notNull())
    .addColumn('ended_at', 'timestamptz')
    .addUniqueConstraint('business_controls_version_unique', ['business_id', 'control_version'])
    .addCheckConstraint('business_controls_status_check', sql`status in ('ACTIVE', 'ENDED')`)
    .execute();

  await schema
    .createTable('business_events')
    .addColumn('event_id', 'varchar(80)', (column) => column.primaryKey())
    .addColumn('event_type', 'varchar(64)', (column) => column.notNull())
    .addColumn('business_id', 'varchar(80)', (column) =>
      column.notNull().references(`${schemaName}.businesses.business_id`),
    )
    .addColumn('actor_principal_id', 'varchar(80)', (column) =>
      column.notNull().references(`${schemaName}.principals.principal_id`),
    )
    .addColumn('request_id', 'varchar(96)', (column) => column.notNull())
    .addColumn('occurred_at', 'timestamptz', (column) => column.notNull())
    .addColumn('payload', 'jsonb', (column) => column.notNull())
    .execute();

  await schema
    .createTable('treasury_bindings')
    .addColumn('binding_id', 'varchar(80)', (column) => column.primaryKey())
    .addColumn('business_id', 'varchar(80)', (column) =>
      column.notNull().references(`${schemaName}.businesses.business_id`),
    )
    .addColumn('binding_version', 'integer', (column) => column.notNull())
    .addColumn('provider', 'varchar(32)', (column) => column.notNull())
    .addColumn('provider_wallet_id', 'varchar(128)')
    .addColumn('address', 'varchar(42)')
    .addColumn('blockchain', 'varchar(32)', (column) => column.notNull())
    .addColumn('account_type', 'varchar(16)', (column) => column.notNull())
    .addColumn('custody_model', 'varchar(32)', (column) => column.notNull())
    .addColumn('account_assurance', 'varchar(48)', (column) => column.notNull())
    .addColumn('status', 'varchar(16)', (column) => column.notNull())
    .addColumn('environment', 'varchar(32)', (column) => column.notNull())
    .addColumn('created_at', 'timestamptz', (column) =>
      column.defaultTo(sql`current_timestamp`).notNull(),
    )
    .addColumn('ended_at', 'timestamptz')
    .addUniqueConstraint('treasury_bindings_version_unique', ['business_id', 'binding_version'])
    .addUniqueConstraint('treasury_bindings_provider_wallet_unique', [
      'provider',
      'provider_wallet_id',
    ])
    .addCheckConstraint(
      'treasury_bindings_status_check',
      sql`status in ('PENDING', 'ACTIVE', 'SUSPENDED', 'ENDED')`,
    )
    .execute();

  await schema
    .createTable('service_offers')
    .addColumn('offer_id', 'varchar(80)', (column) => column.primaryKey())
    .addColumn('provider_business_id', 'varchar(80)', (column) =>
      column.notNull().references(`${schemaName}.businesses.business_id`),
    )
    .addColumn('capability_id', 'varchar(96)', (column) => column.notNull())
    .addColumn('description', 'text', (column) => column.notNull())
    .addColumn('price_micro_usdc', 'numeric(30, 0)', (column) => column.notNull())
    .addColumn('terms_version', 'integer', (column) => column.notNull())
    .addColumn('status', 'varchar(16)', (column) => column.notNull())
    .addColumn('created_at', 'timestamptz', (column) =>
      column.defaultTo(sql`current_timestamp`).notNull(),
    )
    .addCheckConstraint('service_offers_price_check', sql`price_micro_usdc > 0`)
    .addCheckConstraint('service_offers_status_check', sql`status in ('ACTIVE', 'RETIRED')`)
    .execute();

  await schema
    .createTable('obligations')
    .addColumn('obligation_id', 'varchar(80)', (column) => column.primaryKey())
    .addColumn('offer_id', 'varchar(80)', (column) =>
      column.notNull().references(`${schemaName}.service_offers.offer_id`),
    )
    .addColumn('buyer_business_id', 'varchar(80)', (column) =>
      column.notNull().references(`${schemaName}.businesses.business_id`),
    )
    .addColumn('seller_business_id', 'varchar(80)', (column) =>
      column.notNull().references(`${schemaName}.businesses.business_id`),
    )
    .addColumn('amount_micro_usdc', 'numeric(30, 0)', (column) => column.notNull())
    .addColumn('asset', 'varchar(16)', (column) => column.notNull())
    .addColumn('terms_version', 'integer', (column) => column.notNull())
    .addColumn('state', 'varchar(24)', (column) => column.notNull())
    .addColumn('provenance', 'varchar(32)', (column) => column.notNull())
    .addColumn('environment', 'varchar(32)', (column) => column.notNull())
    .addColumn('created_at', 'timestamptz', (column) =>
      column.defaultTo(sql`current_timestamp`).notNull(),
    )
    .addColumn('settled_at', 'timestamptz')
    .addCheckConstraint('obligations_distinct_parties_check', sql`buyer_business_id <> seller_business_id`)
    .addCheckConstraint('obligations_amount_check', sql`amount_micro_usdc > 0`)
    .addCheckConstraint('obligations_state_check', sql`state in ('OPEN', 'SETTLED', 'CANCELLED')`)
    .execute();

  await schema
    .createTable('settlement_operations')
    .addColumn('settlement_id', 'varchar(80)', (column) => column.primaryKey())
    .addColumn('obligation_id', 'varchar(80)', (column) =>
      column.notNull().references(`${schemaName}.obligations.obligation_id`),
    )
    .addColumn('idempotency_key', 'uuid', (column) => column.notNull().unique())
    .addColumn('provider', 'varchar(48)', (column) => column.notNull())
    .addColumn('provider_transaction_id', 'varchar(128)', (column) => column.unique())
    .addColumn('chain_id', 'integer', (column) => column.notNull())
    .addColumn('asset_address', 'varchar(42)', (column) => column.notNull())
    .addColumn('amount_micro_usdc', 'numeric(30, 0)', (column) => column.notNull())
    .addColumn('state', 'varchar(24)', (column) => column.notNull())
    .addColumn('transaction_hash', 'varchar(66)', (column) => column.unique())
    .addColumn('provider_state', 'varchar(48)')
    .addColumn('created_at', 'timestamptz', (column) =>
      column.defaultTo(sql`current_timestamp`).notNull(),
    )
    .addColumn('updated_at', 'timestamptz', (column) =>
      column.defaultTo(sql`current_timestamp`).notNull(),
    )
    .addCheckConstraint(
      'settlement_operations_state_check',
      sql`state in ('AUTHORIZED', 'SUBMITTED', 'OUTCOME_UNKNOWN', 'COMPLETE', 'FAILED')`,
    )
    .execute();

  await schema
    .createTable('economic_entries')
    .addColumn('entry_id', 'varchar(80)', (column) => column.primaryKey())
    .addColumn('business_id', 'varchar(80)', (column) =>
      column.notNull().references(`${schemaName}.businesses.business_id`),
    )
    .addColumn('obligation_id', 'varchar(80)', (column) =>
      column.notNull().references(`${schemaName}.obligations.obligation_id`),
    )
    .addColumn('settlement_id', 'varchar(80)', (column) =>
      column.notNull().references(`${schemaName}.settlement_operations.settlement_id`),
    )
    .addColumn('direction', 'varchar(16)', (column) => column.notNull())
    .addColumn('category', 'varchar(32)', (column) => column.notNull())
    .addColumn('amount_micro_usdc', 'numeric(30, 0)', (column) => column.notNull())
    .addColumn('asset', 'varchar(16)', (column) => column.notNull())
    .addColumn('provenance', 'varchar(32)', (column) => column.notNull())
    .addColumn('occurred_at', 'timestamptz', (column) => column.notNull())
    .addUniqueConstraint('economic_entries_once_per_business_category', [
      'settlement_id',
      'business_id',
      'category',
    ])
    .addCheckConstraint('economic_entries_amount_check', sql`amount_micro_usdc > 0`)
    .addCheckConstraint('economic_entries_direction_check', sql`direction in ('INFLOW', 'OUTFLOW')`)
    .addCheckConstraint(
      'economic_entries_category_check',
      sql`category in ('REVENUE', 'SERVICE_COST', 'OWNER_CONTRIBUTION', 'CAPITAL', 'REFUND')`,
    )
    .execute();

  await schema
    .createTable('evidence_facts')
    .addColumn('evidence_id', 'varchar(80)', (column) => column.primaryKey())
    .addColumn('subject_type', 'varchar(32)', (column) => column.notNull())
    .addColumn('subject_id', 'varchar(96)', (column) => column.notNull())
    .addColumn('fact_type', 'varchar(64)', (column) => column.notNull())
    .addColumn('source_type', 'varchar(32)', (column) => column.notNull())
    .addColumn('source_reference', 'varchar(160)', (column) => column.notNull())
    .addColumn('verification', 'varchar(32)', (column) => column.notNull())
    .addColumn('coverage', 'varchar(32)', (column) => column.notNull())
    .addColumn('provenance', 'varchar(32)', (column) => column.notNull())
    .addColumn('environment', 'varchar(32)', (column) => column.notNull())
    .addColumn('payload', 'jsonb', (column) => column.notNull())
    .addColumn('observed_at', 'timestamptz', (column) => column.notNull())
    .addColumn('created_at', 'timestamptz', (column) =>
      column.defaultTo(sql`current_timestamp`).notNull(),
    )
    .addCheckConstraint(
      'evidence_facts_verification_check',
      sql`verification in ('NOT_VERIFIED', 'PROVIDER_REPORTED', 'CHAIN_VERIFIED')`,
    )
    .execute();

  await schema.createIndex('obligations_buyer_created_idx').on('obligations').columns([
    'buyer_business_id',
    'created_at',
  ]).execute();
  await schema.createIndex('obligations_seller_created_idx').on('obligations').columns([
    'seller_business_id',
    'created_at',
  ]).execute();
  await schema.createIndex('settlement_operations_state_idx').on('settlement_operations').column('state').execute();
  await schema.createIndex('evidence_facts_subject_idx').on('evidence_facts').columns([
    'subject_type',
    'subject_id',
    'observed_at',
  ]).execute();
}

export async function down(database: Kysely<unknown>): Promise<void> {
  const schema = database.schema.withSchema(schemaName);

  await schema.dropTable('evidence_facts').ifExists().execute();
  await schema.dropTable('economic_entries').ifExists().execute();
  await schema.dropTable('settlement_operations').ifExists().execute();
  await schema.dropTable('obligations').ifExists().execute();
  await schema.dropTable('service_offers').ifExists().execute();
  await schema.dropTable('treasury_bindings').ifExists().execute();
  await schema.dropTable('business_events').ifExists().execute();
  await schema.dropTable('business_controls').ifExists().execute();
  await schema.dropTable('businesses').ifExists().execute();
  await schema.dropTable('genesis_requests').ifExists().execute();
  await schema.dropTable('principals').ifExists().execute();
  await database.schema.dropSchema(schemaName).ifExists().execute();
}
