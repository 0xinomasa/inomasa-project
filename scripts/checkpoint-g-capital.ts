import assert from 'node:assert/strict';

import {
  acceptCapitalAllocation,
  decideCapitalRequest,
  offerCapitalAllocation,
  type ApprovedCapitalTerms,
  type CapitalDecisionMaterial,
  type CapitalMandate,
} from '../src/modules/capital/model.ts';
import { parseUsdcAmount } from '../src/modules/commerce/money.ts';
import { summarizeEconomicHistory } from '../src/modules/economic-history/model.ts';
import { readDatabaseConnectionConfig } from '../src/platform/persistence/config.ts';
import { PostgresAlphaBusinessRepository } from '../src/platform/persistence/alpha-business-repository.ts';
import { PostgresCapitalRepository } from '../src/platform/persistence/capital-repository.ts';
import { PostgresPersistence } from '../src/platform/persistence/database.ts';
import { PostgresEconomicHistoryRepository } from '../src/platform/persistence/economic-history-repository.ts';

const requestedMicroUsdc = parseUsdcAmount('0.20');
const terms: ApprovedCapitalTerms = {
  instrument: 'CONTROLLED_TEST_ALLOCATION',
  purpose: 'Bounded later-use proof inside the common-control reference economy.',
  returnProfile: 'NONE',
  useCapMicroUsdc: '100000',
};

function mandate(input: {
  readonly allowedProvenance: readonly ('COMMON_CONTROL_TEST' | 'INDEPENDENT')[];
  readonly mandateId: `cmt_${string}`;
  readonly providerId: `cap_${string}`;
}): CapitalMandate {
  return {
    criteria: {
      allowedProvenance: input.allowedProvenance,
      minimumCompletedCommerceActivities: 2,
      minimumCompletedCommerceVolumeMicroUsdc: '60000',
      requireNoUnresolvedActivity: true,
    },
    mandateId: input.mandateId,
    maximumMicroUsdc: parseUsdcAmount('0.50'),
    minimumMicroUsdc: parseUsdcAmount('0.10'),
    name: `${input.providerId} reference mandate`,
    providerId: input.providerId,
    status: 'ACTIVE',
    strategy: 'Provider-specific reference-economy mandate; no score, entitlement, or independent-demand claim.',
    version: 1,
  };
}

async function main(): Promise<void> {
  const config = readDatabaseConnectionConfig('runtime');
  if (config.environment !== 'PRIVATE_ARC_TESTNET') {
    throw new Error('Checkpoint G Capital review is restricted to PRIVATE_ARC_TESTNET.');
  }
  const persistence = new PostgresPersistence(config);
  try {
    const businesses = new PostgresAlphaBusinessRepository(persistence);
    const history = new PostgresEconomicHistoryRepository(persistence);
    const capital = new PostgresCapitalRepository(persistence);
    const recipient = await businesses.getBusiness('biz_reference_workbench');
    const decisionActivityIds = new Set([
      'obl_reference_arc_snapshot_x402_v1',
      'obl_reference_economy_8183_v1',
    ]);
    const activities = (await history.listActivities({ businessId: recipient.businessId })).filter(
      ({ activityId, activityKind }) =>
        activityKind === 'COMMERCE' && decisionActivityIds.has(activityId),
    );
    const summary = summarizeEconomicHistory(activities);
    const observedAt = new Date(
      Math.max(...activities.map(({ occurredAt }) => occurredAt.getTime())) + 1_000,
    ).toISOString();
    const material: CapitalDecisionMaterial = {
      businessId: recipient.businessId,
      businessTemplateId: recipient.templateId,
      completedCommerceActivityCount: summary.statusCounts.COMPLETE,
      completedCommerceVolumeMicroUsdc: summary.completedVolumeMicroUsdc,
      failedActivityCount: summary.statusCounts.FAILED,
      observedAt,
      outcomeUnknownActivityCount: summary.statusCounts.OUTCOME_UNKNOWN,
      pendingActivityCount: summary.statusCounts.PENDING,
      provenance: 'COMMON_CONTROL_TEST',
    };
    assert.equal(material.completedCommerceActivityCount, 2);
    assert.equal(material.completedCommerceVolumeMicroUsdc, '60000');
    const approvedMandate = mandate({
      allowedProvenance: ['COMMON_CONTROL_TEST'],
      mandateId: 'cmt_reference_seed_v1',
      providerId: 'cap_reference_seed_v1',
    });
    const declinedMandate = mandate({
      allowedProvenance: ['INDEPENDENT'],
      mandateId: 'cmt_reference_independent_v1',
      providerId: 'cap_reference_independent_v1',
    });
    const approved = decideCapitalRequest({
      decisionId: 'cpd_reference_seed_workbench_v1',
      mandate: approvedMandate,
      material,
      requestedMicroUsdc,
      reviewId: 'cpr_reference_seed_workbench_v1',
      terms,
    });
    const declined = decideCapitalRequest({
      decisionId: 'cpd_reference_independent_workbench_v1',
      mandate: declinedMandate,
      material,
      requestedMicroUsdc,
      reviewId: 'cpr_reference_independent_workbench_v1',
      terms,
    });
    assert.equal(approved.outcome, 'APPROVED');
    assert.equal(declined.outcome, 'DECLINED');
    const decidedAt = new Date(Date.parse(observedAt) + 1_000).toISOString();
    await capital.recordReviewDecision({
      decidedAt,
      decidedByPrincipalId: 'usr_reference_workbench',
      decision: approved,
      material,
      requestedMicroUsdc,
    });
    await capital.recordReviewDecision({
      decidedAt,
      decidedByPrincipalId: 'usr_reference_workbench',
      decision: declined,
      material,
      requestedMicroUsdc,
    });
    const offered = offerCapitalAllocation({
      allocationId: 'cal_reference_workbench_seed_v1',
      decision: approved,
      providerAccountId: 'cpa_reference_seed_v1',
      provenance: 'COMMON_CONTROL_TEST',
      recipientBusinessId: recipient.businessId,
    });
    await capital.prepareOfferedAllocation({
      allocation: offered,
      idempotencyKey: 'f4c5e613-de65-41bc-892a-50a9b7b984b5',
    });
    const accepted = acceptCapitalAllocation(
      offered,
      'usr_reference_workbench',
      new Date(Date.parse(observedAt) + 2_000).toISOString(),
    );
    await capital.acceptAllocation({
      acceptedAt: accepted.acceptedAt!,
      acceptedByPrincipalId: accepted.acceptedByPrincipalId!,
      allocationId: accepted.allocationId,
    });
    console.log(
      `checkpoint_g_capital=PASS material=${material.completedCommerceActivityCount}/${material.completedCommerceVolumeMicroUsdc} approved=${approved.providerId} declined=${declined.providerId} allocation=${accepted.allocationId} state=${accepted.state} provenance=COMMON_CONTROL_TEST`,
    );
  } finally {
    await persistence.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Checkpoint G Capital review failed.');
  process.exitCode = 1;
});
