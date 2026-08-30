import { createHash } from 'node:crypto';

import type { UsdcMicroAmount } from '../../modules/commerce/money.ts';
import {
  externalReadTimeoutMs,
  withExternalOperationTimeout,
} from '../provider-timeout.ts';
import { arcTestnet } from './config.ts';

const erc20TransferTopic =
  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

interface JsonRpcResponse<T> {
  readonly error?: { readonly code: number; readonly message: string };
  readonly id: number;
  readonly jsonrpc: '2.0';
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

export interface VerifiedArcUsdcTransfer {
  readonly amountMicroUsdc: UsdcMicroAmount;
  readonly blockNumber: bigint;
  readonly destinationAddress: `0x${string}`;
  readonly sourceAddress: `0x${string}`;
  readonly transactionHash: `0x${string}`;
}

export interface ArcNetworkSnapshot {
  readonly blockNumber: bigint;
  readonly chainId: 5042002;
  readonly gasPriceWei: bigint;
  readonly observedAt: string;
  readonly usdcCodeSha256: string;
}

export class ArcRpcError extends Error {
  override readonly name = 'ArcRpcError';
}

export class ArcTestnetRpc {
  readonly #fetch: typeof fetch;
  readonly #rpcUrl: string;

  constructor(options?: { readonly fetch?: typeof fetch; readonly rpcUrl?: string }) {
    this.#fetch = options?.fetch ?? fetch;
    this.#rpcUrl = options?.rpcUrl ?? arcTestnet.rpcUrl;
  }

  async readNetworkSnapshot(observedAt: string): Promise<ArcNetworkSnapshot> {
    const chainId = await this.#request<string>('eth_chainId', []);
    if (BigInt(chainId) !== BigInt(arcTestnet.chainId)) {
      throw new ArcRpcError('Arc RPC returned the wrong chain ID.');
    }

    const [blockNumber, gasPrice, usdcCode] = await Promise.all([
      this.#request<string>('eth_blockNumber', []),
      this.#request<string>('eth_gasPrice', []),
      this.#request<string>('eth_getCode', [arcTestnet.usdc.address, 'latest']),
    ]);
    if (!/^0x[0-9a-fA-F]+$/.test(blockNumber) || !/^0x[0-9a-fA-F]+$/.test(gasPrice)) {
      throw new ArcRpcError('Arc RPC returned an invalid numeric snapshot field.');
    }
    if (!/^0x[0-9a-fA-F]+$/.test(usdcCode) || usdcCode === '0x') {
      throw new ArcRpcError('Arc USDC interface has no contract code at the configured address.');
    }

    return {
      blockNumber: BigInt(blockNumber),
      chainId: arcTestnet.chainId,
      gasPriceWei: BigInt(gasPrice),
      observedAt,
      usdcCodeSha256: createHash('sha256').update(usdcCode.toLowerCase()).digest('hex'),
    };
  }

  async verifyUsdcTransfer(input: {
    readonly amountMicroUsdc: UsdcMicroAmount;
    readonly destinationAddress: `0x${string}`;
    readonly sourceAddress: `0x${string}`;
    readonly transactionHash: `0x${string}`;
  }): Promise<VerifiedArcUsdcTransfer> {
    const chainId = await this.#request<string>('eth_chainId', []);
    if (BigInt(chainId) !== BigInt(arcTestnet.chainId)) {
      throw new ArcRpcError('Arc RPC returned the wrong chain ID.');
    }

    const receipt = await this.#request<ArcReceipt | null>('eth_getTransactionReceipt', [
      input.transactionHash,
    ]);
    if (receipt === null) {
      throw new ArcRpcError('Arc transaction receipt is not available yet.');
    }
    if (receipt.status !== '0x1') {
      throw new ArcRpcError('Arc transaction receipt is not successful.');
    }
    if (receipt.transactionHash.toLowerCase() !== input.transactionHash.toLowerCase()) {
      throw new ArcRpcError('Arc transaction receipt hash does not match the requested transaction.');
    }

    const destinationTopic = `0x${input.destinationAddress.slice(2).padStart(64, '0')}`.toLowerCase();
    const sourceTopic = `0x${input.sourceAddress.slice(2).padStart(64, '0')}`.toLowerCase();
    const transfer = receipt.logs.find(
      (log) =>
        log.address.toLowerCase() === arcTestnet.usdc.address.toLowerCase() &&
        log.topics[0]?.toLowerCase() === erc20TransferTopic &&
        log.topics[1]?.toLowerCase() === sourceTopic &&
        log.topics[2]?.toLowerCase() === destinationTopic &&
        BigInt(log.data) === input.amountMicroUsdc,
    );

    if (transfer === undefined) {
      throw new ArcRpcError('Arc receipt does not contain the expected USDC Transfer event.');
    }

    return {
      amountMicroUsdc: input.amountMicroUsdc,
      blockNumber: BigInt(receipt.blockNumber),
      destinationAddress: input.destinationAddress,
      sourceAddress: input.sourceAddress,
      transactionHash: input.transactionHash,
    };
  }

  async #request<T>(method: string, params: readonly unknown[]): Promise<T> {
    const response = await withExternalOperationTimeout(
      this.#fetch(this.#rpcUrl, {
        body: JSON.stringify({ id: 1, jsonrpc: '2.0', method, params }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      }),
      `Arc RPC ${method}`,
      externalReadTimeoutMs,
    );

    if (!response.ok) {
      throw new ArcRpcError(`Arc RPC HTTP request failed with status ${response.status}.`);
    }

    const payload = (await response.json()) as JsonRpcResponse<T>;
    if (payload.error !== undefined) {
      throw new ArcRpcError(`Arc RPC ${method} failed with code ${payload.error.code}.`);
    }
    if (!Object.hasOwn(payload, 'result')) {
      throw new ArcRpcError(`Arc RPC ${method} returned no result.`);
    }

    return payload.result as T;
  }
}
