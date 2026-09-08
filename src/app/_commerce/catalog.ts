import {
  alphaServiceCatalog,
} from '../../modules/commerce/service-catalog.ts';
import type { ServiceOffer } from '../../modules/commerce/model.ts';
import type { ProductEconomicOperationKind } from '../../modules/commerce/product-operations.ts';
import type { ActivatedProductOfferSummary } from '../../platform/persistence/operational-workspace-repository.ts';

export interface ProductCommerceSelection {
  readonly capability: {
    readonly mimeType: 'application/json';
    readonly offer: ServiceOffer;
    readonly resourceUri: `inomasa://${string}`;
  };
  readonly createdByProduct: boolean;
  readonly displayName: string;
  readonly kind: ProductEconomicOperationKind;
  readonly providerDisplayName: string;
  readonly transactionShape: string;
}

export const productCommerceSelections = [
  {
    capability: alphaServiceCatalog.arcMarketSnapshotX402,
    createdByProduct: false,
    displayName: 'Arc network snapshot',
    kind: 'X402_PURCHASE',
    providerDisplayName: 'Signal Forge · controlled test provider',
    transactionShape: 'x402 v2 exact · instant Arc snapshot',
  },
  {
    capability: alphaServiceCatalog.commerceReadinessJob,
    createdByProduct: false,
    displayName: 'Commerce readiness brief',
    kind: 'ERC8183_JOB',
    providerDisplayName: 'Signal Forge · controlled test provider',
    transactionShape: 'ERC-8183 · funded and evaluated work',
  },
] as const satisfies readonly ProductCommerceSelection[];

export function productCommerceSelectionForOffer(
  offerId: string,
  activatedOffers: readonly ActivatedProductOfferSummary[] = [],
): ProductCommerceSelection | undefined {
  const fixture = productCommerceSelections.find(({ capability }) => capability.offer.offerId === offerId);
  if (fixture !== undefined) return fixture;
  const offer = activatedOffers.find((candidate) => candidate.offerId === offerId);
  if (offer === undefined || (offer.commerceProtocol !== 'X402' && offer.commerceProtocol !== 'ERC8183')) {
    return undefined;
  }
  return {
    capability: {
      mimeType: 'application/json',
      offer: {
        capabilityId: offer.capabilityId,
        description: offer.description,
        offerId: offer.offerId as `off_${string}`,
        priceMicroUsdc: BigInt(offer.priceMicroUsdc) as ServiceOffer['priceMicroUsdc'],
        providerBusinessId: offer.providerBusinessId,
        status: 'ACTIVE',
        termsVersion: offer.termsVersion,
      },
      resourceUri: `inomasa://${offer.providerSlug}/${offer.capabilityId}`,
    },
    createdByProduct: true,
    displayName: offer.capabilityId.replaceAll('-', ' '),
    kind: offer.commerceProtocol === 'X402' ? 'X402_PURCHASE' : 'ERC8183_JOB',
    providerDisplayName: `${offer.providerDisplayName} · controlled Alpha provider`,
    transactionShape: offer.commerceProtocol === 'X402'
      ? 'x402 v2 exact · deterministic Alpha resource delivery'
      : 'ERC-8183 · funded and evaluated Alpha work',
  };
}
