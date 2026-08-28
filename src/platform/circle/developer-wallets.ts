import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';

import type {
  ProvisionedTreasuryWallet,
  ProvisionTreasuryWalletCommand,
  SubmitTreasuryTransferCommand,
  SubmittedTreasuryTransfer,
  TreasuryTransferOutcome,
  TreasuryWalletPort,
} from '../../modules/business/treasury-port.ts';
import type {
  CapitalExecutionPort,
  CapitalTransferOutcome,
  ProvisionCapitalAccountCommand,
  ProvisionedCapitalAccount,
  SubmitCapitalTransferCommand,
} from '../../modules/capital/execution-port.ts';
import {
  formatUsdcAmount,
  parseUsdcAmount,
  type UsdcMicroAmount,
} from '../../modules/commerce/money.ts';
import { arcTestnet } from '../arc/config.ts';
import type { CircleDeveloperWalletConfig } from './config.ts';

const circleTerminalFailureStates = new Set(['CANCELLED', 'DENIED', 'FAILED', 'STUCK']);

type CircleWalletsClient = ReturnType<typeof initiateDeveloperControlledWalletsClient>;
type CircleTransferInput = Parameters<CircleWalletsClient['createTransaction']>[0];

function requireEvmAddress(value: string, label: string): `0x${string}` {
  if (!/^0x[0-9a-fA-F]{40}$/.test(value)) {
    throw new Error(`${label} returned by Circle is not a 20-byte EVM address.`);
  }

  return value as `0x${string}`;
}

async function provisionEoa(
  client: CircleWalletsClient,
  walletSetId: string,
  command: {
    readonly displayName: string;
    readonly idempotencyKey: string;
    readonly referenceId: string;
  },
): Promise<ProvisionedTreasuryWallet> {
  const response = await client.createWallets({
    accountType: 'EOA',
    blockchains: [arcTestnet.circleBlockchain],
    count: 1,
    idempotencyKey: command.idempotencyKey,
    metadata: [{ name: command.displayName, refId: command.referenceId }],
    walletSetId,
  });
  const wallet = response.data?.wallets[0];

  if (wallet === undefined) {
    throw new Error('Circle wallet provisioning returned no wallet.');
  }
  if (wallet.blockchain !== arcTestnet.circleBlockchain || wallet.accountType !== 'EOA') {
    throw new Error('Circle wallet provisioning returned an unexpected chain or account type.');
  }
  return {
    accountType: 'EOA',
    address: requireEvmAddress(wallet.address, 'Wallet address'),
    blockchain: arcTestnet.circleBlockchain,
    providerWalletId: wallet.id,
  };
}

async function getUsdcBalance(
  client: CircleWalletsClient,
  providerWalletId: string,
): Promise<UsdcMicroAmount> {
  const response = await client.getWalletTokenBalance({
    id: providerWalletId,
    tokenAddresses: [arcTestnet.usdc.address],
  });
  const balance = response.data?.tokenBalances?.find(
    ({ token }) => token.tokenAddress?.toLowerCase() === arcTestnet.usdc.address.toLowerCase(),
  );
  return parseUsdcAmount(balance?.amount ?? '0');
}

async function submitTransfer(
  client: CircleWalletsClient,
  command: SubmitTreasuryTransferCommand,
): Promise<SubmittedTreasuryTransfer> {
  const response = await client.createTransaction(buildCircleTransferInput(command));
  const transactionId = response.data?.id;
  if (transactionId === undefined || transactionId.length === 0) {
    throw new Error('Circle transfer submission returned no transaction ID.');
  }
  return { providerTransactionId: transactionId, state: 'SUBMITTED' };
}

async function observeTransfer(
  client: CircleWalletsClient,
  providerTransactionId: string,
): Promise<TreasuryTransferOutcome> {
  const response = await client.getTransaction({ id: providerTransactionId });
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
      transactionHash: requireEvmAddressLikeHash(transaction.txHash),
    };
  }
  if (circleTerminalFailureStates.has(transaction.state)) {
    return { providerState: transaction.state, state: 'FAILED' };
  }
  return { providerState: transaction.state, state: 'PENDING' };
}

export function buildCircleTransferInput(
  command: SubmitTreasuryTransferCommand,
): CircleTransferInput {
  return {
    amount: [formatUsdcAmount(command.amountMicroUsdc)],
    blockchain: arcTestnet.circleBlockchain,
    destinationAddress: command.destinationAddress,
    fee: { config: { feeLevel: 'MEDIUM' }, type: 'level' },
    idempotencyKey: command.idempotencyKey,
    refId: command.referenceId,
    tokenAddress: arcTestnet.usdc.address,
    walletAddress: command.sourceAddress,
  };
}

export class CircleDeveloperWalletAdapter implements TreasuryWalletPort {
  readonly #client;
  readonly #walletSetId: string;

  constructor(config: CircleDeveloperWalletConfig) {
    this.#client = initiateDeveloperControlledWalletsClient({
      apiKey: config.apiKey,
      entitySecret: config.entitySecret,
    });
    this.#walletSetId = config.walletSetId;
  }

  async provisionWallet(
    command: ProvisionTreasuryWalletCommand,
  ): Promise<ProvisionedTreasuryWallet> {
    return provisionEoa(this.#client, this.#walletSetId, {
      displayName: command.displayName,
      idempotencyKey: command.idempotencyKey,
      referenceId: command.businessId,
    });
  }

  async getUsdcBalance(providerWalletId: string): Promise<UsdcMicroAmount> {
    return getUsdcBalance(this.#client, providerWalletId);
  }

  async submitTransfer(
    command: SubmitTreasuryTransferCommand,
  ): Promise<SubmittedTreasuryTransfer> {
    return submitTransfer(this.#client, command);
  }

  async observeTransfer(providerTransactionId: string): Promise<TreasuryTransferOutcome> {
    return observeTransfer(this.#client, providerTransactionId);
  }
}

export class CircleCapitalExecutionAdapter implements CapitalExecutionPort {
  readonly #client;
  readonly #walletSetId: string;

  constructor(config: CircleDeveloperWalletConfig) {
    this.#client = initiateDeveloperControlledWalletsClient({
      apiKey: config.apiKey,
      entitySecret: config.entitySecret,
    });
    this.#walletSetId = config.walletSetId;
  }

  async provisionCapitalAccount(
    command: ProvisionCapitalAccountCommand,
  ): Promise<ProvisionedCapitalAccount> {
    return provisionEoa(this.#client, this.#walletSetId, {
      displayName: command.displayName,
      idempotencyKey: command.idempotencyKey,
      referenceId: command.providerId,
    });
  }

  async getUsdcBalance(providerWalletId: string): Promise<UsdcMicroAmount> {
    return getUsdcBalance(this.#client, providerWalletId);
  }

  async submitCapitalTransfer(
    command: SubmitCapitalTransferCommand,
  ): Promise<{ readonly providerTransactionId: string; readonly state: 'SUBMITTED' }> {
    return submitTransfer(this.#client, command);
  }

  async observeTransfer(providerTransactionId: string): Promise<CapitalTransferOutcome> {
    return observeTransfer(this.#client, providerTransactionId);
  }
}

function requireEvmAddressLikeHash(value: string): `0x${string}` {
  if (!/^0x[0-9a-fA-F]{64}$/.test(value)) {
    throw new Error('Circle returned an invalid Arc transaction hash.');
  }

  return value as `0x${string}`;
}
