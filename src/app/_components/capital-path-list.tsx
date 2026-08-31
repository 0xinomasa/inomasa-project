import Link from 'next/link';

import { formatUsdcAmount, type UsdcMicroAmount } from '../../modules/commerce/money.ts';
import type { CapitalPathSummary } from '../../platform/persistence/capital-repository.ts';
import { arcTestnet } from '../../platform/arc/config.ts';
import { CapitalAllocationAcceptance } from './capital-allocation-acceptance';

function displayUsdc(amount: string | null): string {
  return amount === null
    ? 'Not approved'
    : `${formatUsdcAmount(BigInt(amount) as UsdcMicroAmount)} USDC`;
}

function readable(value: string | null): string {
  return value === null
    ? 'Not available'
    : value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function termsValue(terms: unknown, key: 'purpose' | 'useCapMicroUsdc'): string | null {
  if (typeof terms !== 'object' || terms === null || !Object.hasOwn(terms, key)) return null;
  const value = (terms as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : null;
}

function criteriaSummary(criteria: unknown): string {
  if (typeof criteria !== 'object' || criteria === null) return 'Provider criteria unavailable.';
  const value = criteria as Record<string, unknown>;
  const activities = value['minimumCompletedCommerceActivities'];
  const volume = value['minimumCompletedCommerceVolumeMicroUsdc'];
  const unresolved = value['requireNoUnresolvedActivity'];
  if (typeof activities !== 'number' || typeof volume !== 'string' || typeof unresolved !== 'boolean') {
    return 'Provider criteria unavailable.';
  }
  return `At least ${activities} completed activities and ${displayUsdc(volume)} completed commerce${
    unresolved ? ', with no unresolved activity' : ''
  }.`;
}

function allocationTone(state: string | null, outcome: string): string {
  if (state === 'COMPLETE') return 'complete';
  if (state === 'FAILED' || outcome === 'DECLINED') return 'failed';
  if (state === 'OUTCOME_UNKNOWN') return 'outcome_unknown';
  return 'pending';
}

export function CapitalPathList({
  paths,
  enableAcceptance = false,
  presentation = 'full',
}: {
  readonly paths: readonly CapitalPathSummary[];
  readonly enableAcceptance?: boolean;
  readonly presentation?: 'full' | 'workspace';
}) {
  if (paths.length === 0) {
    return (
      <article className="activity-empty">
        <span>No provider decision</span>
        <p>No Capital review or allocation exists for a Business in this context.</p>
      </article>
    );
  }
  return (
    <div className="capital-path-list">
      {paths.map((path) => {
        const purpose = termsValue(path.terms, 'purpose');
        const useCap = termsValue(path.terms, 'useCapMicroUsdc');
        const currentState = path.allocationState ?? path.outcome;
        const supportingDetail = (
          <>
            <dl className="capital-path__facts">
              <div><dt>Risk bearer</dt><dd>{path.providerDisplayName}</dd></div>
              <div><dt>Decision</dt><dd>{readable(path.reasonCode)}</dd></div>
              <div><dt>Requested</dt><dd>{displayUsdc(path.requestedMicroUsdc)}</dd></div>
              <div><dt>Mandate</dt><dd>{path.mandateName} · v{path.mandateVersion}</dd></div>
              <div><dt>Instrument</dt><dd>{readable(path.instrument)}</dd></div>
              <div><dt>Return</dt><dd>{readable(path.returnProfile)}</dd></div>
            </dl>

            {purpose === null ? null : (
              <div className="capital-path__purpose">
                <strong>Bounded purpose</strong>
                <p>{purpose}</p>
                {useCap === null ? null : <span>Use cap · {displayUsdc(useCap)}</span>}
              </div>
            )}

            {path.uses.length === 0 ? (
              path.allocationState === 'COMPLETE' ? (
                <p className="capital-path__no-use">No later Business use is linked to this allocation yet.</p>
              ) : null
            ) : (
              <div className="capital-path__uses">
                <strong>Later Business use</strong>
                {path.uses.map((use) => (
                  <div key={use.capitalUseId}>
                    <span>{displayUsdc(use.amountMicroUsdc)}</span>
                    <p>{readable(use.settlementState ?? use.obligationState)} · obligation {use.obligationId}</p>
                  </div>
                ))}
              </div>
            )}

            <details className="capital-path__proof">
              <summary>Provider decision and system proof</summary>
              <div className="capital-path__proof-grid">
                <div><span>Provider provenance</span><strong>{readable(path.providerProvenance)}</strong></div>
                <div><span>Risk classification</span><strong>{readable(path.providerRiskBearerClassification)}</strong></div>
                <div><span>Mandate range</span><strong>{displayUsdc(path.mandateMinimumMicroUsdc)}–{displayUsdc(path.mandateMaximumMicroUsdc)}</strong></div>
                <div><span>Allocation provenance</span><strong>{readable(path.allocationProvenance)}</strong></div>
                <div><span>Execution account</span><strong>{readable(path.providerAccountAssurance)}</strong></div>
                <div><span>Custody</span><strong>{readable(path.providerAccountCustodyModel)}</strong></div>
                <div><span>Infrastructure</span><strong>{path.providerAccountInfrastructure ?? 'Not allocated'} · {path.providerAccountBlockchain ?? 'No chain'} · {readable(path.providerAccountStatus)}</strong></div>
              </div>
              <p>{path.mandateStrategy}</p>
              <p>{criteriaSummary(path.mandateCriteria)}</p>
              <dl>
                <div><dt>Provider</dt><dd><code>{path.providerId}</code></dd></div>
                <div><dt>Mandate</dt><dd><code>{path.mandateId}</code></dd></div>
                <div><dt>Review</dt><dd><code>{path.reviewId}</code></dd></div>
                <div><dt>Decision</dt><dd><code>{path.decisionId}</code></dd></div>
                <div><dt>Material digest</dt><dd><code>{path.materialSha256}</code></dd></div>
              </dl>
              {path.allocationTransactionHash === null ? (
                <span>No finalized Arc allocation transaction.</span>
              ) : (
                <a href={`${arcTestnet.explorerUrl}/tx/${path.allocationTransactionHash}`} rel="noreferrer" target="_blank">
                  Open Arc allocation proof
                </a>
              )}
            </details>

            <div className="capital-path__footer">
              <span>Capital remains separate from Revenue.</span>
              <Link href={`/app/businesses/${path.businessSlug}#capital`}>Open Business context</Link>
            </div>
          </>
        );
        return (
          <article className="capital-path" key={path.decisionId}>
            <div className="capital-path__topline">
              <div>
                <p className="eyebrow">{path.providerDisplayName}</p>
                <h3>{path.businessName}</h3>
              </div>
              <span className={`activity-status activity-status--${allocationTone(path.allocationState, path.outcome)}`}>
                {readable(currentState)}
              </span>
            </div>

            <div className="capital-path__amount">
              <span>{path.outcome === 'APPROVED' ? 'Provider-approved allocation' : 'Provider decision'}</span>
              <strong>{displayUsdc(path.approvedMicroUsdc)}</strong>
              <p>{path.rationale}</p>
            </div>

            {enableAcceptance && path.allocationState === 'OFFERED' && path.allocationId !== null ? (
              <CapitalAllocationAcceptance allocationId={path.allocationId} businessSlug={path.businessSlug} />
            ) : null}
            {presentation === 'workspace' ? (
              <details className="capital-path__workspace-details">
                <summary>Terms, later use, and proof</summary>
                {supportingDetail}
              </details>
            ) : supportingDetail}
          </article>
        );
      })}
    </div>
  );
}
