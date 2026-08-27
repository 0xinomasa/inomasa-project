import assert from 'node:assert/strict';
import test from 'node:test';
import {
  decodeFunctionData,
  encodeFunctionResult,
  keccak256,
  parseAbi,
  toBytes,
} from 'viem';

import { parseUsdcAmount } from '../src/modules/commerce/money.ts';
import { ArcErc8183Rpc, arcErc8183 } from '../src/platform/arc/erc8183.ts';

const commerceAbi = parseAbi([
  'function getJob(uint256 jobId) view returns ((uint256 id,address client,address provider,address evaluator,string description,uint256 budget,uint256 expiredAt,uint8 status,address hook))',
  'function paymentToken() view returns (address)',
  'function platformFeeBP() view returns (uint256)',
  'function evaluatorFeeBP() view returns (uint256)',
]);
const erc20Abi = parseAbi(['function allowance(address owner,address spender) view returns (uint256)']);
const client = '0x1111111111111111111111111111111111111111' as const;
const provider = '0x2222222222222222222222222222222222222222' as const;
const transactionHash = `0x${'a'.repeat(64)}` as const;
const jobId = 42n;
const budget = parseUsdcAmount('0.05');
const expiredAtUnix = 1_788_134_400n;
const description = 'Bounded Arc commerce-readiness brief.';

function addressTopic(address: `0x${string}`): `0x${string}` {
  return `0x${address.slice(2).padStart(64, '0')}`;
}

function uintTopic(value: bigint): `0x${string}` {
  return `0x${value.toString(16).padStart(64, '0')}`;
}

function rpcFetch(status: number, transfer?: 'PAYOUT' | 'TO_ESCROW'): typeof fetch {
  return (async (_input: string | URL | Request, init?: RequestInit) => {
    const request = JSON.parse(String(init?.body)) as {
      readonly method: string;
      readonly params: readonly [{ readonly data?: `0x${string}`; readonly to?: string }] | readonly string[];
    };
    let result: unknown;
    if (request.method === 'eth_chainId') {
      result = '0x4cef52';
    } else if (request.method === 'eth_getTransactionReceipt') {
      const transferFrom = transfer === 'PAYOUT' ? arcErc8183.contractAddress : client;
      const transferTo = transfer === 'PAYOUT' ? provider : arcErc8183.contractAddress;
      result = {
        blockNumber: '0x2a',
        logs: [
          {
            address: arcErc8183.contractAddress,
            data: '0x',
            topics: [
              keccak256(toBytes('JobCreated(uint256,address,address,address,uint256,address)')),
              uintTopic(jobId),
              addressTopic(client),
              addressTopic(provider),
            ],
          },
          ...(transfer === undefined
            ? []
            : [
                {
                  address: arcErc8183.paymentTokenAddress,
                  data: uintTopic(budget),
                  topics: [
                    keccak256(toBytes('Transfer(address,address,uint256)')),
                    addressTopic(transferFrom),
                    addressTopic(transferTo),
                  ],
                },
              ]),
        ],
        status: '0x1',
        transactionHash,
      };
    } else if (request.method === 'eth_call') {
      const call = request.params[0] as { readonly data: `0x${string}`; readonly to: string };
      if (call.to.toLowerCase() === arcErc8183.paymentTokenAddress.toLowerCase()) {
        decodeFunctionData({ abi: erc20Abi, data: call.data });
        result = encodeFunctionResult({ abi: erc20Abi, functionName: 'allowance', result: budget });
      } else {
        const decoded = decodeFunctionData({ abi: commerceAbi, data: call.data });
        if (decoded.functionName === 'paymentToken') {
          result = encodeFunctionResult({
            abi: commerceAbi,
            functionName: 'paymentToken',
            result: arcErc8183.paymentTokenAddress,
          });
        } else if (decoded.functionName === 'platformFeeBP') {
          result = encodeFunctionResult({ abi: commerceAbi, functionName: 'platformFeeBP', result: 0n });
        } else if (decoded.functionName === 'evaluatorFeeBP') {
          result = encodeFunctionResult({ abi: commerceAbi, functionName: 'evaluatorFeeBP', result: 0n });
        } else {
          result = encodeFunctionResult({
            abi: commerceAbi,
            functionName: 'getJob',
            result: {
              budget: status === 0 ? 0n : budget,
              client,
              description,
              evaluator: client,
              expiredAt: expiredAtUnix,
              hook: arcErc8183.hookAddress,
              id: jobId,
              provider,
              status,
            },
          });
        }
      }
    }
    return new Response(JSON.stringify({ id: 1, jsonrpc: '2.0', result }));
  }) as typeof fetch;
}

test('Arc verifier binds create event and full non-hooked zero-fee job commitment', async () => {
  const rpc = new ArcErc8183Rpc({ fetch: rpcFetch(0) });
  const observed = await rpc.verifyCreate({
    client,
    description,
    evaluator: client,
    expiredAtUnix,
    provider,
    transactionHash,
  });
  assert.equal(observed.jobId, jobId);
  assert.equal(observed.blockNumber, 42n);
});

test('Arc verifier requires one exact escrow transfer and one exact payout transfer', async () => {
  const funding = await new ArcErc8183Rpc({ fetch: rpcFetch(1, 'TO_ESCROW') }).verifyJobState({
    budgetMicroUsdc: budget,
    client,
    description,
    evaluator: client,
    expectedStatus: 'FUNDED',
    expiredAtUnix,
    jobId,
    provider,
    transactionHash,
    transfer: 'TO_ESCROW',
  });
  assert.equal(funding.blockNumber, 42n);

  const payout = await new ArcErc8183Rpc({ fetch: rpcFetch(3, 'PAYOUT') }).verifyJobState({
    budgetMicroUsdc: budget,
    client,
    description,
    evaluator: client,
    expectedStatus: 'COMPLETED',
    expiredAtUnix,
    jobId,
    provider,
    transactionHash,
    transfer: 'PAYOUT',
  });
  assert.equal(payout.blockNumber, 42n);
});

test('Arc verifier does not accept a successful receipt without the committed exact transfer', async () => {
  await assert.rejects(
    new ArcErc8183Rpc({ fetch: rpcFetch(3) }).verifyJobState({
      budgetMicroUsdc: budget,
      client,
      description,
      evaluator: client,
      expectedStatus: 'COMPLETED',
      expiredAtUnix,
      jobId,
      provider,
      transactionHash,
      transfer: 'PAYOUT',
    }),
    /exact expected USDC transfer/,
  );
});
