import { sql, type Kysely } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  const schema = db.schema.withSchema('inomasa_app');
  await schema.createTable('accounts')
    .addColumn('account_id', 'text', c => c.primaryKey())
    .addColumn('environment', 'text', c => c.notNull())
    .addColumn('provider_app_id', 'text', c => c.notNull())
    .addColumn('provider_subject', 'text', c => c.notNull())
    .addColumn('created_at', 'timestamptz', c => c.notNull().defaultTo(sql`now()`))
    .addUniqueConstraint('account_circle_identity', ['environment', 'provider_app_id', 'provider_subject'])
    .execute();
  await schema.createTable('account_sessions')
    .addColumn('token_hash', 'text', c => c.primaryKey())
    .addColumn('environment', 'text', c => c.notNull())
    .addColumn('entry_email', 'text', c => c.notNull())
    .addColumn('account_id', 'text', c => c.references('inomasa_app.accounts.account_id'))
    .addColumn('challenge_hash', 'text')
    .addColumn('challenge_expires_at', 'timestamptz')
    .addColumn('expires_at', 'timestamptz', c => c.notNull())
    .addColumn('created_at', 'timestamptz', c => c.notNull().defaultTo(sql`now()`))
    .execute();
  await schema.createIndex('account_sessions_expiry').on('account_sessions').column('expires_at').execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.withSchema('inomasa_app').dropTable('account_sessions').execute();
  await db.schema.withSchema('inomasa_app').dropTable('accounts').execute();
}
