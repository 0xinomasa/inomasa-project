import { sql, type Kysely } from 'kysely';

const schemaName = 'inomasa_app';

export async function up(database: Kysely<unknown>): Promise<void> {
  const schema = database.schema.withSchema(schemaName);
  await schema
    .alterTable('capital_allocations')
    .dropConstraint('capital_allocations_profile_check')
    .execute();
  await schema
    .alterTable('capital_allocations')
    .addCheckConstraint(
      'capital_allocations_profile_check',
      sql`amount_micro_usdc > 0 and asset = 'USDC'
          and instrument = 'CONTROLLED_TEST_ALLOCATION'
          and return_profile = 'NONE'
          and provenance in ('COMMON_CONTROL_TEST', 'INDEPENDENT')`,
    )
    .execute();
}

export async function down(database: Kysely<unknown>): Promise<void> {
  const schema = database.schema.withSchema(schemaName);
  await schema
    .alterTable('capital_allocations')
    .dropConstraint('capital_allocations_profile_check')
    .execute();
  await schema
    .alterTable('capital_allocations')
    .addCheckConstraint(
      'capital_allocations_profile_check',
      sql`amount_micro_usdc > 0 and asset = 'USDC'
          and instrument = 'CONTROLLED_TEST_ALLOCATION'
          and return_profile = 'NONE'
          and provenance = 'COMMON_CONTROL_TEST'`,
    )
    .execute();
}
