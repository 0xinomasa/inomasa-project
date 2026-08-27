import type { InomasaEnvironment } from '../../shared/environment.ts';

import type { BusinessInstance } from '../business/model.ts';
import type { UsdcMicroAmount } from './money.ts';

export type EconomicProvenance = 'COMMON_CONTROL_TEST' | 'INDEPENDENT';
export type SettlementState =
  | 'AUTHORIZED'
  | 'COMPLETE'
  | 'FAILED'
  | 'OUTCOME_UNKNOWN'
  | 'REFUNDED'
  | 'SUBMITTED';

export interface ServiceOffer {
  readonly capabilityId: string;
  readonly description: string;
  readonly offerId: `off_${string}`;
  readonly priceMicroUsdc: UsdcMicroAmount;
  readonly providerBusinessId: BusinessInstance['businessId'];
  readonly status: 'ACTIVE';
  readonly termsVersion: number;
}

export interface EconomicObligation {
  readonly amountMicroUsdc: UsdcMicroAmount;
  readonly asset: 'USDC';
  readonly buyerBusinessId: BusinessInstance['businessId'];
  readonly environment: InomasaEnvironment;
  readonly executionAuthorizationId?: `xau_${string}`;
  readonly obligationId: `obl_${string}`;
  readonly offerId: ServiceOffer['offerId'];
  readonly provenance: EconomicProvenance;
  readonly representedBusinessId?: BusinessInstance['businessId'];
  readonly requesterPrincipalId?: `agt_${string}`;
  readonly sellerBusinessId: BusinessInstance['businessId'];
  readonly state: 'OPEN' | 'SETTLED';
  readonly termsVersion: number;
}

export interface SettlementOperation {
  readonly amountMicroUsdc: UsdcMicroAmount;
  readonly assetAddress: '0x3600000000000000000000000000000000000000';
  readonly chainId: 5042002;
  readonly idempotencyKey: string;
  readonly obligationId: EconomicObligation['obligationId'];
  readonly provider: 'CIRCLE_DEVELOPER_WALLETS' | 'CIRCLE_GATEWAY_X402' | 'ERC8183';
  readonly providerTransactionId?: string;
  readonly settlementId: `set_${string}`;
  readonly state: SettlementState;
  readonly transactionHash?: `0x${string}`;
}

export function acceptServiceOffer(input: {
  readonly agentAuthority?: {
    readonly executionAuthorizationId: `xau_${string}`;
    readonly representedBusinessId: BusinessInstance['businessId'];
    readonly requesterPrincipalId: `agt_${string}`;
  };
  readonly buyer: BusinessInstance;
  readonly offer: ServiceOffer;
  readonly obligationId: `obl_${string}`;
  readonly provider: BusinessInstance;
}): EconomicObligation {
  if (input.buyer.environment !== input.provider.environment) {
    throw new Error('Buyer and provider must belong to the same Inomasa environment.');
  }

  if (input.buyer.businessId === input.provider.businessId) {
    throw new Error('A Business cannot create an Alpha service obligation to itself.');
  }

  if (input.offer.providerBusinessId !== input.provider.businessId) {
    throw new Error('The service offer does not belong to the selected provider Business.');
  }

  if (
    input.agentAuthority !== undefined &&
    input.agentAuthority.representedBusinessId !== input.buyer.businessId
  ) {
    throw new Error('Agent authority must represent the buyer Business.');
  }

  return {
    amountMicroUsdc: input.offer.priceMicroUsdc,
    asset: 'USDC',
    buyerBusinessId: input.buyer.businessId,
    environment: input.buyer.environment,
    ...(input.agentAuthority === undefined
      ? {}
      : {
          executionAuthorizationId: input.agentAuthority.executionAuthorizationId,
          representedBusinessId: input.agentAuthority.representedBusinessId,
          requesterPrincipalId: input.agentAuthority.requesterPrincipalId,
        }),
    obligationId: input.obligationId,
    offerId: input.offer.offerId,
    provenance:
      input.buyer.actorClassification === 'COMMON_CONTROL_TEST' ||
      input.provider.actorClassification === 'COMMON_CONTROL_TEST'
        ? 'COMMON_CONTROL_TEST'
        : 'INDEPENDENT',
    sellerBusinessId: input.provider.businessId,
    state: 'OPEN',
    termsVersion: input.offer.termsVersion,
  };
}

export function authorizeSettlement(input: {
  readonly idempotencyKey: string;
  readonly obligation: EconomicObligation;
  readonly provider?: SettlementOperation['provider'];
  readonly settlementId: `set_${string}`;
}): SettlementOperation {
  if (input.obligation.state !== 'OPEN') {
    throw new Error('Only an open obligation can be authorized for settlement.');
  }

  if (input.idempotencyKey.trim().length === 0) {
    throw new Error('Settlement idempotency key must not be empty.');
  }

  return {
    amountMicroUsdc: input.obligation.amountMicroUsdc,
    assetAddress: '0x3600000000000000000000000000000000000000',
    chainId: 5042002,
    idempotencyKey: input.idempotencyKey,
    obligationId: input.obligation.obligationId,
    provider: input.provider ?? 'CIRCLE_DEVELOPER_WALLETS',
    settlementId: input.settlementId,
    state: 'AUTHORIZED',
  };
}

export function recordSettlementSubmission(
  settlement: SettlementOperation,
  providerTransactionId: string,
): SettlementOperation {
  if (settlement.state !== 'AUTHORIZED') {
    throw new Error('Only an authorized settlement can be submitted.');
  }

  if (providerTransactionId.trim().length === 0) {
    throw new Error('Provider transaction ID must not be empty.');
  }

  return {
    ...settlement,
    providerTransactionId,
    state: 'SUBMITTED',
  };
}

export function reconcileSettlement(
  settlement: SettlementOperation,
  outcome:
    | { readonly state: 'FAILED' | 'OUTCOME_UNKNOWN' }
    | { readonly state: 'COMPLETE'; readonly transactionHash: `0x${string}` },
): SettlementOperation {
  if (settlement.state !== 'SUBMITTED' && settlement.state !== 'OUTCOME_UNKNOWN') {
    throw new Error('Only a submitted or outcome-unknown settlement can be reconciled.');
  }

  return outcome.state === 'COMPLETE'
    ? { ...settlement, state: 'COMPLETE', transactionHash: outcome.transactionHash }
    : { ...settlement, state: outcome.state };
}
