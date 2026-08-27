import { sql, type Kysely } from 'kysely';

const schemaName = 'inomasa_app';

export async function up(database: Kysely<unknown>): Promise<void> {
  const schema = database.schema.withSchema(schemaName);

  await schema
    .alterTable('settlement_operations')
    .dropConstraint('settlement_operations_state_check')
    .execute();
  await schema
    .alterTable('settlement_operations')
    .addCheckConstraint(
      'settlement_operations_state_check',
      sql`state in ('AUTHORIZED', 'SUBMITTED', 'OUTCOME_UNKNOWN', 'COMPLETE', 'FAILED', 'REFUNDED')`,
    )
    .execute();

  await schema
    .createTable('erc8183_jobs')
    .addColumn('job_id', 'varchar(80)', (column) => column.primaryKey())
    .addColumn('protocol_job_id', 'numeric(78, 0)', (column) => column.unique())
    .addColumn('offer_id', 'varchar(80)', (column) =>
      column.notNull().references(`${schemaName}.service_offers.offer_id`),
    )
    .addColumn('obligation_id', 'varchar(80)', (column) =>
      column.notNull().unique().references(`${schemaName}.obligations.obligation_id`),
    )
    .addColumn('settlement_id', 'varchar(80)', (column) =>
      column.notNull().unique().references(`${schemaName}.settlement_operations.settlement_id`),
    )
    .addColumn('contract_address', 'varchar(42)', (column) => column.notNull())
    .addColumn('chain_id', 'integer', (column) => column.notNull())
    .addColumn('payment_token_address', 'varchar(42)', (column) => column.notNull())
    .addColumn('client_business_id', 'varchar(80)', (column) =>
      column.notNull().references(`${schemaName}.businesses.business_id`),
    )
    .addColumn('provider_business_id', 'varchar(80)', (column) =>
      column.notNull().references(`${schemaName}.businesses.business_id`),
    )
    .addColumn('client_address', 'varchar(42)', (column) => column.notNull())
    .addColumn('provider_address', 'varchar(42)', (column) => column.notNull())
    .addColumn('evaluator_address', 'varchar(42)', (column) => column.notNull())
    .addColumn('hook_address', 'varchar(42)', (column) => column.notNull())
    .addColumn('description', 'text', (column) => column.notNull())
    .addColumn('budget_micro_usdc', 'numeric(30, 0)', (column) => column.notNull())
    .addColumn('expired_at', 'timestamptz', (column) => column.notNull())
    .addColumn('deliverable_hash', 'varchar(66)')
    .addColumn('evaluation_hash', 'varchar(66)')
    .addColumn('protocol_status', 'varchar(16)', (column) => column.notNull())
    .addColumn('provenance', 'varchar(32)', (column) => column.notNull())
    .addColumn('terminal_at', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (column) =>
      column.defaultTo(sql`current_timestamp`).notNull(),
    )
    .addColumn('updated_at', 'timestamptz', (column) =>
      column.defaultTo(sql`current_timestamp`).notNull(),
    )
    .addCheckConstraint('erc8183_chain_check', sql`chain_id = 5042002`)
    .addCheckConstraint(
      'erc8183_contract_check',
      sql`lower(contract_address) = '0x0747eef0706327138c69792bf28cd525089e4583'`,
    )
    .addCheckConstraint(
      'erc8183_asset_check',
      sql`lower(payment_token_address) = '0x3600000000000000000000000000000000000000'`,
    )
    .addCheckConstraint(
      'erc8183_no_hook_check',
      sql`lower(hook_address) = '0x0000000000000000000000000000000000000000'`,
    )
    .addCheckConstraint('erc8183_budget_check', sql`budget_micro_usdc > 0`)
    .addCheckConstraint('erc8183_distinct_businesses_check', sql`client_business_id <> provider_business_id`)
    .addCheckConstraint(
      'erc8183_status_check',
      sql`protocol_status in ('UNCREATED', 'OPEN', 'FUNDED', 'SUBMITTED', 'COMPLETED', 'REJECTED', 'EXPIRED')`,
    )
    .addCheckConstraint(
      'erc8183_provenance_check',
      sql`provenance in ('COMMON_CONTROL_TEST', 'INDEPENDENT')`,
    )
    .addCheckConstraint(
      'erc8183_terminal_check',
      sql`(protocol_status in ('COMPLETED', 'REJECTED', 'EXPIRED')) = (terminal_at is not null)`,
    )
    .execute();

  await schema
    .createTable('erc8183_job_operations')
    .addColumn('operation_id', 'varchar(80)', (column) => column.primaryKey())
    .addColumn('job_id', 'varchar(80)', (column) =>
      column.notNull().references(`${schemaName}.erc8183_jobs.job_id`),
    )
    .addColumn('leg', 'varchar(16)', (column) => column.notNull())
    .addColumn('actor_address', 'varchar(42)', (column) => column.notNull())
    .addColumn('source_provider_wallet_id', 'varchar(128)', (column) => column.notNull())
    .addColumn('idempotency_key', 'uuid', (column) => column.notNull().unique())
    .addColumn('provider_transaction_id', 'varchar(128)', (column) => column.unique())
    .addColumn('transaction_hash', 'varchar(66)', (column) => column.unique())
    .addColumn('provider_state', 'varchar(48)')
    .addColumn('state', 'varchar(24)', (column) => column.notNull())
    .addColumn('block_number', 'numeric(78, 0)')
    .addColumn('created_at', 'timestamptz', (column) =>
      column.defaultTo(sql`current_timestamp`).notNull(),
    )
    .addColumn('updated_at', 'timestamptz', (column) =>
      column.defaultTo(sql`current_timestamp`).notNull(),
    )
    .addUniqueConstraint('erc8183_job_leg_unique', ['job_id', 'leg'])
    .addCheckConstraint(
      'erc8183_operation_leg_check',
      sql`leg in ('CREATE', 'SET_BUDGET', 'APPROVE', 'FUND', 'SUBMIT', 'COMPLETE', 'REJECT', 'REFUND')`,
    )
    .addCheckConstraint(
      'erc8183_operation_state_check',
      sql`state in ('AUTHORIZED', 'SUBMITTED', 'OUTCOME_UNKNOWN', 'COMPLETE', 'FAILED')`,
    )
    .addCheckConstraint(
      'erc8183_operation_outcome_check',
      sql`(state = 'AUTHORIZED' and provider_transaction_id is null and transaction_hash is null and block_number is null) or
          (state in ('SUBMITTED', 'OUTCOME_UNKNOWN', 'FAILED') and provider_transaction_id is not null and transaction_hash is null and block_number is null) or
          (state = 'COMPLETE' and provider_transaction_id is not null and transaction_hash is not null and block_number is not null)`,
    )
    .execute();

  await schema
    .createIndex('erc8183_jobs_status_updated_idx')
    .on('erc8183_jobs')
    .columns(['protocol_status', 'updated_at'])
    .execute();
  await schema
    .createIndex('erc8183_operations_state_updated_idx')
    .on('erc8183_job_operations')
    .columns(['state', 'updated_at'])
    .execute();
}

export async function down(database: Kysely<unknown>): Promise<void> {
  const schema = database.schema.withSchema(schemaName);
  await schema.dropIndex('erc8183_operations_state_updated_idx').execute();
  await schema.dropIndex('erc8183_jobs_status_updated_idx').execute();
  await schema.dropTable('erc8183_job_operations').execute();
  await schema.dropTable('erc8183_jobs').execute();
  await schema
    .alterTable('settlement_operations')
    .dropConstraint('settlement_operations_state_check')
    .execute();
  await schema
    .alterTable('settlement_operations')
    .addCheckConstraint(
      'settlement_operations_state_check',
      sql`state in ('AUTHORIZED', 'SUBMITTED', 'OUTCOME_UNKNOWN', 'COMPLETE', 'FAILED')`,
    )
    .execute();
}
