import assert from 'node:assert/strict';
import test from 'node:test';

import { arcTestnet } from '../src/platform/arc/config.ts';
import { buildCircleContractExecutionInput } from '../src/platform/circle/contract-execution.ts';

test('Circle contract execution uses Arc EOA wallet address and idempotent contract semantics', () => {
  const input = buildCircleContractExecutionInput({
    abiFunctionSignature: 'register()',
    abiParameters: [],
    contractAddress: '0x8004A818BFB912233c491871b3d84c89A494BD9e',
    idempotencyKey: '4d239f0d-28d8-42a7-b7f6-5f69fc3918c3',
    referenceId: 'aid_example',
    sourceAddress: '0x1111111111111111111111111111111111111111',
  });

  assert.equal(input.blockchain, arcTestnet.circleBlockchain);
  assert.equal(input.walletAddress, '0x1111111111111111111111111111111111111111');
  assert.equal('walletId' in input, false);
  assert.equal(input.abiFunctionSignature, 'register()');
});
