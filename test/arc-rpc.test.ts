import assert from 'node:assert/strict';
import test from 'node:test';

import { parseUsdcAmount } from '../src/modules/commerce/money.ts';
import { ArcRpcError, ArcTestnetRpc } from '../src/platform/arc/rpc.ts';

const transactionHash = `0x${'a'.repeat(64)}` as const;
const destinationAddress = '0x2222222222222222222222222222222222222222' as const;
const sourceAddress = '0x1111111111111111111111111111111111111111' as const;
const destinationTopic = `0x${destinationAddress.slice(2).padStart(64, '0')}`;
const sourceTopic = `0x${sourceAddress.slice(2).padStart(64, '0')}`;

function rpcFetch(receiptStatus = '0x1'): typeof fetch {
  return (async (_input: string | URL | Request, init?: RequestInit) => {
    const request = JSON.parse(String(init?.body)) as { method: string };
    const result =
      request.method === 'eth_chainId'
        ? '0x4cef52'
        : request.method === 'eth_blockNumber'
          ? '0x2a'
          : request.method === 'eth_gasPrice'
            ? '0x3b9aca00'
            : request.method === 'eth_getCode'
              ? '0x6001600055'
              : {
            blockNumber: '0x2a',
            logs: [
              {
                address: '0x3600000000000000000000000000000000000000',
                data: `0x${parseUsdcAmount('0.25').toString(16).padStart(64, '0')}`,
                topics: [
                  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
                  sourceTopic,
                  destinationTopic,
                ],
              },
            ],
            status: receiptStatus,
            transactionHash,
          };

    return new Response(JSON.stringify({ id: 1, jsonrpc: '2.0', result }), {
      headers: { 'content-type': 'application/json' },
      status: 200,
    });
  }) as typeof fetch;
}

test('Arc RPC proof checks chain, receipt status, destination, and exact USDC amount', async () => {
  const proof = await new ArcTestnetRpc({ fetch: rpcFetch() }).verifyUsdcTransfer({
    amountMicroUsdc: parseUsdcAmount('0.25'),
    destinationAddress,
    sourceAddress,
    transactionHash,
  });

  assert.equal(proof.blockNumber, 42n);
  assert.equal(proof.amountMicroUsdc, 250_000n);
});

test('Arc RPC proof rejects a reverted transfer', async () => {
  await assert.rejects(
    new ArcTestnetRpc({ fetch: rpcFetch('0x0') }).verifyUsdcTransfer({
      amountMicroUsdc: parseUsdcAmount('0.25'),
      destinationAddress,
      sourceAddress,
      transactionHash,
    }),
    ArcRpcError,
  );
});

test('Arc RPC proof rejects a transfer from a different payer', async () => {
  await assert.rejects(
    new ArcTestnetRpc({ fetch: rpcFetch() }).verifyUsdcTransfer({
      amountMicroUsdc: parseUsdcAmount('0.25'),
      destinationAddress,
      sourceAddress: '0x3333333333333333333333333333333333333333',
      transactionHash,
    }),
    ArcRpcError,
  );
});

test('Arc network snapshot binds live fields to the configured USDC interface', async () => {
  const snapshot = await new ArcTestnetRpc({ fetch: rpcFetch() }).readNetworkSnapshot(
    '2026-08-25T00:00:00.000Z',
  );

  assert.equal(snapshot.chainId, 5042002);
  assert.equal(snapshot.blockNumber, 42n);
  assert.equal(snapshot.gasPriceWei, 1_000_000_000n);
  assert.match(snapshot.usdcCodeSha256, /^[0-9a-f]{64}$/);
});
