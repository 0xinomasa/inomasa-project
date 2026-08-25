import { sql, type Kysely } from 'kysely';

const schemaName = 'inomasa_app';

export async function up(database: Kysely<unknown>): Promise<void> {
  const schema = database.schema.withSchema(schemaName);

  await schema
    .createTable('agent_registrations')
    .addColumn('agent_principal_id', 'varchar(80)', (column) =>
      column.primaryKey().references(`${schemaName}.principals.principal_id`),
    )
    .addColumn('provider_of_record_principal_id', 'varchar(80)', (column) =>
      column.notNull().references(`${schemaName}.principals.principal_id`),
    )
    .addColumn('software_version', 'varchar(48)', (column) => column.notNull())
    .addColumn('runtime_class', 'varchar(32)', (column) => column.notNull())
    .addColumn('status', 'varchar(16)', (column) => column.notNull())
    .addColumn('created_at', 'timestamptz', (column) =>
      column.defaultTo(sql`current_timestamp`).notNull(),
    )
    .addCheckConstraint('agent_registrations_status_check', sql`status in ('ACTIVE', 'RETIRED')`)
    .addCheckConstraint(
      'agent_registrations_runtime_check',
      sql`runtime_class in ('OPERATOR_INVOKED', 'HOSTED')`,
    )
    .execute();

  await schema
    .createTable('standing_authority_grants')
    .addColumn('grant_id', 'varchar(80)', (column) => column.primaryKey())
    .addColumn('grant_version', 'integer', (column) => column.notNull())
    .addColumn('grantee_principal_id', 'varchar(80)', (column) =>
      column.notNull().references(`${schemaName}.principals.principal_id`),
    )
    .addColumn('grantor_principal_id', 'varchar(80)', (column) =>
      column.notNull().references(`${schemaName}.principals.principal_id`),
    )
    .addColumn('represented_business_id', 'varchar(80)', (column) =>
      column.notNull().references(`${schemaName}.businesses.business_id`),
    )
    .addColumn('authority_domain_business_id', 'varchar(80)', (column) =>
      column.notNull().references(`${schemaName}.businesses.business_id`),
    )
    .addColumn('action_type', 'varchar(48)', (column) => column.notNull())
    .addColumn('allowed_offer_id', 'varchar(80)', (column) => column.notNull())
    .addColumn('allowed_counterparty_business_id', 'varchar(80)', (column) =>
      column.notNull().references(`${schemaName}.businesses.business_id`),
    )
    .addColumn('asset', 'varchar(16)', (column) => column.notNull())
    .addColumn('environment', 'varchar(32)', (column) => column.notNull())
    .addColumn('max_per_action_micro_usdc', 'numeric(30, 0)', (column) => column.notNull())
    .addColumn('allowance_total_micro_usdc', 'numeric(30, 0)', (column) => column.notNull())
    .addColumn('allowance_consumed_micro_usdc', 'numeric(30, 0)', (column) =>
      column.defaultTo(0).notNull(),
    )
    .addColumn('control_version', 'integer', (column) => column.notNull())
    .addColumn('delegation_allowed', 'boolean', (column) => column.defaultTo(false).notNull())
    .addColumn('status', 'varchar(16)', (column) => column.notNull())
    .addColumn('valid_from', 'timestamptz', (column) => column.notNull())
    .addColumn('expires_at', 'timestamptz', (column) => column.notNull())
    .addColumn('revoked_at', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (column) =>
      column.defaultTo(sql`current_timestamp`).notNull(),
    )
    .addUniqueConstraint('standing_authority_grants_version_unique', ['grant_id', 'grant_version'])
    .addCheckConstraint(
      'standing_authority_grants_scope_check',
      sql`represented_business_id = authority_domain_business_id`,
    )
    .addCheckConstraint(
      'standing_authority_grants_action_check',
      sql`action_type = 'PURCHASE_SERVICE'`,
    )
    .addCheckConstraint('standing_authority_grants_asset_check', sql`asset = 'USDC'`)
    .addCheckConstraint(
      'standing_authority_grants_amount_check',
      sql`max_per_action_micro_usdc > 0 and
          allowance_total_micro_usdc > 0 and
          allowance_consumed_micro_usdc >= 0 and
          allowance_consumed_micro_usdc <= allowance_total_micro_usdc and
          max_per_action_micro_usdc <= allowance_total_micro_usdc`,
    )
    .addCheckConstraint(
      'standing_authority_grants_validity_check',
      sql`expires_at > valid_from`,
    )
    .addCheckConstraint(
      'standing_authority_grants_status_check',
      sql`status in ('ACTIVE', 'REVOKED', 'EXPIRED')`,
    )
    .addCheckConstraint(
      'standing_authority_grants_revocation_check',
      sql`(status = 'REVOKED' and revoked_at is not null) or
          (status <> 'REVOKED' and revoked_at is null)`,
    )
    .execute();

  await schema
    .createTable('action_intents')
    .addColumn('intent_id', 'varchar(80)', (column) => column.primaryKey())
    .addColumn('requester_principal_id', 'varchar(80)', (column) =>
      column.notNull().references(`${schemaName}.principals.principal_id`),
    )
    .addColumn('represented_business_id', 'varchar(80)', (column) =>
      column.notNull().references(`${schemaName}.businesses.business_id`),
    )
    .addColumn('authority_domain_business_id', 'varchar(80)', (column) =>
      column.notNull().references(`${schemaName}.businesses.business_id`),
    )
    .addColumn('grant_id', 'varchar(80)', (column) =>
      column.notNull().references(`${schemaName}.standing_authority_grants.grant_id`),
    )
    .addColumn('action_type', 'varchar(48)', (column) => column.notNull())
    .addColumn('offer_id', 'varchar(80)', (column) => column.notNull())
    .addColumn('counterparty_business_id', 'varchar(80)', (column) =>
      column.notNull().references(`${schemaName}.businesses.business_id`),
    )
    .addColumn('asset', 'varchar(16)', (column) => column.notNull())
    .addColumn('amount_micro_usdc', 'numeric(30, 0)', (column) => column.notNull())
    .addColumn('purpose', 'varchar(160)', (column) => column.notNull())
    .addColumn('state', 'varchar(16)', (column) => column.notNull())
    .addColumn('requested_at', 'timestamptz', (column) => column.notNull())
    .addCheckConstraint('action_intents_amount_check', sql`amount_micro_usdc > 0`)
    .addCheckConstraint('action_intents_asset_check', sql`asset = 'USDC'`)
    .addCheckConstraint('action_intents_action_check', sql`action_type = 'PURCHASE_SERVICE'`)
    .addCheckConstraint(
      'action_intents_scope_check',
      sql`represented_business_id = authority_domain_business_id`,
    )
    .addCheckConstraint(
      'action_intents_state_check',
      sql`state in ('PROPOSED', 'AUTHORIZED', 'DENIED', 'CONSUMED')`,
    )
    .execute();

  await schema
    .createTable('authority_policy_decisions')
    .addColumn('decision_id', 'varchar(80)', (column) => column.primaryKey())
    .addColumn('intent_id', 'varchar(80)', (column) =>
      column.notNull().unique().references(`${schemaName}.action_intents.intent_id`),
    )
    .addColumn('grant_id', 'varchar(80)', (column) =>
      column.notNull().references(`${schemaName}.standing_authority_grants.grant_id`),
    )
    .addColumn('grant_version', 'integer', (column) => column.notNull())
    .addColumn('policy_version', 'integer', (column) => column.notNull())
    .addColumn('outcome', 'varchar(16)', (column) => column.notNull())
    .addColumn('reason', 'varchar(64)', (column) => column.notNull())
    .addColumn('decided_at', 'timestamptz', (column) => column.notNull())
    .addCheckConstraint(
      'authority_policy_decisions_outcome_check',
      sql`outcome in ('ALLOW', 'DENY', 'ESCALATE')`,
    )
    .execute();

  await schema
    .createTable('execution_authorizations')
    .addColumn('authorization_id', 'varchar(80)', (column) => column.primaryKey())
    .addColumn('intent_id', 'varchar(80)', (column) =>
      column.notNull().unique().references(`${schemaName}.action_intents.intent_id`),
    )
    .addColumn('decision_id', 'varchar(80)', (column) =>
      column.notNull().unique().references(`${schemaName}.authority_policy_decisions.decision_id`),
    )
    .addColumn('grant_id', 'varchar(80)', (column) =>
      column.notNull().references(`${schemaName}.standing_authority_grants.grant_id`),
    )
    .addColumn('grant_version', 'integer', (column) => column.notNull())
    .addColumn('policy_version', 'integer', (column) => column.notNull())
    .addColumn('control_version', 'integer', (column) => column.notNull())
    .addColumn('state', 'varchar(16)', (column) => column.notNull())
    .addColumn('issued_at', 'timestamptz', (column) => column.notNull())
    .addColumn('expires_at', 'timestamptz', (column) => column.notNull())
    .addColumn('consumed_at', 'timestamptz')
    .addColumn('obligation_id', 'varchar(80)', (column) =>
      column.references(`${schemaName}.obligations.obligation_id`),
    )
    .addCheckConstraint(
      'execution_authorizations_state_check',
      sql`state in ('ISSUED', 'CONSUMED', 'REVOKED', 'EXPIRED')`,
    )
    .addCheckConstraint(
      'execution_authorizations_consumption_check',
      sql`(state = 'CONSUMED' and consumed_at is not null and obligation_id is not null) or
          (state <> 'CONSUMED' and consumed_at is null and obligation_id is null)`,
    )
    .addCheckConstraint(
      'execution_authorizations_validity_check',
      sql`expires_at > issued_at`,
    )
    .execute();

  await schema
    .alterTable('obligations')
    .addColumn('requester_principal_id', 'varchar(80)', (column) =>
      column.references(`${schemaName}.principals.principal_id`),
    )
    .addColumn('represented_business_id', 'varchar(80)', (column) =>
      column.references(`${schemaName}.businesses.business_id`),
    )
    .addColumn('execution_authorization_id', 'varchar(80)', (column) =>
      column.unique().references(`${schemaName}.execution_authorizations.authorization_id`),
    )
    .execute();
  await schema
    .alterTable('obligations')
    .addCheckConstraint(
      'obligations_authority_context_check',
      sql`(requester_principal_id is null and represented_business_id is null and execution_authorization_id is null) or
          (requester_principal_id is not null and represented_business_id = buyer_business_id and execution_authorization_id is not null)`,
    )
    .execute();

  await schema
    .createIndex('standing_authority_grants_grantee_status_idx')
    .on('standing_authority_grants')
    .columns(['grantee_principal_id', 'status', 'expires_at'])
    .execute();
  await schema
    .createIndex('action_intents_requester_requested_idx')
    .on('action_intents')
    .columns(['requester_principal_id', 'requested_at'])
    .execute();
}

export async function down(database: Kysely<unknown>): Promise<void> {
  const schema = database.schema.withSchema(schemaName);

  await schema.dropIndex('action_intents_requester_requested_idx').execute();
  await schema.dropIndex('standing_authority_grants_grantee_status_idx').execute();
  await schema.alterTable('obligations').dropConstraint('obligations_authority_context_check').execute();
  await schema.alterTable('obligations').dropColumn('execution_authorization_id').execute();
  await schema.alterTable('obligations').dropColumn('represented_business_id').execute();
  await schema.alterTable('obligations').dropColumn('requester_principal_id').execute();
  await schema.dropTable('execution_authorizations').execute();
  await schema.dropTable('authority_policy_decisions').execute();
  await schema.dropTable('action_intents').execute();
  await schema.dropTable('standing_authority_grants').execute();
  await schema.dropTable('agent_registrations').execute();
}
