import { sql, type Kysely } from 'kysely';

const schemaName = 'inomasa_app';

export async function up(database: Kysely<unknown>): Promise<void> {
  const schema = database.schema.withSchema(schemaName);

  await schema
    .alterTable('service_offers')
    .dropConstraint('service_offers_status_check')
    .execute();
  await schema
    .alterTable('service_offers')
    .addColumn('commerce_protocol', 'varchar(16)', (column) =>
      column.defaultTo('DIRECT_USDC').notNull(),
    )
    .addColumn('created_by_principal_id', 'varchar(80)', (column) =>
      column.references(`${schemaName}.principals.principal_id`),
    )
    .addColumn('idempotency_key', 'uuid')
    .addColumn('updated_at', 'timestamptz', (column) =>
      column.defaultTo(sql`current_timestamp`).notNull(),
    )
    .execute();
  await schema
    .alterTable('service_offers')
    .addCheckConstraint(
      'service_offers_status_check',
      sql`status in ('DRAFT', 'ACTIVE', 'RETIRED')`,
    )
    .execute();
  await schema
    .alterTable('service_offers')
    .addCheckConstraint(
      'service_offers_protocol_check',
      sql`commerce_protocol in ('DIRECT_USDC', 'X402', 'ERC8183')`,
    )
    .execute();
  await schema
    .alterTable('service_offers')
    .addCheckConstraint(
      'service_offers_product_origin_check',
      sql`(created_by_principal_id is null and idempotency_key is null) or
          (created_by_principal_id is not null and idempotency_key is not null)`,
    )
    .execute();

  await sql`
    update ${sql.table(`${schemaName}.service_offers`)}
    set commerce_protocol = case
      when offer_id in (
        'off_arc_snapshot_x402_v1',
        'off_reference_arc_snapshot_x402_v1'
      ) then 'X402'
      when offer_id in (
        'off_commerce_readiness_8183_v1',
        'off_reference_economy_8183_v1'
      ) then 'ERC8183'
      else 'DIRECT_USDC'
    end
  `.execute(database);

  await schema
    .createIndex('service_offers_idempotency_unique')
    .unique()
    .on('service_offers')
    .column('idempotency_key')
    .where('idempotency_key', 'is not', null)
    .execute();
  await schema
    .createIndex('service_offers_business_status_idx')
    .on('service_offers')
    .columns(['provider_business_id', 'status', 'updated_at'])
    .execute();
}

export async function down(database: Kysely<unknown>): Promise<void> {
  const schema = database.schema.withSchema(schemaName);

  await sql`
    update ${sql.table(`${schemaName}.service_offers`)}
    set status = 'RETIRED', updated_at = current_timestamp
    where status = 'DRAFT'
  `.execute(database);
  await schema.dropIndex('service_offers_business_status_idx').execute();
  await schema.dropIndex('service_offers_idempotency_unique').execute();
  await schema
    .alterTable('service_offers')
    .dropConstraint('service_offers_product_origin_check')
    .execute();
  await schema
    .alterTable('service_offers')
    .dropConstraint('service_offers_protocol_check')
    .execute();
  await schema
    .alterTable('service_offers')
    .dropConstraint('service_offers_status_check')
    .execute();
  await schema
    .alterTable('service_offers')
    .dropColumn('updated_at')
    .dropColumn('idempotency_key')
    .dropColumn('created_by_principal_id')
    .dropColumn('commerce_protocol')
    .execute();
  await schema
    .alterTable('service_offers')
    .addCheckConstraint(
      'service_offers_status_check',
      sql`status in ('ACTIVE', 'RETIRED')`,
    )
    .execute();
}
