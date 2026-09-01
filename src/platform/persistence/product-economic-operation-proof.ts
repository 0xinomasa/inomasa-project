import { randomUUID } from 'node:crypto';

import { providerHandoffDisposition } from '../../modules/commerce/product-operations.ts';
import type { UsdcMicroAmount } from '../../modules/commerce/money.ts';
import { arcGatewayTestnet } from '../circle/gateway-x402.ts';
import type { PersistenceTransaction, PostgresPersistence } from './database.ts';
import { applicationSchema } from './database.ts';
import { PostgresErc8183Repository } from './erc8183-repository.ts';
import { PostgresGatewayX402Repository } from './gateway-x402-repository.ts';
import { PostgresProductEconomicOperationRepository } from './product-economic-operation-repository.ts';

export interface ProductEconomicOperationPersistenceProof {
  readonly applicationLifecycleVerified: boolean;
  readonly canonicalReadVerified: boolean;
  readonly erc8183AmbiguousHandoffVerified: boolean;
  readonly gatewayAmbiguousHandoffVerified: boolean;
  readonly genericActivatedOfferCanonicalVerified: boolean;
  readonly noBlindProviderResubmitVerified: boolean;
  readonly replayVerified: boolean;
  readonly semanticMismatchRejected: boolean;
  readonly tenantIsolationVerified: boolean;
}

interface ProductProofFixture {
  readonly buyerBusinessId: `biz_${string}`;
  readonly buyerGenesisId: string;
  readonly controllerPrincipalId: `usr_${string}`;
  readonly controlId: string;
  readonly jobId: `job_${string}`;
  readonly obligationId: `obl_${string}`;
  readonly offerId: `off_${string}`;
  readonly providerBusinessId: `biz_${string}`;
  readonly providerGenesisId: string;
  readonly requestId: string;
  readonly serviceExecutionId: `svc_${string}`;
  readonly settlementId: `set_${string}`;
  readonly slug: string;
}

const erc8183ContractAddress = '0x0747eef0706327138c69792bf28cd525089e4583';
const arcUsdcAddress = '0x3600000000000000000000000000000000000000';
const zeroAddress = '0x0000000000000000000000000000000000000000';

function createFixture(): ProductProofFixture {
  const suffix = randomUUID().replaceAll('-', '').slice(0, 16);
  return {
    buyerBusinessId: `biz_w3_buyer_${suffix}`,
    buyerGenesisId: `genesis-w3-buyer-${suffix}`,
    controllerPrincipalId: `usr_w3_${suffix}`,
    controlId: `ctl_w3_${suffix}`,
    jobId: `job_w3_${suffix}`,
    obligationId: `obl_w3_${suffix}`,
    offerId: `off_w3_${suffix}`,
    providerBusinessId: `biz_w3_provider_${suffix}`,
    providerGenesisId: `genesis-w3-provider-${suffix}`,
    requestId: randomUUID(),
    serviceExecutionId: `svc_w3_${suffix}`,
    settlementId: `set_w3_${suffix}`,
    slug: `work-3-proof-${suffix}`,
  };
}

async function insertFixture(
  transaction: PersistenceTransaction,
  fixture: ProductProofFixture,
): Promise<void> {
  const database = transaction.withSchema(applicationSchema);
  const now = new Date('2026-08-30T12:00:00.000Z');
  const proofHash = `0x${fixture.requestId.replaceAll('-', '').repeat(2)}`;

  await database.insertInto('principals').values([
    {
      actor_classification: 'COMMON_CONTROL_TEST',
      display_name: 'Work 3 proof owner',
      environment: 'PRIVATE_ARC_TESTNET',
      principal_id: fixture.controllerPrincipalId,
      principal_kind: 'HUMAN',
    },
    {
      actor_classification: 'COMMON_CONTROL_TEST',
      display_name: 'Work 3 proof buyer',
      environment: 'PRIVATE_ARC_TESTNET',
      principal_id: fixture.buyerBusinessId,
      principal_kind: 'BUSINESS',
    },
    {
      actor_classification: 'COMMON_CONTROL_TEST',
      display_name: 'Work 3 proof provider',
      environment: 'PRIVATE_ARC_TESTNET',
      principal_id: fixture.providerBusinessId,
      principal_kind: 'BUSINESS',
    },
  ]).execute();
  await database.insertInto('genesis_requests').values([
    {
      consumed_at: now,
      genesis_request_id: fixture.buyerGenesisId,
      requester_principal_id: fixture.controllerPrincipalId,
      state: 'CONSUMED',
      template_id: 'api-data-compute',
      template_version: 1,
    },
    {
      consumed_at: now,
      genesis_request_id: fixture.providerGenesisId,
      requester_principal_id: fixture.controllerPrincipalId,
      state: 'CONSUMED',
      template_id: 'professional-service',
      template_version: 1,
    },
  ]).execute();
  await database.insertInto('businesses').values([
    {
      actor_classification: 'COMMON_CONTROL_TEST',
      business_id: fixture.buyerBusinessId,
      business_principal_id: fixture.buyerBusinessId,
      common_control_group_id: 'ccg_work_3_proof',
      display_name: 'Work 3 proof buyer',
      entry_route: 'BUILD',
      environment: 'PRIVATE_ARC_TESTNET',
      genesis_request_id: fixture.buyerGenesisId,
      slug: fixture.slug,
      status: 'ACTIVE',
      summary: 'Transactional Work 3 application persistence proof.',
      template_id: 'api-data-compute',
      template_version: 1,
    },
    {
      actor_classification: 'COMMON_CONTROL_TEST',
      business_id: fixture.providerBusinessId,
      business_principal_id: fixture.providerBusinessId,
      common_control_group_id: 'ccg_work_3_proof',
      display_name: 'Work 3 proof provider',
      entry_route: 'BUILD',
      environment: 'PRIVATE_ARC_TESTNET',
      genesis_request_id: fixture.providerGenesisId,
      slug: `work-3-provider-${fixture.requestId.slice(0, 16)}`,
      status: 'ACTIVE',
      summary: 'Controlled provider for the Work 3 persistence proof.',
      template_id: 'professional-service',
      template_version: 1,
    },
  ]).execute();
  await database.insertInto('business_controls').values({
    accepted_at: now,
    business_id: fixture.buyerBusinessId,
    control_id: fixture.controlId,
    control_version: 1,
    controller_principal_id: fixture.controllerPrincipalId,
    ended_at: null,
    status: 'ACTIVE',
  }).execute();
  await database.insertInto('service_offers').values({
    capability_id: 'work-3-proof-service',
    commerce_protocol: 'ERC8183',
    created_by_principal_id: fixture.controllerPrincipalId,
    description: 'Isolated canonical Work 3 persistence proof.',
    idempotency_key: fixture.requestId,
    offer_id: fixture.offerId,
    price_micro_usdc: '50000',
    provider_business_id: fixture.providerBusinessId,
    status: 'ACTIVE',
    terms_version: 1,
  }).execute();
  await database.insertInto('obligations').values({
    amount_micro_usdc: '50000',
    asset: 'USDC',
    buyer_business_id: fixture.buyerBusinessId,
    environment: 'PRIVATE_ARC_TESTNET',
    execution_authorization_id: null,
    obligation_id: fixture.obligationId,
    offer_id: fixture.offerId,
    provenance: 'COMMON_CONTROL_TEST',
    represented_business_id: null,
    requester_principal_id: null,
    seller_business_id: fixture.providerBusinessId,
    settled_at: now,
    state: 'SETTLED',
    terms_version: 1,
  }).execute();
  await database.insertInto('settlement_operations').values({
    amount_micro_usdc: '50000',
    asset_address: arcUsdcAddress,
    chain_id: 5042002,
    idempotency_key: randomUUID(),
    obligation_id: fixture.obligationId,
    provider: 'ERC8183',
    provider_state: 'COMPLETED',
    provider_transaction_id: `work-3-proof-${fixture.requestId}`,
    settlement_id: fixture.settlementId,
    state: 'COMPLETE',
    transaction_hash: proofHash,
    updated_at: now,
  }).execute();
  await database.insertInto('erc8183_jobs').values({
    budget_micro_usdc: '50000',
    chain_id: 5042002,
    client_address: '0x1111111111111111111111111111111111111111',
    client_business_id: fixture.buyerBusinessId,
    contract_address: erc8183ContractAddress,
    deliverable_hash: proofHash,
    description: 'Isolated canonical Work 3 persistence proof.',
    evaluator_address: '0x3333333333333333333333333333333333333333',
    evaluation_hash: proofHash,
    expired_at: '2026-09-01T12:00:00.000Z',
    hook_address: zeroAddress,
    job_id: fixture.jobId,
    obligation_id: fixture.obligationId,
    offer_id: fixture.offerId,
    payment_token_address: arcUsdcAddress,
    protocol_job_id: null,
    protocol_status: 'COMPLETED',
    provenance: 'COMMON_CONTROL_TEST',
    provider_address: '0x2222222222222222222222222222222222222222',
    provider_business_id: fixture.providerBusinessId,
    settlement_id: fixture.settlementId,
    terminal_at: now,
    updated_at: now,
  }).execute();
  await database.insertInto('service_executions').values({
    capability_id: 'work-3-proof-service',
    completed_at: now,
    consumer_business_id: fixture.buyerBusinessId,
    environment: 'PRIVATE_ARC_TESTNET',
    execution_id: fixture.serviceExecutionId,
    obligation_id: fixture.obligationId,
    output: { proof: 'work-3-application-lifecycle' },
    output_sha256: fixture.requestId.replaceAll('-', '').repeat(2),
    provenance: 'COMMON_CONTROL_TEST',
    provider_business_id: fixture.providerBusinessId,
    settlement_id: fixture.settlementId,
    source_reference: `work-3-proof:${fixture.requestId}`,
    state: 'COMPLETE',
  }).execute();
}

async function deleteFixture(
  persistence: PostgresPersistence,
  fixture: ProductProofFixture,
): Promise<void> {
  const database = persistence.databaseForApplication.withSchema(applicationSchema);
  await database.deleteFrom('product_economic_requests').where('request_id', '=', fixture.requestId).execute();
  await database.deleteFrom('gateway_funding_operations').where('business_id', '=', fixture.buyerBusinessId).execute();
  await database.deleteFrom('service_executions').where('execution_id', '=', fixture.serviceExecutionId).execute();
  await database.deleteFrom('erc8183_job_operations').where('job_id', '=', fixture.jobId).execute();
  await database.deleteFrom('erc8183_jobs').where('job_id', '=', fixture.jobId).execute();
  await database.deleteFrom('settlement_operations').where('settlement_id', '=', fixture.settlementId).execute();
  await database.deleteFrom('obligations').where('obligation_id', '=', fixture.obligationId).execute();
  await database.deleteFrom('service_offers').where('offer_id', '=', fixture.offerId).execute();
  await database.deleteFrom('business_controls').where('control_id', '=', fixture.controlId).execute();
  await database.deleteFrom('businesses').where('business_id', 'in', [
    fixture.buyerBusinessId,
    fixture.providerBusinessId,
  ]).execute();
  await database.deleteFrom('genesis_requests').where('genesis_request_id', 'in', [
    fixture.buyerGenesisId,
    fixture.providerGenesisId,
  ]).execute();
  await database.deleteFrom('principals').where('principal_id', 'in', [
    fixture.controllerPrincipalId,
    fixture.buyerBusinessId,
    fixture.providerBusinessId,
  ]).execute();
}

export async function runProductEconomicOperationPersistenceProof(
  persistence: PostgresPersistence,
  loadRequests: (input: {
    readonly businessSlug: string;
    readonly controllerPrincipalId: `usr_${string}`;
  }) => Promise<readonly { readonly requestId: string }[] | undefined>,
): Promise<ProductEconomicOperationPersistenceProof> {
  const fixture = createFixture();
  const repository = new PostgresProductEconomicOperationRepository(persistence);
  const input = {
    agentPrincipalId: null,
    buyerBusinessId: fixture.buyerBusinessId,
    controllerPrincipalId: fixture.controllerPrincipalId,
    gatewayFundingId: null,
    jobId: fixture.jobId,
    kind: 'ERC8183_JOB' as const,
    obligationId: fixture.obligationId,
    offerId: fixture.offerId,
    paymentId: null,
    requestId: fixture.requestId,
    requestedAt: '2026-08-30T12:00:00.000Z',
    serviceExecutionId: fixture.serviceExecutionId,
    settlementId: fixture.settlementId,
  };
  try {
    await persistence.transaction((transaction) => insertFixture(transaction, fixture));
    const jobs = new PostgresErc8183Repository(persistence);
    const ambiguousOperationId = `jop_w5_${fixture.requestId.slice(0, 16)}` as const;
    await jobs.ensureOperation({
      actorAddress: '0x1111111111111111111111111111111111111111',
      idempotencyKey: randomUUID(),
      jobId: fixture.jobId,
      leg: 'REJECT',
      operationId: ambiguousOperationId,
      sourceProviderWalletId: `wallet-w5-${fixture.requestId}`,
    });
    await jobs.recordHandoffStarted(ambiguousOperationId);
    await jobs.recordHandoffStarted(ambiguousOperationId);
    const ambiguousOperation = await jobs.getOperation(ambiguousOperationId);
    const erc8183AmbiguousHandoffVerified =
      ambiguousOperation.state === 'OUTCOME_UNKNOWN' &&
      ambiguousOperation.providerState === 'HANDOFF_STARTED' &&
      ambiguousOperation.providerTransactionId === null;

    const gateway = new PostgresGatewayX402Repository(persistence);
    const fundingId = `gwf_w5_${fixture.requestId.slice(0, 16)}` as const;
    const funding = await gateway.ensureFunding({
      amountMicroUsdc: 50_000n as UsdcMicroAmount,
      approvalIdempotencyKey: randomUUID(),
      businessId: fixture.buyerBusinessId,
      depositIdempotencyKey: randomUUID(),
      depositorAddress: '0x1111111111111111111111111111111111111111',
      fundingId,
      gatewayContractAddress: arcGatewayTestnet.contractAddress,
    });
    await gateway.recordFundingHandoffStarted({ fundingId: funding.fundingId, leg: 'APPROVAL' });
    await gateway.recordFundingHandoffStarted({ fundingId: funding.fundingId, leg: 'APPROVAL' });
    const ambiguousFunding = await gateway.getFunding(funding.fundingId);
    const gatewayAmbiguousHandoffVerified =
      ambiguousFunding.state === 'OUTCOME_UNKNOWN' &&
      ambiguousFunding.providerState === 'APPROVAL_HANDOFF_STARTED' &&
      ambiguousFunding.approvalProviderTransactionId === null;
    const noBlindProviderResubmitVerified =
      providerHandoffDisposition({
        providerTransactionId: ambiguousOperation.providerTransactionId,
        state: ambiguousOperation.state,
      }) === 'HOLD' &&
      providerHandoffDisposition({
        providerTransactionId: ambiguousFunding.approvalProviderTransactionId,
        state: ambiguousFunding.state,
      }) === 'HOLD';
    const firstCreated = (await persistence.transaction((transaction) =>
      repository.ensureRequestInTransaction(transaction, input)
    )).created;
    const replayCreated = (await persistence.transaction((transaction) =>
      repository.ensureRequestInTransaction(transaction, input)
    )).created;

    const ownerRequests = await repository.listRequests({
      controllerPrincipalId: input.controllerPrincipalId,
      slug: fixture.slug,
    });
    const request = ownerRequests?.find((candidate) => candidate.requestId === fixture.requestId);
    const canonicalReadVerified =
      request?.jobStatus === 'COMPLETED' &&
      request.deliveryState === 'COMPLETE' &&
      request.settlementState === 'COMPLETE';
    const genericOffer = await persistence.databaseForApplication
      .withSchema(applicationSchema)
      .selectFrom('service_offers')
      .select(['created_by_principal_id as createdByPrincipalId', 'status'])
      .where('offer_id', '=', fixture.offerId)
      .executeTakeFirstOrThrow();
    const genericActivatedOfferCanonicalVerified =
      genericOffer.createdByPrincipalId === fixture.controllerPrincipalId &&
      genericOffer.status === 'ACTIVE' &&
      request?.offerId === fixture.offerId;

    const applicationRequests = await loadRequests({
      businessSlug: fixture.slug,
      controllerPrincipalId: input.controllerPrincipalId,
    });
    const applicationLifecycleVerified = applicationRequests
      ?.some((candidate) => candidate.requestId === fixture.requestId) === true;

    const tenantIsolationVerified = await repository.listRequests({
      controllerPrincipalId: `usr_w3_intruder_${fixture.requestId.slice(0, 16)}`,
      slug: fixture.slug,
    }) === undefined;

    let semanticMismatchRejected = false;
    try {
      await persistence.transaction((transaction) =>
        repository.ensureRequestInTransaction(transaction, {
          ...input,
          serviceExecutionId: `svc_w3_changed_${fixture.requestId.slice(0, 16)}`,
        }),
      );
    } catch {
      semanticMismatchRejected = true;
    }
    return {
      applicationLifecycleVerified,
      canonicalReadVerified,
      erc8183AmbiguousHandoffVerified,
      gatewayAmbiguousHandoffVerified,
      genericActivatedOfferCanonicalVerified,
      noBlindProviderResubmitVerified,
      replayVerified: firstCreated && !replayCreated,
      semanticMismatchRejected,
      tenantIsolationVerified,
    };
  } finally {
    await deleteFixture(persistence, fixture);
  }
}
