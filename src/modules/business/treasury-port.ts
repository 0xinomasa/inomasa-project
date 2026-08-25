import type { UsdcMicroAmount } from '../commerce/money.ts';

export interface ProvisionTreasuryWalletCommand {
  readonly businessId: `biz_${string}`;
  readonly displayName: string;
  readonly idempotencyKey: string;
}

export interface ProvisionedTreasuryWallet {
  readonly accountType: 'EOA';
  readonly address: `0x${string}`;
  readonly blockchain: 'ARC-TESTNET';
  readonly providerWalletId: string;
}

export interface SubmitTreasuryTransferCommand {
  readonly amountMicroUsdc: UsdcMicroAmount;
  readonly destinationAddress: `0x${string}`;
  readonly idempotencyKey: string;
  readonly referenceId: string;
  readonly sourceAddress: `0x${string}`;
}

export interface SubmittedTreasuryTransfer {
  readonly providerTransactionId: string;
  readonly state: 'SUBMITTED';
}

export type TreasuryTransferOutcome =
  | {
      readonly providerState: string;
      readonly state: 'COMPLETE';
      readonly transactionHash: `0x${string}`;
    }
  | {
      readonly providerState: string;
      readonly state: 'FAILED' | 'OUTCOME_UNKNOWN' | 'PENDING';
    };

export interface TreasuryWalletPort {
  getUsdcBalance(providerWalletId: string): Promise<UsdcMicroAmount>;
  observeTransfer(providerTransactionId: string): Promise<TreasuryTransferOutcome>;
  provisionWallet(command: ProvisionTreasuryWalletCommand): Promise<ProvisionedTreasuryWallet>;
  submitTransfer(command: SubmitTreasuryTransferCommand): Promise<SubmittedTreasuryTransfer>;
}
