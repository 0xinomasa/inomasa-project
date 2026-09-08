import { sql, type Kysely } from 'kysely';
const schemaName = 'inomasa_app';
export async function up(database: Kysely<unknown>): Promise<void> {
  const schema = database.schema.withSchema(schemaName);
  await schema.createTable('business_work')
    .addColumn('work_id', 'text', c => c.primaryKey())
    .addColumn('business_id', 'text', c => c.notNull().references('inomasa_app.businesses.business_id'))
    .addColumn('agent_principal_id', 'text', c => c.notNull().references('inomasa_app.agent_registrations.agent_principal_id'))
    .addColumn('created_by', 'text', c => c.notNull().references('inomasa_app.principals.principal_id'))
    .addColumn('environment', 'text', c => c.notNull())
    .addColumn('request_key', 'text', c => c.notNull())
    .addColumn('objective', 'text', c => c.notNull())
    .addColumn('acceptance_criteria', 'text', c => c.notNull())
    .addColumn('capability', 'text', c => c.notNull().defaultTo('ARC_RESEARCH_V1'))
    .addColumn('context', 'jsonb', c => c.notNull())
    .addColumn('state', 'text', c => c.notNull().defaultTo('READY'))
    .addColumn('step', 'text', c => c.notNull().defaultTo('OBSERVE'))
    .addColumn('revision', 'integer', c => c.notNull().defaultTo(0))
    .addColumn('active_attempt_id', 'text')
    .addColumn('lease_until', 'timestamptz')
    .addColumn('observation', 'jsonb')
    .addColumn('generation', 'jsonb')
    .addColumn('failure', 'text')
    .addColumn('reviewed_by', 'text').addColumn('review_note', 'text')
    .addColumn('created_at', 'timestamptz', c => c.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', c => c.notNull().defaultTo(sql`now()`))
    .addUniqueConstraint('work_request_unique', ['business_id', 'request_key'])
    .addCheckConstraint('work_state_check', sql`state in ('READY','RUNNING','RETRYABLE','WAITING_REVIEW','COMPLETED','CANCELLED')`)
    .addCheckConstraint('work_step_check', sql`step in ('OBSERVE','ANALYZE','REVIEW') and capability = 'ARC_RESEARCH_V1'`)
    .addCheckConstraint('work_revision_check', sql`revision >= 0`)
    .addCheckConstraint('work_lease_check', sql`(state = 'RUNNING' and active_attempt_id is not null and lease_until is not null) or (state <> 'RUNNING' and active_attempt_id is null and lease_until is null)`)
    .addCheckConstraint('work_progress_check', sql`(step = 'OBSERVE' and observation is null and generation is null) or (step = 'ANALYZE' and observation is not null and generation is null) or (step = 'REVIEW' and observation is not null and generation is not null)`)
    .addCheckConstraint('work_review_check', sql`(state not in ('WAITING_REVIEW','COMPLETED') or step = 'REVIEW') and (state <> 'COMPLETED' or (reviewed_by is not null and review_note is not null))`)
    .execute();
  await schema.createIndex('business_work_business_updated').on('business_work').columns(['business_id','updated_at']).execute();
  await schema.createTable('business_work_attempts')
    .addColumn('attempt_id','text',c=>c.primaryKey())
    .addColumn('work_id','text',c=>c.notNull().references('inomasa_app.business_work.work_id'))
    .addColumn('step','text',c=>c.notNull())
    .addColumn('state','text',c=>c.notNull())
    .addColumn('provider','text').addColumn('model','text').addColumn('failure','text')
    .addColumn('started_at','timestamptz',c=>c.notNull().defaultTo(sql`now()`))
    .addColumn('finished_at','timestamptz')
    .addCheckConstraint('work_attempt_state_check',sql`state in ('RUNNING','COMPLETED','FAILED','OUTCOME_UNKNOWN')`)
    .addCheckConstraint('work_attempt_step_check',sql`step in ('OBSERVE','ANALYZE')`)
    .execute();
  await schema.createIndex('work_attempts_work').on('business_work_attempts').columns(['work_id','step']).execute();
}
export async function down(database: Kysely<unknown>): Promise<void> {
  const schema = database.schema.withSchema(schemaName);
  await schema.dropTable('business_work_attempts').execute();
  await schema.dropTable('business_work').execute();
}
