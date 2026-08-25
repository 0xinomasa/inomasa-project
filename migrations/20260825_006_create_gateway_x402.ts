import { sql, type Kysely } from 'kysely';

const schemaName = 'inomasa_app';

export async function up(database: Kysely<unknown>): Promise<void> {
  const schema = database.schema.withSchema(schemaName);

  await schema
    .createTable('gateway_funding_operations')
    .addColumn('funding_id', 'varchar(80)', (column) => column.primaryKey())
    .addColumn('business_id', 'varchar(80)', (column) =>
      column.notNull().references(`${schemaName}.businesses.business_id`),
    )
    .addColumn('depositor_address', 'varchar(42)', (column) => column.notNull())
    .addColumn('gateway_contract_address', 'varchar(42)', (column) => column.notNull())
    .addColumn('amount_micro_usdc', 'numeric(30, 0)', (column) => column.notNull())
    .addColumn('approval_idempotency_key', 'uuid', (column) => column.notNull().unique())
    .addColumn('deposit_idempotency_key', 'uuid', (column) => column.notNull().unique())
    .addColumn('approval_provider_transaction_id', 'varchar(128)', (column) => column.unique())
    .addColumn('approval_transaction_hash', 'varchar(66)', (column) => column.unique())
    .addColumn('deposit_provider_transaction_id', 'varchar(128)', (column) => column.unique())
    .addColumn('deposit_transaction_hash', 'varchar(66)', (column) => column.unique())
    .addColumn('provider_state', 'varchar(48)')
    .addColumn('state', 'varchar(32)', (column) => column.notNull())
    .addColumn('created_at', 'timestamptz', (column) =>
      column.defaultTo(sql`current_timestamp`).notNull(),
    )
    .addColumn('updated_at', 'timestamptz', (column) =>
      column.defaultTo(sql`current_timestamp`).notNull(),
    )
    .addCheckConstraint('gateway_funding_amount_check', sql`amount_micro_usdc > 0`)
    .addCheckConstraint(
      'gateway_funding_state_check',
      sql`state in ('APPROVAL_AUTHORIZED', 'APPROVAL_SUBMITTED', 'APPROVAL_COMPLETE',
          'DEPOSIT_SUBMITTED', 'DEPOSIT_COMPLETE', 'OUTCOME_UNKNOWN', 'FAILED')`,
    )
    .execute();

  await schema
    .createTable('x402_payment_operations')
    .addColumn('payment_id', 'varchar(80)', (column) => column.primaryKey())
    .addColumn('settlement_id', 'varchar(80)', (column) =>
      column.notNull().unique().references(`${schemaName}.settlement_operations.settlement_id`),
    )
    .addColumn('obligation_id', 'varchar(80)', (column) =>
      column.notNull().unique().references(`${schemaName}.obligations.obligation_id`),
    )
    .addColumn('execution_authorization_id', 'varchar(80)', (column) =>
      column.notNull().unique().references(`${schemaName}.execution_authorizations.authorization_id`),
    )
    .addColumn('protocol_version', 'integer', (column) => column.notNull())
    .addColumn('scheme', 'varchar(16)', (column) => column.notNull())
    .addColumn('network', 'varchar(32)', (column) => column.notNull())
    .addColumn('asset_address', 'varchar(42)', (column) => column.notNull())
    .addColumn('payer_address', 'varchar(42)', (column) => column.notNull())
    .addColumn('pay_to_address', 'varchar(42)', (column) => column.notNull())
    .addColumn('amount_micro_usdc', 'numeric(30, 0)', (column) => column.notNull())
    .addColumn('payment_required', 'jsonb', (column) => column.notNull())
    .addColumn('payment_required_sha256', 'varchar(64)', (column) => column.notNull())
    .addColumn('payment_payload', 'jsonb')
    .addColumn('payment_payload_sha256', 'varchar(64)')
    .addColumn('provider_state', 'varchar(48)')
    .addColumn('provider_transaction_id', 'varchar(160)', (column) => column.unique())
    .addColumn('state', 'varchar(24)', (column) => column.notNull())
    .addColumn('created_at', 'timestamptz', (column) =>
      column.defaultTo(sql`current_timestamp`).notNull(),
    )
    .addColumn('updated_at', 'timestamptz', (column) =>
      column.defaultTo(sql`current_timestamp`).notNull(),
    )
    .addCheckConstraint('x402_payment_protocol_check', sql`protocol_version = 2 and scheme = 'exact'`)
    .addCheckConstraint('x402_payment_network_check', sql`network = 'eip155:5042002'`)
    .addCheckConstraint(
      'x402_payment_asset_check',
      sql`lower(asset_address) = '0x3600000000000000000000000000000000000000'`,
    )
    .addCheckConstraint('x402_payment_amount_check', sql`amount_micro_usdc > 0`)
    .addCheckConstraint(
      'x402_payment_state_check',
      sql`state in ('REQUIRED', 'SIGNED', 'VERIFIED', 'OUTCOME_UNKNOWN', 'COMPLETE', 'FAILED')`,
    )
    .addCheckConstraint(
      'x402_payment_payload_check',
      sql`(state = 'REQUIRED' and payment_payload is null and payment_payload_sha256 is null) or
          (state <> 'REQUIRED' and payment_payload is not null and payment_payload_sha256 is not null)`,
    )
    .execute();

  await schema
    .createIndex('gateway_funding_business_state_idx')
    .on('gateway_funding_operations')
    .columns(['business_id', 'state'])
    .execute();
  await schema
    .createIndex('x402_payment_state_updated_idx')
    .on('x402_payment_operations')
    .columns(['state', 'updated_at'])
    .execute();
}

export async function down(database: Kysely<unknown>): Promise<void> {
  const schema = database.schema.withSchema(schemaName);
  await schema.dropIndex('x402_payment_state_updated_idx').execute();
  await schema.dropIndex('gateway_funding_business_state_idx').execute();
  await schema.dropTable('x402_payment_operations').execute();
  await schema.dropTable('gateway_funding_operations').execute();
}
