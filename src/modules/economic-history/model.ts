import type { EconomicProvenance } from '../commerce/model.ts';

export const activityStatuses = ['COMPLETE', 'FAILED', 'PENDING', 'OUTCOME_UNKNOWN'] as const;

export type ActivityStatus = (typeof activityStatuses)[number];

export const activityProtocols = ['ARC_USDC', 'X402', 'ERC_8004', 'ERC_8183'] as const;

export type ActivityProtocol = (typeof activityProtocols)[number];

export type ActivityProofKind =
  | 'APPLICATION_RECORD'
  | 'ARC_BLOCK'
  | 'ARC_CONTRACT'
  | 'ARC_TRANSACTION'
  | 'CONTENT_DIGEST'
  | 'PROVIDER_RECEIPT';

export interface ActivityParty {
  readonly businessId: `biz_${string}`;
  readonly displayName: string;
  readonly slug: string;
}

export interface ActivityAgent {
  readonly agentId: string | null;
  readonly agentPrincipalId: `agt_${string}`;
  readonly agentRegistry: string | null;
  readonly displayName: string;
  readonly identityId: `aid_${string}` | null;
}

export interface ActivityEconomicEffect {
  readonly amountMicroUsdc: string;
  readonly businessId: `biz_${string}`;
  readonly category: string;
  readonly direction: string;
}

export interface ActivityProof {
  readonly kind: ActivityProofKind;
  readonly label: string;
  readonly reference: string;
  readonly scope: string;
  readonly verification: string;
}

export interface EconomicActivity {
  readonly activityId: `obl_${string}`;
  readonly agent: ActivityAgent | null;
  readonly amountMicroUsdc: string;
  readonly asset: 'USDC';
  readonly buyer: ActivityParty;
  readonly economicEffects: readonly ActivityEconomicEffect[];
  readonly environment: string;
  readonly occurredAt: Date;
  readonly offer: {
    readonly capabilityId: string;
    readonly description: string;
    readonly offerId: `off_${string}`;
    readonly termsVersion: number;
  };
  readonly outcome: string;
  readonly proofs: readonly ActivityProof[];
  readonly protocols: readonly ActivityProtocol[];
  readonly provenance: EconomicProvenance;
  readonly seller: ActivityParty;
  readonly settlement: {
    readonly provider: string | null;
    readonly settlementId: `set_${string}` | null;
    readonly state: string | null;
  };
  readonly status: ActivityStatus;
  readonly work: {
    readonly jobId: `job_${string}`;
    readonly protocolJobId: string | null;
    readonly protocolStatus: string;
  } | null;
}

export interface ActivityStatusInput {
  readonly deliveryState: string | null;
  readonly jobOperationStates: readonly string[];
  readonly jobStatus: string | null;
  readonly paymentState: string | null;
  readonly settlementState: string | null;
}

export interface EconomicHistorySummary {
  readonly activityCount: number;
  readonly completedVolumeMicroUsdc: string;
  readonly economicCategoryCounts: Readonly<Record<string, number>>;
  readonly protocolCounts: Readonly<Record<ActivityProtocol, number>>;
  readonly statusCounts: Readonly<Record<ActivityStatus, number>>;
}

export interface EconomicHistoryInventory {
  readonly agentCount: number;
  readonly businessCount: number;
  readonly evidenceCount: number;
  readonly serviceDeliveryCount: number;
}

function includesState(states: readonly (string | null)[], expected: string): boolean {
  return states.some((state) => state === expected);
}

export function deriveActivityStatus(input: ActivityStatusInput): ActivityStatus {
  const observedStates = [
    input.deliveryState,
    input.jobStatus,
    input.paymentState,
    input.settlementState,
    ...input.jobOperationStates,
  ];

  if (includesState(observedStates, 'OUTCOME_UNKNOWN')) return 'OUTCOME_UNKNOWN';
  if (includesState(observedStates, 'FAILED')) return 'FAILED';

  if (input.jobStatus === 'REJECTED' || input.jobStatus === 'EXPIRED') {
    return input.settlementState === 'REFUNDED' ? 'COMPLETE' : 'PENDING';
  }

  if (input.jobStatus === 'COMPLETED') {
    return input.settlementState === 'COMPLETE' && input.deliveryState === 'COMPLETE'
      ? 'COMPLETE'
      : 'PENDING';
  }

  if (input.settlementState === 'REFUNDED') return 'COMPLETE';
  if (input.settlementState !== 'COMPLETE') return 'PENDING';

  if (input.paymentState !== null && input.paymentState !== 'COMPLETE') return 'PENDING';
  return input.deliveryState === 'COMPLETE' ? 'COMPLETE' : 'PENDING';
}

export function deriveActivityOutcome(input: ActivityStatusInput): string {
  if (input.jobStatus !== null && input.jobStatus !== 'UNCREATED') return input.jobStatus;
  if (input.settlementState === 'REFUNDED') return 'REFUNDED';
  if (input.deliveryState === 'COMPLETE') return 'SERVICE_DELIVERED';
  if (input.paymentState === 'COMPLETE') return 'PAYMENT_COMPLETE';
  return input.settlementState ?? input.paymentState ?? 'NOT_SETTLED';
}

export function deriveActivityProtocols(input: {
  readonly hasArcUsdcSettlement: boolean;
  readonly hasErc8004Identity: boolean;
  readonly hasErc8183Job: boolean;
  readonly hasX402Payment: boolean;
}): readonly ActivityProtocol[] {
  return activityProtocols.filter((protocol) => {
    if (protocol === 'ARC_USDC') return input.hasArcUsdcSettlement;
    if (protocol === 'X402') return input.hasX402Payment;
    if (protocol === 'ERC_8004') return input.hasErc8004Identity;
    return input.hasErc8183Job;
  });
}

export function summarizeEconomicHistory(
  activities: readonly EconomicActivity[],
): EconomicHistorySummary {
  const statusCounts: Record<ActivityStatus, number> = {
    COMPLETE: 0,
    FAILED: 0,
    OUTCOME_UNKNOWN: 0,
    PENDING: 0,
  };
  const protocolCounts: Record<ActivityProtocol, number> = {
    ARC_USDC: 0,
    ERC_8004: 0,
    ERC_8183: 0,
    X402: 0,
  };
  const economicCategoryCounts: Record<string, number> = {};
  let completedVolumeMicroUsdc = 0n;

  for (const activity of activities) {
    statusCounts[activity.status] += 1;
    for (const protocol of activity.protocols) protocolCounts[protocol] += 1;
    for (const effect of activity.economicEffects) {
      economicCategoryCounts[effect.category] =
        (economicCategoryCounts[effect.category] ?? 0) + 1;
    }
    if (activity.status === 'COMPLETE' && activity.settlement.state === 'COMPLETE') {
      completedVolumeMicroUsdc += BigInt(activity.amountMicroUsdc);
    }
  }

  return {
    activityCount: activities.length,
    completedVolumeMicroUsdc: completedVolumeMicroUsdc.toString(),
    economicCategoryCounts,
    protocolCounts,
    statusCounts,
  };
}
