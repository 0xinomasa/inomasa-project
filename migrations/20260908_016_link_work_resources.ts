import { sql, type Kysely } from 'kysely';
export async function up(database: Kysely<unknown>): Promise<void> {
  const schema = database.schema.withSchema('inomasa_app');
  await schema.alterTable('service_offers').addColumn('alpha_shared','boolean',c=>c.notNull().defaultTo(false)).execute();
  await schema.alterTable('business_work').addColumn('resource_input','jsonb').execute();
  await schema.createTable('business_work_resources')
    .addColumn('work_id','text',c=>c.primaryKey().references('inomasa_app.business_work.work_id'))
    .addColumn('request_id','uuid',c=>c.notNull().unique())
    .addColumn('offer_id','text',c=>c.notNull().references('inomasa_app.service_offers.offer_id'))
    .addColumn('reason','text',c=>c.notNull())
    .addColumn('terms','jsonb',c=>c.notNull())
    .addColumn('state','text',c=>c.notNull().defaultTo('PROPOSED'))
    .addColumn('proposed_by','text',c=>c.notNull().references('inomasa_app.principals.principal_id'))
    .addColumn('canonical_request_id','uuid',c=>c.references('inomasa_app.product_economic_requests.request_id'))
    .addColumn('approved_by','text')
    .addColumn('purchase_agent_id','text',c=>c.references('inomasa_app.agent_registrations.agent_principal_id'))
    .addColumn('created_at','timestamptz',c=>c.notNull().defaultTo(sql`now()`))
    .addColumn('approved_at','timestamptz')
    .addCheckConstraint('work_resource_state',sql`state in ('PROPOSED','APPROVED','ATTACHED','DECLINED')`)
    .addCheckConstraint('work_resource_approval',sql`(state in ('PROPOSED','DECLINED') and approved_by is null and approved_at is null and purchase_agent_id is null) or (state in ('APPROVED','ATTACHED') and canonical_request_id = request_id and canonical_request_id is not null and approved_by is not null and approved_at is not null and purchase_agent_id is not null)`)
    .execute();
}
export async function down(database: Kysely<unknown>): Promise<void> {
  const schema = database.schema.withSchema('inomasa_app');
  await schema.dropTable('business_work_resources').execute();
  await schema.alterTable('business_work').dropColumn('resource_input').execute();
  await schema.alterTable('service_offers').dropColumn('alpha_shared').execute();
}
