import {
  decodeFunctionResult,
  encodeFunctionData,
  keccak256,
  parseAbi,
  toBytes,
} from 'viem';

import type { EvmAddress, TransactionHash } from '../../modules/agent/erc8004.ts';
import {
  erc8183StatusFromChain,
  type Erc8183JobStatus,
} from '../../modules/commerce/erc8183.ts';
import type { UsdcMicroAmount } from '../../modules/commerce/money.ts';
import { arcTestnet } from './config.ts';

const zeroAddress = '0x0000000000000000000000000000000000000000' as const;

const commerceAbi = parseAbi([
  'function getJob(uint256 jobId) view returns ((uint256 id,address client,address provider,address evaluator,string description,uint256 budget,uint256 expiredAt,uint8 status,address hook))',
  'function paymentToken() view returns (address)',
  'function platformFeeBP() view returns (uint256)',
  'function evaluatorFeeBP() view returns (uint256)',
]);
const erc20Abi = parseAbi(['function allowance(address owner,address spender) view returns (uint256)']);
const jobCreatedTopic = keccak256(toBytes('JobCreated(uint256,address,address,address,uint256,address)'));
const transferTopic = keccak256(toBytes('Transfer(address,address,uint256)'));

interface JsonRpcResponse<T> {
  readonly error?: { readonly code: number; readonly message: string };
  readonly result?: T;
}

interface ArcReceipt {
  readonly blockNumber: string;
  readonly logs: readonly {
    readonly address: string;
    readonly data: `0x${string}`;
    readonly topics: readonly `0x${string}`[];
  }[];
  readonly status: string;
  readonly transactionHash: string;
}

interface StoredJob {
  readonly budget: bigint;
  readonly client: EvmAddress;
  readonly description: string;
  readonly evaluator: EvmAddress;
  readonly expiredAt: bigint;
  readonly hook: EvmAddress;
  readonly id: bigint;
  readonly provider: EvmAddress;
  readonly status: number;
}

export interface ArcErc8183JobObservation extends StoredJob {
  readonly statusName: Erc8183JobStatus;
}

export const arcErc8183 = {
  chainId: arcTestnet.chainId,
  contractAddress: '0x0747EEf0706327138c69792bF28Cd525089e4583' as EvmAddress,
  hookAddress: zeroAddress,
  paymentTokenAddress: arcTestnet.usdc.address,
} as const;

export class ArcErc8183RpcError extends Error {
  override readonly name = 'ArcErc8183RpcError';
}

function topicAddress(topic: string): EvmAddress {
  const value = `0x${topic.slice(-40)}`;
  if (!/^0x[0-9a-fA-F]{40}$/.test(value)) throw new ArcErc8183RpcError('Invalid address topic.');
  return value as EvmAddress;
}

function sameAddress(left: string, right: string): boolean {
  return left.toLowerCase() === right.toLowerCase();
}

export class ArcErc8183Rpc {
  readonly #fetch: typeof fetch;
  readonly #rpcUrl: string;

  constructor(options?: { readonly fetch?: typeof fetch; readonly rpcUrl?: string }) {
    this.#fetch = options?.fetch ?? fetch;
    this.#rpcUrl = options?.rpcUrl ?? arcTestnet.rpcUrl;
  }

  async verifyContractProfile(): Promise<void> {
    await this.#assertChain();
    const [paymentToken, platformFee, evaluatorFee] = await Promise.all([
      this.#readCommerce('paymentToken', []),
      this.#readCommerce('platformFeeBP', []),
      this.#readCommerce('evaluatorFeeBP', []),
    ]);
    if (!sameAddress(String(paymentToken), arcErc8183.paymentTokenAddress)) {
      throw new ArcErc8183RpcError('ERC-8183 payment token is not Arc Testnet USDC.');
    }
    if (BigInt(platformFee as bigint) !== 0n || BigInt(evaluatorFee as bigint) !== 0n) {
      throw new ArcErc8183RpcError('Alpha requires the verified zero-fee ERC-8183 profile.');
    }
  }

  async verifyCreate(input: {
    readonly client: EvmAddress;
    readonly description: string;
    readonly evaluator: EvmAddress;
    readonly expiredAtUnix: bigint;
    readonly provider: EvmAddress;
    readonly transactionHash: TransactionHash;
  }): Promise<{ readonly blockNumber: bigint; readonly jobId: bigint }> {
    await this.verifyContractProfile();
    const receipt = await this.#receipt(input.transactionHash);
    const event = receipt.logs.find(
      (log) =>
        sameAddress(log.address, arcErc8183.contractAddress) &&
        log.topics[0]?.toLowerCase() === jobCreatedTopic.toLowerCase(),
    );
    if (event?.topics[1] === undefined || event.topics[2] === undefined || event.topics[3] === undefined) {
      throw new ArcErc8183RpcError('Arc receipt has no complete ERC-8183 JobCreated event.');
    }
    if (!sameAddress(topicAddress(event.topics[2]), input.client)) {
      throw new ArcErc8183RpcError('ERC-8183 JobCreated client does not match the commitment.');
    }
    if (!sameAddress(topicAddress(event.topics[3]), input.provider)) {
      throw new ArcErc8183RpcError('ERC-8183 JobCreated provider does not match the commitment.');
    }
    const jobId = BigInt(event.topics[1]);
    const job = await this.readJob(jobId, receipt.blockNumber);
    this.#assertJob(job, {
      budget: 0n,
      client: input.client,
      description: input.description,
      evaluator: input.evaluator,
      expiredAtUnix: input.expiredAtUnix,
      provider: input.provider,
      status: 'OPEN',
    });
    return { blockNumber: BigInt(receipt.blockNumber), jobId };
  }

  async verifyApproval(input: {
    readonly amountMicroUsdc: UsdcMicroAmount;
    readonly owner: EvmAddress;
    readonly transactionHash: TransactionHash;
  }): Promise<{ readonly blockNumber: bigint }> {
    await this.#assertChain();
    const receipt = await this.#receipt(input.transactionHash);
    const allowance = await this.#readAllowance(
      input.owner,
      arcErc8183.contractAddress,
      receipt.blockNumber,
    );
    if (allowance < input.amountMicroUsdc) {
      throw new ArcErc8183RpcError('USDC allowance is below the committed ERC-8183 budget.');
    }
    return { blockNumber: BigInt(receipt.blockNumber) };
  }

  async verifyJobState(input: {
    readonly budgetMicroUsdc: UsdcMicroAmount;
    readonly client: EvmAddress;
    readonly description: string;
    readonly evaluator: EvmAddress;
    readonly expectedStatus: Erc8183JobStatus;
    readonly expiredAtUnix: bigint;
    readonly jobId: bigint;
    readonly provider: EvmAddress;
    readonly transactionHash: TransactionHash;
    readonly transfer?: 'PAYOUT' | 'REFUND' | 'TO_ESCROW';
  }): Promise<{ readonly blockNumber: bigint }> {
    await this.verifyContractProfile();
    const receipt = await this.#receipt(input.transactionHash);
    const job = await this.readJob(input.jobId, receipt.blockNumber);
    this.#assertJob(job, {
      budget: input.budgetMicroUsdc,
      client: input.client,
      description: input.description,
      evaluator: input.evaluator,
      expiredAtUnix: input.expiredAtUnix,
      provider: input.provider,
      status: input.expectedStatus,
    });
    if (input.transfer !== undefined) {
      const [from, to] =
        input.transfer === 'TO_ESCROW'
          ? [input.client, arcErc8183.contractAddress]
          : input.transfer === 'PAYOUT'
            ? [arcErc8183.contractAddress, input.provider]
            : [arcErc8183.contractAddress, input.client];
      this.#assertExactTransfer(receipt, from, to, input.budgetMicroUsdc);
    }
    return { blockNumber: BigInt(receipt.blockNumber) };
  }

  async readJob(jobId: bigint, blockTag = 'latest'): Promise<ArcErc8183JobObservation> {
    const value = (await this.#readCommerce('getJob', [jobId], blockTag)) as StoredJob;
    return { ...value, statusName: erc8183StatusFromChain(Number(value.status)) };
  }

  #assertExactTransfer(
    receipt: ArcReceipt,
    from: EvmAddress,
    to: EvmAddress,
    amount: UsdcMicroAmount,
  ): void {
    const matches = receipt.logs.filter(
      (log) =>
        sameAddress(log.address, arcErc8183.paymentTokenAddress) &&
        log.topics[0]?.toLowerCase() === transferTopic.toLowerCase() &&
        log.topics[1] !== undefined &&
        log.topics[2] !== undefined &&
        sameAddress(topicAddress(log.topics[1]), from) &&
        sameAddress(topicAddress(log.topics[2]), to) &&
        BigInt(log.data) === amount,
    );
    if (matches.length !== 1) {
      throw new ArcErc8183RpcError('Arc receipt does not contain one exact expected USDC transfer.');
    }
  }

  #assertJob(
    job: ArcErc8183JobObservation,
    expected: {
      readonly budget: bigint;
      readonly client: EvmAddress;
      readonly description: string;
      readonly evaluator: EvmAddress;
      readonly expiredAtUnix: bigint;
      readonly provider: EvmAddress;
      readonly status: Erc8183JobStatus;
    },
  ): void {
    if (
      job.budget !== expected.budget ||
      !sameAddress(job.client, expected.client) ||
      job.description !== expected.description ||
      !sameAddress(job.evaluator, expected.evaluator) ||
      job.expiredAt !== expected.expiredAtUnix ||
      !sameAddress(job.hook, zeroAddress) ||
      !sameAddress(job.provider, expected.provider) ||
      job.statusName !== expected.status
    ) {
      throw new ArcErc8183RpcError('Onchain ERC-8183 job does not match the persisted commitment.');
    }
  }

  async #assertChain(): Promise<void> {
    const chainId = await this.#request<string>('eth_chainId', []);
    if (BigInt(chainId) !== BigInt(arcErc8183.chainId)) {
      throw new ArcErc8183RpcError('Arc RPC returned the wrong chain ID.');
    }
  }

  async #readAllowance(owner: EvmAddress, spender: EvmAddress, blockTag: string): Promise<bigint> {
    const data = encodeFunctionData({ abi: erc20Abi, args: [owner, spender], functionName: 'allowance' });
    const result = await this.#request<`0x${string}`>('eth_call', [
      { data, to: arcErc8183.paymentTokenAddress },
      blockTag,
    ]);
    return decodeFunctionResult({ abi: erc20Abi, data: result, functionName: 'allowance' });
  }

  async #readCommerce(
    functionName: 'evaluatorFeeBP' | 'getJob' | 'paymentToken' | 'platformFeeBP',
    args: readonly unknown[],
    blockTag = 'latest',
  ): Promise<unknown> {
    const data = encodeFunctionData({ abi: commerceAbi, args: args as never, functionName });
    const result = await this.#request<`0x${string}`>('eth_call', [
      { data, to: arcErc8183.contractAddress },
      blockTag,
    ]);
    return decodeFunctionResult({ abi: commerceAbi, data: result, functionName });
  }

  async #receipt(transactionHash: TransactionHash): Promise<ArcReceipt> {
    const receipt = await this.#request<ArcReceipt | null>('eth_getTransactionReceipt', [transactionHash]);
    if (receipt === null) throw new ArcErc8183RpcError('Arc transaction receipt is unavailable.');
    if (receipt.status !== '0x1') throw new ArcErc8183RpcError('Arc transaction reverted.');
    if (!sameAddress(receipt.transactionHash, transactionHash)) {
      throw new ArcErc8183RpcError('Arc receipt hash mismatch.');
    }
    return receipt;
  }

  async #request<T>(method: string, params: readonly unknown[]): Promise<T> {
    const response = await this.#fetch(this.#rpcUrl, {
      body: JSON.stringify({ id: 1, jsonrpc: '2.0', method, params }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });
    if (!response.ok) throw new ArcErc8183RpcError(`Arc RPC HTTP ${response.status}.`);
    const payload = (await response.json()) as JsonRpcResponse<T>;
    if (payload.error !== undefined) {
      throw new ArcErc8183RpcError(`Arc RPC ${method} failed with code ${payload.error.code}.`);
    }
    if (!Object.hasOwn(payload, 'result')) {
      throw new ArcErc8183RpcError(`Arc RPC ${method} returned no result.`);
    }
    return payload.result as T;
  }
}
