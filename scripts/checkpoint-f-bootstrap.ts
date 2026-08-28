import assert from 'node:assert/strict';

import {
  acceptCapitalAllocation,
  decideCapitalRequest,
  offerCapitalAllocation,
  type ApprovedCapitalTerms,
  type CapitalDecisionMaterial,
  type CapitalMandate,
  type CapitalProvider,
} from '../src/modules/capital/model.ts';
import { parseUsdcAmount } from '../src/modules/commerce/money.ts';
import { summarizeEconomicHistory } from '../src/modules/economic-history/model.ts';
import { readDatabaseConnectionConfig } from '../src/platform/persistence/config.ts';
import { PostgresAlphaBusinessRepository } from '../src/platform/persistence/alpha-business-repository.ts';
import { PostgresCapitalRepository } from '../src/platform/persistence/capital-repository.ts';
import { PostgresPersistence } from '../src/platform/persistence/database.ts';
import { PostgresEconomicHistoryRepository } from '../src/platform/persistence/economic-history-repository.ts';

const observedAt = '2026-08-28T02:30:00.000Z';
const decidedAt = '2026-08-28T02:31:00.000Z';
const acceptedAt = '2026-08-28T02:32:00.000Z';
const controllerPrincipalId = 'usr_alpha_operator';
const requestedMicroUsdc = parseUsdcAmount('0.20');
const terms: ApprovedCapitalTerms = {
  instrument: 'CONTROLLED_TEST_ALLOCATION',
  purpose: 'Bounded operating service procurement proof for the controlled Alpha.',
  returnProfile: 'NONE',
  useCapMicroUsdc: '100000',
};

function provider(
  providerId: `cap_${string}`,
  displayName: string,
): CapitalProvider {
  return {
    controllerPrincipalId,
    displayName,
    environment: 'PRIVATE_ARC_TESTNET',
    provenance: 'COMMON_CONTROL_TEST',
    providerId,
    riskBearerClassification: 'PROVIDER_RISK_BEARER',
    status: 'ACTIVE',
  };
}

function mandate(input: {
  readonly allowedProvenance: readonly ('COMMON_CONTROL_TEST' | 'INDEPENDENT')[];
  readonly mandateId: `cmt_${string}`;
  readonly name: string;
  readonly providerId: `cap_${string}`;
}): CapitalMandate {
  return {
    criteria: {
      allowedProvenance: input.allowedProvenance,
      minimumCompletedCommerceActivities: 5,
      minimumCompletedCommerceVolumeMicroUsdc: '400000',
      requireNoUnresolvedActivity: true,
    },
    mandateId: input.mandateId,
    maximumMicroUsdc: parseUsdcAmount('0.50'),
    minimumMicroUsdc: parseUsdcAmount('0.10'),
    name: input.name,
    providerId: input.providerId,
    status: 'ACTIVE',
    strategy: 'Provider-specific controlled testnet mandate; no universal score or entitlement.',
    version: 1,
  };
}

async function main(): Promise<void> {
  const config = readDatabaseConnectionConfig('runtime');
  if (config.environment !== 'PRIVATE_ARC_TESTNET') {
    throw new Error('Checkpoint F bootstrap is restricted to PRIVATE_ARC_TESTNET.');
  }
  const persistence = new PostgresPersistence(config);
  try {
    const businesses = new PostgresAlphaBusinessRepository(persistence);
    const history = new PostgresEconomicHistoryRepository(persistence);
    const capital = new PostgresCapitalRepository(persistence);
    const recipient = await businesses.getBusiness('biz_ops_pilot');
    const summary = summarizeEconomicHistory(
      await history.listActivities({ businessId: recipient.businessId }),
    );
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
    assert.equal(material.completedCommerceActivityCount, 5);
    assert.equal(material.completedCommerceVolumeMicroUsdc, '420000');

    const northstar = provider('cap_northstar_v1', 'Northstar Controlled Capital');
    const independent = provider('cap_independent_only_v1', 'Independent Provenance Capital');
    const northstarMandate = mandate({
      allowedProvenance: ['COMMON_CONTROL_TEST'],
      mandateId: 'cmt_northstar_v1',
      name: 'Controlled Alpha operating allocation',
      providerId: northstar.providerId,
    });
    const independentMandate = mandate({
      allowedProvenance: ['INDEPENDENT'],
      mandateId: 'cmt_independent_only_v1',
      name: 'Independent operating history only',
      providerId: independent.providerId,
    });
    const approved = decideCapitalRequest({
      decisionId: 'cpd_northstar_ops_v1',
      mandate: northstarMandate,
      material,
      requestedMicroUsdc,
      reviewId: 'cpr_northstar_ops_v1',
      terms,
    });
    const declined = decideCapitalRequest({
      decisionId: 'cpd_independent_ops_v1',
      mandate: independentMandate,
      material,
      requestedMicroUsdc,
      reviewId: 'cpr_independent_ops_v1',
      terms,
    });
    assert.equal(approved.outcome, 'APPROVED');
    assert.equal(declined.outcome, 'DECLINED');

    await capital.prepareProvider({
      mandate: northstarMandate,
      pendingProviderAccountId: 'cpa_northstar_v1',
      provider: northstar,
    });
    await capital.prepareProvider({ mandate: independentMandate, provider: independent });
    await capital.recordReviewDecision({
      decidedAt,
      decidedByPrincipalId: controllerPrincipalId,
      decision: approved,
      material,
      requestedMicroUsdc,
    });
    await capital.recordReviewDecision({
      decidedAt,
      decidedByPrincipalId: controllerPrincipalId,
      decision: declined,
      material,
      requestedMicroUsdc,
    });
    const offered = offerCapitalAllocation({
      allocationId: 'cal_ops_pilot_northstar_v1',
      decision: approved,
      providerAccountId: 'cpa_northstar_v1',
      provenance: 'COMMON_CONTROL_TEST',
      recipientBusinessId: recipient.businessId,
    });
    await capital.prepareOfferedAllocation({
      allocation: offered,
      idempotencyKey: '0ab593c7-13a7-4795-80ed-aeb25c2dc9bf',
    });
    const accepted = acceptCapitalAllocation(offered, controllerPrincipalId, acceptedAt);
    await capital.acceptAllocation({
      acceptedAt: accepted.acceptedAt!,
      acceptedByPrincipalId: accepted.acceptedByPrincipalId!,
      allocationId: accepted.allocationId,
    });

    console.log(
      `checkpoint_f_bootstrap=PASS material=${material.completedCommerceActivityCount}/${material.completedCommerceVolumeMicroUsdc} approved=${approved.providerId} declined=${declined.providerId} allocation=${accepted.allocationId} state=${accepted.state}`,
    );
  } finally {
    await persistence.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Checkpoint F bootstrap failed.');
  process.exitCode = 1;
});
