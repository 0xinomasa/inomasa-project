import { sql, type Kysely } from 'kysely';

const schemaName = 'inomasa_engineering';
const tableName = 'persistence_probe';

export async function up(database: Kysely<unknown>): Promise<void> {
  await database.schema.createSchema(schemaName).ifNotExists().execute();

  await database.schema
    .withSchema(schemaName)
    .createTable(tableName)
    .addColumn('probe_id', 'varchar(64)', (column) => column.primaryKey())
    .addColumn('probe_value', 'varchar(128)', (column) => column.notNull())
    .addColumn('created_at', 'timestamptz', (column) =>
      column.defaultTo(sql`current_timestamp`).notNull(),
    )
    .execute();

  await sql`
    comment on table ${sql.table(`${schemaName}.${tableName}`)} is
    'B3 non-domain engineering probe; never use as an Inomasa business model'
  `.execute(database);
}

export async function down(database: Kysely<unknown>): Promise<void> {
  await database.schema.withSchema(schemaName).dropTable(tableName).ifExists().execute();
  await database.schema.dropSchema(schemaName).ifExists().execute();
}
