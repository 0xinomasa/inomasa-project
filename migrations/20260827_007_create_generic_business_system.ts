import { sql, type Kysely } from 'kysely';

const schemaName = 'inomasa_app';

export async function up(database: Kysely<unknown>): Promise<void> {
  const schema = database.schema.withSchema(schemaName);

  await schema
    .createTable('business_templates')
    .addColumn('template_id', 'varchar(64)', (column) => column.notNull())
    .addColumn('version', 'integer', (column) => column.notNull())
    .addColumn('label', 'varchar(160)', (column) => column.notNull())
    .addColumn('description', 'text', (column) => column.notNull())
    .addColumn('default_name', 'varchar(160)', (column) => column.notNull())
    .addColumn('default_site_headline', 'varchar(240)', (column) => column.notNull())
    .addColumn('capabilities', 'jsonb', (column) => column.notNull())
    .addColumn('status', 'varchar(16)', (column) => column.notNull())
    .addColumn('created_at', 'timestamptz', (column) =>
      column.defaultTo(sql`current_timestamp`).notNull(),
    )
    .addPrimaryKeyConstraint('business_templates_primary', ['template_id', 'version'])
    .addCheckConstraint('business_templates_status_check', sql`status in ('ACTIVE', 'RETIRED')`)
    .execute();

  await sql`
    insert into ${sql.table(`${schemaName}.business_templates`)}
      (template_id, version, label, description, default_name, default_site_headline, capabilities, status)
    values
      (
        'api-data-compute', 1, 'API / Data / Compute',
        'Sell APIs, data, analytics, verification, inference, or compute as reusable resources.',
        'New Data Business', 'Useful data, delivered for people and software.',
        '["DATA_API", "X402_READY"]'::jsonb, 'ACTIVE'
      ),
      (
        'saas-micro-saas', 1, 'SaaS / Micro-SaaS',
        'Offer digital software and automation to people, Businesses, or their Agents.',
        'New SaaS Business', 'Focused software for a specific operational job.',
        '["SOFTWARE_SERVICE", "COMMERCE_READY"]'::jsonb, 'ACTIVE'
      ),
      (
        'agent-as-a-service', 1, 'Agent-as-a-Service',
        'Sell bounded research, coding, design, marketing, analysis, or specialist Agent work.',
        'New Agent Service', 'Specialist Agent capability inside a real Business context.',
        '["AGENT_SERVICE", "IDENTITY_READY"]'::jsonb, 'ACTIVE'
      ),
      (
        'web3-native-digital', 1, 'Web3-native Digital Business',
        'Build onchain analytics, monitoring, accounting, verification, or settlement services.',
        'New Web3 Business', 'Digital services grounded in observable onchain activity.',
        '["ONCHAIN_SERVICE", "ARC_READY"]'::jsonb, 'ACTIVE'
      )
  `.execute(database);

  await schema
    .alterTable('businesses')
    .addColumn('entry_route', 'varchar(16)', (column) =>
      column.defaultTo('BUILD').notNull(),
    )
    .addColumn('slug', 'varchar(96)')
    .addColumn('summary', 'text')
    .execute();

  await sql`
    update ${sql.table(`${schemaName}.businesses`)}
    set
      slug = case business_id
        when 'biz_signal_forge' then 'signal-forge'
        when 'biz_ops_pilot' then 'ops-pilot'
        else trim(both '-' from lower(regexp_replace(display_name, '[^a-zA-Z0-9]+', '-', 'g')))
          || '-' || substr(md5(business_id), 1, 8)
      end,
      summary = case business_id
        when 'biz_signal_forge' then 'Normalized Arc Testnet signal snapshots for controlled machine commerce.'
        when 'biz_ops_pilot' then 'Operational readiness briefs built from authenticated Arc signal data.'
        else 'Controlled Alpha Business created through the reusable Inomasa Business System.'
      end
  `.execute(database);

  await sql`
    alter table ${sql.table(`${schemaName}.businesses`)}
      alter column slug set not null,
      alter column summary set not null
  `.execute(database);

  await schema
    .alterTable('businesses')
    .addCheckConstraint('businesses_entry_route_check', sql`entry_route in ('BUILD', 'MIGRATE')`)
    .execute();
  await schema
    .createIndex('businesses_slug_unique')
    .unique()
    .on('businesses')
    .column('slug')
    .execute();
  await schema
    .createIndex('businesses_controller_lookup')
    .on('business_controls')
    .columns(['controller_principal_id', 'status'])
    .execute();

  await schema
    .createTable('business_sites')
    .addColumn('site_id', 'varchar(80)', (column) => column.primaryKey())
    .addColumn('business_id', 'varchar(80)', (column) =>
      column.notNull().unique().references(`${schemaName}.businesses.business_id`),
    )
    .addColumn('slug', 'varchar(96)', (column) => column.notNull().unique())
    .addColumn('headline', 'varchar(240)', (column) => column.notNull())
    .addColumn('description', 'text', (column) => column.notNull())
    .addColumn('status', 'varchar(16)', (column) => column.notNull())
    .addColumn('visibility', 'varchar(24)', (column) => column.notNull())
    .addColumn('created_at', 'timestamptz', (column) =>
      column.defaultTo(sql`current_timestamp`).notNull(),
    )
    .addColumn('updated_at', 'timestamptz', (column) =>
      column.defaultTo(sql`current_timestamp`).notNull(),
    )
    .addCheckConstraint('business_sites_status_check', sql`status in ('DRAFT', 'PUBLISHED')`)
    .addCheckConstraint(
      'business_sites_visibility_check',
      sql`visibility in ('PROTECTED_ALPHA')`,
    )
    .execute();

  await sql`
    insert into ${sql.table(`${schemaName}.business_sites`)}
      (site_id, business_id, slug, headline, description, status, visibility)
    select
      replace(business_id, 'biz_', 'site_'),
      business_id,
      slug,
      case business_id
        when 'biz_signal_forge' then 'Arc signal data for deterministic machine commerce.'
        when 'biz_ops_pilot' then 'Operational decisions grounded in paid, authenticated data.'
        else display_name
      end,
      summary,
      'PUBLISHED',
      'PROTECTED_ALPHA'
    from ${sql.table(`${schemaName}.businesses`)}
  `.execute(database);
}

export async function down(database: Kysely<unknown>): Promise<void> {
  const schema = database.schema.withSchema(schemaName);

  await schema.dropTable('business_sites').ifExists().execute();
  await schema.dropIndex('businesses_controller_lookup').ifExists().execute();
  await schema.dropIndex('businesses_slug_unique').ifExists().execute();
  await schema
    .alterTable('businesses')
    .dropConstraint('businesses_entry_route_check')
    .execute();
  await schema
    .alterTable('businesses')
    .dropColumn('summary')
    .dropColumn('slug')
    .dropColumn('entry_route')
    .execute();
  await schema.dropTable('business_templates').ifExists().execute();
}
