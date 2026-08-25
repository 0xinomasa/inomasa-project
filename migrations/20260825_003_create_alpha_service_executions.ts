import { sql, type Kysely } from 'kysely';

const schemaName = 'inomasa_app';

export async function up(database: Kysely<unknown>): Promise<void> {
  const schema = database.schema.withSchema(schemaName);

  await schema
    .createTable('service_executions')
    .addColumn('execution_id', 'varchar(80)', (column) => column.primaryKey())
    .addColumn('obligation_id', 'varchar(80)', (column) =>
      column.notNull().unique().references(`${schemaName}.obligations.obligation_id`),
    )
    .addColumn('settlement_id', 'varchar(80)', (column) =>
      column.notNull().references(`${schemaName}.settlement_operations.settlement_id`),
    )
    .addColumn('capability_id', 'varchar(96)', (column) => column.notNull())
    .addColumn('provider_business_id', 'varchar(80)', (column) =>
      column.notNull().references(`${schemaName}.businesses.business_id`),
    )
    .addColumn('consumer_business_id', 'varchar(80)', (column) =>
      column.notNull().references(`${schemaName}.businesses.business_id`),
    )
    .addColumn('state', 'varchar(24)', (column) => column.notNull())
    .addColumn('provenance', 'varchar(32)', (column) => column.notNull())
    .addColumn('environment', 'varchar(32)', (column) => column.notNull())
    .addColumn('output', 'jsonb', (column) => column.notNull())
    .addColumn('output_sha256', 'varchar(64)', (column) => column.notNull())
    .addColumn('source_reference', 'varchar(160)', (column) => column.notNull())
    .addColumn('completed_at', 'timestamptz', (column) => column.notNull())
    .addColumn('created_at', 'timestamptz', (column) =>
      column.defaultTo(sql`current_timestamp`).notNull(),
    )
    .addCheckConstraint('service_executions_state_check', sql`state in ('COMPLETE')`)
    .addCheckConstraint(
      'service_executions_distinct_parties_check',
      sql`provider_business_id <> consumer_business_id`,
    )
    .execute();

  await schema
    .createIndex('service_executions_provider_completed_idx')
    .on('service_executions')
    .columns(['provider_business_id', 'completed_at'])
    .execute();
}

export async function down(database: Kysely<unknown>): Promise<void> {
  await database.schema
    .withSchema(schemaName)
    .dropTable('service_executions')
    .ifExists()
    .execute();
}
