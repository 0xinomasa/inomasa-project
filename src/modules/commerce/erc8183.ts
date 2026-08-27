import type { EconomicProvenance } from './model.ts';
import type { UsdcMicroAmount } from './money.ts';

export type Erc8183JobStatus =
  | 'COMPLETED'
  | 'EXPIRED'
  | 'FUNDED'
  | 'OPEN'
  | 'REJECTED'
  | 'SUBMITTED';

export type Erc8183Leg =
  | 'APPROVE'
  | 'COMPLETE'
  | 'CREATE'
  | 'FUND'
  | 'REFUND'
  | 'REJECT'
  | 'SET_BUDGET'
  | 'SUBMIT';

export type Erc8183OperationState =
  | 'AUTHORIZED'
  | 'COMPLETE'
  | 'FAILED'
  | 'OUTCOME_UNKNOWN'
  | 'SUBMITTED';

export interface Erc8183JobCommitment {
  readonly budgetMicroUsdc: UsdcMicroAmount;
  readonly clientAddress: `0x${string}`;
  readonly clientBusinessId: `biz_${string}`;
  readonly description: string;
  readonly evaluatorAddress: `0x${string}`;
  readonly expiredAt: string;
  readonly hookAddress: '0x0000000000000000000000000000000000000000';
  readonly jobId: `job_${string}`;
  readonly obligationId: `obl_${string}`;
  readonly provenance: EconomicProvenance;
  readonly providerAddress: `0x${string}`;
  readonly providerBusinessId: `biz_${string}`;
  readonly settlementId: `set_${string}`;
}

const terminalStatuses = new Set<Erc8183JobStatus>(['COMPLETED', 'EXPIRED', 'REJECTED']);

export function erc8183StatusFromChain(value: number): Erc8183JobStatus {
  const statuses = ['OPEN', 'FUNDED', 'SUBMITTED', 'COMPLETED', 'REJECTED', 'EXPIRED'] as const;
  const status = statuses[value];
  if (status === undefined) throw new Error(`Unknown ERC-8183 job status ${value}.`);
  return status;
}

export function isErc8183Terminal(status: Erc8183JobStatus): boolean {
  return terminalStatuses.has(status);
}

export function assertErc8183Transition(
  previous: Erc8183JobStatus,
  next: Erc8183JobStatus,
): void {
  const allowed: Readonly<Record<Erc8183JobStatus, readonly Erc8183JobStatus[]>> = {
    COMPLETED: [],
    EXPIRED: [],
    FUNDED: ['SUBMITTED', 'REJECTED', 'EXPIRED'],
    OPEN: ['FUNDED', 'REJECTED'],
    REJECTED: [],
    SUBMITTED: ['COMPLETED', 'REJECTED', 'EXPIRED'],
  };
  if (!allowed[previous].includes(next)) {
    throw new Error(`ERC-8183 transition ${previous} -> ${next} is not admissible.`);
  }
}

export function erc8183TerminalEconomicEffect(status: Erc8183JobStatus):
  | 'PAYOUT'
  | 'REFUND'
  | 'NONE' {
  if (status === 'COMPLETED') return 'PAYOUT';
  if (status === 'EXPIRED' || status === 'REJECTED') return 'REFUND';
  return 'NONE';
}
