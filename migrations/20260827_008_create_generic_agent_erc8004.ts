import { sql, type Kysely } from 'kysely';

const schemaName = 'inomasa_app';

export async function up(database: Kysely<unknown>): Promise<void> {
  const schema = database.schema.withSchema(schemaName);

  await schema
    .alterTable('agent_registrations')
    .addColumn('business_id', 'varchar(80)', (column) =>
      column.references(`${schemaName}.businesses.business_id`),
    )
    .addColumn('role', 'varchar(80)')
    .addColumn('capabilities', 'jsonb')
    .execute();
  await sql`
    update ${sql.table(`${schemaName}.agent_registrations`)}
    set business_id = provider_of_record_principal_id,
        role = 'BUYER_AGENT',
        capabilities = '["purchase-service"]'::jsonb
    where business_id is null
  `.execute(database);
  await schema
    .alterTable('agent_registrations')
    .alterColumn('business_id', (column) => column.setNotNull())
    .alterColumn('role', (column) => column.setNotNull())
    .alterColumn('capabilities', (column) => column.setNotNull())
    .execute();
  await schema
    .alterTable('agent_registrations')
    .addCheckConstraint(
      'agent_registrations_business_provider_check',
      sql`business_id = provider_of_record_principal_id`,
    )
    .execute();
  await schema
    .alterTable('agent_registrations')
    .addCheckConstraint(
      'agent_registrations_capabilities_check',
      sql`jsonb_typeof(capabilities) = 'array' and jsonb_array_length(capabilities) > 0`,
    )
    .execute();

  await schema
    .createTable('erc8004_identity_operations')
    .addColumn('identity_id', 'varchar(80)', (column) => column.primaryKey())
    .addColumn('agent_principal_id', 'varchar(80)', (column) =>
      column.notNull().unique().references(`${schemaName}.agent_registrations.agent_principal_id`),
    )
    .addColumn('chain_id', 'integer', (column) => column.notNull())
    .addColumn('identity_registry_address', 'varchar(42)', (column) => column.notNull())
    .addColumn('reputation_registry_address', 'varchar(42)', (column) => column.notNull())
    .addColumn('owner_address', 'varchar(42)', (column) => column.notNull())
    .addColumn('agent_id', 'numeric(78, 0)')
    .addColumn('agent_registry', 'varchar(128)')
    .addColumn('registration_uri', 'text')
    .addColumn('registration_provider_transaction_id', 'varchar(80)')
    .addColumn('registration_transaction_hash', 'varchar(66)')
    .addColumn('metadata_provider_transaction_id', 'varchar(80)')
    .addColumn('metadata_transaction_hash', 'varchar(66)')
    .addColumn('provider_state', 'varchar(48)')
    .addColumn('state', 'varchar(32)', (column) => column.notNull())
    .addColumn('provenance', 'varchar(32)', (column) => column.notNull())
    .addColumn('verified_at', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (column) =>
      column.defaultTo(sql`current_timestamp`).notNull(),
    )
    .addColumn('updated_at', 'timestamptz', (column) =>
      column.defaultTo(sql`current_timestamp`).notNull(),
    )
    .addCheckConstraint('erc8004_chain_check', sql`chain_id = 5042002`)
    .addCheckConstraint(
      'erc8004_provenance_check',
      sql`provenance in ('COMMON_CONTROL_TEST', 'INDEPENDENT')`,
    )
    .addCheckConstraint(
      'erc8004_state_check',
      sql`state in ('REGISTER_AUTHORIZED', 'REGISTER_SUBMITTED', 'IDENTITY_REGISTERED', 'METADATA_SUBMITTED', 'VERIFIED', 'OUTCOME_UNKNOWN', 'FAILED')`,
    )
    .addCheckConstraint(
      'erc8004_identity_check',
      sql`(agent_id is null and agent_registry is null) or (agent_id is not null and agent_id >= 0 and agent_registry is not null)`,
    )
    .execute();

  await schema
    .alterTable('action_intents')
    .addColumn('erc8004_identity_id', 'varchar(80)', (column) =>
      column.references(`${schemaName}.erc8004_identity_operations.identity_id`),
    )
    .execute();

  await schema
    .createIndex('agent_registrations_business_status_idx')
    .on('agent_registrations')
    .columns(['business_id', 'status'])
    .execute();
  await schema
    .createIndex('erc8004_identity_state_idx')
    .on('erc8004_identity_operations')
    .columns(['state', 'updated_at'])
    .execute();
}

export async function down(database: Kysely<unknown>): Promise<void> {
  const schema = database.schema.withSchema(schemaName);
  await schema.dropIndex('erc8004_identity_state_idx').execute();
  await schema.dropIndex('agent_registrations_business_status_idx').execute();
  await schema.alterTable('action_intents').dropColumn('erc8004_identity_id').execute();
  await schema.dropTable('erc8004_identity_operations').execute();
  await schema.alterTable('agent_registrations').dropConstraint('agent_registrations_capabilities_check').execute();
  await schema.alterTable('agent_registrations').dropConstraint('agent_registrations_business_provider_check').execute();
  await schema.alterTable('agent_registrations').dropColumn('capabilities').execute();
  await schema.alterTable('agent_registrations').dropColumn('role').execute();
  await schema.alterTable('agent_registrations').dropColumn('business_id').execute();
}
