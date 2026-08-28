import Link from 'next/link';

import { formatUsdcAmount, type UsdcMicroAmount } from '../../modules/commerce/money.ts';
import type { CapitalPathSummary } from '../../platform/persistence/capital-repository.ts';
import { arcTestnet } from '../../platform/arc/config.ts';

function displayUsdc(amount: string | null): string {
  return amount === null
    ? 'NOT APPROVED'
    : `${formatUsdcAmount(BigInt(amount) as UsdcMicroAmount)} USDC`;
}

function termsPurpose(terms: unknown): string {
  if (typeof terms !== 'object' || terms === null || !Object.hasOwn(terms, 'purpose')) {
    return 'NO ALLOCATION TERMS';
  }
  const purpose = (terms as { readonly purpose?: unknown }).purpose;
  return typeof purpose === 'string' ? purpose : 'NO ALLOCATION TERMS';
}

export function CapitalPathList({ paths }: { readonly paths: readonly CapitalPathSummary[] }) {
  if (paths.length === 0) {
    return <article className="activity-empty"><span>NO PROVIDER DECISION</span><p>No Capital path exists in this context.</p></article>;
  }
  return (
    <div className="capital-path-list">
      {paths.map((path) => (
        <article className="economic-activity" key={path.decisionId}>
          <div className="economic-activity__topline">
            <div className="protocol-badges">
              <span>CAPITAL PROVIDER</span>
              <span>{path.providerProvenance.replaceAll('_', ' ')}</span>
            </div>
            <span className={`activity-status activity-status--${path.outcome === 'APPROVED' ? 'complete' : 'failed'}`}>
              {path.outcome}
            </span>
          </div>
          <div className="economic-activity__headline">
            <div>
              <p className="eyebrow">{path.providerDisplayName}</p>
              <h3>{path.businessName}</h3>
              <p>{path.rationale}</p>
            </div>
            <strong>{displayUsdc(path.approvedMicroUsdc)}</strong>
          </div>
          <dl className="economic-activity__context">
            <div><dt>Provider decision</dt><dd>{path.reasonCode.replaceAll('_', ' ')}</dd></div>
            <div><dt>Requested</dt><dd>{displayUsdc(path.requestedMicroUsdc)}</dd></div>
            <div><dt>Allocation</dt><dd>{path.allocationState ?? 'NOT OFFERED'}</dd></div>
            <div><dt>Instrument</dt><dd>{path.instrument?.replaceAll('_', ' ') ?? 'NONE'}</dd></div>
            <div><dt>Return profile</dt><dd>{path.returnProfile ?? 'NONE'}</dd></div>
            <div><dt>Bounded use links</dt><dd>{path.uses.length}</dd></div>
            <div><dt>Terms purpose</dt><dd>{termsPurpose(path.terms)}</dd></div>
            <div><dt>Material</dt><dd><code>{path.materialSha256}</code></dd></div>
          </dl>
          {path.uses.map((use) => (
            <p key={use.capitalUseId}>
              USE · {displayUsdc(use.amountMicroUsdc)} · {use.obligationId} · {use.settlementState ?? use.obligationState}
            </p>
          ))}
          <div className="economic-activity__footer">
            <span>{path.providerId}</span>
            {path.allocationTransactionHash === null ? (
              <span>NO CHAIN ALLOCATION PROOF</span>
            ) : (
              <a href={`${arcTestnet.explorerUrl}/tx/${path.allocationTransactionHash}`} rel="noreferrer" target="_blank">Arc allocation proof</a>
            )}
            <Link href={`/business/${path.businessSlug}`}>Business context</Link>
          </div>
        </article>
      ))}
    </div>
  );
}
