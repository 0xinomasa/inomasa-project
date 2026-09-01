import 'server-only';

import { cache } from 'react';

import { formatUsdcAmount } from '../../modules/commerce/money.ts';
import type { ProductEconomicRequestSummary } from '../../platform/persistence/product-economic-operation-repository.ts';
import { readDatabaseConnectionConfig } from '../../platform/persistence/config.ts';
import { PostgresPersistence } from '../../platform/persistence/database.ts';
import { PostgresOperationalWorkspaceRepository } from '../../platform/persistence/operational-workspace-repository.ts';
import { loadProductEconomicRequests } from './application.ts';
import {
  productCommerceSelectionForOffer,
  productCommerceSelections,
  type ProductCommerceSelection,
} from './catalog.ts';

export type ProductCommerceLoadState =
  | 'CONNECTED'
  | 'NOT_CONFIGURED'
  | 'PERMISSION_DENIED'
  | 'UNAVAILABLE';

export interface ProductCommerceView {
  readonly offers: readonly {
    readonly amountUsdc: string;
    readonly description: string;
    readonly displayName: string;
    readonly createdByProduct: boolean;
    readonly kind: 'ERC8183_JOB' | 'X402_PURCHASE';
    readonly offerId: string;
    readonly providerDisplayName: string;
    readonly transactionShape: string;
  }[];
  readonly providerConfigured: boolean;
  readonly requests: readonly ProductEconomicRequestSummary[];
  readonly state: ProductCommerceLoadState;
}

function offerView(selection: ProductCommerceSelection): ProductCommerceView['offers'][number] {
  return {
  amountUsdc: formatUsdcAmount(selection.capability.offer.priceMicroUsdc),
  createdByProduct: selection.createdByProduct,
  description: selection.capability.offer.description,
  displayName: selection.displayName,
  kind: selection.kind,
  offerId: selection.capability.offer.offerId,
  providerDisplayName: selection.providerDisplayName,
  transactionShape: selection.transactionShape,
  };
}

const fixtureOffers: ProductCommerceView['offers'] = productCommerceSelections.map(offerView);

export const loadProductCommerce = cache(async (
  businessSlug: string,
  controllerPrincipalId: `usr_${string}`,
): Promise<ProductCommerceView> => {
  const providerConfigured = Boolean(
    process.env['CIRCLE_API_KEY']?.trim() &&
    process.env['CIRCLE_ENTITY_SECRET']?.trim() &&
    process.env['CIRCLE_WALLET_SET_ID']?.trim(),
  );
  if (!process.env['INOMASA_ENV']?.trim() || !process.env['DATABASE_URL']?.trim()) {
    return { offers: fixtureOffers, providerConfigured, requests: [], state: 'NOT_CONFIGURED' };
  }
  let persistence: PostgresPersistence | undefined;
  try {
    persistence = new PostgresPersistence(readDatabaseConnectionConfig('runtime'));
    const [requests, activated] = await Promise.all([
      loadProductEconomicRequests({ businessSlug, controllerPrincipalId }),
      new PostgresOperationalWorkspaceRepository(persistence).listActivatedProductOffersForBuyer({
        controllerPrincipalId,
        slug: businessSlug,
      }),
    ]);
    const productOffers = (activated ?? []).flatMap((offer) => {
      const selection = productCommerceSelectionForOffer(offer.offerId, [offer]);
      return selection === undefined ? [] : [offerView(selection)];
    });
    return requests === undefined
      ? { offers: fixtureOffers, providerConfigured, requests: [], state: 'PERMISSION_DENIED' }
      : { offers: [...productOffers, ...fixtureOffers], providerConfigured, requests, state: 'CONNECTED' };
  } catch {
    return { offers: fixtureOffers, providerConfigured, requests: [], state: 'UNAVAILABLE' };
  } finally {
    await persistence?.close();
  }
});
