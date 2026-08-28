import type { UsdcMicroAmount } from '../commerce/money.ts';

export interface ProvisionCapitalAccountCommand {
  readonly displayName: string;
  readonly idempotencyKey: string;
  readonly providerId: `cap_${string}`;
}

export interface ProvisionedCapitalAccount {
  readonly accountType: 'EOA';
  readonly address: `0x${string}`;
  readonly blockchain: 'ARC-TESTNET';
  readonly providerWalletId: string;
}

export interface SubmitCapitalTransferCommand {
  readonly amountMicroUsdc: UsdcMicroAmount;
  readonly destinationAddress: `0x${string}`;
  readonly idempotencyKey: string;
  readonly referenceId: string;
  readonly sourceAddress: `0x${string}`;
}

export type CapitalTransferOutcome =
  | {
      readonly providerState: string;
      readonly state: 'COMPLETE';
      readonly transactionHash: `0x${string}`;
    }
  | {
      readonly providerState: string;
      readonly state: 'FAILED' | 'OUTCOME_UNKNOWN' | 'PENDING';
    };

export interface CapitalExecutionPort {
  getUsdcBalance(providerWalletId: string): Promise<UsdcMicroAmount>;
  observeTransfer(providerTransactionId: string): Promise<CapitalTransferOutcome>;
  provisionCapitalAccount(
    command: ProvisionCapitalAccountCommand,
  ): Promise<ProvisionedCapitalAccount>;
  submitCapitalTransfer(
    command: SubmitCapitalTransferCommand,
  ): Promise<{ readonly providerTransactionId: string; readonly state: 'SUBMITTED' }>;
}
