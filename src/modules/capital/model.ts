import type { UsdcMicroAmount } from '../commerce/money.ts';

export type CapitalDecisionOutcome = 'APPROVED' | 'DECLINED';
export type CapitalAllocationState =
  | 'OFFERED'
  | 'AUTHORIZED'
  | 'SUBMITTED'
  | 'OUTCOME_UNKNOWN'
  | 'COMPLETE'
  | 'FAILED';

export interface CapitalProvider {
  readonly controllerPrincipalId: `usr_${string}`;
  readonly displayName: string;
  readonly environment: 'PRIVATE_ARC_TESTNET';
  readonly provenance: 'COMMON_CONTROL_TEST' | 'INDEPENDENT';
  readonly providerId: `cap_${string}`;
  readonly riskBearerClassification: 'PROVIDER_RISK_BEARER';
  readonly status: 'ACTIVE' | 'INACTIVE';
}

export interface CapitalMandateCriteria {
  readonly allowedProvenance: readonly ('COMMON_CONTROL_TEST' | 'INDEPENDENT')[];
  readonly minimumCompletedCommerceActivities: number;
  readonly minimumCompletedCommerceVolumeMicroUsdc: string;
  readonly requireNoUnresolvedActivity: boolean;
}

export interface CapitalMandate {
  readonly criteria: CapitalMandateCriteria;
  readonly mandateId: `cmt_${string}`;
  readonly maximumMicroUsdc: UsdcMicroAmount;
  readonly minimumMicroUsdc: UsdcMicroAmount;
  readonly name: string;
  readonly providerId: `cap_${string}`;
  readonly status: 'ACTIVE' | 'RETIRED';
  readonly strategy: string;
  readonly version: number;
}

export interface CapitalDecisionMaterial {
  readonly businessId: `biz_${string}`;
  readonly businessTemplateId: string;
  readonly completedCommerceActivityCount: number;
  readonly completedCommerceVolumeMicroUsdc: string;
  readonly failedActivityCount: number;
  readonly observedAt: string;
  readonly outcomeUnknownActivityCount: number;
  readonly pendingActivityCount: number;
  readonly provenance: 'COMMON_CONTROL_TEST' | 'INDEPENDENT';
}

export interface ApprovedCapitalTerms {
  readonly instrument: 'CONTROLLED_TEST_ALLOCATION';
  readonly purpose: string;
  readonly returnProfile: 'NONE';
  readonly useCapMicroUsdc: string;
}

export interface CapitalDecision {
  readonly approvedMicroUsdc: UsdcMicroAmount | null;
  readonly asset: 'USDC' | null;
  readonly decisionId: `cpd_${string}`;
  readonly mandateId: `cmt_${string}`;
  readonly outcome: CapitalDecisionOutcome;
  readonly providerId: `cap_${string}`;
  readonly rationale: string;
  readonly reasonCode: string;
  readonly reviewId: `cpr_${string}`;
  readonly terms: ApprovedCapitalTerms | null;
}

export interface CapitalAllocation {
  readonly acceptedAt?: string;
  readonly acceptedByPrincipalId?: `usr_${string}`;
  readonly allocationId: `cal_${string}`;
  readonly amountMicroUsdc: UsdcMicroAmount;
  readonly asset: 'USDC';
  readonly decisionId: `cpd_${string}`;
  readonly instrument: 'CONTROLLED_TEST_ALLOCATION';
  readonly provenance: 'COMMON_CONTROL_TEST' | 'INDEPENDENT';
  readonly providerAccountId: `cpa_${string}`;
  readonly recipientBusinessId: `biz_${string}`;
  readonly returnProfile: 'NONE';
  readonly state: CapitalAllocationState;
}

export function deriveCapitalProvenance(input: {
  readonly decisionMaterialProvenance: CapitalDecisionMaterial['provenance'];
  readonly providerProvenance: CapitalProvider['provenance'];
}): CapitalAllocation['provenance'] {
  return input.decisionMaterialProvenance === 'COMMON_CONTROL_TEST' ||
    input.providerProvenance === 'COMMON_CONTROL_TEST'
    ? 'COMMON_CONTROL_TEST'
    : 'INDEPENDENT';
}

function decline(input: {
  readonly decisionId: `cpd_${string}`;
  readonly mandate: CapitalMandate;
  readonly reasonCode: string;
  readonly rationale: string;
  readonly reviewId: `cpr_${string}`;
}): CapitalDecision {
  return {
    approvedMicroUsdc: null,
    asset: null,
    decisionId: input.decisionId,
    mandateId: input.mandate.mandateId,
    outcome: 'DECLINED',
    providerId: input.mandate.providerId,
    rationale: input.rationale,
    reasonCode: input.reasonCode,
    reviewId: input.reviewId,
    terms: null,
  };
}

export function decideCapitalRequest(input: {
  readonly decisionId: `cpd_${string}`;
  readonly mandate: CapitalMandate;
  readonly material: CapitalDecisionMaterial;
  readonly requestedMicroUsdc: UsdcMicroAmount;
  readonly reviewId: `cpr_${string}`;
  readonly terms: ApprovedCapitalTerms;
}): CapitalDecision {
  if (input.mandate.status !== 'ACTIVE') {
    return decline({
      ...input,
      reasonCode: 'MANDATE_NOT_ACTIVE',
      rationale: 'This provider mandate is not active.',
    });
  }
  if (
    input.requestedMicroUsdc < input.mandate.minimumMicroUsdc ||
    input.requestedMicroUsdc > input.mandate.maximumMicroUsdc
  ) {
    return decline({
      ...input,
      reasonCode: 'OUTSIDE_PROVIDER_AMOUNT_RANGE',
      rationale: 'The requested allocation is outside this provider mandate.',
    });
  }
  if (!input.mandate.criteria.allowedProvenance.includes(input.material.provenance)) {
    return decline({
      ...input,
      reasonCode: 'PROVENANCE_OUTSIDE_MANDATE',
      rationale: 'This provider does not allocate against the observed provenance class.',
    });
  }
  if (
    input.material.completedCommerceActivityCount <
      input.mandate.criteria.minimumCompletedCommerceActivities ||
    BigInt(input.material.completedCommerceVolumeMicroUsdc) <
      BigInt(input.mandate.criteria.minimumCompletedCommerceVolumeMicroUsdc)
  ) {
    return decline({
      ...input,
      reasonCode: 'INSUFFICIENT_OPERATING_HISTORY',
      rationale: 'The observed commerce history does not meet this provider mandate.',
    });
  }
  if (
    input.mandate.criteria.requireNoUnresolvedActivity &&
    (input.material.failedActivityCount > 0 ||
      input.material.outcomeUnknownActivityCount > 0 ||
      input.material.pendingActivityCount > 0)
  ) {
    return decline({
      ...input,
      reasonCode: 'UNRESOLVED_ACTIVITY',
      rationale: 'This provider requires no failed, pending, or outcome-unknown activity.',
    });
  }
  if (BigInt(input.terms.useCapMicroUsdc) > input.requestedMicroUsdc) {
    throw new Error('Capital use cap cannot exceed the approved allocation.');
  }

  return {
    approvedMicroUsdc: input.requestedMicroUsdc,
    asset: 'USDC',
    decisionId: input.decisionId,
    mandateId: input.mandate.mandateId,
    outcome: 'APPROVED',
    providerId: input.mandate.providerId,
    rationale: 'Provider-specific mandate requirements were satisfied by the scoped snapshot.',
    reasonCode: 'WITHIN_PROVIDER_MANDATE',
    reviewId: input.reviewId,
    terms: input.terms,
  };
}

export function offerCapitalAllocation(input: {
  readonly allocationId: `cal_${string}`;
  readonly decision: CapitalDecision;
  readonly providerAccountId: `cpa_${string}`;
  readonly provenance: 'COMMON_CONTROL_TEST' | 'INDEPENDENT';
  readonly recipientBusinessId: `biz_${string}`;
}): CapitalAllocation {
  if (
    input.decision.outcome !== 'APPROVED' ||
    input.decision.approvedMicroUsdc === null ||
    input.decision.terms === null
  ) {
    throw new Error('Only an approved provider decision can create a Capital offer.');
  }
  return {
    allocationId: input.allocationId,
    amountMicroUsdc: input.decision.approvedMicroUsdc,
    asset: 'USDC',
    decisionId: input.decision.decisionId,
    instrument: input.decision.terms.instrument,
    provenance: input.provenance,
    providerAccountId: input.providerAccountId,
    recipientBusinessId: input.recipientBusinessId,
    returnProfile: input.decision.terms.returnProfile,
    state: 'OFFERED',
  };
}

export function acceptCapitalAllocation(
  allocation: CapitalAllocation,
  acceptedByPrincipalId: `usr_${string}`,
  acceptedAt: string,
): CapitalAllocation {
  if (allocation.state !== 'OFFERED') {
    throw new Error('Capital allocation can only be accepted from OFFERED.');
  }
  if (!Number.isFinite(Date.parse(acceptedAt))) {
    throw new Error('Capital acceptance requires a valid timestamp.');
  }
  return {
    ...allocation,
    acceptedAt,
    acceptedByPrincipalId,
    state: 'AUTHORIZED',
  };
}
