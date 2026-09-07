import { sql, type Kysely } from 'kysely';

const schemaName = 'inomasa_app';

export async function up(database: Kysely<unknown>): Promise<void> {
  const schema = database.schema.withSchema(schemaName);

  await schema
    .alterTable('erc8183_job_operations')
    .dropConstraint('erc8183_operation_outcome_check')
    .execute();
  await schema
    .alterTable('erc8183_job_operations')
    .addCheckConstraint(
      'erc8183_operation_outcome_check',
      sql`(state = 'AUTHORIZED' and provider_transaction_id is null and transaction_hash is null and block_number is null) or
          (state = 'OUTCOME_UNKNOWN' and transaction_hash is null and block_number is null) or
          (state in ('SUBMITTED', 'FAILED') and provider_transaction_id is not null and transaction_hash is null and block_number is null) or
          (state = 'COMPLETE' and provider_transaction_id is not null and transaction_hash is not null and block_number is not null)`,
    )
    .execute();
}

export async function down(database: Kysely<unknown>): Promise<void> {
  const schema = database.schema.withSchema(schemaName);

  await schema
    .alterTable('erc8183_job_operations')
    .dropConstraint('erc8183_operation_outcome_check')
    .execute();
  await schema
    .alterTable('erc8183_job_operations')
    .addCheckConstraint(
      'erc8183_operation_outcome_check',
      sql`(state = 'AUTHORIZED' and provider_transaction_id is null and transaction_hash is null and block_number is null) or
          (state in ('SUBMITTED', 'OUTCOME_UNKNOWN', 'FAILED') and provider_transaction_id is not null and transaction_hash is null and block_number is null) or
          (state = 'COMPLETE' and provider_transaction_id is not null and transaction_hash is not null and block_number is not null)`,
    )
    .execute();
}
