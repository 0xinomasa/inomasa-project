import assert from 'node:assert/strict';
import test from 'node:test';

import type { X402PaymentRequired } from '../src/modules/commerce/x402-port.ts';
import { arcGatewayTestnet, serializeCircleTypedData } from '../src/platform/circle/gateway-x402.ts';
import {
  nextGatewayFundingState,
  sha256Json,
} from '../src/platform/persistence/gateway-x402-repository.ts';

test('Circle Gateway registry is pinned to the selected Arc Testnet profile', () => {
  assert.equal(arcGatewayTestnet.domain, 26);
  assert.equal(arcGatewayTestnet.network, 'eip155:5042002');
  assert.equal(arcGatewayTestnet.minValiditySeconds, 604_800);
  assert.equal(
    arcGatewayTestnet.contractAddress.toLowerCase(),
    '0x0077777d7eba4688bdef3e311b846f25870a19b9',
  );
});

test('pending Gateway observations remain submitted instead of inventing a terminal state', () => {
  assert.equal(nextGatewayFundingState('APPROVAL', 'PENDING'), 'APPROVAL_SUBMITTED');
  assert.equal(nextGatewayFundingState('DEPOSIT', 'PENDING'), 'DEPOSIT_SUBMITTED');
  assert.equal(nextGatewayFundingState('DEPOSIT', 'COMPLETE'), 'DEPOSIT_COMPLETE');
});

test('Circle typed-data envelope includes the EIP712 domain and preserves bigint exactly', () => {
  const serialized = serializeCircleTypedData({
    domain: {
      chainId: 5_042_002,
      name: 'GatewayWalletBatched',
      verifyingContract: arcGatewayTestnet.contractAddress,
      version: '1',
    },
    message: { value: 10_000n },
    primaryType: 'TransferWithAuthorization',
    types: {
      TransferWithAuthorization: [{ name: 'value', type: 'uint256' }],
    },
  });
  const parsed = JSON.parse(serialized) as {
    readonly message: { readonly value: string };
    readonly types: { readonly EIP712Domain: readonly unknown[] };
  };

  assert.equal(parsed.message.value, '10000');
  assert.equal(parsed.types.EIP712Domain.length, 4);
});

test('x402 challenge digest changes when exact economic requirements change', () => {
  const challenge: X402PaymentRequired = {
    accepts: [
      {
        amount: '10000',
        asset: '0x3600000000000000000000000000000000000000',
        extra: {
          minValiditySeconds: 604_800,
          name: 'GatewayWalletBatched',
          verifyingContract: arcGatewayTestnet.contractAddress,
          version: '1',
        },
        maxTimeoutSeconds: 604_800,
        network: 'eip155:5042002',
        payTo: '0xd1d26154d2a493a0be3a30f8e8ae5498bd12f144',
        scheme: 'exact',
      },
    ],
    resource: {
      description: 'Arc snapshot',
      mimeType: 'application/json',
      url: 'inomasa://signal-forge/arc-market-snapshot',
    },
    x402Version: 2,
  };
  const changed = {
    ...challenge,
    accepts: [{ ...challenge.accepts[0], amount: '10001' }],
  };

  assert.match(sha256Json(challenge), /^[0-9a-f]{64}$/);
  assert.notEqual(sha256Json(challenge), sha256Json(changed));
});
