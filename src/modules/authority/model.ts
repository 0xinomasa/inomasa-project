import type { InomasaEnvironment } from '../../shared/environment.ts';
import type { UsdcMicroAmount } from '../commerce/money.ts';

export type AuthorityDenialReason =
  | 'ALLOWANCE_EXHAUSTED'
  | 'AMOUNT_EXCEEDS_PER_ACTION_LIMIT'
  | 'COUNTERPARTY_OUT_OF_SCOPE'
  | 'GRANT_EXPIRED'
  | 'GRANT_INACTIVE'
  | 'GRANT_NOT_YET_VALID'
  | 'OFFER_OUT_OF_SCOPE'
  | 'REQUESTER_MISMATCH'
  | 'SCOPE_MISMATCH';

export interface StandingPurchaseAuthorityGrant {
  readonly actionType: 'PURCHASE_SERVICE';
  readonly allowedCounterpartyBusinessId: `biz_${string}`;
  readonly allowedOfferId: `off_${string}`;
  readonly allowanceConsumedMicroUsdc: UsdcMicroAmount;
  readonly allowanceTotalMicroUsdc: UsdcMicroAmount;
  readonly asset: 'USDC';
  readonly authorityDomainBusinessId: `biz_${string}`;
  readonly controlVersion: number;
  readonly delegationAllowed: false;
  readonly environment: InomasaEnvironment;
  readonly expiresAt: string;
  readonly granteePrincipalId: `agt_${string}`;
  readonly grantId: `grt_${string}`;
  readonly grantVersion: number;
  readonly grantorPrincipalId: `usr_${string}`;
  readonly maxPerActionMicroUsdc: UsdcMicroAmount;
  readonly representedBusinessId: `biz_${string}`;
  readonly status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  readonly validFrom: string;
}

export interface AgentPurchaseIntent {
  readonly actionType: 'PURCHASE_SERVICE';
  readonly amountMicroUsdc: UsdcMicroAmount;
  readonly asset: 'USDC';
  readonly authorityDomainBusinessId: `biz_${string}`;
  readonly counterpartyBusinessId: `biz_${string}`;
  readonly environment: InomasaEnvironment;
  readonly grantId: `grt_${string}`;
  readonly intentId: `int_${string}`;
  readonly offerId: `off_${string}`;
  readonly purpose: string;
  readonly requestedAt: string;
  readonly requesterPrincipalId: `agt_${string}`;
  readonly representedBusinessId: `biz_${string}`;
}

export type AuthorityPolicyDecision =
  | {
      readonly availableAfterMicroUsdc: UsdcMicroAmount;
      readonly outcome: 'ALLOW';
      readonly reason: 'WITHIN_PERSISTED_AUTHORITY';
    }
  | {
      readonly outcome: 'DENY';
      readonly reason: AuthorityDenialReason;
    };

function asEpoch(value: string, label: string): number {
  const epoch = Date.parse(value);
  if (!Number.isFinite(epoch)) throw new Error(`${label} must be an ISO timestamp.`);
  return epoch;
}

export function evaluateAgentPurchaseAuthority(
  grant: StandingPurchaseAuthorityGrant,
  intent: AgentPurchaseIntent,
  evaluatedAt: string,
): AuthorityPolicyDecision {
  const evaluatedAtEpoch = asEpoch(evaluatedAt, 'Evaluation time');
  const validFromEpoch = asEpoch(grant.validFrom, 'Grant valid-from time');
  const expiresAtEpoch = asEpoch(grant.expiresAt, 'Grant expiry time');

  if (grant.status !== 'ACTIVE') return { outcome: 'DENY', reason: 'GRANT_INACTIVE' };
  if (evaluatedAtEpoch < validFromEpoch) {
    return { outcome: 'DENY', reason: 'GRANT_NOT_YET_VALID' };
  }
  if (evaluatedAtEpoch >= expiresAtEpoch) return { outcome: 'DENY', reason: 'GRANT_EXPIRED' };
  if (intent.requesterPrincipalId !== grant.granteePrincipalId) {
    return { outcome: 'DENY', reason: 'REQUESTER_MISMATCH' };
  }
  if (
    intent.environment !== grant.environment ||
    intent.grantId !== grant.grantId ||
    intent.representedBusinessId !== grant.representedBusinessId ||
    intent.authorityDomainBusinessId !== grant.authorityDomainBusinessId ||
    intent.actionType !== grant.actionType ||
    intent.asset !== grant.asset
  ) {
    return { outcome: 'DENY', reason: 'SCOPE_MISMATCH' };
  }
  if (intent.offerId !== grant.allowedOfferId) {
    return { outcome: 'DENY', reason: 'OFFER_OUT_OF_SCOPE' };
  }
  if (intent.counterpartyBusinessId !== grant.allowedCounterpartyBusinessId) {
    return { outcome: 'DENY', reason: 'COUNTERPARTY_OUT_OF_SCOPE' };
  }
  if (intent.amountMicroUsdc > grant.maxPerActionMicroUsdc) {
    return { outcome: 'DENY', reason: 'AMOUNT_EXCEEDS_PER_ACTION_LIMIT' };
  }

  const available = grant.allowanceTotalMicroUsdc - grant.allowanceConsumedMicroUsdc;
  if (intent.amountMicroUsdc > available) {
    return { outcome: 'DENY', reason: 'ALLOWANCE_EXHAUSTED' };
  }

  return {
    availableAfterMicroUsdc: (available - intent.amountMicroUsdc) as UsdcMicroAmount,
    outcome: 'ALLOW',
    reason: 'WITHIN_PERSISTED_AUTHORITY',
  };
}
