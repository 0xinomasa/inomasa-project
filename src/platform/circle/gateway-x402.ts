import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';
import { BatchEvmScheme } from '@circle-fin/x402-batching/client';
import { BatchFacilitatorClient } from '@circle-fin/x402-batching/server';

import type {
  GatewayBalance,
  GatewayFundingTransactionOutcome,
  GatewayX402Port,
  X402PaymentPayload,
  X402PaymentRequired,
  X402PaymentRequirements,
  X402SettlementResult,
  X402VerificationResult,
} from '../../modules/commerce/x402-port.ts';
import { parseUsdcAmount, type UsdcMicroAmount } from '../../modules/commerce/money.ts';
import { arcTestnet } from '../arc/config.ts';
import type { CircleDeveloperWalletConfig } from './config.ts';

export const arcGatewayTestnet = {
  apiUrl: 'https://gateway-api-testnet.circle.com',
  contractAddress: '0x0077777d7EBA4688BDeF3E311b846F25870A19B9',
  domain: 26,
  minValiditySeconds: 604_800,
  network: 'eip155:5042002',
} as const;

type FacilitatorPaymentPayload = Parameters<BatchFacilitatorClient['verify']>[0];
type FacilitatorPaymentRequirements = Parameters<BatchFacilitatorClient['verify']>[1];

const circleTerminalFailureStates = new Set(['CANCELLED', 'DENIED', 'FAILED', 'STUCK']);

function requireEvmAddress(value: string, label: string): `0x${string}` {
  if (!/^0x[0-9a-fA-F]{40}$/.test(value)) throw new Error(`${label} is not an EVM address.`);
  return value as `0x${string}`;
}

function requireTransactionHash(value: string): `0x${string}` {
  if (!/^0x[0-9a-fA-F]{64}$/.test(value)) {
    throw new Error('Circle returned an invalid Arc transaction hash.');
  }
  return value as `0x${string}`;
}

function requireSignature(value: string | undefined): `0x${string}` {
  if (value === undefined || !/^0x[0-9a-fA-F]{130}$/.test(value)) {
    throw new Error('Circle returned an invalid EVM typed-data signature.');
  }
  return value as `0x${string}`;
}

export function serializeCircleTypedData(input: {
  readonly domain: {
    readonly chainId: number;
    readonly name: string;
    readonly verifyingContract: `0x${string}`;
    readonly version: string;
  };
  readonly message: Record<string, unknown>;
  readonly primaryType: string;
  readonly types: Record<string, readonly { readonly name: string; readonly type: string }[]>;
}): string {
  return JSON.stringify(
    {
      ...input,
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' },
        ],
        ...input.types,
      },
    },
    (_key, value) => (typeof value === 'bigint' ? value.toString() : value),
  );
}

export class CircleGatewayFacilitatorAdapter {
  readonly #facilitator = new BatchFacilitatorClient({ url: arcGatewayTestnet.apiUrl });

  async getRequirements(input: {
    readonly amountMicroUsdc: UsdcMicroAmount;
    readonly payToAddress: `0x${string}`;
  }): Promise<X402PaymentRequirements> {
    const supported = await this.#facilitator.getSupported();
    const kind = supported.kinds.find(
      (candidate) =>
        candidate.x402Version === 2 &&
        candidate.scheme === 'exact' &&
        candidate.network === arcGatewayTestnet.network,
    );
    const extra = kind?.extra;
    if (
      extra?.['name'] !== 'GatewayWalletBatched' ||
      extra['version'] !== '1' ||
      typeof extra['verifyingContract'] !== 'string' ||
      typeof extra['minValiditySeconds'] !== 'number'
    ) {
      throw new Error('Circle Gateway does not currently advertise the required Arc x402 profile.');
    }
    if (
      extra['verifyingContract'].toLowerCase() !==
        arcGatewayTestnet.contractAddress.toLowerCase() ||
      extra['minValiditySeconds'] < arcGatewayTestnet.minValiditySeconds
    ) {
      throw new Error('Circle Gateway Arc x402 profile differs from the selected registry.');
    }
    return {
      amount: input.amountMicroUsdc.toString(),
      asset: arcTestnet.usdc.address,
      extra: {
        minValiditySeconds: extra['minValiditySeconds'],
        name: 'GatewayWalletBatched',
        verifyingContract: requireEvmAddress(extra['verifyingContract'], 'Gateway contract'),
        version: '1',
      },
      maxTimeoutSeconds: extra['minValiditySeconds'],
      network: arcGatewayTestnet.network,
      payTo: requireEvmAddress(input.payToAddress, 'x402 payee'),
      scheme: 'exact',
    };
  }

  async verify(
    payload: X402PaymentPayload,
    requirements: X402PaymentRequirements,
  ): Promise<X402VerificationResult> {
    return this.#facilitator.verify(
      payload as unknown as FacilitatorPaymentPayload,
      requirements as unknown as FacilitatorPaymentRequirements,
    );
  }

  async settle(
    payload: X402PaymentPayload,
    requirements: X402PaymentRequirements,
  ): Promise<X402SettlementResult> {
    return this.#facilitator.settle(
      payload as unknown as FacilitatorPaymentPayload,
      requirements as unknown as FacilitatorPaymentRequirements,
    ) as Promise<X402SettlementResult>;
  }
}

export class CircleGatewayX402Adapter implements GatewayX402Port {
  readonly #client;
  readonly #facilitator = new CircleGatewayFacilitatorAdapter();
  readonly #payerAddress: `0x${string}`;

  constructor(config: CircleDeveloperWalletConfig, payerAddress: `0x${string}`) {
    this.#client = initiateDeveloperControlledWalletsClient({
      apiKey: config.apiKey,
      entitySecret: config.entitySecret,
    });
    this.#payerAddress = requireEvmAddress(payerAddress, 'Gateway payer');
  }

  async submitApproval(input: {
    readonly amountMicroUsdc: UsdcMicroAmount;
    readonly idempotencyKey: string;
    readonly referenceId: string;
    readonly sourceAddress: `0x${string}`;
  }): Promise<{ readonly providerTransactionId: string }> {
    return this.#submitContract({
      abiFunctionSignature: 'approve(address,uint256)',
      abiParameters: [arcGatewayTestnet.contractAddress, input.amountMicroUsdc.toString()],
      contractAddress: arcTestnet.usdc.address,
      ...input,
    });
  }

  async submitDeposit(input: {
    readonly amountMicroUsdc: UsdcMicroAmount;
    readonly idempotencyKey: string;
    readonly referenceId: string;
    readonly sourceAddress: `0x${string}`;
  }): Promise<{ readonly providerTransactionId: string }> {
    return this.#submitContract({
      abiFunctionSignature: 'deposit(address,uint256)',
      abiParameters: [arcTestnet.usdc.address, input.amountMicroUsdc.toString()],
      contractAddress: arcGatewayTestnet.contractAddress,
      ...input,
    });
  }

  async #submitContract(input: {
    readonly abiFunctionSignature: string;
    readonly abiParameters: string[];
    readonly contractAddress: string;
    readonly idempotencyKey: string;
    readonly referenceId: string;
    readonly sourceAddress: `0x${string}`;
  }): Promise<{ readonly providerTransactionId: string }> {
    const response = await this.#client.createContractExecutionTransaction({
      abiFunctionSignature: input.abiFunctionSignature,
      abiParameters: input.abiParameters,
      blockchain: arcTestnet.circleBlockchain,
      contractAddress: input.contractAddress,
      fee: { config: { feeLevel: 'MEDIUM' }, type: 'level' },
      idempotencyKey: input.idempotencyKey,
      refId: input.referenceId,
      walletAddress: input.sourceAddress,
    });
    const providerTransactionId = response.data?.id;
    if (providerTransactionId === undefined || providerTransactionId.length === 0) {
      throw new Error('Circle contract execution returned no transaction ID.');
    }
    return { providerTransactionId };
  }

  async observeFundingTransaction(
    providerTransactionId: string,
  ): Promise<GatewayFundingTransactionOutcome> {
    const response = await this.#client.getTransaction({ id: providerTransactionId });
    const transaction = response.data?.transaction;
    if (transaction === undefined) {
      return { providerState: 'EMPTY_RESPONSE', state: 'OUTCOME_UNKNOWN' };
    }
    if (transaction.state === 'COMPLETE') {
      if (transaction.txHash === undefined) {
        return { providerState: transaction.state, state: 'OUTCOME_UNKNOWN' };
      }
      return {
        providerState: transaction.state,
        state: 'COMPLETE',
        transactionHash: requireTransactionHash(transaction.txHash),
      };
    }
    if (circleTerminalFailureStates.has(transaction.state)) {
      return { providerState: transaction.state, state: 'FAILED' };
    }
    return { providerState: transaction.state, state: 'PENDING' };
  }

  async getBalance(depositorAddress: `0x${string}`): Promise<GatewayBalance> {
    const response = await fetch(`${arcGatewayTestnet.apiUrl}/v1/balances`, {
      body: JSON.stringify({
        sources: [{ depositor: depositorAddress, domain: arcGatewayTestnet.domain }],
        token: 'USDC',
      }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    const data = (await response.json()) as {
      readonly balances?: readonly { readonly balance?: string; readonly pendingBatch?: string }[];
      readonly message?: string;
    };
    if (!response.ok) {
      throw new Error(`Gateway balance failed (${response.status}): ${data.message ?? 'unknown'}`);
    }
    const balance = data.balances?.[0];
    if (balance === undefined) throw new Error('Gateway returned no balance for the depositor.');
    return {
      availableMicroUsdc: parseUsdcAmount(balance.balance ?? '0'),
      pendingMicroUsdc: parseUsdcAmount(balance.pendingBatch ?? '0'),
    };
  }

  async getRequirements(input: {
    readonly amountMicroUsdc: UsdcMicroAmount;
    readonly payToAddress: `0x${string}`;
  }): Promise<X402PaymentRequirements> {
    return this.#facilitator.getRequirements(input);
  }

  async createPaymentPayload(paymentRequired: X402PaymentRequired): Promise<X402PaymentPayload> {
    const requirements = paymentRequired.accepts[0];
    const scheme = new BatchEvmScheme({
      address: this.#payerAddress,
      signTypedData: async (params) => {
        const response = await this.#client.signTypedData({
          blockchain: arcTestnet.circleBlockchain,
          data: serializeCircleTypedData(params),
          memo: 'Inomasa bounded Agent x402 payment authorization',
          walletAddress: this.#payerAddress,
        });
        return requireSignature(response.data?.signature);
      },
    });
    const partial = await scheme.createPaymentPayload(2, requirements);
    return {
      accepted: requirements,
      payload: partial.payload as X402PaymentPayload['payload'],
      resource: paymentRequired.resource,
      x402Version: 2,
    };
  }

  async verify(
    payload: X402PaymentPayload,
    requirements: X402PaymentRequirements,
  ): Promise<X402VerificationResult> {
    return this.#facilitator.verify(payload, requirements);
  }

  async settle(
    payload: X402PaymentPayload,
    requirements: X402PaymentRequirements,
  ): Promise<X402SettlementResult> {
    return this.#facilitator.settle(payload, requirements);
  }
}
