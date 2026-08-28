import type { ServiceOffer } from './model.ts';
import { parseUsdcAmount } from './money.ts';

export type CommerceProtocol = 'ARC_USDC' | 'ERC8183' | 'X402';

export interface ServiceCapabilityDefinition {
  readonly deliveryKind: 'ARC_NETWORK_SNAPSHOT';
  readonly mimeType: 'application/json';
  readonly offer: ServiceOffer;
  readonly protocol: CommerceProtocol;
  readonly resourcePath: `/api/alpha/services/${string}`;
  readonly resourceUri: `inomasa://${string}`;
}

export const alphaServiceCatalog = {
  capitalFundedArcSnapshot: {
    deliveryKind: 'ARC_NETWORK_SNAPSHOT',
    mimeType: 'application/json',
    offer: {
      capabilityId: 'capital-funded-arc-snapshot',
      description: 'A later bounded operating service procured from an accepted Capital allocation.',
      offerId: 'off_capital_funded_snapshot_v1',
      priceMicroUsdc: parseUsdcAmount('0.10'),
      providerBusinessId: 'biz_signal_forge',
      status: 'ACTIVE',
      termsVersion: 1,
    },
    protocol: 'ARC_USDC',
    resourcePath: '/api/alpha/services/off_capital_funded_snapshot_v1',
    resourceUri: 'inomasa://signal-forge/capital-funded-arc-snapshot',
  },
  arcMarketSnapshotX402: {
    deliveryKind: 'ARC_NETWORK_SNAPSHOT',
    mimeType: 'application/json',
    offer: {
      capabilityId: 'arc-market-snapshot',
      description: 'Deterministic Arc network snapshot sold through Circle Gateway x402.',
      offerId: 'off_arc_snapshot_x402_v1',
      priceMicroUsdc: parseUsdcAmount('0.01'),
      providerBusinessId: 'biz_signal_forge',
      status: 'ACTIVE',
      termsVersion: 1,
    },
    protocol: 'X402',
    resourcePath: '/api/alpha/services/off_arc_snapshot_x402_v1',
    resourceUri: 'inomasa://signal-forge/arc-market-snapshot',
  },
  commerceReadinessJob: {
    deliveryKind: 'ARC_NETWORK_SNAPSHOT',
    mimeType: 'application/json',
    offer: {
      capabilityId: 'commerce-readiness-brief',
      description: 'A scoped Arc commerce-readiness brief delivered as funded ERC-8183 work.',
      offerId: 'off_commerce_readiness_8183_v1',
      priceMicroUsdc: parseUsdcAmount('0.05'),
      providerBusinessId: 'biz_signal_forge',
      status: 'ACTIVE',
      termsVersion: 1,
    },
    protocol: 'ERC8183',
    resourcePath: '/api/alpha/services/off_commerce_readiness_8183_v1',
    resourceUri: 'inomasa://signal-forge/commerce-readiness-brief',
  },
  referenceCapitalUse: {
    deliveryKind: 'ARC_NETWORK_SNAPSHOT',
    mimeType: 'application/json',
    offer: {
      capabilityId: 'reference-capital-funded-snapshot',
      description: 'A bounded later service procured from the accepted reference allocation.',
      offerId: 'off_reference_capital_use_v1',
      priceMicroUsdc: parseUsdcAmount('0.10'),
      providerBusinessId: 'biz_reference_signal',
      status: 'ACTIVE',
      termsVersion: 1,
    },
    protocol: 'ARC_USDC',
    resourcePath: '/api/alpha/services/off_reference_capital_use_v1',
    resourceUri: 'inomasa://reference-signal/capital-funded-snapshot',
  },
  referenceEvaluatedWork: {
    deliveryKind: 'ARC_NETWORK_SNAPSHOT',
    mimeType: 'application/json',
    offer: {
      capabilityId: 'reference-economy-brief',
      description: 'A scoped reference-economy brief delivered as evaluated ERC-8183 work.',
      offerId: 'off_reference_economy_8183_v1',
      priceMicroUsdc: parseUsdcAmount('0.05'),
      providerBusinessId: 'biz_reference_signal',
      status: 'ACTIVE',
      termsVersion: 1,
    },
    protocol: 'ERC8183',
    resourcePath: '/api/alpha/services/off_reference_economy_8183_v1',
    resourceUri: 'inomasa://reference-signal/reference-economy-brief',
  },
  referenceMachineResource: {
    deliveryKind: 'ARC_NETWORK_SNAPSHOT',
    mimeType: 'application/json',
    offer: {
      capabilityId: 'reference-arc-snapshot',
      description: 'A fresh Arc network snapshot sold by the reference economy through x402.',
      offerId: 'off_reference_arc_snapshot_x402_v1',
      priceMicroUsdc: parseUsdcAmount('0.01'),
      providerBusinessId: 'biz_reference_signal',
      status: 'ACTIVE',
      termsVersion: 1,
    },
    protocol: 'X402',
    resourcePath: '/api/alpha/services/off_reference_arc_snapshot_x402_v1',
    resourceUri: 'inomasa://reference-signal/arc-snapshot',
  },
} as const satisfies Record<string, ServiceCapabilityDefinition>;

export function serviceCapabilityForOffer(offerId: string): ServiceCapabilityDefinition | null {
  return (
    Object.values(alphaServiceCatalog).find(({ offer }) => offer.offerId === offerId) ?? null
  );
}

export function selectCommerceProtocol(input: {
  readonly requiresDeliverableEvaluation: boolean;
}): CommerceProtocol {
  return input.requiresDeliverableEvaluation ? 'ERC8183' : 'X402';
}
