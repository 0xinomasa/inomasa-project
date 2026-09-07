import { createHash } from 'node:crypto';

import { keccak256, toBytes } from 'viem';

import {
  createProductErc8183Plan,
  createProductX402Plan,
  deriveProductOperationIdentity,
  assertProductEconomicRequestId,
  providerHandoffDisposition,
  productErc8183Legs,
  type ProductEconomicOperationKind,
  type ProductErc8183Leg,
} from '../../modules/commerce/product-operations.ts';
import type { X402PaymentRequired } from '../../modules/commerce/x402-port.ts';
import { canonicalJson } from '../../shared/canonical-json.ts';
import { ArcErc8183Rpc, arcErc8183 } from '../../platform/arc/erc8183.ts';
import { ArcTestnetRpc } from '../../platform/arc/rpc.ts';
import { readCircleDeveloperWalletConfig } from '../../platform/circle/config.ts';
import { CircleContractExecutionAdapter } from '../../platform/circle/contract-execution.ts';
import {
  arcGatewayTestnet,
  CircleGatewayX402Adapter,
} from '../../platform/circle/gateway-x402.ts';
import { PostgresAgentAuthorityRepository } from '../../platform/persistence/agent-authority-repository.ts';
import { PostgresAgentRepository } from '../../platform/persistence/agent-repository.ts';
import { PostgresAlphaBusinessRepository } from '../../platform/persistence/alpha-business-repository.ts';
import { PostgresAlphaCommerceRepository } from '../../platform/persistence/alpha-commerce-repository.ts';
import { PostgresAlphaServiceRepository } from '../../platform/persistence/alpha-service-repository.ts';
import { readDatabaseConnectionConfig } from '../../platform/persistence/config.ts';
import { PostgresPersistence } from '../../platform/persistence/database.ts';
import {
  type Erc8183JobOperation,
  PostgresErc8183Repository,
} from '../../platform/persistence/erc8183-repository.ts';
import { PostgresGatewayX402Repository } from '../../platform/persistence/gateway-x402-repository.ts';
import { PostgresOperationalWorkspaceRepository } from '../../platform/persistence/operational-workspace-repository.ts';
import {
  PostgresProductEconomicOperationRepository,
  type ProductEconomicRequestSummary,
} from '../../platform/persistence/product-economic-operation-repository.ts';
import { readBusinessSources, readConnectedResource } from '../../platform/http/business-source.ts';
import { productCommerceSelectionForOffer } from './catalog.ts';

export type ProductEconomicAction = 'ADVANCE' | 'PREPARE';

export interface ProductEconomicActionInput {
  readonly action: ProductEconomicAction;
  readonly agentPrincipalId?: string;
  readonly businessSlug: string;
  readonly controllerPrincipalId: `usr_${string}`;
  readonly kind?: ProductEconomicOperationKind;
  readonly offerId?: string;
  readonly requestId: string;
}

export interface ProductEconomicActionResult {
  readonly message: string;
  readonly request: ProductEconomicRequestSummary;
}

function asAgentId(value: string | undefined): `agt_${string}` {
  if (value === undefined || !/^agt_[a-z0-9_]+$/.test(value)) {
    throw new Error('Choose a bounded purchase Agent for this x402 confirmation.');
  }
  return value as `agt_${string}`;
}

function asOfferId(value: string | undefined): `off_${string}` {
  if (value === undefined || !/^off_[a-z0-9_]+$/.test(value)) {
    throw new Error('Choose a supported controlled service offer.');
  }
  return value as `off_${string}`;
}

function requestedKind(value: ProductEconomicOperationKind | undefined): ProductEconomicOperationKind {
  if (value !== 'X402_PURCHASE' && value !== 'ERC8183_JOB') {
    throw new Error('Choose an instant purchase or evaluated job.');
  }
  return value;
}

function snapshotDigest(snapshot: {
  readonly blockNumber: bigint;
  readonly chainId: number;
  readonly gasPriceWei: bigint;
  readonly observedAt: string;
  readonly usdcCodeSha256: string;
}): string {
  return createHash('sha256').update(JSON.stringify({
    blockNumber: snapshot.blockNumber.toString(),
    chainId: snapshot.chainId,
    gasPriceWei: snapshot.gasPriceWei.toString(),
    observedAt: snapshot.observedAt,
    usdcCodeSha256: snapshot.usdcCodeSha256,
  })).digest('hex');
}

async function requestSummary(
  repository: PostgresProductEconomicOperationRepository,
  input: Pick<ProductEconomicActionInput, 'businessSlug' | 'controllerPrincipalId' | 'requestId'>,
): Promise<ProductEconomicRequestSummary> {
  const requests = await repository.listRequests({
    controllerPrincipalId: input.controllerPrincipalId,
    slug: input.businessSlug,
  });
  const request = requests?.find(({ requestId }) => requestId === input.requestId);
  if (request === undefined) throw new Error('Economic request was not found in this Business context.');
  return request;
}

async function prepareOperation(
  persistence: PostgresPersistence,
  input: ProductEconomicActionInput,
): Promise<ProductEconomicActionResult> {
  const kind = requestedKind(input.kind);
  const offerId = asOfferId(input.offerId);
  const requestRepository = new PostgresProductEconomicOperationRepository(persistence);
  const existing = (await requestRepository.listRequests({
    controllerPrincipalId: input.controllerPrincipalId,
    slug: input.businessSlug,
  }))?.find(({ requestId }) => requestId === input.requestId);
  if (existing !== undefined) {
    if (existing.kind !== kind || existing.offerId !== offerId) {
      throw new Error('Economic request replay changed the confirmed operation.');
    }
    return { message: 'This exact confirmation already exists; no duplicate obligation was created.', request: existing };
  }

  const workspaces = new PostgresOperationalWorkspaceRepository(persistence);
  const businessContext = await workspaces.getBusinessForController({
    controllerPrincipalId: input.controllerPrincipalId,
    slug: input.businessSlug,
  });
  if (businessContext === undefined) throw new Error('Business control is required for this economic operation.');
  if (businessContext.environment !== 'PRIVATE_ARC_TESTNET') {
    throw new Error('Product economic operation is restricted to PRIVATE_ARC_TESTNET.');
  }
  const activatedOffers = await workspaces.listActivatedProductOffersForBuyer({
    controllerPrincipalId: input.controllerPrincipalId,
    slug: input.businessSlug,
  });
  const selection = productCommerceSelectionForOffer(offerId, activatedOffers ?? []);
  if (selection === undefined || selection.kind !== kind) {
    throw new Error('The selected offer is not active for this controlled transaction shape.');
  }
  const capability = selection.capability;
  const businesses = new PostgresAlphaBusinessRepository(persistence);
  const buyer = await businesses.getBusiness(businessContext.businessId);
  const provider = await businesses.getBusiness(capability.offer.providerBusinessId);
  const buyerTreasury = await workspaces.getTreasury({
    controllerPrincipalId: input.controllerPrincipalId,
    slug: input.businessSlug,
  });
  if (
    buyerTreasury?.status !== 'ACTIVE' ||
    buyerTreasury.address === null ||
    buyerTreasury.providerWalletId === null
  ) {
    throw new Error('Connect and fund the Business Treasury before confirming an economic operation.');
  }
  const providerTreasury = (await businesses.listBusinesses())
    .find(({ businessId }) => businessId === provider.businessId);
  if (providerTreasury?.address === null || providerTreasury?.address === undefined) {
    throw new Error('The controlled provider offer is currently unavailable.');
  }
  const providerAddress = providerTreasury.address as `0x${string}`;
  const buyerAddress = buyerTreasury.address as `0x${string}`;
  const requestedAt = new Date().toISOString();
  const identity = deriveProductOperationIdentity({
    buyerBusinessId: buyer.businessId,
    kind,
    offerId,
    requestId: input.requestId,
  });
  const commerce = new PostgresAlphaCommerceRepository(persistence);

  if (kind === 'X402_PURCHASE') {
    const agentPrincipalId = asAgentId(input.agentPrincipalId);
    const agent = await new PostgresAgentRepository(persistence).getAgentDetail({
      agentPrincipalId,
      businessId: buyer.businessId,
    });
    if (
      agent === undefined ||
      agent.status !== 'ACTIVE' ||
      agent.runtimeClass !== 'OPERATOR_INVOKED' ||
      !agent.capabilities.includes('purchase-service') ||
      agent.identityId === null ||
      agent.identityState !== 'VERIFIED'
    ) {
      throw new Error('The selected Agent requires active bounded purchase-service capability and an active onchain identity.');
    }
    const gateway = new CircleGatewayX402Adapter(readCircleDeveloperWalletConfig(), buyerAddress);
    const requirements = await gateway.getRequirements({
      amountMicroUsdc: capability.offer.priceMicroUsdc,
      payToAddress: providerAddress,
    });
    const paymentRequired: X402PaymentRequired = {
      accepts: [requirements],
      resource: {
        description: capability.offer.description,
        mimeType: capability.mimeType,
        url: capability.resourceUri,
      },
      x402Version: 2,
    };
    const plan = createProductX402Plan({
      agentPrincipalId,
      buyer,
      controllerPrincipalId: input.controllerPrincipalId,
      erc8004IdentityId: agent.identityId as `aid_${string}`,
      identity,
      offer: capability.offer,
      provider,
      requestedAt,
    });
    const authorities = new PostgresAgentAuthorityRepository(persistence);
    const payments = new PostgresGatewayX402Repository(persistence);
    await persistence.transaction(async (transaction) => {
      await authorities.ensureAgentAndGrant({
        agentBusinessId: buyer.businessId,
        agentCapabilities: agent.capabilities,
        agentDisplayName: agent.displayName,
        agentPrincipalId,
        agentRole: agent.role,
        grant: plan.grant,
        providerOfRecordPrincipalId: agent.providerOfRecordPrincipalId as `biz_${string}`,
        runtimeClass: 'OPERATOR_INVOKED',
        softwareVersion: agent.softwareVersion,
      }, transaction);
      await authorities.authorizePurchaseInTransaction(transaction, {
        evaluatedAt: requestedAt,
        executionAuthorizationExpiresAt: plan.grant.expiresAt,
        identifiers: {
          authorizationId: identity.authorizationId,
          decisionId: identity.decisionId,
        },
        intent: plan.intent,
        policyVersion: 1,
      });
      await commerce.prepareCommerce({
        obligation: plan.obligation,
        offer: capability.offer,
        settlement: plan.settlement,
      }, transaction);
      await payments.preparePaymentInTransaction(transaction, {
        executionAuthorizationId: identity.authorizationId,
        obligationId: identity.obligationId,
        payerAddress: buyerAddress,
        paymentId: identity.paymentId,
        paymentRequired,
        settlementId: identity.settlementId,
      });
      await requestRepository.ensureRequestInTransaction(transaction, {
        agentPrincipalId,
        buyerBusinessId: buyer.businessId,
        controllerPrincipalId: input.controllerPrincipalId,
        gatewayFundingId: identity.funding.fundingId,
        jobId: null,
        kind,
        obligationId: identity.obligationId,
        offerId,
        paymentId: identity.paymentId,
        requestId: input.requestId,
        requestedAt,
        serviceExecutionId: identity.serviceExecutionId,
        settlementId: identity.settlementId,
      });
      await authorities.consumeAuthorizationInTransaction(transaction, {
        authorizationId: identity.authorizationId,
        consumedAt: requestedAt,
        obligationId: identity.obligationId,
      });
    });
  } else {
    const providerBinding = await persistence.databaseForApplication
      .withSchema('inomasa_app')
      .selectFrom('treasury_bindings')
      .select(['address', 'provider_wallet_id as providerWalletId'])
      .where('business_id', '=', provider.businessId)
      .where('status', '=', 'ACTIVE')
      .executeTakeFirst();
    if (providerBinding?.providerWalletId === null || providerBinding?.providerWalletId === undefined) {
      throw new Error('The controlled provider has no active Circle execution account.');
    }
    const plan = createProductErc8183Plan({
      buyer,
      clientAddress: buyerAddress,
      identity,
      offer: capability.offer,
      provider,
      providerAddress,
      requestedAt,
    });
    const jobs = new PostgresErc8183Repository(persistence);
    await persistence.transaction(async (transaction) => {
      await commerce.prepareCommerce({
        obligation: plan.obligation,
        offer: capability.offer,
        settlement: plan.settlement,
      }, transaction);
      await jobs.ensureJob({ commitment: plan.commitment, offer: capability.offer }, transaction);
      await requestRepository.ensureRequestInTransaction(transaction, {
        agentPrincipalId: null,
        buyerBusinessId: buyer.businessId,
        controllerPrincipalId: input.controllerPrincipalId,
        gatewayFundingId: null,
        jobId: identity.jobId,
        kind,
        obligationId: identity.obligationId,
        offerId,
        paymentId: null,
        requestId: input.requestId,
        requestedAt,
        serviceExecutionId: identity.serviceExecutionId,
        settlementId: identity.settlementId,
      });
    });
  }

  return {
    message: kind === 'X402_PURCHASE'
      ? 'Exact x402 obligation confirmed. Continue the persisted payment; funding may require explicit rail preparation.'
      : 'ERC-8183 job commitment confirmed. Advance each persisted lifecycle leg without blind resubmission.',
    request: await requestSummary(requestRepository, input),
  };
}

async function advanceGatewayFunding(input: {
  readonly gateway: CircleGatewayX402Adapter;
  readonly identity: ReturnType<typeof deriveProductOperationIdentity>;
  readonly repository: PostgresGatewayX402Repository;
  readonly amountMicroUsdc: bigint;
  readonly businessId: `biz_${string}`;
  readonly depositorAddress: `0x${string}`;
}): Promise<string> {
  let operation = await input.repository.ensureFunding({
    amountMicroUsdc: input.amountMicroUsdc as Parameters<PostgresGatewayX402Repository['ensureFunding']>[0]['amountMicroUsdc'],
    approvalIdempotencyKey: input.identity.funding.approvalIdempotencyKey,
    businessId: input.businessId,
    depositIdempotencyKey: input.identity.funding.depositIdempotencyKey,
    depositorAddress: input.depositorAddress,
    fundingId: input.identity.funding.fundingId,
    gatewayContractAddress: arcGatewayTestnet.contractAddress,
  });
  if (operation.state === 'OUTCOME_UNKNOWN') {
    const leg = operation.providerState === 'DEPOSIT_HANDOFF_STARTED' ||
      operation.depositProviderTransactionId !== null
      ? 'DEPOSIT'
      : 'APPROVAL';
    const providerTransactionId = leg === 'APPROVAL'
      ? operation.approvalProviderTransactionId
      : operation.depositProviderTransactionId;
    if (providerHandoffDisposition({
      providerTransactionId,
      state: operation.state,
    }) === 'HOLD') {
      return 'Gateway funding outcome is unknown and has no provider transaction to reconcile. No resubmission occurred.';
    }
    if (providerTransactionId === null) throw new Error('Gateway reconciliation has no provider transaction.');
    const outcome = await input.gateway.observeFundingTransaction(providerTransactionId);
    await input.repository.recordFundingOutcome({ fundingId: operation.fundingId, leg, outcome });
    return `Gateway ${leg.toLowerCase()} reconciliation observed ${outcome.state}. No new transaction was submitted.`;
  }
  if (operation.state === 'FAILED') return 'Gateway funding failed terminally. No retry was submitted.';
  if (operation.state === 'APPROVAL_AUTHORIZED') {
    await input.repository.recordFundingHandoffStarted({ fundingId: operation.fundingId, leg: 'APPROVAL' });
    try {
      const submitted = await input.gateway.submitApproval({
        amountMicroUsdc: operation.amountMicroUsdc,
        idempotencyKey: operation.approvalIdempotencyKey,
        referenceId: `${operation.fundingId}:approval`,
        sourceAddress: operation.depositorAddress,
      });
      await input.repository.recordFundingSubmitted({
        fundingId: operation.fundingId,
        leg: 'APPROVAL',
        providerTransactionId: submitted.providerTransactionId,
      });
    } catch {
      return 'Gateway approval handoff is outcome unknown. Its intent is persisted and no replacement submission will occur.';
    }
    return 'Gateway USDC approval submitted. Continue to reconcile the existing provider transaction.';
  }
  if (operation.state === 'APPROVAL_SUBMITTED') {
    if (operation.approvalProviderTransactionId === null) throw new Error('Gateway approval has no provider transaction.');
    const outcome = await input.gateway.observeFundingTransaction(operation.approvalProviderTransactionId);
    if (outcome.state === 'PENDING') return 'Gateway approval remains pending; no replacement transaction was submitted.';
    await input.repository.recordFundingOutcome({ fundingId: operation.fundingId, leg: 'APPROVAL', outcome });
    return `Gateway approval reconciliation observed ${outcome.state}.`;
  }
  if (operation.state === 'APPROVAL_COMPLETE') {
    await input.repository.recordFundingHandoffStarted({ fundingId: operation.fundingId, leg: 'DEPOSIT' });
    try {
      const submitted = await input.gateway.submitDeposit({
        amountMicroUsdc: operation.amountMicroUsdc,
        idempotencyKey: operation.depositIdempotencyKey,
        referenceId: `${operation.fundingId}:deposit`,
        sourceAddress: operation.depositorAddress,
      });
      await input.repository.recordFundingSubmitted({
        fundingId: operation.fundingId,
        leg: 'DEPOSIT',
        providerTransactionId: submitted.providerTransactionId,
      });
    } catch {
      return 'Gateway deposit handoff is outcome unknown. Its intent is persisted and no replacement submission will occur.';
    }
    return 'Gateway exact deposit submitted. Continue to reconcile the existing provider transaction.';
  }
  if (operation.state === 'DEPOSIT_SUBMITTED') {
    if (operation.depositProviderTransactionId === null) throw new Error('Gateway deposit has no provider transaction.');
    const outcome = await input.gateway.observeFundingTransaction(operation.depositProviderTransactionId);
    if (outcome.state === 'PENDING') return 'Gateway deposit remains pending; no replacement transaction was submitted.';
    await input.repository.recordFundingOutcome({ fundingId: operation.fundingId, leg: 'DEPOSIT', outcome });
    return `Gateway deposit reconciliation observed ${outcome.state}.`;
  }
  operation = await input.repository.getFunding(operation.fundingId);
  return operation.state === 'DEPOSIT_COMPLETE'
    ? 'Gateway x402 balance preparation is complete.'
    : `Gateway funding remains ${operation.state}.`;
}

async function ensurePaidServiceDelivery(input: {
  readonly executionId: `svc_${string}`;
  readonly obligationId: `obl_${string}`;
  readonly persistence: PostgresPersistence;
}): Promise<void> {
  const services = new PostgresAlphaServiceRepository(input.persistence);
  const authorization = await services.getExecutionAuthorization(input.executionId, input.obligationId);
  if (authorization.alreadyComplete) return;
  const { externalConnection } = await new PostgresAlphaBusinessRepository(input.persistence)
    .getGenesisContext(authorization.sellerBusinessId);
  if (externalConnection !== undefined) {
    const result = await readConnectedResource(externalConnection, readBusinessSources());
    await services.recordCompletedResource({
      authorization, executionId: input.executionId, obligationId: input.obligationId,
      output: result.output, outputSha256: result.outputSha256, completedAt: result.observedAt,
      sourceReference: result.sourceReference, sourceType: 'EXTERNAL_HTTP_JSON', factType: 'EXTERNAL_JSON_RESOURCE_DELIVERED',
    });
    return;
  }
  const snapshot = await new ArcTestnetRpc().readNetworkSnapshot(new Date().toISOString());
  await services.recordCompletedSnapshot({
    authorization,
    executionId: input.executionId,
    obligationId: input.obligationId,
    outputSha256: snapshotDigest(snapshot),
    snapshot,
  });
}

async function advanceX402(
  persistence: PostgresPersistence,
  input: ProductEconomicActionInput,
): Promise<string> {
  const requests = new PostgresProductEconomicOperationRepository(persistence);
  const context = await requests.getExecutionContext({
    controllerPrincipalId: input.controllerPrincipalId,
    requestId: input.requestId,
    slug: input.businessSlug,
  });
  if (context === undefined) throw new Error('Economic request was not found in this Business context.');
  if (context.kind !== 'X402_PURCHASE' || context.paymentId === null || context.gatewayFundingId === null) {
    throw new Error('The selected request is not an x402 purchase.');
  }
  const identity = deriveProductOperationIdentity({
    buyerBusinessId: context.buyerBusinessId,
    kind: context.kind,
    offerId: context.offerId,
    requestId: context.requestId,
  });
  const payments = new PostgresGatewayX402Repository(persistence);
  let payment = await payments.getPayment(context.paymentId);
  const funding = await payments.findFunding(context.gatewayFundingId);
  const gateway = new CircleGatewayX402Adapter(readCircleDeveloperWalletConfig(), context.buyerAddress);
  if (payment.state === 'COMPLETE') {
    if (
      funding?.state === 'APPROVAL_SUBMITTED' ||
      funding?.state === 'DEPOSIT_SUBMITTED' ||
      funding?.state === 'OUTCOME_UNKNOWN'
    ) {
      return advanceGatewayFunding({
        amountMicroUsdc: payment.amountMicroUsdc,
        businessId: context.buyerBusinessId,
        depositorAddress: context.buyerAddress,
        gateway,
        identity,
        repository: payments,
      });
    }
    await ensurePaidServiceDelivery({
      executionId: context.serviceExecutionId,
      obligationId: context.obligationId,
      persistence,
    });
    return 'x402 payment and service delivery are complete. Economic History now reconstructs the result.';
  }
  if (payment.state === 'FAILED') return `x402 payment failed terminally (${payment.providerState ?? 'provider reason unavailable'}).`;
  if (payment.state === 'OUTCOME_UNKNOWN') {
    return 'x402 settlement outcome is unknown. No blind settlement retry was submitted; inspect the persisted provider reference.';
  }

  if (payment.state === 'REQUIRED') {
    if (funding !== undefined && funding.state !== 'DEPOSIT_COMPLETE') {
      return advanceGatewayFunding({
        amountMicroUsdc: payment.amountMicroUsdc,
        businessId: context.buyerBusinessId,
        depositorAddress: context.buyerAddress,
        gateway,
        identity,
        repository: payments,
      });
    }
    const balance = await gateway.getBalance(context.buyerAddress);
    if (balance.availableMicroUsdc < payment.amountMicroUsdc) {
      if (funding?.state === 'DEPOSIT_COMPLETE') {
        return 'Gateway deposit is complete, but its available balance is insufficient. No duplicate funding transaction was submitted.';
      }
      return advanceGatewayFunding({
        amountMicroUsdc: payment.amountMicroUsdc,
        businessId: context.buyerBusinessId,
        depositorAddress: context.buyerAddress,
        gateway,
        identity,
        repository: payments,
      });
    }
    const payload = await gateway.createPaymentPayload(payment.paymentRequired);
    await payments.recordSigned({ paymentId: payment.paymentId, paymentPayload: payload });
    payment = await payments.getPayment(payment.paymentId);
  }
  await payments.ensureResourceEnvelope(payment.paymentId);
  payment = await payments.getPayment(payment.paymentId);
  const payload = payment.paymentPayload;
  if (payload === null) throw new Error('Persisted x402 signature is unavailable.');
  if (payment.state === 'SIGNED') {
    const verification = await gateway.verify(payload, payment.requirements);
    if (!verification.isValid) {
      await payments.recordFailed(payment.paymentId, verification.invalidReason ?? 'VERIFY_REJECTED');
      return `Gateway rejected the exact payment (${verification.invalidReason ?? 'unknown'}).`;
    }
    await payments.recordVerified(payment.paymentId);
    payment = await payments.getPayment(payment.paymentId);
  }
  if (payment.state !== 'VERIFIED') {
    return `x402 payment remains ${payment.state}; no new settlement was submitted.`;
  }
  await payments.recordOutcomeUnknown(payment.paymentId, 'PRODUCT_SETTLEMENT_HANDOFF_STARTED');
  try {
    const settlement = await gateway.settle(payload, payment.requirements);
    if (!settlement.success) {
      await payments.recordFailed(payment.paymentId, settlement.errorReason ?? 'SETTLE_REJECTED');
      return `Gateway settlement failed (${settlement.errorReason ?? 'unknown'}).`;
    }
    await payments.recordComplete({
      observedAt: new Date().toISOString(),
      paymentId: payment.paymentId,
      providerTransactionId: settlement.transaction,
    });
  } catch {
    await payments.recordOutcomeUnknown(payment.paymentId, 'PRODUCT_SETTLE_REQUEST_AMBIGUOUS');
    return 'Gateway settlement handoff had an ambiguous outcome. The signed payment is persisted and was not blindly retried.';
  }
  await ensurePaidServiceDelivery({
    executionId: context.serviceExecutionId,
    obligationId: context.obligationId,
    persistence,
  });
  return 'x402 exact payment settled and the service resource was delivered.';
}

function deliverableFor(input: {
  readonly jobId: `job_${string}`;
  readonly offerId: `off_${string}`;
}) {
  return {
    chainId: arcErc8183.chainId,
    conclusion: 'The human-confirmed controlled job completed through the accepted Arc funded-work path.',
    jobId: input.jobId,
    provenance: 'COMMON_CONTROL_TEST',
    scope: input.offerId,
  } as const;
}

async function reconcileErc8183Leg(input: {
  readonly execution: CircleContractExecutionAdapter;
  readonly identity: ReturnType<typeof deriveProductOperationIdentity>;
  readonly jobs: PostgresErc8183Repository;
  readonly leg: ProductErc8183Leg;
  readonly offerId: `off_${string}`;
  readonly operation: Erc8183JobOperation;
  readonly rpc: ArcErc8183Rpc;
}): Promise<string> {
  const outcome = await input.execution.observe(input.operation.providerTransactionId as string);
  if (outcome.state === 'PENDING') {
    return `ERC-8183 ${input.leg.replaceAll('_', ' ')} remains pending; no replacement transaction was submitted.`;
  }
  if (outcome.state !== 'COMPLETE' || outcome.transactionHash === undefined) {
    await input.jobs.recordOutcome({
      operationId: input.operation.operationId,
      providerState: outcome.providerState,
      state: outcome.state === 'FAILED' ? 'FAILED' : 'OUTCOME_UNKNOWN',
    });
    return `ERC-8183 ${input.leg.replaceAll('_', ' ')} is ${outcome.state}. No blind resubmission occurred.`;
  }
  const job = await input.jobs.getJob(input.operation.jobId);
  const expiredAtUnix = BigInt(Math.floor(Date.parse(job.expiredAt) / 1_000));
  const common = {
    budgetMicroUsdc: job.budgetMicroUsdc,
    client: job.clientAddress,
    description: job.description,
    evaluator: job.evaluatorAddress,
    expiredAtUnix,
    provider: job.providerAddress,
    transactionHash: outcome.transactionHash,
  } as const;
  if (input.leg === 'CREATE') {
    const observed = await input.rpc.verifyCreate(common);
    await input.jobs.recordComplete({
      blockNumber: observed.blockNumber,
      nextStatus: 'OPEN',
      observedAt: new Date().toISOString(),
      operationId: input.operation.operationId,
      protocolJobId: observed.jobId,
      providerState: outcome.providerState,
      transactionHash: outcome.transactionHash,
    });
    return `ERC-8183 CREATE reconciled on Arc as job ${observed.jobId}.`;
  }
  if (job.protocolJobId === null) throw new Error('ERC-8183 protocol job identity is unavailable.');
  if (input.leg === 'APPROVE') {
    const observed = await input.rpc.verifyApproval({
      amountMicroUsdc: job.budgetMicroUsdc,
      owner: job.clientAddress,
      transactionHash: outcome.transactionHash,
    });
    await input.jobs.recordComplete({
      blockNumber: observed.blockNumber,
      observedAt: new Date().toISOString(),
      operationId: input.operation.operationId,
      providerState: outcome.providerState,
      transactionHash: outcome.transactionHash,
    });
    return 'ERC-8183 USDC approval reconciled on Arc.';
  }
  const nextStatus = input.leg === 'FUND'
    ? 'FUNDED'
    : input.leg === 'SUBMIT'
      ? 'SUBMITTED'
      : input.leg === 'COMPLETE'
        ? 'COMPLETED'
        : 'OPEN';
  const transfer = input.leg === 'FUND' ? 'TO_ESCROW' : input.leg === 'COMPLETE' ? 'PAYOUT' : undefined;
  const observed = await input.rpc.verifyJobState({
    ...common,
    expectedStatus: nextStatus,
    jobId: job.protocolJobId,
    ...(transfer === undefined ? {} : { transfer }),
  });
  const deliverable = deliverableFor({ jobId: job.jobId, offerId: input.offerId });
  const deliverableHash = keccak256(toBytes(JSON.stringify(deliverable)));
  const evaluationHash = keccak256(toBytes(`accepted:${deliverableHash}`));
  const outputSha256 = createHash('sha256').update(canonicalJson(deliverable)).digest('hex');
  await input.jobs.recordComplete({
    blockNumber: observed.blockNumber,
    ...(input.leg === 'SUBMIT' ? { deliverableHash } : {}),
    ...(input.leg === 'COMPLETE' ? {
      evaluationHash,
      serviceExecutionId: input.identity.serviceExecutionId,
      serviceOutput: deliverable,
      serviceOutputSha256: outputSha256,
    } : {}),
    ...(input.leg === 'SET_BUDGET' ? {} : { nextStatus }),
    observedAt: new Date().toISOString(),
    operationId: input.operation.operationId,
    providerState: outcome.providerState,
    transactionHash: outcome.transactionHash,
  });
  if (input.leg === 'COMPLETE') {
    await input.jobs.ensureCompletedDeliveryIntegrity({
      deliverableHash,
      jobId: job.jobId,
      output: deliverable,
      serviceExecutionId: input.identity.serviceExecutionId,
    });
  }
  return `ERC-8183 ${input.leg.replaceAll('_', ' ')} reconciled as ${nextStatus}.`;
}

async function advanceErc8183(
  persistence: PostgresPersistence,
  input: ProductEconomicActionInput,
): Promise<string> {
  const requests = new PostgresProductEconomicOperationRepository(persistence);
  const context = await requests.getExecutionContext({
    controllerPrincipalId: input.controllerPrincipalId,
    requestId: input.requestId,
    slug: input.businessSlug,
  });
  if (context === undefined) throw new Error('Economic request was not found in this Business context.');
  if (context.kind !== 'ERC8183_JOB' || context.jobId === null) {
    throw new Error('The selected request is not an ERC-8183 job.');
  }
  const identity = deriveProductOperationIdentity({
    buyerBusinessId: context.buyerBusinessId,
    kind: context.kind,
    offerId: context.offerId,
    requestId: context.requestId,
  });
  const jobs = new PostgresErc8183Repository(persistence);
  const job = await jobs.getJob(context.jobId);
  if (job.protocolStatus === 'COMPLETED') {
    const deliverable = deliverableFor({ jobId: job.jobId, offerId: context.offerId });
    if (job.deliverableHash === null) throw new Error('Completed ERC-8183 job lacks its deliverable commitment.');
    await jobs.ensureCompletedDeliveryIntegrity({
      deliverableHash: job.deliverableHash,
      jobId: job.jobId,
      output: deliverable,
      serviceExecutionId: context.serviceExecutionId,
    });
    return 'ERC-8183 job, exact payout, and service delivery are complete.';
  }
  const operations = await jobs.listOperations(job.jobId);
  const nextLeg = productErc8183Legs().find((leg) =>
    operations.find(({ operationId }) => operationId === identity.erc8183Operations[leg].operationId)?.state !== 'COMPLETE',
  );
  if (nextLeg === undefined) return `ERC-8183 job remains ${job.protocolStatus}; no unverified transition was inferred.`;
  const identifiers = identity.erc8183Operations[nextLeg];
  const actorIsProvider = nextLeg === 'SET_BUDGET' || nextLeg === 'SUBMIT';
  let operation = await jobs.ensureOperation({
    actorAddress: actorIsProvider ? context.providerAddress : context.buyerAddress,
    idempotencyKey: identifiers.idempotencyKey,
    jobId: job.jobId,
    leg: nextLeg,
    operationId: identifiers.operationId,
    sourceProviderWalletId: actorIsProvider
      ? context.providerProviderWalletId
      : context.buyerProviderWalletId,
  });
  if (operation.state === 'FAILED') {
    return `ERC-8183 ${nextLeg.replaceAll('_', ' ')} failed terminally (${operation.providerState ?? 'provider reason unavailable'}).`;
  }
  const execution = new CircleContractExecutionAdapter(readCircleDeveloperWalletConfig());
  const rpc = new ArcErc8183Rpc();
  await rpc.verifyContractProfile();
  if (operation.state === 'SUBMITTED' || operation.state === 'OUTCOME_UNKNOWN') {
    if (providerHandoffDisposition({
      providerTransactionId: operation.providerTransactionId,
      state: operation.state,
    }) === 'HOLD') {
      return `ERC-8183 ${nextLeg.replaceAll('_', ' ')} is ${operation.state} without a provider transaction; no resubmission occurred.`;
    }
    return reconcileErc8183Leg({
      execution,
      identity,
      jobs,
      leg: nextLeg,
      offerId: context.offerId,
      operation,
      rpc,
    });
  }
  const current = await jobs.getJob(job.jobId);
  const expiredAtUnix = BigInt(Math.floor(Date.parse(current.expiredAt) / 1_000));
  const deliverable = deliverableFor({ jobId: current.jobId, offerId: context.offerId });
  const deliverableHash = keccak256(toBytes(JSON.stringify(deliverable)));
  const evaluationHash = keccak256(toBytes(`accepted:${deliverableHash}`));
  if (nextLeg !== 'CREATE' && current.protocolJobId === null) {
    throw new Error('ERC-8183 protocol job identity is unavailable.');
  }
  const protocolJobId = current.protocolJobId?.toString() ?? '';
  const call = {
    APPROVE: {
      abiFunctionSignature: 'approve(address,uint256)',
      abiParameters: [arcErc8183.contractAddress, current.budgetMicroUsdc.toString()],
      contractAddress: arcErc8183.paymentTokenAddress,
    },
    COMPLETE: {
      abiFunctionSignature: 'complete(uint256,bytes32,bytes)',
      abiParameters: [protocolJobId, evaluationHash, '0x'],
      contractAddress: arcErc8183.contractAddress,
    },
    CREATE: {
      abiFunctionSignature: 'createJob(address,address,uint256,string,address)',
      abiParameters: [current.providerAddress, current.evaluatorAddress, expiredAtUnix.toString(), current.description, arcErc8183.hookAddress],
      contractAddress: arcErc8183.contractAddress,
    },
    FUND: {
      abiFunctionSignature: 'fund(uint256,bytes)',
      abiParameters: [protocolJobId, '0x'],
      contractAddress: arcErc8183.contractAddress,
    },
    SET_BUDGET: {
      abiFunctionSignature: 'setBudget(uint256,uint256,bytes)',
      abiParameters: [protocolJobId, current.budgetMicroUsdc.toString(), '0x'],
      contractAddress: arcErc8183.contractAddress,
    },
    SUBMIT: {
      abiFunctionSignature: 'submit(uint256,bytes32,bytes)',
      abiParameters: [protocolJobId, deliverableHash, '0x'],
      contractAddress: arcErc8183.contractAddress,
    },
  } as const;
  const selected = call[nextLeg];
  await jobs.recordHandoffStarted(operation.operationId);
  try {
    const submission = await execution.submit({
      ...selected,
      idempotencyKey: operation.idempotencyKey,
      referenceId: `${job.jobId}:${nextLeg.toLowerCase()}`,
      sourceAddress: operation.actorAddress,
    });
    await jobs.recordSubmitted({
      operationId: operation.operationId,
      providerTransactionId: submission.providerTransactionId,
    });
  } catch {
    return `ERC-8183 ${nextLeg.replaceAll('_', ' ')} handoff is outcome unknown. The intent is durable and no replacement submission will occur.`;
  }
  operation = await jobs.getOperation(operation.operationId);
  return `ERC-8183 ${nextLeg.replaceAll('_', ' ')} submitted as provider transaction ${operation.providerTransactionId}. Continue to reconcile it; no duplicate will be submitted.`;
}

export async function executeProductEconomicAction(
  input: ProductEconomicActionInput,
): Promise<ProductEconomicActionResult> {
  const config = readDatabaseConnectionConfig('runtime');
  if (config.environment !== 'PRIVATE_ARC_TESTNET') {
    throw new Error('Product economic operation is restricted to PRIVATE_ARC_TESTNET.');
  }
  const normalizedInput = {
    ...input,
    requestId: assertProductEconomicRequestId(input.requestId),
  };
  const persistence = new PostgresPersistence(config);
  try {
    if (normalizedInput.action === 'PREPARE') return await prepareOperation(persistence, normalizedInput);
    const repository = new PostgresProductEconomicOperationRepository(persistence);
    const before = await requestSummary(repository, normalizedInput);
    const message = before.kind === 'X402_PURCHASE'
      ? await advanceX402(persistence, normalizedInput)
      : await advanceErc8183(persistence, normalizedInput);
    return { message, request: await requestSummary(repository, normalizedInput) };
  } finally {
    await persistence.close();
  }
}

export async function loadProductEconomicRequests(input: {
  readonly businessSlug: string;
  readonly controllerPrincipalId: `usr_${string}`;
}): Promise<readonly ProductEconomicRequestSummary[] | undefined> {
  const config = readDatabaseConnectionConfig('runtime');
  const persistence = new PostgresPersistence(config);
  try {
    return await new PostgresProductEconomicOperationRepository(persistence).listRequests({
      controllerPrincipalId: input.controllerPrincipalId,
      slug: input.businessSlug,
    });
  } finally {
    await persistence.close();
  }
}
