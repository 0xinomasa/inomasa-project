import Link from 'next/link';

import {
  type ActivityProof,
  type ActivityProtocol,
  type EconomicActivity,
} from '../../modules/economic-history/model.ts';
import { formatUsdcAmount, type UsdcMicroAmount } from '../../modules/commerce/money.ts';
import { arcTestnet } from '../../platform/arc/config.ts';

const protocolLabels: Readonly<Record<ActivityProtocol, string>> = {
  ARC_USDC: 'Arc · USDC',
  ERC_8004: 'ERC-8004',
  ERC_8183: 'ERC-8183',
  X402: 'x402',
};

function humanize(value: string): string {
  return value.replaceAll('_', ' ');
}

function displayUsdc(amountMicroUsdc: string): string {
  return `${formatUsdcAmount(BigInt(amountMicroUsdc) as UsdcMicroAmount)} USDC`;
}

function proofHref(proof: ActivityProof): string | null {
  if (proof.kind === 'ARC_TRANSACTION' && /^0x[0-9a-fA-F]{64}$/.test(proof.reference)) {
    return `${arcTestnet.explorerUrl}/tx/${proof.reference}`;
  }
  if (proof.kind === 'ARC_CONTRACT' && /^0x[0-9a-fA-F]{40}$/.test(proof.reference)) {
    return `${arcTestnet.explorerUrl}/address/${proof.reference}`;
  }
  if (proof.kind === 'ARC_BLOCK' && /^arc-block:[0-9]+$/.test(proof.reference)) {
    return `${arcTestnet.explorerUrl}/block/${proof.reference.slice('arc-block:'.length)}`;
  }
  return null;
}

function compactReference(reference: string): string {
  return reference.length <= 30
    ? reference
    : `${reference.slice(0, 14)}…${reference.slice(-10)}`;
}

function activityRole(activity: EconomicActivity, businessId?: `biz_${string}`): string {
  if (businessId === undefined) return 'BUSINESS-TO-BUSINESS';
  return activity.buyer.businessId === businessId ? 'BUYER' : 'SELLER';
}

function economicInterpretation(
  activity: EconomicActivity,
  businessId?: `biz_${string}`,
): string {
  const effects =
    businessId === undefined
      ? activity.economicEffects
      : activity.economicEffects.filter((effect) => effect.businessId === businessId);
  if (effects.length === 0) return 'NO POSTED ECONOMIC EFFECT';
  return effects
    .map((effect) => `${humanize(effect.category)} · ${effect.direction}`)
    .join(' / ');
}

export function EconomicActivityList({
  activities,
  businessId,
  emptyMessage = 'No economic activity exists in this context.',
}: {
  readonly activities: readonly EconomicActivity[];
  readonly businessId?: `biz_${string}`;
  readonly emptyMessage?: string;
}) {
  if (activities.length === 0) {
    return (
      <article className="activity-empty">
        <span>NO ACTIVITY</span>
        <p>{emptyMessage}</p>
      </article>
    );
  }

  return (
    <div className="economic-history-list">
      {activities.map((activity) => {
        const counterparty =
          businessId === undefined || activity.buyer.businessId === businessId
            ? activity.seller
            : activity.buyer;
        return (
          <article className="economic-activity" key={activity.activityId}>
            <div className="economic-activity__topline">
              <div className="protocol-badges" aria-label="Protocols used">
                {activity.protocols.map((protocol) => (
                  <span key={protocol}>{protocolLabels[protocol]}</span>
                ))}
              </div>
              <span className={`activity-status activity-status--${activity.status.toLowerCase()}`}>
                {humanize(activity.status)}
              </span>
            </div>

            <div className="economic-activity__headline">
              <div>
                <p className="eyebrow">
                  {activityRole(activity, businessId)} · {humanize(activity.provenance)}
                </p>
                <h3>{humanize(activity.offer.capabilityId)}</h3>
                <p>{activity.offer.description}</p>
              </div>
              <strong>{displayUsdc(activity.amountMicroUsdc)}</strong>
            </div>

            <dl className="economic-activity__context">
              <div>
                <dt>Buyer</dt>
                <dd>{activity.buyer.displayName}</dd>
              </div>
              <div>
                <dt>Seller</dt>
                <dd>{activity.seller.displayName}</dd>
              </div>
              <div>
                <dt>Agent</dt>
                <dd>{activity.agent?.displayName ?? 'HUMAN / SYSTEM ACTION'}</dd>
              </div>
              <div>
                <dt>{businessId === undefined ? 'Parties' : 'Counterparty'}</dt>
                <dd>{businessId === undefined ? 'BUYER + SELLER' : counterparty.displayName}</dd>
              </div>
              <div>
                <dt>Service / job</dt>
                <dd>
                  {activity.work === null
                    ? activity.offer.offerId
                    : `${activity.work.jobId} · ${activity.work.protocolJobId ?? 'NOT CREATED'}`}
                </dd>
              </div>
              <div>
                <dt>Outcome</dt>
                <dd>{humanize(activity.outcome)}</dd>
              </div>
              <div>
                <dt>Economic meaning</dt>
                <dd>{economicInterpretation(activity, businessId)}</dd>
              </div>
              <div>
                <dt>Observed</dt>
                <dd>
                  <time dateTime={activity.occurredAt.toISOString()}>
                    {activity.occurredAt.toISOString()}
                  </time>
                </dd>
              </div>
            </dl>

            <details className="economic-activity__proofs">
              <summary>Inspect {activity.proofs.length} source-scoped references</summary>
              <div>
                {activity.proofs.map((proof, index) => {
                  const href = proofHref(proof);
                  return (
                    <article key={`${proof.kind}-${proof.scope}-${proof.reference}-${index}`}>
                      <span>{humanize(proof.scope)}</span>
                      <strong>{proof.label}</strong>
                      <small>{humanize(proof.verification)} · {humanize(proof.kind)}</small>
                      {href === null ? (
                        <code title={proof.reference}>{proof.reference}</code>
                      ) : (
                        <a href={href} rel="noreferrer" target="_blank">
                          View on ArcScan · {compactReference(proof.reference)}
                        </a>
                      )}
                    </article>
                  );
                })}
              </div>
            </details>

            <div className="economic-activity__footer">
              <span>{activity.activityId}</span>
              <span>{activity.settlement.provider?.replaceAll('_', ' ') ?? 'RAIL NOT SELECTED'}</span>
              {businessId === undefined ? (
                <Link href={`/business/${activity.buyer.slug}`}>
                  Business context
                </Link>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
