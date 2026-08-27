import type {
  AgentPurchaseIntent,
  StandingPurchaseAuthorityGrant,
} from '../src/modules/authority/model.ts';
import { acceptServiceOffer, authorizeSettlement, type ServiceOffer } from '../src/modules/commerce/model.ts';
import { parseUsdcAmount } from '../src/modules/commerce/money.ts';
import { alphaServiceCatalog } from '../src/modules/commerce/service-catalog.ts';
import type { X402PaymentRequired } from '../src/modules/commerce/x402-port.ts';
import { readCircleDeveloperWalletConfig } from '../src/platform/circle/config.ts';
import { CircleGatewayX402Adapter } from '../src/platform/circle/gateway-x402.ts';
import { PostgresAgentAuthorityRepository } from '../src/platform/persistence/agent-authority-repository.ts';
import { PostgresAlphaBusinessRepository } from '../src/platform/persistence/alpha-business-repository.ts';
import { PostgresAlphaCommerceRepository } from '../src/platform/persistence/alpha-commerce-repository.ts';
import { readDatabaseConnectionConfig } from '../src/platform/persistence/config.ts';
import { PostgresPersistence } from '../src/platform/persistence/database.ts';
import { PostgresGatewayX402Repository } from '../src/platform/persistence/gateway-x402-repository.ts';

const agentPrincipalId = 'agt_ops_pilot_buyer_v1' as const;
const checkpointC = process.argv.includes('--erc8004');
const authorizationId = checkpointC
  ? ('xau_arc_snapshot_x402_8004_v1' as const)
  : ('xau_arc_snapshot_x402_v1' as const);
const decisionId = checkpointC
  ? ('dec_arc_snapshot_x402_8004_v1' as const)
  : ('dec_arc_snapshot_x402_v1' as const);
const grantId = 'grt_ops_pilot_x402_v1' as const;
const intentId = checkpointC
  ? ('int_arc_snapshot_x402_8004_v1' as const)
  : ('int_arc_snapshot_x402_v1' as const);
const obligationId = checkpointC
  ? ('obl_arc_snapshot_x402_8004_v1' as const)
  : ('obl_arc_snapshot_x402_v1' as const);
const paymentId = checkpointC
  ? ('pay_arc_snapshot_x402_8004_v1' as const)
  : ('pay_arc_snapshot_x402_v1' as const);
const settlementId = checkpointC
  ? ('set_arc_snapshot_x402_8004_v1' as const)
  : ('set_arc_snapshot_x402_v1' as const);

function requireAddress(value: string | null, label: string): `0x${string}` {
  if (value === null || !/^0x[0-9a-fA-F]{40}$/.test(value)) {
    throw new Error(`${label} requires an active Arc EOA Treasury.`);
  }
  return value as `0x${string}`;
}

async function main(): Promise<void> {
  const databaseConfig = readDatabaseConnectionConfig('runtime');
  const circleConfig = readCircleDeveloperWalletConfig();
  if (
    databaseConfig.environment !== 'PRIVATE_ARC_TESTNET' ||
    circleConfig.environment !== 'PRIVATE_ARC_TESTNET'
  ) {
    throw new Error('Agent x402 purchase is restricted to PRIVATE_ARC_TESTNET.');
  }

  const persistence = new PostgresPersistence(databaseConfig);
  const authorities = new PostgresAgentAuthorityRepository(persistence);
  const businesses = new PostgresAlphaBusinessRepository(persistence);
  const commerce = new PostgresAlphaCommerceRepository(persistence);
  const payments = new PostgresGatewayX402Repository(persistence);

  try {
    const provider = await businesses.getBusiness('biz_signal_forge');
    const buyer = await businesses.getBusiness('biz_ops_pilot');
    const summaries = await businesses.listBusinesses();
    const payerAddress = requireAddress(
      summaries.find((business) => business.businessId === buyer.businessId)?.address ?? null,
      'Ops Pilot',
    );
    const payToAddress = requireAddress(
      summaries.find((business) => business.businessId === provider.businessId)?.address ?? null,
      'Signal Forge',
    );
    const gateway = new CircleGatewayX402Adapter(circleConfig, payerAddress);
    const offer: ServiceOffer = alphaServiceCatalog.arcMarketSnapshotX402.offer;
    const grant: StandingPurchaseAuthorityGrant = {
      actionType: 'PURCHASE_SERVICE',
      allowedCounterpartyBusinessId: provider.businessId,
      allowedOfferId: offer.offerId,
      allowanceConsumedMicroUsdc: parseUsdcAmount('0'),
      allowanceTotalMicroUsdc: parseUsdcAmount('0.02'),
      asset: 'USDC',
      authorityDomainBusinessId: buyer.businessId,
      controlVersion: 1,
      delegationAllowed: false,
      environment: databaseConfig.environment,
      expiresAt: '2026-09-05T00:00:00.000Z',
      granteePrincipalId: agentPrincipalId,
      grantId,
      grantVersion: 1,
      grantorPrincipalId: 'usr_alpha_operator',
      maxPerActionMicroUsdc: offer.priceMicroUsdc,
      representedBusinessId: buyer.businessId,
      status: 'ACTIVE',
      validFrom: '2026-08-25T00:00:00.000Z',
    };
    await authorities.ensureAgentAndGrant({
      agentBusinessId: buyer.businessId,
      agentCapabilities: ['purchase-service'],
      agentDisplayName: 'Ops Pilot Buyer Agent',
      agentPrincipalId,
      agentRole: 'BUYER_AGENT',
      grant,
      providerOfRecordPrincipalId: buyer.businessId,
      runtimeClass: 'OPERATOR_INVOKED',
      softwareVersion: 'deterministic-buyer@1',
    });

    let payment;
    try {
      payment = await payments.getPayment(paymentId);
    } catch {
      const requirements = await gateway.getRequirements({
        amountMicroUsdc: offer.priceMicroUsdc,
        payToAddress,
      });
      const paymentRequired: X402PaymentRequired = {
        accepts: [requirements],
        resource: {
          description: offer.description,
          mimeType: 'application/json',
          url: alphaServiceCatalog.arcMarketSnapshotX402.resourceUri,
        },
        x402Version: 2,
      };
      const requestedAt = new Date().toISOString();
      const intent: AgentPurchaseIntent = {
        actionType: 'PURCHASE_SERVICE',
        amountMicroUsdc: offer.priceMicroUsdc,
        asset: 'USDC',
        authorityDomainBusinessId: buyer.businessId,
        counterpartyBusinessId: provider.businessId,
        environment: databaseConfig.environment,
        ...(checkpointC ? { erc8004IdentityId: 'aid_ops_pilot_buyer_arc_8004_v1' as const } : {}),
        grantId,
        intentId,
        offerId: offer.offerId,
        purpose: checkpointC
          ? 'Use the verified ERC-8004 identity for one bounded x402 economic action.'
          : 'Buy a machine-priced Arc operating snapshot through x402.',
        requestedAt,
        requesterPrincipalId: agentPrincipalId,
        representedBusinessId: buyer.businessId,
      };
      const obligation = acceptServiceOffer({
        agentAuthority: {
          executionAuthorizationId: authorizationId,
          representedBusinessId: buyer.businessId,
          requesterPrincipalId: agentPrincipalId,
        },
        buyer,
        offer,
        obligationId,
        provider,
      });
      const settlement = authorizeSettlement({
        idempotencyKey: checkpointC
          ? 'fe42eebc-a224-4ed4-b9b7-6df3dfe14fb0'
          : 'b9849b77-0ee3-4d82-bde7-849ca822b18e',
        obligation,
        provider: 'CIRCLE_GATEWAY_X402',
        settlementId,
      });
      const expiresAt = new Date(Date.parse(requestedAt) + 15 * 60 * 1000).toISOString();
      await persistence.transaction(async (transaction) => {
        await authorities.authorizePurchaseInTransaction(transaction, {
          evaluatedAt: requestedAt,
          executionAuthorizationExpiresAt: expiresAt,
          identifiers: { authorizationId, decisionId },
          intent,
          policyVersion: 1,
        });
        await commerce.prepareCommerce({ obligation, offer, settlement }, transaction);
        await payments.preparePaymentInTransaction(transaction, {
          executionAuthorizationId: authorizationId,
          obligationId,
          payerAddress,
          paymentId,
          paymentRequired,
          settlementId,
        });
        await authorities.consumeAuthorizationInTransaction(transaction, {
          authorizationId,
          consumedAt: requestedAt,
          obligationId,
        });
      });
      console.log(`payment=${paymentId} challenge=HTTP_402 state=REQUIRED`);
      payment = await payments.getPayment(paymentId);
    }

    if (payment.state === 'COMPLETE') {
      console.log(
        `payment=${paymentId} state=ALREADY_COMPLETE provider_transaction=${payment.providerTransactionId}`,
      );
      return;
    }
    if (payment.state === 'FAILED') {
      throw new Error(`x402 payment is terminally failed: ${payment.providerState ?? 'unknown'}.`);
    }

    if (payment.paymentPayload === null) {
      const balance = await gateway.getBalance(payerAddress);
      if (balance.availableMicroUsdc < payment.amountMicroUsdc) {
        throw new Error(
          `Gateway balance ${balance.availableMicroUsdc} is below required ${payment.amountMicroUsdc}.`,
        );
      }
      const payload = await gateway.createPaymentPayload(payment.paymentRequired);
      await payments.recordSigned({ paymentId, paymentPayload: payload });
      console.log(`payment=${paymentId} state=SIGNED commitment=EXACT_SINGLE_USE`);
      payment = await payments.getPayment(paymentId);
    }

    await payments.ensureResourceEnvelope(paymentId);
    payment = await payments.getPayment(paymentId);
    const payload = payment.paymentPayload;
    if (payload === null) throw new Error('Persisted x402 signature is missing.');
    if (payment.state === 'SIGNED' || payment.state === 'OUTCOME_UNKNOWN') {
      const verification = await gateway.verify(payload, payment.requirements);
      if (!verification.isValid) {
        await payments.recordFailed(paymentId, verification.invalidReason ?? 'VERIFY_REJECTED');
        throw new Error(`Gateway rejected x402 payment: ${verification.invalidReason ?? 'unknown'}.`);
      }
      await payments.recordVerified(paymentId);
      console.log(`payment=${paymentId} state=VERIFIED payer=${verification.payer ?? 'unknown'}`);
    }

    let settlement;
    try {
      settlement = await gateway.settle(payload, payment.requirements);
    } catch (error) {
      await payments.recordOutcomeUnknown(paymentId, 'SETTLE_REQUEST_AMBIGUOUS');
      throw error;
    }
    if (!settlement.success) {
      await payments.recordFailed(paymentId, settlement.errorReason ?? 'SETTLE_REJECTED');
      throw new Error(`Gateway settlement failed: ${settlement.errorReason ?? 'unknown'}.`);
    }
    await payments.recordComplete({
      observedAt: new Date().toISOString(),
      paymentId,
      providerTransactionId: settlement.transaction,
    });
    console.log(
      `payment=${paymentId} state=COMPLETE network=${settlement.network} provider_transaction=${settlement.transaction}`,
    );
  } finally {
    await persistence.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Agent x402 purchase failed.');
  process.exitCode = 1;
});
