import { cache } from 'react';

import { formatUsdcAmount, type UsdcMicroAmount } from '../../modules/commerce/money.ts';
import { loadEconomicHistory } from '../_economic-history/data.ts';

export interface LiveEconomyCard {
  readonly amount: string;
  readonly id: string;
  readonly label: string;
  readonly detail: string;
  readonly status: 'COMPLETE' | 'PENDING' | 'FAILED' | 'OUTCOME_UNKNOWN';
  readonly observedAt: Date;
  readonly protocols: readonly string[];
}

export interface LiveEconomyView {
  readonly cards: readonly LiveEconomyCard[];
  readonly state: 'CONNECTED' | 'NOT_CONFIGURED' | 'UNAVAILABLE';
}

export function liveEconomyLabel(input: {
  readonly activityKind: 'CAPITAL' | 'COMMERCE';
  readonly hasJob: boolean;
  readonly hasPayment: boolean;
  readonly status: LiveEconomyCard['status'];
}): string {
  if (input.activityKind === 'CAPITAL') {
    if (input.status === 'COMPLETE') return 'Capital allocated';
    if (input.status === 'PENDING') return 'Capital allocation pending';
    if (input.status === 'FAILED') return 'Capital allocation failed';
    return 'Capital allocation outcome unknown';
  }

  const subject = input.hasJob ? 'Job' : input.hasPayment ? 'USDC payment' : 'Service activity';
  if (input.status === 'COMPLETE') {
    return input.hasJob ? 'Job completed' : input.hasPayment ? 'USDC payment settled' : 'Service purchased';
  }
  if (input.status === 'PENDING') return `${subject} pending`;
  if (input.status === 'FAILED') return `${subject} failed`;
  return `${subject} outcome unknown`;
}

function amount(value: string): string {
  return formatUsdcAmount(BigInt(value) as UsdcMicroAmount);
}

function toCard(
  activity: Awaited<ReturnType<typeof loadEconomicHistory>>['activities'][number],
): LiveEconomyCard {
  if (activity.activityKind === 'CAPITAL') {
    return {
      amount: amount(activity.amountMicroUsdc),
      detail: 'Provider decision observed',
      id: activity.activityId,
      label: liveEconomyLabel({
        activityKind: activity.activityKind,
        hasJob: false,
        hasPayment: false,
        status: activity.status,
      }),
      observedAt: activity.occurredAt,
      protocols: activity.protocols,
      status: activity.status,
    };
  }

  const isJob = activity.work !== null;
  const isPayment = activity.protocols.includes('X402') || activity.settlement.provider !== null;
  return {
    amount: amount(activity.amountMicroUsdc),
    detail: activity.status.toLowerCase().replaceAll('_', ' '),
    id: activity.activityId,
    label: liveEconomyLabel({
      activityKind: activity.activityKind,
      hasJob: isJob,
      hasPayment: isPayment,
      status: activity.status,
    }),
    observedAt: activity.occurredAt,
    protocols: activity.protocols,
    status: activity.status,
  };
}

export const loadLiveEconomy = cache(async (): Promise<LiveEconomyView> => {
  const history = await loadEconomicHistory();
  return {
    cards: history.activities.slice(0, 8).map(toCard),
    state: history.state,
  };
});
