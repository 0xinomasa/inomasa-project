import { sql, type Kysely } from 'kysely';

const schemaName = 'inomasa_app';

export async function up(database: Kysely<unknown>): Promise<void> {
  const schema = database.schema.withSchema(schemaName);

  await schema
    .createTable('capital_providers')
    .addColumn('provider_id', 'varchar(80)', (column) => column.primaryKey())
    .addColumn('controller_principal_id', 'varchar(80)', (column) =>
      column.notNull().references(`${schemaName}.principals.principal_id`),
    )
    .addColumn('display_name', 'varchar(120)', (column) => column.notNull())
    .addColumn('risk_bearer_classification', 'varchar(32)', (column) => column.notNull())
    .addColumn('provenance', 'varchar(32)', (column) => column.notNull())
    .addColumn('environment', 'varchar(32)', (column) => column.notNull())
    .addColumn('status', 'varchar(16)', (column) => column.notNull())
    .addColumn('created_at', 'timestamptz', (column) =>
      column.defaultTo(sql`current_timestamp`).notNull(),
    )
    .addCheckConstraint(
      'capital_providers_risk_bearer_check',
      sql`risk_bearer_classification = 'PROVIDER_RISK_BEARER'`,
    )
    .addCheckConstraint(
      'capital_providers_provenance_check',
      sql`provenance in ('COMMON_CONTROL_TEST', 'INDEPENDENT')`,
    )
    .addCheckConstraint(
      'capital_providers_environment_check',
      sql`environment = 'PRIVATE_ARC_TESTNET'`,
    )
    .addCheckConstraint('capital_providers_status_check', sql`status in ('ACTIVE', 'INACTIVE')`)
    .execute();

  await schema
    .createTable('capital_mandates')
    .addColumn('mandate_id', 'varchar(80)', (column) => column.primaryKey())
    .addColumn('provider_id', 'varchar(80)', (column) =>
      column.notNull().references(`${schemaName}.capital_providers.provider_id`),
    )
    .addColumn('name', 'varchar(120)', (column) => column.notNull())
    .addColumn('strategy', 'text', (column) => column.notNull())
    .addColumn('criteria', 'jsonb', (column) => column.notNull())
    .addColumn('minimum_micro_usdc', 'numeric(30, 0)', (column) => column.notNull())
    .addColumn('maximum_micro_usdc', 'numeric(30, 0)', (column) => column.notNull())
    .addColumn('version', 'integer', (column) => column.notNull())
    .addColumn('status', 'varchar(16)', (column) => column.notNull())
    .addColumn('created_at', 'timestamptz', (column) =>
      column.defaultTo(sql`current_timestamp`).notNull(),
    )
    .addUniqueConstraint('capital_mandates_provider_version_unique', [
      'provider_id',
      'version',
    ])
    .addCheckConstraint(
      'capital_mandates_amount_check',
      sql`minimum_micro_usdc > 0 and maximum_micro_usdc >= minimum_micro_usdc`,
    )
    .addCheckConstraint('capital_mandates_version_check', sql`version > 0`)
    .addCheckConstraint('capital_mandates_status_check', sql`status in ('ACTIVE', 'RETIRED')`)
    .execute();

  await schema
    .createTable('capital_reviews')
    .addColumn('review_id', 'varchar(80)', (column) => column.primaryKey())
    .addColumn('mandate_id', 'varchar(80)', (column) =>
      column.notNull().references(`${schemaName}.capital_mandates.mandate_id`),
    )
    .addColumn('provider_id', 'varchar(80)', (column) =>
      column.notNull().references(`${schemaName}.capital_providers.provider_id`),
    )
    .addColumn('business_id', 'varchar(80)', (column) =>
      column.notNull().references(`${schemaName}.businesses.business_id`),
    )
    .addColumn('requested_micro_usdc', 'numeric(30, 0)', (column) => column.notNull())
    .addColumn('decision_material', 'jsonb', (column) => column.notNull())
    .addColumn('material_sha256', 'varchar(64)', (column) => column.notNull())
    .addColumn('observed_at', 'timestamptz', (column) => column.notNull())
    .addColumn('created_at', 'timestamptz', (column) =>
      column.defaultTo(sql`current_timestamp`).notNull(),
    )
    .addUniqueConstraint('capital_reviews_provider_business_material_amount_unique', [
      'provider_id',
      'business_id',
      'material_sha256',
      'requested_micro_usdc',
    ])
    .addCheckConstraint('capital_reviews_requested_amount_check', sql`requested_micro_usdc > 0`)
    .addCheckConstraint(
      'capital_reviews_material_digest_check',
      sql`material_sha256 ~ '^[0-9a-f]{64}$'`,
    )
    .execute();

  await schema
    .createTable('capital_decisions')
    .addColumn('decision_id', 'varchar(80)', (column) => column.primaryKey())
    .addColumn('review_id', 'varchar(80)', (column) =>
      column.notNull().unique().references(`${schemaName}.capital_reviews.review_id`),
    )
    .addColumn('outcome', 'varchar(16)', (column) => column.notNull())
    .addColumn('reason_code', 'varchar(64)', (column) => column.notNull())
    .addColumn('rationale', 'text', (column) => column.notNull())
    .addColumn('approved_micro_usdc', 'numeric(30, 0)')
    .addColumn('asset', 'varchar(16)')
    .addColumn('terms', 'jsonb')
    .addColumn('decided_by_principal_id', 'varchar(80)', (column) =>
      column.notNull().references(`${schemaName}.principals.principal_id`),
    )
    .addColumn('decided_at', 'timestamptz', (column) => column.notNull())
    .addCheckConstraint('capital_decisions_outcome_check', sql`outcome in ('APPROVED', 'DECLINED')`)
    .addCheckConstraint(
      'capital_decisions_terms_check',
      sql`(outcome = 'APPROVED' and approved_micro_usdc > 0 and asset = 'USDC' and terms is not null)
          or (outcome = 'DECLINED' and approved_micro_usdc is null and asset is null and terms is null)`,
    )
    .execute();

  await schema
    .createTable('capital_provider_accounts')
    .addColumn('provider_account_id', 'varchar(80)', (column) => column.primaryKey())
    .addColumn('provider_id', 'varchar(80)', (column) =>
      column.notNull().references(`${schemaName}.capital_providers.provider_id`),
    )
    .addColumn('account_assurance', 'varchar(40)', (column) => column.notNull())
    .addColumn('account_type', 'varchar(16)', (column) => column.notNull())
    .addColumn('blockchain', 'varchar(24)', (column) => column.notNull())
    .addColumn('custody_model', 'varchar(32)', (column) => column.notNull())
    .addColumn('provider', 'varchar(32)', (column) => column.notNull())
    .addColumn('provider_wallet_id', 'varchar(128)', (column) => column.unique())
    .addColumn('address', 'varchar(42)', (column) => column.unique())
    .addColumn('environment', 'varchar(32)', (column) => column.notNull())
    .addColumn('status', 'varchar(16)', (column) => column.notNull())
    .addColumn('created_at', 'timestamptz', (column) =>
      column.defaultTo(sql`current_timestamp`).notNull(),
    )
    .addColumn('updated_at', 'timestamptz', (column) =>
      column.defaultTo(sql`current_timestamp`).notNull(),
    )
    .addCheckConstraint(
      'capital_provider_accounts_profile_check',
      sql`account_assurance = 'PLATFORM_CONTROLLED_EXTERNAL'
          and account_type = 'EOA'
          and blockchain = 'ARC-TESTNET'
          and custody_model = 'DEVELOPER_CONTROLLED'
          and provider = 'CIRCLE'
          and environment = 'PRIVATE_ARC_TESTNET'`,
    )
    .addCheckConstraint(
      'capital_provider_accounts_status_check',
      sql`status in ('PENDING', 'ACTIVE', 'ENDED')`,
    )
    .addCheckConstraint(
      'capital_provider_accounts_active_material_check',
      sql`status <> 'ACTIVE' or (provider_wallet_id is not null and address is not null)`,
    )
    .execute();
  await schema
    .createIndex('capital_provider_accounts_one_active_per_provider')
    .unique()
    .on('capital_provider_accounts')
    .column('provider_id')
    .where(sql.ref('status'), '=', 'ACTIVE')
    .execute();
  await schema
    .createIndex('capital_provider_accounts_one_pending_per_provider')
    .unique()
    .on('capital_provider_accounts')
    .column('provider_id')
    .where(sql.ref('status'), '=', 'PENDING')
    .execute();

  await schema
    .createTable('capital_allocations')
    .addColumn('allocation_id', 'varchar(80)', (column) => column.primaryKey())
    .addColumn('decision_id', 'varchar(80)', (column) =>
      column.notNull().unique().references(`${schemaName}.capital_decisions.decision_id`),
    )
    .addColumn('provider_account_id', 'varchar(80)', (column) =>
      column.notNull().references(`${schemaName}.capital_provider_accounts.provider_account_id`),
    )
    .addColumn('recipient_business_id', 'varchar(80)', (column) =>
      column.notNull().references(`${schemaName}.businesses.business_id`),
    )
    .addColumn('amount_micro_usdc', 'numeric(30, 0)', (column) => column.notNull())
    .addColumn('asset', 'varchar(16)', (column) => column.notNull())
    .addColumn('instrument', 'varchar(48)', (column) => column.notNull())
    .addColumn('return_profile', 'varchar(16)', (column) => column.notNull())
    .addColumn('provenance', 'varchar(32)', (column) => column.notNull())
    .addColumn('state', 'varchar(24)', (column) => column.notNull())
    .addColumn('accepted_by_principal_id', 'varchar(80)', (column) =>
      column.references(`${schemaName}.principals.principal_id`),
    )
    .addColumn('accepted_at', 'timestamptz')
    .addColumn('idempotency_key', 'uuid', (column) => column.notNull().unique())
    .addColumn('provider_transaction_id', 'varchar(128)', (column) => column.unique())
    .addColumn('provider_state', 'varchar(48)')
    .addColumn('transaction_hash', 'varchar(66)', (column) => column.unique())
    .addColumn('block_number', 'numeric(78, 0)')
    .addColumn('created_at', 'timestamptz', (column) =>
      column.defaultTo(sql`current_timestamp`).notNull(),
    )
    .addColumn('updated_at', 'timestamptz', (column) =>
      column.defaultTo(sql`current_timestamp`).notNull(),
    )
    .addColumn('completed_at', 'timestamptz')
    .addCheckConstraint(
      'capital_allocations_profile_check',
      sql`amount_micro_usdc > 0 and asset = 'USDC'
          and instrument = 'CONTROLLED_TEST_ALLOCATION'
          and return_profile = 'NONE'
          and provenance = 'COMMON_CONTROL_TEST'`,
    )
    .addCheckConstraint(
      'capital_allocations_state_check',
      sql`state in ('OFFERED', 'AUTHORIZED', 'SUBMITTED', 'OUTCOME_UNKNOWN', 'COMPLETE', 'FAILED')`,
    )
    .addCheckConstraint(
      'capital_allocations_acceptance_check',
      sql`(state = 'OFFERED' and accepted_by_principal_id is null and accepted_at is null)
          or (state <> 'OFFERED' and accepted_by_principal_id is not null and accepted_at is not null)`,
    )
    .addCheckConstraint(
      'capital_allocations_outcome_check',
      sql`(state in ('OFFERED', 'AUTHORIZED') and provider_transaction_id is null and transaction_hash is null and block_number is null and completed_at is null)
          or (state in ('SUBMITTED', 'FAILED') and provider_transaction_id is not null and transaction_hash is null and block_number is null and completed_at is null)
          or (state = 'OUTCOME_UNKNOWN' and transaction_hash is null and block_number is null and completed_at is null)
          or (state = 'COMPLETE' and provider_transaction_id is not null and transaction_hash is not null and block_number is not null and completed_at is not null)`,
    )
    .execute();

  await schema
    .createTable('capital_use_links')
    .addColumn('capital_use_id', 'varchar(80)', (column) => column.primaryKey())
    .addColumn('allocation_id', 'varchar(80)', (column) =>
      column.notNull().references(`${schemaName}.capital_allocations.allocation_id`),
    )
    .addColumn('obligation_id', 'varchar(80)', (column) =>
      column.notNull().references(`${schemaName}.obligations.obligation_id`),
    )
    .addColumn('amount_micro_usdc', 'numeric(30, 0)', (column) => column.notNull())
    .addColumn('linked_by_principal_id', 'varchar(80)', (column) =>
      column.notNull().references(`${schemaName}.principals.principal_id`),
    )
    .addColumn('linked_at', 'timestamptz', (column) => column.notNull())
    .addUniqueConstraint('capital_use_links_allocation_obligation_unique', [
      'allocation_id',
      'obligation_id',
    ])
    .addCheckConstraint('capital_use_links_amount_check', sql`amount_micro_usdc > 0`)
    .execute();

  await schema
    .alterTable('economic_entries')
    .alterColumn('obligation_id', (column) => column.dropNotNull())
    .execute();
  await schema
    .alterTable('economic_entries')
    .alterColumn('settlement_id', (column) => column.dropNotNull())
    .execute();
  await schema
    .alterTable('economic_entries')
    .addColumn('capital_allocation_id', 'varchar(80)', (column) =>
      column.references(`${schemaName}.capital_allocations.allocation_id`),
    )
    .execute();
  await schema
    .alterTable('economic_entries')
    .addCheckConstraint(
      'economic_entries_source_check',
      sql`(obligation_id is not null and settlement_id is not null and capital_allocation_id is null)
          or (obligation_id is null and settlement_id is null and capital_allocation_id is not null)`,
    )
    .execute();
  await schema
    .alterTable('economic_entries')
    .addCheckConstraint(
      'economic_entries_capital_shape_check',
      sql`capital_allocation_id is null or (category = 'CAPITAL' and direction = 'INFLOW')`,
    )
    .execute();
  await schema
    .createIndex('economic_entries_once_per_capital_allocation')
    .unique()
    .on('economic_entries')
    .columns(['capital_allocation_id', 'business_id', 'category'])
    .where('capital_allocation_id', 'is not', null)
    .execute();

  await schema
    .createIndex('capital_reviews_business_observed_idx')
    .on('capital_reviews')
    .columns(['business_id', 'observed_at'])
    .execute();
  await schema
    .createIndex('capital_allocations_business_updated_idx')
    .on('capital_allocations')
    .columns(['recipient_business_id', 'updated_at'])
    .execute();
  await schema
    .createIndex('capital_allocations_state_updated_idx')
    .on('capital_allocations')
    .columns(['state', 'updated_at'])
    .execute();
}

export async function down(database: Kysely<unknown>): Promise<void> {
  const schema = database.schema.withSchema(schemaName);

  await schema.dropIndex('capital_allocations_state_updated_idx').execute();
  await schema.dropIndex('capital_allocations_business_updated_idx').execute();
  await schema.dropIndex('capital_reviews_business_observed_idx').execute();
  await schema.dropIndex('economic_entries_once_per_capital_allocation').execute();
  await schema
    .alterTable('economic_entries')
    .dropConstraint('economic_entries_capital_shape_check')
    .execute();
  await schema
    .alterTable('economic_entries')
    .dropConstraint('economic_entries_source_check')
    .execute();
  await sql`delete from inomasa_app.economic_entries where capital_allocation_id is not null`.execute(
    database,
  );
  await schema
    .alterTable('economic_entries')
    .dropColumn('capital_allocation_id')
    .execute();
  await schema
    .alterTable('economic_entries')
    .alterColumn('settlement_id', (column) => column.setNotNull())
    .execute();
  await schema
    .alterTable('economic_entries')
    .alterColumn('obligation_id', (column) => column.setNotNull())
    .execute();
  await schema.dropTable('capital_use_links').execute();
  await schema.dropTable('capital_allocations').execute();
  await schema.dropIndex('capital_provider_accounts_one_pending_per_provider').execute();
  await schema.dropIndex('capital_provider_accounts_one_active_per_provider').execute();
  await schema.dropTable('capital_provider_accounts').execute();
  await schema.dropTable('capital_decisions').execute();
  await schema.dropTable('capital_reviews').execute();
  await schema.dropTable('capital_mandates').execute();
  await schema.dropTable('capital_providers').execute();
}
