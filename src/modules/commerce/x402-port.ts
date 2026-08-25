import type { UsdcMicroAmount } from './money.ts';

export interface GatewayFundingTransaction {
  readonly providerTransactionId: string;
}

export type GatewayFundingTransactionOutcome =
  | { readonly providerState: string; readonly state: 'FAILED' | 'OUTCOME_UNKNOWN' | 'PENDING' }
  | {
      readonly providerState: string;
      readonly state: 'COMPLETE';
      readonly transactionHash: `0x${string}`;
    };

export interface GatewayBalance {
  readonly availableMicroUsdc: UsdcMicroAmount;
  readonly pendingMicroUsdc: UsdcMicroAmount;
}

export interface X402PaymentRequirements {
  readonly amount: string;
  readonly asset: `0x${string}`;
  readonly extra: {
    readonly minValiditySeconds: number;
    readonly name: 'GatewayWalletBatched';
    readonly verifyingContract: `0x${string}`;
    readonly version: '1';
  };
  readonly maxTimeoutSeconds: number;
  readonly network: 'eip155:5042002';
  readonly payTo: `0x${string}`;
  readonly scheme: 'exact';
}

export interface X402PaymentPayload {
  readonly accepted: X402PaymentRequirements;
  readonly payload: {
    readonly authorization: {
      readonly from: `0x${string}`;
      readonly nonce: `0x${string}`;
      readonly to: `0x${string}`;
      readonly validAfter: string;
      readonly validBefore: string;
      readonly value: string;
    };
    readonly signature: `0x${string}`;
  };
  readonly resource: X402PaymentRequired['resource'];
  readonly x402Version: 2;
}

export interface X402PaymentRequired {
  readonly accepts: readonly [X402PaymentRequirements];
  readonly resource: {
    readonly description: string;
    readonly mimeType: 'application/json';
    readonly url: string;
  };
  readonly x402Version: 2;
}

export interface X402VerificationResult {
  readonly isValid: boolean;
  readonly invalidReason?: string;
  readonly payer?: string;
}

export interface X402SettlementResult {
  readonly errorReason?: string;
  readonly network: string;
  readonly payer?: string;
  readonly success: boolean;
  readonly transaction: string;
}

export interface GatewayX402Port {
  createPaymentPayload(paymentRequired: X402PaymentRequired): Promise<X402PaymentPayload>;
  getBalance(depositorAddress: `0x${string}`): Promise<GatewayBalance>;
  getRequirements(input: {
    readonly amountMicroUsdc: UsdcMicroAmount;
    readonly payToAddress: `0x${string}`;
  }): Promise<X402PaymentRequirements>;
  observeFundingTransaction(
    providerTransactionId: string,
  ): Promise<GatewayFundingTransactionOutcome>;
  settle(
    payload: X402PaymentPayload,
    requirements: X402PaymentRequirements,
  ): Promise<X402SettlementResult>;
  submitApproval(input: {
    readonly amountMicroUsdc: UsdcMicroAmount;
    readonly idempotencyKey: string;
    readonly referenceId: string;
    readonly sourceAddress: `0x${string}`;
  }): Promise<GatewayFundingTransaction>;
  submitDeposit(input: {
    readonly amountMicroUsdc: UsdcMicroAmount;
    readonly idempotencyKey: string;
    readonly referenceId: string;
    readonly sourceAddress: `0x${string}`;
  }): Promise<GatewayFundingTransaction>;
  verify(
    payload: X402PaymentPayload,
    requirements: X402PaymentRequirements,
  ): Promise<X402VerificationResult>;
}
