import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';

import type {
  ProvisionedTreasuryWallet,
  ProvisionTreasuryWalletCommand,
  SubmitTreasuryTransferCommand,
  SubmittedTreasuryTransfer,
  TreasuryTransferOutcome,
  TreasuryWalletPort,
} from '../../modules/business/treasury-port.ts';
import {
  formatUsdcAmount,
  parseUsdcAmount,
  type UsdcMicroAmount,
} from '../../modules/commerce/money.ts';
import { arcTestnet } from '../arc/config.ts';
import type { CircleDeveloperWalletConfig } from './config.ts';

const circleTerminalFailureStates = new Set(['CANCELLED', 'DENIED', 'FAILED', 'STUCK']);

function requireEvmAddress(value: string, label: string): `0x${string}` {
  if (!/^0x[0-9a-fA-F]{40}$/.test(value)) {
    throw new Error(`${label} returned by Circle is not a 20-byte EVM address.`);
  }

  return value as `0x${string}`;
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
    const response = await this.#client.createWallets({
      accountType: 'EOA',
      blockchains: [arcTestnet.circleBlockchain],
      count: 1,
      idempotencyKey: command.idempotencyKey,
      metadata: [{ name: command.displayName, refId: command.businessId }],
      walletSetId: this.#walletSetId,
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

  async getUsdcBalance(providerWalletId: string): Promise<UsdcMicroAmount> {
    const response = await this.#client.getWalletTokenBalance({
      id: providerWalletId,
      tokenAddresses: [arcTestnet.usdc.address],
    });
    const balance = response.data?.tokenBalances?.find(
      ({ token }) => token.tokenAddress?.toLowerCase() === arcTestnet.usdc.address.toLowerCase(),
    );

    return parseUsdcAmount(balance?.amount ?? '0');
  }

  async submitTransfer(
    command: SubmitTreasuryTransferCommand,
  ): Promise<SubmittedTreasuryTransfer> {
    const response = await this.#client.createTransaction({
      amount: [formatUsdcAmount(command.amountMicroUsdc)],
      destinationAddress: command.destinationAddress,
      fee: { config: { feeLevel: 'MEDIUM' }, type: 'level' },
      idempotencyKey: command.idempotencyKey,
      refId: command.referenceId,
      tokenAddress: arcTestnet.usdc.address,
      walletId: command.sourceProviderWalletId,
    });
    const transactionId = response.data?.id;

    if (transactionId === undefined || transactionId.length === 0) {
      throw new Error('Circle transfer submission returned no transaction ID.');
    }

    return { providerTransactionId: transactionId, state: 'SUBMITTED' };
  }

  async observeTransfer(providerTransactionId: string): Promise<TreasuryTransferOutcome> {
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
        transactionHash: requireEvmAddressLikeHash(transaction.txHash),
      };
    }

    if (circleTerminalFailureStates.has(transaction.state)) {
      return { providerState: transaction.state, state: 'FAILED' };
    }

    return { providerState: transaction.state, state: 'PENDING' };
  }
}

function requireEvmAddressLikeHash(value: string): `0x${string}` {
  if (!/^0x[0-9a-fA-F]{64}$/.test(value)) {
    throw new Error('Circle returned an invalid Arc transaction hash.');
  }

  return value as `0x${string}`;
}
