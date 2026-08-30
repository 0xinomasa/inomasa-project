import 'server-only';

import { cache } from 'react';

import { formatUsdcAmount } from '../../modules/commerce/money.ts';
import type { ProductEconomicRequestSummary } from '../../platform/persistence/product-economic-operation-repository.ts';
import { loadProductEconomicRequests } from './application.ts';
import { productCommerceSelections } from './catalog.ts';

export type ProductCommerceLoadState =
  | 'CONNECTED'
  | 'NOT_CONFIGURED'
  | 'PERMISSION_DENIED'
  | 'UNAVAILABLE';

export interface ProductCommerceView {
  readonly offers: readonly {
    readonly amountUsdc: string;
    readonly description: string;
    readonly kind: 'ERC8183_JOB' | 'X402_PURCHASE';
    readonly offerId: string;
    readonly providerDisplayName: string;
    readonly transactionShape: string;
  }[];
  readonly providerConfigured: boolean;
  readonly requests: readonly ProductEconomicRequestSummary[];
  readonly state: ProductCommerceLoadState;
}

const offers: ProductCommerceView['offers'] = productCommerceSelections.map((selection) => ({
  amountUsdc: formatUsdcAmount(selection.capability.offer.priceMicroUsdc),
  description: selection.capability.offer.description,
  kind: selection.kind,
  offerId: selection.capability.offer.offerId,
  providerDisplayName: selection.providerDisplayName,
  transactionShape: selection.transactionShape,
}));

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
    return { offers, providerConfigured, requests: [], state: 'NOT_CONFIGURED' };
  }
  try {
    const requests = await loadProductEconomicRequests({
      businessSlug,
      controllerPrincipalId,
    });
    return requests === undefined
      ? { offers, providerConfigured, requests: [], state: 'PERMISSION_DENIED' }
      : { offers, providerConfigured, requests, state: 'CONNECTED' };
  } catch {
    return { offers, providerConfigured, requests: [], state: 'UNAVAILABLE' };
  }
});
