import { sql, type Kysely } from 'kysely';

const schemaName = 'inomasa_app';

export async function up(database: Kysely<unknown>): Promise<void> {
  const schema = database.schema.withSchema(schemaName);
  await schema
    .createTable('product_economic_requests')
    .addColumn('request_id', 'uuid', (column) => column.primaryKey())
    .addColumn('operation_kind', 'varchar(24)', (column) => column.notNull())
    .addColumn('controller_principal_id', 'varchar(80)', (column) =>
      column.notNull().references(`${schemaName}.principals.principal_id`),
    )
    .addColumn('buyer_business_id', 'varchar(80)', (column) =>
      column.notNull().references(`${schemaName}.businesses.business_id`),
    )
    .addColumn('agent_principal_id', 'varchar(80)', (column) =>
      column.references(`${schemaName}.principals.principal_id`),
    )
    .addColumn('offer_id', 'varchar(80)', (column) =>
      column.notNull().references(`${schemaName}.service_offers.offer_id`),
    )
    .addColumn('obligation_id', 'varchar(80)', (column) =>
      column.notNull().unique().references(`${schemaName}.obligations.obligation_id`),
    )
    .addColumn('settlement_id', 'varchar(80)', (column) =>
      column.notNull().unique().references(`${schemaName}.settlement_operations.settlement_id`),
    )
    .addColumn('payment_id', 'varchar(80)', (column) =>
      column.unique().references(`${schemaName}.x402_payment_operations.payment_id`),
    )
    .addColumn('job_id', 'varchar(80)', (column) =>
      column.unique().references(`${schemaName}.erc8183_jobs.job_id`),
    )
    .addColumn('service_execution_id', 'varchar(80)', (column) => column.notNull().unique())
    .addColumn('gateway_funding_id', 'varchar(80)')
    .addColumn('requested_at', 'timestamptz', (column) => column.notNull())
    .addColumn('created_at', 'timestamptz', (column) =>
      column.defaultTo(sql`current_timestamp`).notNull(),
    )
    .addCheckConstraint(
      'product_economic_requests_kind_check',
      sql`operation_kind in ('X402_PURCHASE', 'ERC8183_JOB')`,
    )
    .addCheckConstraint(
      'product_economic_requests_shape_check',
      sql`(
        operation_kind = 'X402_PURCHASE'
        and agent_principal_id is not null
        and payment_id is not null
        and job_id is null
        and gateway_funding_id is not null
      ) or (
        operation_kind = 'ERC8183_JOB'
        and agent_principal_id is null
        and payment_id is null
        and job_id is not null
        and gateway_funding_id is null
      )`,
    )
    .execute();
  await schema
    .createIndex('product_economic_requests_business_requested_idx')
    .on('product_economic_requests')
    .columns(['buyer_business_id', 'requested_at'])
    .execute();
}

export async function down(database: Kysely<unknown>): Promise<void> {
  await database.schema
    .withSchema(schemaName)
    .dropTable('product_economic_requests')
    .execute();
}
