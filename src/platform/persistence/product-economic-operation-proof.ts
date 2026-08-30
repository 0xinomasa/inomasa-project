import { randomUUID } from 'node:crypto';

import type { PostgresPersistence } from './database.ts';
import { applicationSchema } from './database.ts';
import { PostgresProductEconomicOperationRepository } from './product-economic-operation-repository.ts';

export interface ProductEconomicOperationPersistenceProof {
  readonly applicationLifecycleVerified: boolean;
  readonly canonicalReadVerified: boolean;
  readonly replayVerified: boolean;
  readonly semanticMismatchRejected: boolean;
  readonly tenantIsolationVerified: boolean;
}

export async function runProductEconomicOperationPersistenceProof(
  persistence: PostgresPersistence,
  loadRequests: (input: {
    readonly businessSlug: string;
    readonly controllerPrincipalId: `usr_${string}`;
  }) => Promise<readonly { readonly requestId: string }[] | undefined>,
): Promise<ProductEconomicOperationPersistenceProof> {
  const requestId = randomUUID();
  const repository = new PostgresProductEconomicOperationRepository(persistence);
  const input = {
    agentPrincipalId: 'agt_ops_pilot_buyer_v1' as const,
    buyerBusinessId: 'biz_ops_pilot' as const,
    controllerPrincipalId: 'usr_alpha_operator' as const,
    gatewayFundingId: 'gwf_ops_pilot_v1' as const,
    jobId: null,
    kind: 'X402_PURCHASE' as const,
    obligationId: 'obl_arc_snapshot_x402_v1' as const,
    offerId: 'off_arc_snapshot_x402_v1' as const,
    paymentId: 'pay_arc_snapshot_x402_v1' as const,
    requestId,
    requestedAt: '2026-08-30T12:00:00.000Z',
    serviceExecutionId: 'svc_arc_snapshot_x402_v1' as const,
    settlementId: 'set_arc_snapshot_x402_v1' as const,
  };
  try {
    const firstCreated = (await persistence.transaction((transaction) =>
      repository.ensureRequestInTransaction(transaction, input)
    )).created;
    const replayCreated = (await persistence.transaction((transaction) =>
      repository.ensureRequestInTransaction(transaction, input)
    )).created;

    const ownerRequests = await repository.listRequests({
      controllerPrincipalId: input.controllerPrincipalId,
      slug: 'ops-pilot',
    });
    const request = ownerRequests?.find((candidate) => candidate.requestId === requestId);
    const canonicalReadVerified =
      request?.paymentState === 'COMPLETE' &&
      request.deliveryState === 'COMPLETE' &&
      request.settlementState === 'COMPLETE';

    const applicationRequests = await loadRequests({
      businessSlug: 'ops-pilot',
      controllerPrincipalId: input.controllerPrincipalId,
    });
    const applicationLifecycleVerified = applicationRequests
      ?.some((candidate) => candidate.requestId === requestId) === true;

    const tenantIsolationVerified = await repository.listRequests({
      controllerPrincipalId: 'usr_reference_workbench',
      slug: 'ops-pilot',
    }) === undefined;

    let semanticMismatchRejected = false;
    try {
      await persistence.transaction((transaction) =>
        repository.ensureRequestInTransaction(transaction, {
          ...input,
          serviceExecutionId: 'svc_product_changed_semantics',
        }),
      );
    } catch {
      semanticMismatchRejected = true;
    }
    return {
      applicationLifecycleVerified,
      canonicalReadVerified,
      replayVerified: firstCreated && !replayCreated,
      semanticMismatchRejected,
      tenantIsolationVerified,
    };
  } finally {
    await persistence.databaseForApplication
      .withSchema(applicationSchema)
      .deleteFrom('product_economic_requests')
      .where('request_id', '=', requestId)
      .execute();
  }
}
