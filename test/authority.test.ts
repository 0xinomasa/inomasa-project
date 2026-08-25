import assert from 'node:assert/strict';
import test from 'node:test';

import {
  evaluateAgentPurchaseAuthority,
  type AgentPurchaseIntent,
  type StandingPurchaseAuthorityGrant,
} from '../src/modules/authority/model.ts';
import { parseUsdcAmount } from '../src/modules/commerce/money.ts';

const grant: StandingPurchaseAuthorityGrant = {
  actionType: 'PURCHASE_SERVICE',
  allowedCounterpartyBusinessId: 'biz_signal_forge',
  allowedOfferId: 'off_arc_snapshot_v2',
  allowanceConsumedMicroUsdc: parseUsdcAmount('0'),
  allowanceTotalMicroUsdc: parseUsdcAmount('0.20'),
  asset: 'USDC',
  authorityDomainBusinessId: 'biz_ops_pilot',
  controlVersion: 1,
  delegationAllowed: false,
  environment: 'PRIVATE_ARC_TESTNET',
  expiresAt: '2026-09-01T00:00:00.000Z',
  granteePrincipalId: 'agt_ops_pilot_buyer_v1',
  grantId: 'grt_ops_pilot_snapshot_v1',
  grantVersion: 1,
  grantorPrincipalId: 'usr_alpha_operator',
  maxPerActionMicroUsdc: parseUsdcAmount('0.10'),
  representedBusinessId: 'biz_ops_pilot',
  status: 'ACTIVE',
  validFrom: '2026-08-25T00:00:00.000Z',
};

const intent: AgentPurchaseIntent = {
  actionType: 'PURCHASE_SERVICE',
  amountMicroUsdc: parseUsdcAmount('0.10'),
  asset: 'USDC',
  authorityDomainBusinessId: 'biz_ops_pilot',
  counterpartyBusinessId: 'biz_signal_forge',
  environment: 'PRIVATE_ARC_TESTNET',
  grantId: 'grt_ops_pilot_snapshot_v1',
  intentId: 'int_arc_snapshot_agent_v1',
  offerId: 'off_arc_snapshot_v2',
  purpose: 'Refresh the Arc snapshot.',
  requestedAt: '2026-08-25T10:00:00.000Z',
  requesterPrincipalId: 'agt_ops_pilot_buyer_v1',
  representedBusinessId: 'biz_ops_pilot',
};

test('bounded Agent purchase is allowed with remaining allowance accounted', () => {
  assert.deepEqual(evaluateAgentPurchaseAuthority(grant, intent, intent.requestedAt), {
    availableAfterMicroUsdc: parseUsdcAmount('0.10'),
    outcome: 'ALLOW',
    reason: 'WITHIN_PERSISTED_AUTHORITY',
  });
});

test('Agent purchase policy denies offer, counterparty, amount, allowance, requester, and expiry violations', () => {
  const cases: readonly [AgentPurchaseIntent, StandingPurchaseAuthorityGrant, string][] = [
    [{ ...intent, offerId: 'off_other' }, grant, 'OFFER_OUT_OF_SCOPE'],
    [{ ...intent, counterpartyBusinessId: 'biz_other' }, grant, 'COUNTERPARTY_OUT_OF_SCOPE'],
    [
      { ...intent, amountMicroUsdc: parseUsdcAmount('0.11') },
      grant,
      'AMOUNT_EXCEEDS_PER_ACTION_LIMIT',
    ],
    [
      intent,
      { ...grant, allowanceConsumedMicroUsdc: parseUsdcAmount('0.15') },
      'ALLOWANCE_EXHAUSTED',
    ],
    [
      { ...intent, requesterPrincipalId: 'agt_wrong' },
      grant,
      'REQUESTER_MISMATCH',
    ],
    [intent, grant, 'GRANT_EXPIRED'],
  ];

  for (const [candidate, candidateGrant, reason] of cases) {
    const evaluatedAt = reason === 'GRANT_EXPIRED' ? grant.expiresAt : intent.requestedAt;
    assert.deepEqual(evaluateAgentPurchaseAuthority(candidateGrant, candidate, evaluatedAt), {
      outcome: 'DENY',
      reason,
    });
  }
});

test('revoked authority fails closed', () => {
  assert.deepEqual(
    evaluateAgentPurchaseAuthority({ ...grant, status: 'REVOKED' }, intent, intent.requestedAt),
    { outcome: 'DENY', reason: 'GRANT_INACTIVE' },
  );
});
