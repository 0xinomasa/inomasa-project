import type {
  BusinessGenesis,
  BusinessInstance,
  HumanPrincipal,
} from '../../modules/business/model.ts';
import { createBusinessPackage, type BusinessPackage } from '../../modules/business/business-package.ts';
import {
  getDefaultSiteHeadline,
  isBusinessTemplateId,
  isBusinessTemplateReferenceId,
} from '../../modules/business/templates.ts';
import type { TreasuryBinding } from '../../modules/business/treasury.ts';
import type { PostgresPersistence } from './database.ts';
import { applicationSchema } from './database.ts';

function isActorClassification(value: string): value is BusinessInstance['actorClassification'] {
  return value === 'COMMON_CONTROL_TEST' || value === 'INDEPENDENT';
}

function isBusinessEntryRoute(value: string): value is BusinessInstance['entryRoute'] {
  return value === 'BUILD' || value === 'MIGRATE';
}

function isBusinessEnvironment(value: string): value is BusinessInstance['environment'] {
  return (
    value === 'LOCAL_DEVELOPMENT' ||
    value === 'AUTOMATED_TEST' ||
    value === 'PRIVATE_ARC_TESTNET' ||
    value === 'CLOSED_ARC_TESTNET' ||
    value === 'PUBLIC_DEMO_TESTNET' ||
    value === 'MAINNET'
  );
}

export interface RegisteredBusinessGenesis {
  readonly businessId: `biz_${string}`;
  readonly created: boolean;
  readonly genesisRequestId: string;
}

export interface AlphaBusinessSummary {
  readonly actorClassification: string;
  readonly address: string | null;
  readonly businessId: string;
  readonly controllerPrincipalId: string;
  readonly displayName: string;
  readonly entryRoute: string;
  readonly siteStatus: string;
  readonly slug: string;
  readonly summary: string;
  readonly templateId: string;
  readonly templateVersion: number;
  readonly treasuryStatus: string;
}

export interface BusinessSiteView {
  readonly actorClassification: string;
  readonly businessId: `biz_${string}`;
  readonly businessPackage: BusinessPackage;
  readonly displayName: string;
  readonly entryRoute: 'BUILD' | 'MIGRATE';
  readonly headline: string;
  readonly offers: readonly {
    readonly capabilityId: string;
    readonly description: string;
    readonly offerId: string;
    readonly priceMicroUsdc: string;
    readonly status: string;
  }[];
  readonly siteDescription: string;
  readonly siteStatus: string;
  readonly slug: string;
  readonly templateId: string;
  readonly templateVersion: number;
  readonly treasuryAddress: string | null;
  readonly treasuryStatus: string;
  readonly visibility: string;
}

export interface PendingTreasuryBindingSummary {
  readonly bindingId: `tbn_${string}`;
  readonly businessId: `biz_${string}`;
  readonly displayName: string;
}

export class PostgresAlphaBusinessRepository {
  readonly #persistence: PostgresPersistence;

  constructor(persistence: PostgresPersistence) {
    this.#persistence = persistence;
  }

  async registerGenesis(input: {
    readonly controller: HumanPrincipal;
    readonly genesis: BusinessGenesis;
    readonly treasuryBinding: TreasuryBinding;
  }): Promise<RegisteredBusinessGenesis> {
    return this.#persistence.transaction(async (transaction) => {
      const database = transaction.withSchema(applicationSchema);

      await database
        .insertInto('principals')
        .values({
          actor_classification: input.controller.actorClassification,
          display_name: input.controller.displayName,
          environment: input.controller.environment,
          principal_id: input.controller.principalId,
          principal_kind: 'HUMAN',
        })
        .onConflict((conflict) => conflict.column('principal_id').doNothing())
        .execute();

      const controller = await database
        .selectFrom('principals')
        .select(['actor_classification', 'environment', 'principal_kind'])
        .where('principal_id', '=', input.controller.principalId)
        .executeTakeFirstOrThrow();
      if (
        controller.actor_classification !== input.controller.actorClassification ||
        controller.environment !== input.controller.environment ||
        controller.principal_kind !== 'HUMAN'
      ) {
        throw new Error('Controller Principal ID already exists with different semantics.');
      }

      const request = await database
        .insertInto('genesis_requests')
        .values({
          consumed_at: null,
          genesis_request_id: input.genesis.business.genesisRequestId,
          requester_principal_id: input.controller.principalId,
          state: 'PENDING',
          template_id: input.genesis.business.templateId,
          template_version: input.genesis.business.templateVersion,
        })
        .onConflict((conflict) => conflict.column('genesis_request_id').doNothing())
        .returning('genesis_request_id')
        .executeTakeFirst();

      if (request === undefined) {
        const existing = await database
          .selectFrom('businesses')
          .select([
            'business_id',
            'entry_route',
            'genesis_request_id',
            'slug',
            'summary',
            'template_id',
            'template_version',
          ])
          .where('genesis_request_id', '=', input.genesis.business.genesisRequestId)
          .executeTakeFirstOrThrow();

        if (
          existing.business_id !== input.genesis.business.businessId ||
          (isBusinessTemplateId(input.genesis.business.templateId) &&
            (existing.entry_route !== input.genesis.business.entryRoute ||
              existing.slug !== input.genesis.business.slug ||
              existing.summary !== input.genesis.business.summary)) ||
          existing.template_id !== input.genesis.business.templateId ||
          existing.template_version !== input.genesis.business.templateVersion
        ) {
          throw new Error('Genesis request ID already exists with different Business semantics.');
        }

        return {
          businessId: existing.business_id as `biz_${string}`,
          created: false,
          genesisRequestId: existing.genesis_request_id,
        };
      }

      await database
        .insertInto('principals')
        .values({
          actor_classification: input.genesis.businessPrincipal.actorClassification,
          display_name: input.genesis.businessPrincipal.displayName,
          environment: input.genesis.businessPrincipal.environment,
          principal_id: input.genesis.businessPrincipal.principalId,
          principal_kind: input.genesis.businessPrincipal.principalKind,
        })
        .executeTakeFirstOrThrow();

      await database
        .insertInto('businesses')
        .values({
          actor_classification: input.genesis.business.actorClassification,
          business_id: input.genesis.business.businessId,
          business_principal_id: input.genesis.business.businessPrincipalId,
          common_control_group_id: input.genesis.business.commonControlGroupId ?? null,
          display_name: input.genesis.business.displayName,
          entry_route: input.genesis.business.entryRoute,
          environment: input.genesis.business.environment,
          genesis_request_id: input.genesis.business.genesisRequestId,
          slug: input.genesis.business.slug,
          status: input.genesis.business.status,
          summary: input.genesis.business.summary,
          template_id: input.genesis.business.templateId,
          template_version: input.genesis.business.templateVersion,
        })
        .executeTakeFirstOrThrow();

      await database
        .insertInto('business_sites')
        .values({
          business_id: input.genesis.business.businessId,
          description: input.genesis.business.summary,
          headline: getDefaultSiteHeadline(input.genesis.business.templateId),
          site_id: input.genesis.business.businessId.replace('biz_', 'site_'),
          slug: input.genesis.business.slug,
          status: 'PUBLISHED',
          updated_at: input.genesis.event.occurredAt,
          visibility: 'PROTECTED_ALPHA',
        })
        .executeTakeFirstOrThrow();

      await database
        .insertInto('business_controls')
        .values({
          accepted_at: input.genesis.control.acceptedAt,
          business_id: input.genesis.control.businessId,
          control_id: input.genesis.control.controlId,
          control_version: input.genesis.control.controlVersion,
          controller_principal_id: input.genesis.control.controllerPrincipalId,
          ended_at: null,
          status: input.genesis.control.status,
        })
        .executeTakeFirstOrThrow();

      await database
        .insertInto('business_events')
        .values({
          actor_principal_id: input.genesis.event.actorPrincipalId,
          business_id: input.genesis.event.businessId,
          event_id: input.genesis.event.eventId,
          event_type: input.genesis.event.eventType,
          occurred_at: input.genesis.event.occurredAt,
          payload: {
            actorClassification: input.genesis.business.actorClassification,
            commonControlGroupId: input.genesis.business.commonControlGroupId ?? null,
            entryRoute: input.genesis.business.entryRoute,
            slug: input.genesis.business.slug,
            templateId: input.genesis.business.templateId,
            templateVersion: input.genesis.business.templateVersion,
          },
          request_id: input.genesis.event.requestId,
        })
        .executeTakeFirstOrThrow();

      await database
        .insertInto('treasury_bindings')
        .values({
          account_assurance: input.treasuryBinding.accountAssurance,
          account_type: input.treasuryBinding.accountType,
          address: input.treasuryBinding.address ?? null,
          binding_id: input.treasuryBinding.bindingId,
          binding_version: input.treasuryBinding.bindingVersion,
          blockchain: input.treasuryBinding.blockchain,
          business_id: input.treasuryBinding.businessId,
          custody_model: input.treasuryBinding.custodyModel,
          ended_at: null,
          environment: input.treasuryBinding.environment,
          provider: input.treasuryBinding.provider,
          provider_wallet_id: input.treasuryBinding.providerWalletId ?? null,
          status: input.treasuryBinding.status,
        })
        .executeTakeFirstOrThrow();

      await database
        .updateTable('genesis_requests')
        .set({ consumed_at: input.genesis.event.occurredAt, state: 'CONSUMED' })
        .where('genesis_request_id', '=', input.genesis.business.genesisRequestId)
        .executeTakeFirstOrThrow();

      return {
        businessId: input.genesis.business.businessId,
        created: true,
        genesisRequestId: input.genesis.business.genesisRequestId,
      };
    });
  }

  async listBusinesses(
    controllerPrincipalId?: `usr_${string}`,
  ): Promise<readonly AlphaBusinessSummary[]> {
    let query = this.#persistence.databaseForApplication
      .withSchema(applicationSchema)
      .selectFrom('businesses as business')
      .innerJoin('business_controls as control', (join) =>
        join
          .onRef('control.business_id', '=', 'business.business_id')
          .on('control.status', '=', 'ACTIVE'),
      )
      .leftJoin('treasury_bindings as treasury', (join) =>
        join
          .onRef('treasury.business_id', '=', 'business.business_id')
          .on('treasury.status', 'in', ['PENDING', 'ACTIVE']),
      )
      .innerJoin('business_sites as site', 'site.business_id', 'business.business_id')
      .select([
        'business.actor_classification as actorClassification',
        'treasury.address as address',
        'business.business_id as businessId',
        'control.controller_principal_id as controllerPrincipalId',
        'business.display_name as displayName',
        'business.entry_route as entryRoute',
        'site.status as siteStatus',
        'business.slug as slug',
        'business.summary as summary',
        'business.template_id as templateId',
        'business.template_version as templateVersion',
        'treasury.status as treasuryStatus',
      ])
      .orderBy('business.created_at', 'asc');

    if (controllerPrincipalId !== undefined) {
      query = query.where('control.controller_principal_id', '=', controllerPrincipalId);
    }

    return query.execute()
      .then((rows) =>
        rows.map((row) => ({ ...row, treasuryStatus: row.treasuryStatus ?? 'UNBOUND' })),
      );
  }

  async getBusiness(businessId: `biz_${string}`): Promise<BusinessInstance> {
    const row = await this.#persistence.databaseForApplication
      .withSchema(applicationSchema)
      .selectFrom('businesses')
      .selectAll()
      .where('business_id', '=', businessId)
      .executeTakeFirstOrThrow();

    if (row.status !== 'ACTIVE') {
      throw new Error(`Business ${businessId} is not active.`);
    }
    if (!isBusinessTemplateReferenceId(row.template_id)) {
      throw new Error(`Business ${businessId} has an unknown Alpha template.`);
    }
    if (!isActorClassification(row.actor_classification)) {
      throw new Error(`Business ${businessId} has an invalid actor classification.`);
    }
    if (!isBusinessEnvironment(row.environment)) {
      throw new Error(`Business ${businessId} has an invalid environment.`);
    }
    if (!isBusinessEntryRoute(row.entry_route)) {
      throw new Error(`Business ${businessId} has an invalid entry route.`);
    }

    return {
      actorClassification: row.actor_classification,
      businessId: row.business_id as `biz_${string}`,
      businessPrincipalId: row.business_principal_id as `biz_${string}`,
      ...(row.common_control_group_id === null
        ? {}
        : { commonControlGroupId: row.common_control_group_id }),
      displayName: row.display_name,
      entryRoute: row.entry_route,
      environment: row.environment,
      genesisRequestId: row.genesis_request_id,
      slug: row.slug,
      status: 'ACTIVE',
      summary: row.summary,
      templateId: row.template_id,
      templateVersion: row.template_version,
    };
  }

  async getBusinessSiteBySlug(
    slug: string,
    controllerPrincipalId?: `usr_${string}`,
  ): Promise<BusinessSiteView | undefined> {
    const database = this.#persistence.databaseForApplication.withSchema(applicationSchema);
    let query = database
      .selectFrom('business_sites as site')
      .innerJoin('businesses as business', 'business.business_id', 'site.business_id')
      .innerJoin('business_controls as control', (join) =>
        join
          .onRef('control.business_id', '=', 'business.business_id')
          .on('control.status', '=', 'ACTIVE'),
      )
      .leftJoin('treasury_bindings as treasury', (join) =>
        join
          .onRef('treasury.business_id', '=', 'business.business_id')
          .on('treasury.status', 'in', ['PENDING', 'ACTIVE']),
      )
      .select([
        'business.actor_classification as actorClassification',
        'business.business_id as businessId',
        'business.business_principal_id as businessPrincipalId',
        'business.common_control_group_id as commonControlGroupId',
        'business.display_name as displayName',
        'business.entry_route as entryRoute',
        'business.environment as environment',
        'business.genesis_request_id as genesisRequestId',
        'site.headline as headline',
        'site.description as siteDescription',
        'site.status as siteStatus',
        'site.slug as slug',
        'business.status as businessStatus',
        'business.summary as summary',
        'business.template_id as templateId',
        'business.template_version as templateVersion',
        'treasury.address as treasuryAddress',
        'treasury.status as treasuryStatus',
        'site.visibility as visibility',
      ])
      .where('site.slug', '=', slug)
      .where('site.status', '=', 'PUBLISHED')
      ;

    if (controllerPrincipalId !== undefined) {
      query = query.where('control.controller_principal_id', '=', controllerPrincipalId);
    }

    const row = await query.executeTakeFirst();

    if (row === undefined) {
      return undefined;
    }
    if (!isBusinessTemplateReferenceId(row.templateId)) {
      throw new Error(`Business ${row.businessId} has an unknown Business template reference.`);
    }
    if (!isBusinessEntryRoute(row.entryRoute)) {
      throw new Error(`Business ${row.businessId} has an invalid entry route.`);
    }
    if (!isActorClassification(row.actorClassification)) {
      throw new Error(`Business ${row.businessId} has an invalid actor classification.`);
    }
    if (!isBusinessEnvironment(row.environment)) {
      throw new Error(`Business ${row.businessId} has an invalid environment.`);
    }
    if (row.businessStatus !== 'ACTIVE') {
      return undefined;
    }

    const business: BusinessInstance = {
      actorClassification: row.actorClassification,
      businessId: row.businessId as `biz_${string}`,
      businessPrincipalId: row.businessPrincipalId as `biz_${string}`,
      ...(row.commonControlGroupId === null
        ? {}
        : { commonControlGroupId: row.commonControlGroupId }),
      displayName: row.displayName,
      entryRoute: row.entryRoute,
      environment: row.environment,
      genesisRequestId: row.genesisRequestId,
      slug: row.slug,
      status: 'ACTIVE',
      summary: row.summary,
      templateId: row.templateId,
      templateVersion: row.templateVersion,
    };
    const offers = await database
      .selectFrom('service_offers')
      .select([
        'capability_id as capabilityId',
        'description',
        'offer_id as offerId',
        'price_micro_usdc as priceMicroUsdc',
        'status',
      ])
      .where('provider_business_id', '=', business.businessId)
      .orderBy('created_at', 'asc')
      .execute();

    return {
      actorClassification: row.actorClassification,
      businessId: business.businessId,
      businessPackage: createBusinessPackage(business),
      displayName: row.displayName,
      entryRoute: row.entryRoute,
      headline: row.headline,
      offers,
      siteDescription: row.siteDescription,
      siteStatus: row.siteStatus,
      slug: row.slug,
      templateId: row.templateId,
      templateVersion: row.templateVersion,
      treasuryAddress: row.treasuryAddress,
      treasuryStatus: row.treasuryStatus ?? 'UNBOUND',
      visibility: row.visibility,
    };
  }

  async listPendingTreasuryBindings(): Promise<readonly PendingTreasuryBindingSummary[]> {
    return this.#persistence.databaseForApplication
      .withSchema(applicationSchema)
      .selectFrom('treasury_bindings as treasury')
      .innerJoin('businesses as business', 'business.business_id', 'treasury.business_id')
      .select([
        'treasury.binding_id as bindingId',
        'business.business_id as businessId',
        'business.display_name as displayName',
      ])
      .where('treasury.status', '=', 'PENDING')
      .orderBy('business.created_at', 'asc')
      .execute()
      .then((rows) =>
        rows.map((row) => ({
          bindingId: row.bindingId as `tbn_${string}`,
          businessId: row.businessId as `biz_${string}`,
          displayName: row.displayName,
        })),
      );
  }

  async activateTreasuryBinding(input: {
    readonly activeBinding: TreasuryBinding;
    readonly pendingBindingId: `tbn_${string}`;
    readonly occurredAt: string;
  }): Promise<void> {
    await this.#persistence.transaction(async (transaction) => {
      const database = transaction.withSchema(applicationSchema);
      const pending = await database
        .selectFrom('treasury_bindings')
        .selectAll()
        .where('binding_id', '=', input.pendingBindingId)
        .forUpdate()
        .executeTakeFirstOrThrow();

      if (
        input.activeBinding.businessId !== pending.business_id ||
        input.activeBinding.bindingVersion !== pending.binding_version + 1 ||
        input.activeBinding.status !== 'ACTIVE'
      ) {
        throw new Error('Active Treasury binding does not continue the pending binding.');
      }

      if (pending.status === 'ENDED') {
        const existing = await database
          .selectFrom('treasury_bindings')
          .select(['address', 'binding_id', 'business_id', 'provider_wallet_id', 'status'])
          .where('binding_id', '=', input.activeBinding.bindingId)
          .executeTakeFirst();

        if (
          existing !== undefined &&
          existing.address === input.activeBinding.address &&
          existing.business_id === input.activeBinding.businessId &&
          existing.provider_wallet_id === input.activeBinding.providerWalletId &&
          existing.status === 'ACTIVE'
        ) {
          return;
        }
        throw new Error('Pending Treasury binding ended without the expected active successor.');
      }

      if (pending.status !== 'PENDING') {
        throw new Error('Only a pending Treasury binding can be activated.');
      }

      const ended = await database
        .updateTable('treasury_bindings')
        .set({ ended_at: input.occurredAt, status: 'ENDED' })
        .where('binding_id', '=', input.pendingBindingId)
        .executeTakeFirstOrThrow();

      if (ended.numUpdatedRows !== 1n) {
        throw new Error('Pending Treasury binding was not ended exactly once.');
      }

      await database
        .insertInto('treasury_bindings')
        .values({
          account_assurance: input.activeBinding.accountAssurance,
          account_type: input.activeBinding.accountType,
          address: input.activeBinding.address ?? null,
          binding_id: input.activeBinding.bindingId,
          binding_version: input.activeBinding.bindingVersion,
          blockchain: input.activeBinding.blockchain,
          business_id: input.activeBinding.businessId,
          custody_model: input.activeBinding.custodyModel,
          ended_at: null,
          environment: input.activeBinding.environment,
          provider: input.activeBinding.provider,
          provider_wallet_id: input.activeBinding.providerWalletId ?? null,
          status: input.activeBinding.status,
        })
        .executeTakeFirstOrThrow();
    });
  }
}
