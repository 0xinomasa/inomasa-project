import { cache } from 'react';

import { formatUsdcAmount, type UsdcMicroAmount } from '../../modules/commerce/money.ts';
import { loadEconomicHistory } from '../_economic-history/data.ts';

export interface LiveEconomyCard {
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

function amount(value: string): string {
  return formatUsdcAmount(BigInt(value) as UsdcMicroAmount);
}

function toCard(
  activity: Awaited<ReturnType<typeof loadEconomicHistory>>['activities'][number],
): LiveEconomyCard {
  if (activity.activityKind === 'CAPITAL') {
    return {
      detail: amount(activity.amountMicroUsdc) + ' USDC · provider decision observed',
      id: activity.activityId,
      label: 'Capital allocated',
      observedAt: activity.occurredAt,
      protocols: activity.protocols,
      status: activity.status,
    };
  }

  const isJob = activity.work !== null;
  const isPayment = activity.protocols.includes('X402') || activity.settlement.provider !== null;
  const label = isJob
    ? activity.status === 'COMPLETE' ? 'Job completed' : 'Job activity'
    : isPayment ? 'USDC payment settled' : 'Service purchased';
  return {
    detail: amount(activity.amountMicroUsdc) + ' USDC · ' + activity.status.toLowerCase().replaceAll('_', ' '),
    id: activity.activityId,
    label,
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
