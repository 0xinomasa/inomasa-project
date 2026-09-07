export interface ProductEconomicStateView {
  readonly deliveryState: string | null;
  readonly gatewayFundingState: string | null;
  readonly jobOperations: readonly { readonly state: string }[];
  readonly jobStatus: string | null;
  readonly kind: 'ERC8183_JOB' | 'X402_PURCHASE';
  readonly paymentState: string | null;
}

export function currentProductEconomicState(request: ProductEconomicStateView): string {
  if (request.kind === 'X402_PURCHASE') {
    if (
      request.paymentState === 'COMPLETE' &&
      (request.gatewayFundingState === 'APPROVAL_SUBMITTED' ||
        request.gatewayFundingState === 'DEPOSIT_SUBMITTED' ||
        request.gatewayFundingState === 'OUTCOME_UNKNOWN')
    ) return 'RAIL_RECONCILIATION';
    if (request.paymentState === 'COMPLETE') {
      return request.deliveryState === 'COMPLETE' ? 'COMPLETE' : 'DELIVERY_PENDING';
    }
    if (request.paymentState === 'OUTCOME_UNKNOWN') return 'OUTCOME_UNKNOWN';
    if (request.gatewayFundingState === 'FAILED') return 'FAILED';
    if (request.gatewayFundingState === 'OUTCOME_UNKNOWN') return 'RAIL_OUTCOME_UNKNOWN';
    return request.paymentState ?? 'PREPARED';
  }
  if (request.deliveryState === 'COMPLETE') return 'COMPLETE';
  const unresolved = request.jobOperations.find(({ state }) => state === 'OUTCOME_UNKNOWN' || state === 'FAILED');
  return unresolved?.state ?? request.jobStatus ?? 'PREPARED';
}
