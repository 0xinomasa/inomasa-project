import { sql, type Kysely } from 'kysely';

const schemaName = 'inomasa_app';

export async function up(database: Kysely<unknown>): Promise<void> {
  const schema = database.schema.withSchema(schemaName);

  await schema
    .alterTable('treasury_bindings')
    .addCheckConstraint(
      'treasury_bindings_active_material_check',
      sql`status <> 'ACTIVE' or (address is not null and provider_wallet_id is not null and ended_at is null)`,
    )
    .execute();
  await schema
    .createIndex('treasury_bindings_one_active_per_business')
    .unique()
    .on('treasury_bindings')
    .column('business_id')
    .where(sql.ref('status'), '=', 'ACTIVE')
    .execute();
  await schema
    .createIndex('treasury_bindings_one_pending_per_business')
    .unique()
    .on('treasury_bindings')
    .column('business_id')
    .where(sql.ref('status'), '=', 'PENDING')
    .execute();

  await schema
    .alterTable('obligations')
    .addCheckConstraint('obligations_usdc_asset_check', sql`asset = 'USDC'`)
    .execute();
  await schema
    .alterTable('settlement_operations')
    .addCheckConstraint('settlement_operations_amount_check', sql`amount_micro_usdc > 0`)
    .execute();
  await schema
    .alterTable('settlement_operations')
    .addCheckConstraint('settlement_operations_arc_chain_check', sql`chain_id = 5042002`)
    .execute();
  await schema
    .alterTable('settlement_operations')
    .addCheckConstraint(
      'settlement_operations_usdc_interface_check',
      sql`lower(asset_address) = '0x3600000000000000000000000000000000000000'`,
    )
    .execute();

  await schema
    .alterTable('economic_entries')
    .addCheckConstraint(
      'economic_entries_category_direction_check',
      sql`(category = 'REVENUE' and direction = 'INFLOW') or
          (category = 'SERVICE_COST' and direction = 'OUTFLOW') or
          category in ('OWNER_CONTRIBUTION', 'CAPITAL', 'REFUND')`,
    )
    .execute();
  await schema
    .alterTable('service_executions')
    .addCheckConstraint(
      'service_executions_private_testnet_check',
      sql`environment = 'PRIVATE_ARC_TESTNET'`,
    )
    .execute();
}

export async function down(database: Kysely<unknown>): Promise<void> {
  const schema = database.schema.withSchema(schemaName);

  await schema
    .alterTable('service_executions')
    .dropConstraint('service_executions_private_testnet_check')
    .execute();
  await schema
    .alterTable('economic_entries')
    .dropConstraint('economic_entries_category_direction_check')
    .execute();
  await schema
    .alterTable('settlement_operations')
    .dropConstraint('settlement_operations_usdc_interface_check')
    .execute();
  await schema
    .alterTable('settlement_operations')
    .dropConstraint('settlement_operations_arc_chain_check')
    .execute();
  await schema
    .alterTable('settlement_operations')
    .dropConstraint('settlement_operations_amount_check')
    .execute();
  await schema
    .alterTable('obligations')
    .dropConstraint('obligations_usdc_asset_check')
    .execute();
  await schema.dropIndex('treasury_bindings_one_pending_per_business').execute();
  await schema.dropIndex('treasury_bindings_one_active_per_business').execute();
  await schema
    .alterTable('treasury_bindings')
    .dropConstraint('treasury_bindings_active_material_check')
    .execute();
}
