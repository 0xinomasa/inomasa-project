import type {
  ProductCommerceProtocol,
  ProductOfferDraft,
} from '../../modules/business/operational-workspace.ts';
import type { InomasaEnvironment } from '../../shared/environment.ts';
import type { PostgresPersistence } from './database.ts';
import { applicationSchema, type PersistenceTransaction } from './database.ts';

export interface OperationalBusinessContext {
  readonly businessId: `biz_${string}`;
  readonly displayName: string;
  readonly environment: InomasaEnvironment;
  readonly slug: string;
}

export interface OperationalOfferSummary {
  readonly capabilityId: string;
  readonly commerceProtocol: string;
  readonly createdByProduct: boolean;
  readonly description: string;
  readonly offerId: string;
  readonly priceMicroUsdc: string;
  readonly status: string;
  readonly termsVersion: number;
}

export interface OperationalTreasurySummary {
  readonly accountAssurance: string;
  readonly accountType: string;
  readonly address: string | null;
  readonly bindingId: `tbn_${string}`;
  readonly bindingVersion: number;
  readonly blockchain: string;
  readonly businessId: `biz_${string}`;
  readonly custodyModel: string;
  readonly environment: InomasaEnvironment;
  readonly provider: string;
  readonly providerWalletId: string | null;
  readonly status: 'ACTIVE' | 'PENDING';
}

function isEnvironment(value: string): value is InomasaEnvironment {
  return (
    value === 'LOCAL_DEVELOPMENT' ||
    value === 'AUTOMATED_TEST' ||
    value === 'PRIVATE_ARC_TESTNET' ||
    value === 'CLOSED_ARC_TESTNET' ||
    value === 'PUBLIC_DEMO_TESTNET' ||
    value === 'MAINNET'
  );
}

export class PostgresOperationalWorkspaceRepository {
  readonly #persistence: PostgresPersistence;

  constructor(persistence: PostgresPersistence) {
    this.#persistence = persistence;
  }

  async getBusinessForController(input: {
    readonly controllerPrincipalId: `usr_${string}`;
    readonly slug: string;
  }, transaction?: PersistenceTransaction): Promise<OperationalBusinessContext | undefined> {
    const database = (transaction ?? this.#persistence.databaseForApplication)
      .withSchema(applicationSchema);
    const row = await database
      .selectFrom('businesses as business')
      .innerJoin('business_controls as control', (join) =>
        join
          .onRef('control.business_id', '=', 'business.business_id')
          .on('control.status', '=', 'ACTIVE'),
      )
      .select([
        'business.business_id as businessId',
        'business.display_name as displayName',
        'business.environment',
        'business.slug',
      ])
      .where('business.slug', '=', input.slug)
      .where('business.status', '=', 'ACTIVE')
      .where('control.controller_principal_id', '=', input.controllerPrincipalId)
      .executeTakeFirst();
    if (row === undefined) return undefined;
    if (!isEnvironment(row.environment)) throw new Error('Stored Business environment is invalid.');
    return {
      businessId: row.businessId as `biz_${string}`,
      displayName: row.displayName,
      environment: row.environment,
      slug: row.slug,
    };
  }

  async listOffers(input: {
    readonly controllerPrincipalId: `usr_${string}`;
    readonly slug: string;
  }): Promise<readonly OperationalOfferSummary[] | undefined> {
    const business = await this.getBusinessForController(input);
    if (business === undefined) return undefined;
    const rows = await this.#persistence.databaseForApplication
      .withSchema(applicationSchema)
      .selectFrom('service_offers')
      .select([
        'capability_id as capabilityId',
        'commerce_protocol as commerceProtocol',
        'created_by_principal_id as createdByPrincipalId',
        'description',
        'offer_id as offerId',
        'price_micro_usdc as priceMicroUsdc',
        'status',
        'terms_version as termsVersion',
      ])
      .where('provider_business_id', '=', business.businessId)
      .orderBy('created_at', 'asc')
      .execute();
    return rows.map(({ createdByPrincipalId, ...row }) => ({
      ...row,
      createdByProduct: createdByPrincipalId !== null,
    }));
  }

  async ensureOffer(input: ProductOfferDraft & {
    readonly controllerPrincipalId: `usr_${string}`;
    readonly slug: string;
  }, transaction?: PersistenceTransaction): Promise<{ readonly created: boolean }> {
    if (transaction === undefined) {
      return this.#persistence.transaction((activeTransaction) =>
        this.ensureOffer(input, activeTransaction),
      );
    }
    const business = await this.getBusinessForController(input, transaction);
    if (business === undefined || business.businessId !== input.providerBusinessId) {
      throw new Error('Business control is required to create this Product or Service.');
    }
    const database = transaction.withSchema(applicationSchema);
    const created = await database
      .insertInto('service_offers')
      .values({
          capability_id: input.capabilityId,
          commerce_protocol: input.commerceProtocol,
          created_by_principal_id: input.createdByPrincipalId,
          description: input.description,
          idempotency_key: input.idempotencyKey,
          offer_id: input.offerId,
          price_micro_usdc: input.priceMicroUsdc.toString(),
          provider_business_id: input.providerBusinessId,
          status: input.status,
          terms_version: input.termsVersion,
          updated_at: new Date(),
      })
      .onConflict((conflict) => conflict.column('offer_id').doNothing())
      .returning('offer_id')
      .executeTakeFirst();
    const stored = await database
      .selectFrom('service_offers')
      .select([
          'capability_id',
          'commerce_protocol',
          'created_by_principal_id',
          'description',
          'idempotency_key',
          'price_micro_usdc',
          'provider_business_id',
          'status',
          'terms_version',
      ])
      .where('offer_id', '=', input.offerId)
      .executeTakeFirstOrThrow();
    if (
      stored.capability_id !== input.capabilityId ||
      stored.commerce_protocol !== input.commerceProtocol ||
      stored.created_by_principal_id !== input.createdByPrincipalId ||
      stored.description !== input.description ||
      stored.idempotency_key !== input.idempotencyKey ||
      stored.price_micro_usdc !== input.priceMicroUsdc.toString() ||
      stored.provider_business_id !== input.providerBusinessId ||
      stored.status !== input.status ||
      stored.terms_version !== input.termsVersion
    ) {
      throw new Error('Product or Service request was replayed with different semantics.');
    }
    return { created: created !== undefined };
  }

  async retireOffer(input: {
    readonly controllerPrincipalId: `usr_${string}`;
    readonly offerId: string;
    readonly slug: string;
  }): Promise<'ALREADY_RETIRED' | 'RETIRED'> {
    return this.#persistence.transaction(async (transaction) => {
      const business = await this.getBusinessForController(input, transaction);
      if (business === undefined) throw new Error('Business control is required to manage this offer.');
      const database = transaction.withSchema(applicationSchema);
      const offer = await database
        .selectFrom('service_offers')
        .select(['created_by_principal_id', 'provider_business_id', 'status'])
        .where('offer_id', '=', input.offerId)
        .forUpdate()
        .executeTakeFirstOrThrow();
      if (
        offer.provider_business_id !== business.businessId ||
        offer.created_by_principal_id === null
      ) {
        throw new Error('Only controller-created Product or Service drafts can be managed here.');
      }
      if (offer.status === 'RETIRED') return 'ALREADY_RETIRED';
      if (offer.status !== 'DRAFT') {
        throw new Error('An active economic offer cannot be retired through the draft workspace.');
      }
      await database
        .updateTable('service_offers')
        .set({ status: 'RETIRED', updated_at: new Date() })
        .where('offer_id', '=', input.offerId)
        .where('status', '=', 'DRAFT')
        .executeTakeFirstOrThrow();
      return 'RETIRED';
    });
  }

  async getTreasury(input: {
    readonly controllerPrincipalId: `usr_${string}`;
    readonly slug: string;
  }, transaction?: PersistenceTransaction): Promise<OperationalTreasurySummary | undefined> {
    const business = await this.getBusinessForController(input, transaction);
    if (business === undefined) return undefined;
    const database = (transaction ?? this.#persistence.databaseForApplication)
      .withSchema(applicationSchema);
    const row = await database
      .selectFrom('treasury_bindings')
      .select([
        'account_assurance as accountAssurance',
        'account_type as accountType',
        'address',
        'binding_id as bindingId',
        'binding_version as bindingVersion',
        'blockchain',
        'business_id as businessId',
        'custody_model as custodyModel',
        'environment',
        'provider',
        'provider_wallet_id as providerWalletId',
        'status',
      ])
      .where('business_id', '=', business.businessId)
      .where('status', 'in', ['PENDING', 'ACTIVE'])
      .orderBy('binding_version', 'desc')
      .executeTakeFirst();
    if (row === undefined) return undefined;
    if (!isEnvironment(row.environment) || (row.status !== 'ACTIVE' && row.status !== 'PENDING')) {
      throw new Error('Stored Treasury binding is invalid.');
    }
    return {
      ...row,
      bindingId: row.bindingId as `tbn_${string}`,
      businessId: row.businessId as `biz_${string}`,
      environment: row.environment,
      status: row.status,
    };
  }
}

export function isProductCommerceProtocol(value: string): value is ProductCommerceProtocol {
  return value === 'X402' || value === 'ERC8183';
}
