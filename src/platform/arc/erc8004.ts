import { decodeFunctionResult, encodeFunctionData, keccak256, parseAbi, toBytes } from 'viem';

import type {
  Erc8004IdentityReference,
  Erc8004RegistryReference,
  EvmAddress,
  TransactionHash,
} from '../../modules/agent/erc8004.ts';
import { agentRegistry } from '../../modules/agent/erc8004.ts';
import { arcTestnet } from './config.ts';

const identityRegistryAbi = parseAbi([
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function tokenURI(uint256 tokenId) view returns (string)',
]);
const registeredEventTopic = keccak256(toBytes('Registered(uint256,string,address)'));
const uriUpdatedEventTopic = keccak256(toBytes('URIUpdated(uint256,string,address)'));

interface JsonRpcResponse<T> {
  readonly error?: { readonly code: number; readonly message: string };
  readonly result?: T;
}

interface ArcReceipt {
  readonly blockNumber: string;
  readonly logs: readonly {
    readonly address: string;
    readonly data: string;
    readonly topics: readonly string[];
  }[];
  readonly status: string;
  readonly transactionHash: string;
}

export const arcErc8004: Erc8004RegistryReference = {
  chainId: arcTestnet.chainId,
  identityRegistryAddress: '0x8004A818BFB912233c491871b3d84c89A494BD9e',
  reputationRegistryAddress: '0x8004B663056A597Dffe9eCcC1965A193B7388713',
};

export class ArcErc8004RpcError extends Error {
  override readonly name = 'ArcErc8004RpcError';
}

function topicAddress(topic: string): EvmAddress {
  const value = `0x${topic.slice(-40)}`;
  if (!/^0x[0-9a-fA-F]{40}$/.test(value)) throw new ArcErc8004RpcError('Invalid owner topic.');
  return value as EvmAddress;
}

export class ArcErc8004Rpc {
  readonly #fetch: typeof fetch;
  readonly #rpcUrl: string;

  constructor(options?: { readonly fetch?: typeof fetch; readonly rpcUrl?: string }) {
    this.#fetch = options?.fetch ?? fetch;
    this.#rpcUrl = options?.rpcUrl ?? arcTestnet.rpcUrl;
  }

  async verifyRegistration(input: {
    readonly ownerAddress: EvmAddress;
    readonly transactionHash: TransactionHash;
  }): Promise<Erc8004IdentityReference & { readonly blockNumber: bigint }> {
    await this.#assertChain();
    const receipt = await this.#receipt(input.transactionHash);
    const event = receipt.logs.find(
      (log) =>
        log.address.toLowerCase() === arcErc8004.identityRegistryAddress.toLowerCase() &&
        log.topics[0]?.toLowerCase() === registeredEventTopic.toLowerCase(),
    );
    if (event?.topics[1] === undefined || event.topics[2] === undefined) {
      throw new ArcErc8004RpcError('Arc receipt has no ERC-8004 Registered event.');
    }
    if (topicAddress(event.topics[2]).toLowerCase() !== input.ownerAddress.toLowerCase()) {
      throw new ArcErc8004RpcError('ERC-8004 identity owner does not match the execution account.');
    }
    const agentId = BigInt(event.topics[1]);
    return {
      ...arcErc8004,
      agentId,
      agentRegistry: agentRegistry(arcErc8004),
      blockNumber: BigInt(receipt.blockNumber),
    };
  }

  async verifyMetadata(input: {
    readonly agentId: bigint;
    readonly expectedOwner: EvmAddress;
    readonly expectedUri: string;
    readonly transactionHash: TransactionHash;
  }): Promise<{ readonly blockNumber: bigint }> {
    await this.#assertChain();
    const receipt = await this.#receipt(input.transactionHash);
    const uriUpdate = receipt.logs.find(
      (log) =>
        log.address.toLowerCase() === arcErc8004.identityRegistryAddress.toLowerCase() &&
        log.topics[0]?.toLowerCase() === uriUpdatedEventTopic.toLowerCase() &&
        log.topics[1] !== undefined &&
        BigInt(log.topics[1]) === input.agentId &&
        log.topics[2] !== undefined &&
        topicAddress(log.topics[2]).toLowerCase() === input.expectedOwner.toLowerCase(),
    );
    if (uriUpdate === undefined) {
      throw new ArcErc8004RpcError('Arc receipt has no matching ERC-8004 URIUpdated event.');
    }
    const [owner, uri] = await Promise.all([
      this.#readContract('ownerOf', [input.agentId]),
      this.#readContract('tokenURI', [input.agentId]),
    ]);
    if (String(owner).toLowerCase() !== input.expectedOwner.toLowerCase()) {
      throw new ArcErc8004RpcError('ERC-8004 ownerOf does not match the persisted owner.');
    }
    if (uri !== input.expectedUri) {
      throw new ArcErc8004RpcError('ERC-8004 tokenURI does not match the committed registration.');
    }
    return { blockNumber: BigInt(receipt.blockNumber) };
  }

  async #assertChain(): Promise<void> {
    const chainId = await this.#request<string>('eth_chainId', []);
    if (BigInt(chainId) !== BigInt(arcTestnet.chainId)) {
      throw new ArcErc8004RpcError('Arc RPC returned the wrong chain ID.');
    }
  }

  async #receipt(transactionHash: TransactionHash): Promise<ArcReceipt> {
    const receipt = await this.#request<ArcReceipt | null>('eth_getTransactionReceipt', [transactionHash]);
    if (receipt === null) throw new ArcErc8004RpcError('Arc transaction receipt is unavailable.');
    if (receipt.status !== '0x1') throw new ArcErc8004RpcError('Arc transaction reverted.');
    if (receipt.transactionHash.toLowerCase() !== transactionHash.toLowerCase()) {
      throw new ArcErc8004RpcError('Arc receipt hash mismatch.');
    }
    return receipt;
  }

  async #readContract(
    functionName: 'ownerOf' | 'tokenURI',
    args: readonly [bigint],
  ): Promise<unknown> {
    const data = encodeFunctionData({ abi: identityRegistryAbi, args, functionName });
    const result = await this.#request<`0x${string}`>('eth_call', [
      { data, to: arcErc8004.identityRegistryAddress },
      'latest',
    ]);
    return decodeFunctionResult({ abi: identityRegistryAbi, data: result, functionName });
  }

  async #request<T>(method: string, params: readonly unknown[]): Promise<T> {
    const response = await this.#fetch(this.#rpcUrl, {
      body: JSON.stringify({ id: 1, jsonrpc: '2.0', method, params }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });
    if (!response.ok) throw new ArcErc8004RpcError(`Arc RPC HTTP ${response.status}.`);
    const payload = (await response.json()) as JsonRpcResponse<T>;
    if (payload.error !== undefined) {
      throw new ArcErc8004RpcError(`Arc RPC ${method} failed with code ${payload.error.code}.`);
    }
    if (!Object.hasOwn(payload, 'result')) throw new ArcErc8004RpcError(`Arc RPC ${method} returned no result.`);
    return payload.result as T;
  }
}
