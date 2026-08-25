import assert from 'node:assert/strict';
import test from 'node:test';

import { parseUsdcAmount } from '../src/modules/commerce/money.ts';
import { buildCircleTransferInput } from '../src/platform/circle/developer-wallets.ts';

test('Circle Arc transfer uses the documented source-address and blockchain shape', () => {
  const input = buildCircleTransferInput({
    amountMicroUsdc: parseUsdcAmount('0.25'),
    destinationAddress: '0xd1d26154d2a493a0be3a30f8e8ae5498bd12f144',
    idempotencyKey: '38c1faaf-b4d1-407b-8d63-153500517371',
    referenceId: 'obl_arc_snapshot_v1',
    sourceAddress: '0xcd4194d3cab4fe5e306ac397f8896b4b8e0f7ede',
  });

  assert.equal(input.amount[0], '0.250000');
  assert.equal(input.blockchain, 'ARC-TESTNET');
  assert.equal(input.walletAddress, '0xcd4194d3cab4fe5e306ac397f8896b4b8e0f7ede');
  assert.equal(input.tokenAddress, '0x3600000000000000000000000000000000000000');
  assert.equal('walletId' in input, false);
});
