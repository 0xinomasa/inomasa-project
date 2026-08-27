import {
  evaluateAgentPurchaseAuthority,
  type AgentPurchaseIntent,
  type AuthorityPolicyDecision,
  type StandingPurchaseAuthorityGrant,
} from '../../modules/authority/model.ts';
import type { UsdcMicroAmount } from '../../modules/commerce/money.ts';
import { validateBusinessAgent } from '../../modules/agent/model.ts';
import { isInomasaEnvironment } from '../../shared/environment.ts';
import type { PersistenceTransaction, PostgresPersistence } from './database.ts';
import { applicationSchema } from './database.ts';

export interface AgentAuthoritySummary {
  readonly agentPrincipalId: string;
  readonly allowanceConsumedMicroUsdc: string;
  readonly allowanceTotalMicroUsdc: string;
  readonly allowedCounterpartyBusinessId: string;
  readonly allowedOfferId: string;
  readonly expiresAt: Date;
  readonly grantId: string;
  readonly grantStatus: string;
  readonly providerOfRecordPrincipalId: string;
  readonly runtimeClass: string;
}

export interface AgentPurchaseAuthorizationIdentifiers {
  readonly authorizationId: `xau_${string}`;
  readonly decisionId: `dec_${string}`;
}

function asGrant(
  row: {
    readonly action_type: string;
    readonly allowance_consumed_micro_usdc: string;
    readonly allowance_total_micro_usdc: string;
    readonly allowed_counterparty_business_id: string;
    readonly allowed_offer_id: string;
    readonly asset: string;
    readonly authority_domain_business_id: string;
    readonly control_version: number;
    readonly delegation_allowed: boolean;
    readonly environment: string;
    readonly expires_at: Date;
    readonly grantee_principal_id: string;
    readonly grant_id: string;
    readonly grant_version: number;
    readonly grantor_principal_id: string;
    readonly max_per_action_micro_usdc: string;
    readonly represented_business_id: string;
    readonly status: string;
    readonly valid_from: Date;
  },
): StandingPurchaseAuthorityGrant {
  if (
    row.action_type !== 'PURCHASE_SERVICE' ||
    row.asset !== 'USDC' ||
    !row.grantee_principal_id.startsWith('agt_') ||
    !row.grant_id.startsWith('grt_') ||
    !row.grantor_principal_id.startsWith('usr_') ||
    !row.represented_business_id.startsWith('biz_') ||
    !row.authority_domain_business_id.startsWith('biz_') ||
    !row.allowed_counterparty_business_id.startsWith('biz_') ||
    !row.allowed_offer_id.startsWith('off_') ||
    !isInomasaEnvironment(row.environment) ||
    row.delegation_allowed ||
    (row.status !== 'ACTIVE' && row.status !== 'EXPIRED' && row.status !== 'REVOKED')
  ) {
    throw new Error('Stored authority grant violates the supported Alpha authority profile.');
  }

  return {
    actionType: row.action_type,
    allowanceConsumedMicroUsdc: BigInt(row.allowance_consumed_micro_usdc) as UsdcMicroAmount,
    allowanceTotalMicroUsdc: BigInt(row.allowance_total_micro_usdc) as UsdcMicroAmount,
    allowedCounterpartyBusinessId: row.allowed_counterparty_business_id as `biz_${string}`,
    allowedOfferId: row.allowed_offer_id as `off_${string}`,
    asset: row.asset,
    authorityDomainBusinessId: row.authority_domain_business_id as `biz_${string}`,
    controlVersion: row.control_version,
    delegationAllowed: false,
    environment: row.environment as StandingPurchaseAuthorityGrant['environment'],
    expiresAt: row.expires_at.toISOString(),
    granteePrincipalId: row.grantee_principal_id as `agt_${string}`,
    grantId: row.grant_id as `grt_${string}`,
    grantVersion: row.grant_version,
    grantorPrincipalId: row.grantor_principal_id as `usr_${string}`,
    maxPerActionMicroUsdc: BigInt(row.max_per_action_micro_usdc) as UsdcMicroAmount,
    representedBusinessId: row.represented_business_id as `biz_${string}`,
    status: row.status,
    validFrom: row.valid_from.toISOString(),
  };
}

function assertSameIntent(
  stored: {
    readonly action_type: string;
    readonly amount_micro_usdc: string;
    readonly asset: string;
    readonly authority_domain_business_id: string;
    readonly counterparty_business_id: string;
    readonly erc8004_identity_id: string | null;
    readonly grant_id: string;
    readonly offer_id: string;
    readonly purpose: string;
    readonly represented_business_id: string;
    readonly requester_principal_id: string;
  },
  intent: AgentPurchaseIntent,
): void {
  if (
    stored.action_type !== intent.actionType ||
    stored.amount_micro_usdc !== intent.amountMicroUsdc.toString() ||
    stored.asset !== intent.asset ||
    stored.authority_domain_business_id !== intent.authorityDomainBusinessId ||
    stored.counterparty_business_id !== intent.counterpartyBusinessId ||
    stored.erc8004_identity_id !== (intent.erc8004IdentityId ?? null) ||
    stored.grant_id !== intent.grantId ||
    stored.offer_id !== intent.offerId ||
    stored.purpose !== intent.purpose ||
    stored.represented_business_id !== intent.representedBusinessId ||
    stored.requester_principal_id !== intent.requesterPrincipalId
  ) {
    throw new Error('Action Intent ID already exists with different authority semantics.');
  }
}

export class PostgresAgentAuthorityRepository {
  readonly #persistence: PostgresPersistence;

  constructor(persistence: PostgresPersistence) {
    this.#persistence = persistence;
  }

  async ensureAgentAndGrant(input: {
    readonly agentBusinessId: `biz_${string}`;
    readonly agentCapabilities: readonly string[];
    readonly agentDisplayName: string;
    readonly agentPrincipalId: `agt_${string}`;
    readonly agentRole: string;
    readonly grant: StandingPurchaseAuthorityGrant;
    readonly providerOfRecordPrincipalId: `biz_${string}`;
    readonly runtimeClass: 'OPERATOR_INVOKED';
    readonly softwareVersion: string;
  }): Promise<{ readonly created: boolean }> {
    validateBusinessAgent({
      agentPrincipalId: input.agentPrincipalId,
      businessId: input.agentBusinessId,
      capabilities: input.agentCapabilities,
      displayName: input.agentDisplayName,
      environment: input.grant.environment,
      providerOfRecordPrincipalId: input.providerOfRecordPrincipalId,
      role: input.agentRole,
      runtimeClass: input.runtimeClass,
      softwareVersion: input.softwareVersion,
      status: 'ACTIVE',
    });
    if (input.agentPrincipalId !== input.grant.granteePrincipalId) {
      throw new Error('Grant grantee must be the Agent being registered.');
    }
    if (input.providerOfRecordPrincipalId !== input.grant.representedBusinessId) {
      throw new Error('The Alpha Agent provider-of-record must be its represented Business.');
    }
    if (input.agentBusinessId !== input.grant.representedBusinessId) {
      throw new Error('The Agent Business relationship must match represented authority.');
    }

    return this.#persistence.transaction(async (transaction) => {
      const database = transaction.withSchema(applicationSchema);
      const control = await database
        .selectFrom('business_controls as control')
        .innerJoin('businesses as business', 'business.business_id', 'control.business_id')
        .select([
          'business.actor_classification as actorClassification',
          'business.environment as environment',
        ])
        .where('control.business_id', '=', input.grant.representedBusinessId)
        .where('control.controller_principal_id', '=', input.grant.grantorPrincipalId)
        .where('control.control_version', '=', input.grant.controlVersion)
        .where('control.status', '=', 'ACTIVE')
        .executeTakeFirstOrThrow();
      if (control.environment !== input.grant.environment) {
        throw new Error('Grant environment does not match the represented Business.');
      }

      const principal = await database
        .insertInto('principals')
        .values({
          actor_classification: control.actorClassification,
          display_name: input.agentDisplayName,
          environment: input.grant.environment,
          principal_id: input.agentPrincipalId,
          principal_kind: 'AGENT',
        })
        .onConflict((conflict) => conflict.column('principal_id').doNothing())
        .returning('principal_id')
        .executeTakeFirst();

      await database
        .insertInto('agent_registrations')
        .values({
          agent_principal_id: input.agentPrincipalId,
          business_id: input.agentBusinessId,
          capabilities: JSON.stringify(input.agentCapabilities),
          provider_of_record_principal_id: input.providerOfRecordPrincipalId,
          role: input.agentRole,
          runtime_class: input.runtimeClass,
          software_version: input.softwareVersion,
          status: 'ACTIVE',
        })
        .onConflict((conflict) => conflict.column('agent_principal_id').doNothing())
        .execute();

      await database
        .insertInto('standing_authority_grants')
        .values({
          action_type: input.grant.actionType,
          allowance_consumed_micro_usdc: input.grant.allowanceConsumedMicroUsdc.toString(),
          allowance_total_micro_usdc: input.grant.allowanceTotalMicroUsdc.toString(),
          allowed_counterparty_business_id: input.grant.allowedCounterpartyBusinessId,
          allowed_offer_id: input.grant.allowedOfferId,
          asset: input.grant.asset,
          authority_domain_business_id: input.grant.authorityDomainBusinessId,
          control_version: input.grant.controlVersion,
          delegation_allowed: input.grant.delegationAllowed,
          environment: input.grant.environment,
          expires_at: input.grant.expiresAt,
          grantee_principal_id: input.grant.granteePrincipalId,
          grant_id: input.grant.grantId,
          grant_version: input.grant.grantVersion,
          grantor_principal_id: input.grant.grantorPrincipalId,
          max_per_action_micro_usdc: input.grant.maxPerActionMicroUsdc.toString(),
          represented_business_id: input.grant.representedBusinessId,
          revoked_at: null,
          status: input.grant.status,
          valid_from: input.grant.validFrom,
        })
        .onConflict((conflict) => conflict.column('grant_id').doNothing())
        .execute();

      const registration = await database
        .selectFrom('agent_registrations')
        .select([
          'business_id',
          'capabilities',
          'provider_of_record_principal_id',
          'role',
          'runtime_class',
          'software_version',
          'status',
        ])
        .where('agent_principal_id', '=', input.agentPrincipalId)
        .executeTakeFirstOrThrow();
      if (
        registration.business_id !== input.agentBusinessId ||
        JSON.stringify(registration.capabilities) !== JSON.stringify(input.agentCapabilities) ||
        registration.provider_of_record_principal_id !== input.providerOfRecordPrincipalId ||
        registration.role !== input.agentRole ||
        registration.runtime_class !== input.runtimeClass ||
        registration.software_version !== input.softwareVersion ||
        registration.status !== 'ACTIVE'
      ) {
        throw new Error('Agent principal already exists with different registration semantics.');
      }

      const storedGrant = await database
        .selectFrom('standing_authority_grants')
        .selectAll()
        .where('grant_id', '=', input.grant.grantId)
        .executeTakeFirstOrThrow();
      const normalizedGrant = asGrant(storedGrant);
      if (
        normalizedGrant.granteePrincipalId !== input.grant.granteePrincipalId ||
        normalizedGrant.grantorPrincipalId !== input.grant.grantorPrincipalId ||
        normalizedGrant.allowedOfferId !== input.grant.allowedOfferId ||
        normalizedGrant.allowedCounterpartyBusinessId !== input.grant.allowedCounterpartyBusinessId ||
        normalizedGrant.maxPerActionMicroUsdc !== input.grant.maxPerActionMicroUsdc ||
        normalizedGrant.allowanceTotalMicroUsdc !== input.grant.allowanceTotalMicroUsdc ||
        normalizedGrant.controlVersion !== input.grant.controlVersion ||
        normalizedGrant.validFrom !== input.grant.validFrom ||
        normalizedGrant.expiresAt !== input.grant.expiresAt
      ) {
        throw new Error('Authority Grant ID already exists with different bounded scope.');
      }

      return { created: principal !== undefined };
    });
  }

  async authorizePurchaseInTransaction(
    transaction: PersistenceTransaction,
    input: {
      readonly evaluatedAt: string;
      readonly executionAuthorizationExpiresAt: string;
      readonly identifiers: AgentPurchaseAuthorizationIdentifiers;
      readonly intent: AgentPurchaseIntent;
      readonly policyVersion: number;
    },
  ): Promise<{ readonly authorizationId: `xau_${string}`; readonly created: boolean }> {
    const database = transaction.withSchema(applicationSchema);
    const existingIntent = await database
      .selectFrom('action_intents')
      .selectAll()
      .where('intent_id', '=', input.intent.intentId)
      .executeTakeFirst();

    if (existingIntent !== undefined) {
      assertSameIntent(existingIntent, input.intent);
      const authorization = await database
        .selectFrom('execution_authorizations')
        .select(['authorization_id', 'state'])
        .where('intent_id', '=', input.intent.intentId)
        .executeTakeFirstOrThrow();
      if (authorization.authorization_id !== input.identifiers.authorizationId) {
        throw new Error('Existing Action Intent resolved to a different execution authorization.');
      }
      if (authorization.state !== 'ISSUED' && authorization.state !== 'CONSUMED') {
        throw new Error(`Execution authorization is not usable from state ${authorization.state}.`);
      }
      return { authorizationId: input.identifiers.authorizationId, created: false };
    }

    const storedGrant = await database
      .selectFrom('standing_authority_grants')
      .selectAll()
      .where('grant_id', '=', input.intent.grantId)
      .forUpdate()
      .executeTakeFirstOrThrow();
    const grant = asGrant(storedGrant);
    const decision: AuthorityPolicyDecision = evaluateAgentPurchaseAuthority(
      grant,
      input.intent,
      input.evaluatedAt,
    );

    if (input.intent.erc8004IdentityId !== undefined) {
      const identity = await database
        .selectFrom('erc8004_identity_operations')
        .select(['agent_principal_id', 'state'])
        .where('identity_id', '=', input.intent.erc8004IdentityId)
        .executeTakeFirstOrThrow();
      if (identity.agent_principal_id !== input.intent.requesterPrincipalId || identity.state !== 'VERIFIED') {
        throw new Error('Economic action requires the requester\'s verified ERC-8004 identity.');
      }
    }

    await database
      .insertInto('action_intents')
      .values({
        action_type: input.intent.actionType,
        amount_micro_usdc: input.intent.amountMicroUsdc.toString(),
        asset: input.intent.asset,
        authority_domain_business_id: input.intent.authorityDomainBusinessId,
        counterparty_business_id: input.intent.counterpartyBusinessId,
        erc8004_identity_id: input.intent.erc8004IdentityId ?? null,
        grant_id: input.intent.grantId,
        intent_id: input.intent.intentId,
        offer_id: input.intent.offerId,
        purpose: input.intent.purpose,
        represented_business_id: input.intent.representedBusinessId,
        requested_at: input.intent.requestedAt,
        requester_principal_id: input.intent.requesterPrincipalId,
        state: decision.outcome === 'ALLOW' ? 'AUTHORIZED' : 'DENIED',
      })
      .executeTakeFirstOrThrow();

    await database
      .insertInto('authority_policy_decisions')
      .values({
        decided_at: input.evaluatedAt,
        decision_id: input.identifiers.decisionId,
        grant_id: grant.grantId,
        grant_version: grant.grantVersion,
        intent_id: input.intent.intentId,
        outcome: decision.outcome,
        policy_version: input.policyVersion,
        reason: decision.reason,
      })
      .executeTakeFirstOrThrow();

    if (decision.outcome !== 'ALLOW') {
      throw new Error(`Agent purchase denied: ${decision.reason}.`);
    }
    const evaluatedAtEpoch = Date.parse(input.evaluatedAt);
    const executionExpiresAtEpoch = Date.parse(input.executionAuthorizationExpiresAt);
    if (
      !Number.isFinite(executionExpiresAtEpoch) ||
      executionExpiresAtEpoch <= evaluatedAtEpoch ||
      executionExpiresAtEpoch > Date.parse(grant.expiresAt)
    ) {
      throw new Error('Execution authorization expiry must be positive and bounded by the grant.');
    }

    const allowance = await database
      .updateTable('standing_authority_grants')
      .set({
        allowance_consumed_micro_usdc: (
          grant.allowanceConsumedMicroUsdc + input.intent.amountMicroUsdc
        ).toString(),
      })
      .where('grant_id', '=', grant.grantId)
      .where('grant_version', '=', grant.grantVersion)
      .where('allowance_consumed_micro_usdc', '=', grant.allowanceConsumedMicroUsdc.toString())
      .executeTakeFirstOrThrow();
    if (allowance.numUpdatedRows !== 1n) {
      throw new Error('Agent Authority Allowance changed concurrently; authorization failed closed.');
    }

    await database
      .insertInto('execution_authorizations')
      .values({
        authorization_id: input.identifiers.authorizationId,
        consumed_at: null,
        control_version: grant.controlVersion,
        decision_id: input.identifiers.decisionId,
        expires_at: input.executionAuthorizationExpiresAt,
        grant_id: grant.grantId,
        grant_version: grant.grantVersion,
        intent_id: input.intent.intentId,
        issued_at: input.evaluatedAt,
        obligation_id: null,
        policy_version: input.policyVersion,
        state: 'ISSUED',
      })
      .executeTakeFirstOrThrow();

    return { authorizationId: input.identifiers.authorizationId, created: true };
  }

  async consumeAuthorizationInTransaction(
    transaction: PersistenceTransaction,
    input: {
      readonly authorizationId: `xau_${string}`;
      readonly consumedAt: string;
      readonly obligationId: `obl_${string}`;
    },
  ): Promise<void> {
    const database = transaction.withSchema(applicationSchema);
    const existing = await database
      .selectFrom('execution_authorizations')
      .select(['control_version', 'grant_id', 'grant_version', 'intent_id', 'obligation_id', 'state'])
      .where('authorization_id', '=', input.authorizationId)
      .forUpdate()
      .executeTakeFirstOrThrow();
    if (existing.state === 'CONSUMED') {
      if (existing.obligation_id !== input.obligationId) {
        throw new Error('Execution authorization was consumed by another obligation.');
      }
      return;
    }
    if (existing.state !== 'ISSUED') {
      throw new Error(`Execution authorization cannot be consumed from state ${existing.state}.`);
    }

    const grant = await database
      .selectFrom('standing_authority_grants')
      .select(['expires_at', 'represented_business_id', 'status'])
      .where('grant_id', '=', existing.grant_id)
      .where('grant_version', '=', existing.grant_version)
      .forUpdate()
      .executeTakeFirstOrThrow();
    if (grant.status !== 'ACTIVE' || grant.expires_at <= new Date(input.consumedAt)) {
      throw new Error('Parent authority grant is no longer executable.');
    }
    const currentControl = await database
      .selectFrom('business_controls')
      .select('control_id')
      .where('business_id', '=', grant.represented_business_id)
      .where('control_version', '=', existing.control_version)
      .where('status', '=', 'ACTIVE')
      .executeTakeFirst();
    if (currentControl === undefined) {
      throw new Error('Execution authorization is stale for the current Business control version.');
    }

    const authorization = await database
      .updateTable('execution_authorizations')
      .set({
        consumed_at: input.consumedAt,
        obligation_id: input.obligationId,
        state: 'CONSUMED',
      })
      .where('authorization_id', '=', input.authorizationId)
      .where('state', '=', 'ISSUED')
      .where('expires_at', '>', new Date(input.consumedAt))
      .executeTakeFirstOrThrow();
    if (authorization.numUpdatedRows !== 1n) {
      throw new Error('Execution authorization expired or changed before commitment.');
    }

    await database
      .updateTable('action_intents')
      .set({ state: 'CONSUMED' })
      .where('intent_id', '=', existing.intent_id)
      .where('state', '=', 'AUTHORIZED')
      .executeTakeFirstOrThrow();
  }

  async revokeGrant(input: {
    readonly grantId: `grt_${string}`;
    readonly grantorPrincipalId: `usr_${string}`;
    readonly revokedAt: string;
  }): Promise<void> {
    await this.#persistence.transaction(async (transaction) => {
      const database = transaction.withSchema(applicationSchema);
      const result = await database
        .updateTable('standing_authority_grants')
        .set({ revoked_at: input.revokedAt, status: 'REVOKED' })
        .where('grant_id', '=', input.grantId)
        .where('grantor_principal_id', '=', input.grantorPrincipalId)
        .where('status', '=', 'ACTIVE')
        .executeTakeFirstOrThrow();
      if (result.numUpdatedRows !== 1n) {
        throw new Error('Active authority grant was not revoked by its recorded grantor.');
      }

      await database
        .updateTable('execution_authorizations')
        .set({ state: 'REVOKED' })
        .where('grant_id', '=', input.grantId)
        .where('state', '=', 'ISSUED')
        .execute();
    });
  }

  async listAgentAuthorities(): Promise<readonly AgentAuthoritySummary[]> {
    return this.#persistence.databaseForApplication
      .withSchema(applicationSchema)
      .selectFrom('standing_authority_grants as grant')
      .innerJoin(
        'agent_registrations as registration',
        'registration.agent_principal_id',
        'grant.grantee_principal_id',
      )
      .select([
        'grant.grantee_principal_id as agentPrincipalId',
        'grant.allowance_consumed_micro_usdc as allowanceConsumedMicroUsdc',
        'grant.allowance_total_micro_usdc as allowanceTotalMicroUsdc',
        'grant.allowed_counterparty_business_id as allowedCounterpartyBusinessId',
        'grant.allowed_offer_id as allowedOfferId',
        'grant.expires_at as expiresAt',
        'grant.grant_id as grantId',
        'grant.status as grantStatus',
        'registration.provider_of_record_principal_id as providerOfRecordPrincipalId',
        'registration.runtime_class as runtimeClass',
      ])
      .orderBy('grant.created_at', 'desc')
      .execute();
  }
}
