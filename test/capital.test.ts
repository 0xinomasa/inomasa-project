import assert from 'node:assert/strict';
import test from 'node:test';

import {
  acceptCapitalAllocation,
  decideCapitalRequest,
  deriveCapitalProvenance,
  offerCapitalAllocation,
  type CapitalDecisionMaterial,
  type CapitalMandate,
} from '../src/modules/capital/model.ts';
import { parseUsdcAmount } from '../src/modules/commerce/money.ts';

const material: CapitalDecisionMaterial = {
  businessId: 'biz_ops_pilot',
  businessTemplateId: 'ops-pilot',
  completedCommerceActivityCount: 5,
  completedCommerceVolumeMicroUsdc: '420000',
  failedActivityCount: 0,
  observedAt: '2026-08-28T00:00:00.000Z',
  outcomeUnknownActivityCount: 0,
  pendingActivityCount: 0,
  provenance: 'COMMON_CONTROL_TEST',
};

function mandate(
  providerId: `cap_${string}`,
  allowedProvenance: readonly ('COMMON_CONTROL_TEST' | 'INDEPENDENT')[],
): CapitalMandate {
  return {
    criteria: {
      allowedProvenance,
      minimumCompletedCommerceActivities: 5,
      minimumCompletedCommerceVolumeMicroUsdc: '400000',
      requireNoUnresolvedActivity: true,
    },
    mandateId: `cmt_${providerId.slice(4)}`,
    maximumMicroUsdc: parseUsdcAmount('0.50'),
    minimumMicroUsdc: parseUsdcAmount('0.10'),
    name: 'Test mandate',
    providerId,
    status: 'ACTIVE',
    strategy: 'Provider-specific test strategy.',
    version: 1,
  };
}

const terms = {
  instrument: 'CONTROLLED_TEST_ALLOCATION',
  purpose: 'Bounded operating service procurement proof.',
  returnProfile: 'NONE',
  useCapMicroUsdc: '100000',
} as const;

test('different Capital Providers can decide differently from the same decision material', () => {
  const approved = decideCapitalRequest({
    decisionId: 'cpd_alpha',
    mandate: mandate('cap_alpha', ['COMMON_CONTROL_TEST']),
    material,
    requestedMicroUsdc: parseUsdcAmount('0.20'),
    reviewId: 'cpr_alpha',
    terms,
  });
  const declined = decideCapitalRequest({
    decisionId: 'cpd_beta',
    mandate: mandate('cap_beta', ['INDEPENDENT']),
    material,
    requestedMicroUsdc: parseUsdcAmount('0.20'),
    reviewId: 'cpr_beta',
    terms,
  });

  assert.equal(approved.outcome, 'APPROVED');
  assert.equal(approved.reasonCode, 'WITHIN_PROVIDER_MANDATE');
  assert.equal(declined.outcome, 'DECLINED');
  assert.equal(declined.reasonCode, 'PROVENANCE_OUTSIDE_MANDATE');
});

test('Capital offer requires provider approval and explicit Business acceptance', () => {
  const decision = decideCapitalRequest({
    decisionId: 'cpd_alpha',
    mandate: mandate('cap_alpha', ['COMMON_CONTROL_TEST']),
    material,
    requestedMicroUsdc: parseUsdcAmount('0.20'),
    reviewId: 'cpr_alpha',
    terms,
  });
  const offered = offerCapitalAllocation({
    allocationId: 'cal_alpha',
    decision,
    providerAccountId: 'cpa_alpha',
    provenance: 'COMMON_CONTROL_TEST',
    recipientBusinessId: material.businessId,
  });
  const accepted = acceptCapitalAllocation(
    offered,
    'usr_alpha_operator',
    '2026-08-28T00:01:00.000Z',
  );

  assert.equal(offered.state, 'OFFERED');
  assert.equal(accepted.state, 'AUTHORIZED');
  assert.equal(accepted.acceptedByPrincipalId, 'usr_alpha_operator');
  assert.equal(accepted.instrument, 'CONTROLLED_TEST_ALLOCATION');
  assert.equal(accepted.returnProfile, 'NONE');
});

test('unresolved activity and amount bounds fail provider-specific underwriting', () => {
  const activeMandate = mandate('cap_alpha', ['COMMON_CONTROL_TEST']);
  const unresolved = decideCapitalRequest({
    decisionId: 'cpd_unresolved',
    mandate: activeMandate,
    material: { ...material, outcomeUnknownActivityCount: 1 },
    requestedMicroUsdc: parseUsdcAmount('0.20'),
    reviewId: 'cpr_unresolved',
    terms,
  });
  const oversized = decideCapitalRequest({
    decisionId: 'cpd_oversized',
    mandate: activeMandate,
    material,
    requestedMicroUsdc: parseUsdcAmount('1.00'),
    reviewId: 'cpr_oversized',
    terms,
  });

  assert.equal(unresolved.reasonCode, 'UNRESOLVED_ACTIVITY');
  assert.equal(oversized.reasonCode, 'OUTSIDE_PROVIDER_AMOUNT_RANGE');
});

test('Capital provenance fails closed to common-control when either side is common-control', () => {
  assert.equal(
    deriveCapitalProvenance({
      decisionMaterialProvenance: 'COMMON_CONTROL_TEST',
      providerProvenance: 'INDEPENDENT',
    }),
    'COMMON_CONTROL_TEST',
  );
  assert.equal(
    deriveCapitalProvenance({
      decisionMaterialProvenance: 'INDEPENDENT',
      providerProvenance: 'COMMON_CONTROL_TEST',
    }),
    'COMMON_CONTROL_TEST',
  );
  assert.equal(
    deriveCapitalProvenance({
      decisionMaterialProvenance: 'INDEPENDENT',
      providerProvenance: 'INDEPENDENT',
    }),
    'INDEPENDENT',
  );
});

test('approved Capital terms cannot claim use beyond the requested allocation', () => {
  assert.throws(
    () =>
      decideCapitalRequest({
        decisionId: 'cpd_invalid_cap',
        mandate: mandate('cap_alpha', ['COMMON_CONTROL_TEST']),
        material,
        requestedMicroUsdc: parseUsdcAmount('0.20'),
        reviewId: 'cpr_invalid_cap',
        terms: { ...terms, useCapMicroUsdc: '200001' },
      }),
    /use cap cannot exceed/i,
  );
});
