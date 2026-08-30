import {
  alphaServiceCatalog,
  type ServiceCapabilityDefinition,
} from '../../modules/commerce/service-catalog.ts';
import type { ProductEconomicOperationKind } from '../../modules/commerce/product-operations.ts';

export interface ProductCommerceSelection {
  readonly capability: ServiceCapabilityDefinition;
  readonly kind: ProductEconomicOperationKind;
  readonly providerDisplayName: string;
  readonly transactionShape: string;
}

export const productCommerceSelections = [
  {
    capability: alphaServiceCatalog.arcMarketSnapshotX402,
    kind: 'X402_PURCHASE',
    providerDisplayName: 'Signal Forge · controlled test provider',
    transactionShape: 'x402 v2 exact · instant Arc snapshot',
  },
  {
    capability: alphaServiceCatalog.commerceReadinessJob,
    kind: 'ERC8183_JOB',
    providerDisplayName: 'Signal Forge · controlled test provider',
    transactionShape: 'ERC-8183 · funded and evaluated work',
  },
] as const satisfies readonly ProductCommerceSelection[];

export function productCommerceSelectionForOffer(
  offerId: string,
): ProductCommerceSelection | undefined {
  return productCommerceSelections.find(({ capability }) => capability.offer.offerId === offerId);
}
