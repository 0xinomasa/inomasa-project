import assert from 'node:assert/strict';
import test from 'node:test';
import { encodeFunctionResult, keccak256, parseAbi, toBytes } from 'viem';

import { ArcErc8004Rpc, arcErc8004 } from '../src/platform/arc/erc8004.ts';

const abi = parseAbi([
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function tokenURI(uint256 tokenId) view returns (string)',
]);
const owner = '0x1111111111111111111111111111111111111111' as const;
const transactionHash = `0x${'a'.repeat(64)}` as const;
const registrationUri = 'data:application/json;base64,e30=';

function rpcFetch(): typeof fetch {
  let callIndex = 0;
  return (async (_input: string | URL | Request, init?: RequestInit) => {
    const request = JSON.parse(String(init?.body)) as { readonly method: string };
    let result: unknown;
    if (request.method === 'eth_chainId') {
      result = '0x4cef52';
    } else if (request.method === 'eth_getTransactionReceipt') {
      result = {
        blockNumber: '0x2a',
        logs: [
          {
            address: arcErc8004.identityRegistryAddress,
            data: '0x',
            topics: [
              keccak256(toBytes('Registered(uint256,string,address)')),
              `0x${42n.toString(16).padStart(64, '0')}`,
              `0x${owner.slice(2).padStart(64, '0')}`,
            ],
          },
          {
            address: arcErc8004.identityRegistryAddress,
            data: '0x',
            topics: [
              keccak256(toBytes('URIUpdated(uint256,string,address)')),
              `0x${42n.toString(16).padStart(64, '0')}`,
              `0x${owner.slice(2).padStart(64, '0')}`,
            ],
          },
        ],
        status: '0x1',
        transactionHash,
      };
    } else {
      result =
        callIndex++ === 0
          ? encodeFunctionResult({ abi, functionName: 'ownerOf', result: owner })
          : encodeFunctionResult({ abi, functionName: 'tokenURI', result: registrationUri });
    }
    return new Response(JSON.stringify({ id: 1, jsonrpc: '2.0', result }));
  }) as typeof fetch;
}

test('Arc ERC-8004 proof binds the Registered event, owner, token URI, and chain', async () => {
  const rpc = new ArcErc8004Rpc({ fetch: rpcFetch() });
  const identity = await rpc.verifyRegistration({ ownerAddress: owner, transactionHash });
  assert.equal(identity.agentId, 42n);
  assert.equal(identity.chainId, 5_042_002);
  assert.equal(identity.agentRegistry, `eip155:5042002:${arcErc8004.identityRegistryAddress}`);

  const metadata = await rpc.verifyMetadata({
    agentId: identity.agentId,
    expectedOwner: owner,
    expectedUri: registrationUri,
    transactionHash,
  });
  assert.equal(metadata.blockNumber, 42n);
});
