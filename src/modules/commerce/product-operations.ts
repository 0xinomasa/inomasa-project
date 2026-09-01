import { createHash } from 'node:crypto';

import type { BusinessInstance } from '../business/model.ts';
import type {
  AgentPurchaseIntent,
  StandingPurchaseAuthorityGrant,
} from '../authority/model.ts';
import type { Erc8183JobCommitment, Erc8183Leg } from './erc8183.ts';
import {
  acceptServiceOffer,
  authorizeSettlement,
  type EconomicObligation,
  type ServiceOffer,
  type SettlementOperation,
} from './model.ts';

export type ProductEconomicOperationKind = 'ERC8183_JOB' | 'X402_PURCHASE';

export type ProviderHandoffDisposition = 'HOLD' | 'RECONCILE' | 'SUBMIT';

export function providerHandoffDisposition(input: {
  readonly providerTransactionId: string | null;
  readonly state: string;
}): ProviderHandoffDisposition {
  if (input.state === 'AUTHORIZED' || input.state === 'APPROVAL_AUTHORIZED' || input.state === 'APPROVAL_COMPLETE') {
    return 'SUBMIT';
  }
  if (
    input.state === 'SUBMITTED' ||
    input.state === 'APPROVAL_SUBMITTED' ||
    input.state === 'DEPOSIT_SUBMITTED' ||
    input.state === 'OUTCOME_UNKNOWN'
  ) {
    return input.providerTransactionId === null ? 'HOLD' : 'RECONCILE';
  }
  return 'HOLD';
}

const executableErc8183Legs = [
  'CREATE',
  'SET_BUDGET',
  'APPROVE',
  'FUND',
  'SUBMIT',
  'COMPLETE',
] as const satisfies readonly Erc8183Leg[];

export type ProductErc8183Leg = (typeof executableErc8183Legs)[number];

export interface ProductOperationIdentity {
  readonly authorizationId: `xau_${string}`;
  readonly decisionId: `dec_${string}`;
  readonly digest: string;
  readonly erc8183Operations: Readonly<Record<ProductErc8183Leg, {
    readonly idempotencyKey: string;
    readonly operationId: `jop_${string}`;
  }>>;
  readonly funding: {
    readonly approvalIdempotencyKey: string;
    readonly depositIdempotencyKey: string;
    readonly fundingId: `gwf_${string}`;
  };
  readonly grantId: `grt_${string}`;
  readonly intentId: `int_${string}`;
  readonly jobId: `job_${string}`;
  readonly obligationId: `obl_${string}`;
  readonly paymentId: `pay_${string}`;
  readonly serviceExecutionId: `svc_${string}`;
  readonly settlementId: `set_${string}`;
  readonly settlementIdempotencyKey: string;
}

function uuidFromDigest(digest: string): string {
  const digits = digest.slice(0, 32).split('');
  digits[12] = '4';
  const variant = Number.parseInt(digits[16] ?? '0', 16);
  digits[16] = ((variant & 0x3) | 0x8).toString(16);
  const joined = digits.join('');
  return `${joined.slice(0, 8)}-${joined.slice(8, 12)}-${joined.slice(12, 16)}-${joined.slice(16, 20)}-${joined.slice(20)}`;
}

function scopedDigest(scope: string, value: string): string {
  return createHash('sha256').update(scope).update('\0').update(value).digest('hex');
}

export function assertProductEconomicRequestId(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(normalized)) {
    throw new Error('Economic request ID must be a UUID v4 generated for this confirmation.');
  }
  return normalized;
}

export function deriveProductOperationIdentity(input: {
  readonly buyerBusinessId: `biz_${string}`;
  readonly kind: ProductEconomicOperationKind;
  readonly offerId: `off_${string}`;
  readonly requestId: string;
}): ProductOperationIdentity {
  const requestId = assertProductEconomicRequestId(input.requestId);
  const digest = scopedDigest(
    'product-economic-operation-v1',
    `${requestId}:${input.buyerBusinessId}:${input.offerId}:${input.kind}`,
  );
  const identifier = digest.slice(0, 28);
  const operationFor = (leg: ProductErc8183Leg) => {
    const legDigest = scopedDigest(`product-erc8183-${leg.toLowerCase()}-v1`, digest);
    return {
      idempotencyKey: uuidFromDigest(legDigest),
      operationId: `jop_product_${identifier}_${leg.toLowerCase()}` as const,
    };
  };
  return {
    authorizationId: `xau_product_${identifier}`,
    decisionId: `dec_product_${identifier}`,
    digest,
    erc8183Operations: {
      APPROVE: operationFor('APPROVE'),
      COMPLETE: operationFor('COMPLETE'),
      CREATE: operationFor('CREATE'),
      FUND: operationFor('FUND'),
      SET_BUDGET: operationFor('SET_BUDGET'),
      SUBMIT: operationFor('SUBMIT'),
    },
    funding: {
      approvalIdempotencyKey: uuidFromDigest(scopedDigest('product-gateway-approval-v1', digest)),
      depositIdempotencyKey: uuidFromDigest(scopedDigest('product-gateway-deposit-v1', digest)),
      fundingId: `gwf_product_${identifier}`,
    },
    grantId: `grt_product_${identifier}`,
    intentId: `int_product_${identifier}`,
    jobId: `job_product_${identifier}`,
    obligationId: `obl_product_${identifier}`,
    paymentId: `pay_product_${identifier}`,
    serviceExecutionId: `svc_product_${identifier}`,
    settlementId: `set_product_${identifier}`,
    settlementIdempotencyKey: uuidFromDigest(scopedDigest('product-settlement-v1', digest)),
  };
}

function isoAfter(value: string, milliseconds: number, label: string): string {
  const epoch = Date.parse(value);
  if (!Number.isFinite(epoch)) throw new Error(`${label} must be an ISO timestamp.`);
  return new Date(epoch + milliseconds).toISOString();
}

export function createProductX402Plan(input: {
  readonly agentPrincipalId: `agt_${string}`;
  readonly buyer: BusinessInstance;
  readonly controllerPrincipalId: `usr_${string}`;
  readonly erc8004IdentityId: `aid_${string}`;
  readonly identity: ProductOperationIdentity;
  readonly offer: ServiceOffer;
  readonly provider: BusinessInstance;
  readonly requestedAt: string;
}): {
  readonly grant: StandingPurchaseAuthorityGrant;
  readonly intent: AgentPurchaseIntent;
  readonly obligation: EconomicObligation;
  readonly settlement: SettlementOperation;
} {
  const expiresAt = isoAfter(input.requestedAt, 24 * 60 * 60 * 1_000, 'Request time');
  const grant: StandingPurchaseAuthorityGrant = {
    actionType: 'PURCHASE_SERVICE',
    allowedCounterpartyBusinessId: input.provider.businessId,
    allowedOfferId: input.offer.offerId,
    allowanceConsumedMicroUsdc: 0n as StandingPurchaseAuthorityGrant['allowanceConsumedMicroUsdc'],
    allowanceTotalMicroUsdc: input.offer.priceMicroUsdc,
    asset: 'USDC',
    authorityDomainBusinessId: input.buyer.businessId,
    controlVersion: 1,
    delegationAllowed: false,
    environment: input.buyer.environment,
    expiresAt,
    granteePrincipalId: input.agentPrincipalId,
    grantId: input.identity.grantId,
    grantVersion: 1,
    grantorPrincipalId: input.controllerPrincipalId,
    maxPerActionMicroUsdc: input.offer.priceMicroUsdc,
    representedBusinessId: input.buyer.businessId,
    status: 'ACTIVE',
    validFrom: input.requestedAt,
  };
  const intent: AgentPurchaseIntent = {
    actionType: 'PURCHASE_SERVICE',
    amountMicroUsdc: input.offer.priceMicroUsdc,
    asset: 'USDC',
    authorityDomainBusinessId: input.buyer.businessId,
    counterpartyBusinessId: input.provider.businessId,
    environment: input.buyer.environment,
    erc8004IdentityId: input.erc8004IdentityId,
    grantId: grant.grantId,
    intentId: input.identity.intentId,
    offerId: input.offer.offerId,
    purpose: 'Human-confirmed controlled x402 purchase from the Business Workspace.',
    requestedAt: input.requestedAt,
    requesterPrincipalId: input.agentPrincipalId,
    representedBusinessId: input.buyer.businessId,
  };
  const obligation = acceptServiceOffer({
    agentAuthority: {
      executionAuthorizationId: input.identity.authorizationId,
      representedBusinessId: input.buyer.businessId,
      requesterPrincipalId: input.agentPrincipalId,
    },
    buyer: input.buyer,
    offer: input.offer,
    obligationId: input.identity.obligationId,
    provider: input.provider,
  });
  return {
    grant,
    intent,
    obligation,
    settlement: authorizeSettlement({
      idempotencyKey: input.identity.settlementIdempotencyKey,
      obligation,
      provider: 'CIRCLE_GATEWAY_X402',
      settlementId: input.identity.settlementId,
    }),
  };
}

export function createProductErc8183Plan(input: {
  readonly buyer: BusinessInstance;
  readonly clientAddress: `0x${string}`;
  readonly identity: ProductOperationIdentity;
  readonly offer: ServiceOffer;
  readonly provider: BusinessInstance;
  readonly providerAddress: `0x${string}`;
  readonly requestedAt: string;
}): {
  readonly commitment: Erc8183JobCommitment;
  readonly obligation: EconomicObligation;
  readonly settlement: SettlementOperation;
} {
  const obligation = acceptServiceOffer({
    buyer: input.buyer,
    offer: input.offer,
    obligationId: input.identity.obligationId,
    provider: input.provider,
  });
  const settlement = authorizeSettlement({
    idempotencyKey: input.identity.settlementIdempotencyKey,
    obligation,
    provider: 'ERC8183',
    settlementId: input.identity.settlementId,
  });
  return {
    commitment: {
      budgetMicroUsdc: input.offer.priceMicroUsdc,
      clientAddress: input.clientAddress,
      clientBusinessId: input.buyer.businessId,
      description: input.offer.description,
      evaluatorAddress: input.clientAddress,
      expiredAt: isoAfter(input.requestedAt, 7 * 24 * 60 * 60 * 1_000, 'Request time'),
      hookAddress: '0x0000000000000000000000000000000000000000',
      jobId: input.identity.jobId,
      obligationId: input.identity.obligationId,
      provenance: obligation.provenance,
      providerAddress: input.providerAddress,
      providerBusinessId: input.provider.businessId,
      settlementId: input.identity.settlementId,
    },
    obligation,
    settlement,
  };
}

export function productErc8183Legs(): readonly ProductErc8183Leg[] {
  return executableErc8183Legs;
}
