import type {
  AgentPurchaseIntent,
  StandingPurchaseAuthorityGrant,
} from '../src/modules/authority/model.ts';
import { acceptServiceOffer, authorizeSettlement, type ServiceOffer } from '../src/modules/commerce/model.ts';
import { parseUsdcAmount } from '../src/modules/commerce/money.ts';
import { readDatabaseConnectionConfig } from '../src/platform/persistence/config.ts';
import { PostgresAgentAuthorityRepository } from '../src/platform/persistence/agent-authority-repository.ts';
import { PostgresAlphaBusinessRepository } from '../src/platform/persistence/alpha-business-repository.ts';
import { PostgresAlphaCommerceRepository } from '../src/platform/persistence/alpha-commerce-repository.ts';
import { PostgresPersistence } from '../src/platform/persistence/database.ts';

const agentPrincipalId = 'agt_ops_pilot_buyer_v1' as const;
const grantId = 'grt_ops_pilot_snapshot_v1' as const;
const intentId = 'int_arc_snapshot_agent_v1' as const;
const authorizationId = 'xau_arc_snapshot_agent_v1' as const;
const decisionId = 'dec_arc_snapshot_agent_v1' as const;
const obligationId = 'obl_arc_snapshot_agent_v1' as const;
const settlementId = 'set_arc_snapshot_agent_v1' as const;

async function main(): Promise<void> {
  const config = readDatabaseConnectionConfig('runtime');
  if (config.environment !== 'PRIVATE_ARC_TESTNET') {
    throw new Error('Agent-triggered Alpha purchase is restricted to PRIVATE_ARC_TESTNET.');
  }

  const persistence = new PostgresPersistence(config);
  const authorities = new PostgresAgentAuthorityRepository(persistence);
  const businesses = new PostgresAlphaBusinessRepository(persistence);
  const commerce = new PostgresAlphaCommerceRepository(persistence);

  try {
    const provider = await businesses.getBusiness('biz_signal_forge');
    const buyer = await businesses.getBusiness('biz_ops_pilot');
    const grant: StandingPurchaseAuthorityGrant = {
      actionType: 'PURCHASE_SERVICE',
      allowedCounterpartyBusinessId: provider.businessId,
      allowedOfferId: 'off_arc_snapshot_v2',
      allowanceConsumedMicroUsdc: parseUsdcAmount('0'),
      allowanceTotalMicroUsdc: parseUsdcAmount('0.20'),
      asset: 'USDC',
      authorityDomainBusinessId: buyer.businessId,
      controlVersion: 1,
      delegationAllowed: false,
      environment: config.environment,
      expiresAt: '2026-09-01T00:00:00.000Z',
      granteePrincipalId: agentPrincipalId,
      grantId,
      grantVersion: 1,
      grantorPrincipalId: 'usr_alpha_operator',
      maxPerActionMicroUsdc: parseUsdcAmount('0.10'),
      representedBusinessId: buyer.businessId,
      status: 'ACTIVE',
      validFrom: '2026-08-25T00:00:00.000Z',
    };
    await authorities.ensureAgentAndGrant({
      agentDisplayName: 'Ops Pilot Buyer Agent',
      agentPrincipalId,
      grant,
      providerOfRecordPrincipalId: buyer.businessId,
      runtimeClass: 'OPERATOR_INVOKED',
      softwareVersion: 'deterministic-buyer@1',
    });

    const requestedAt = new Date().toISOString();
    const offer: ServiceOffer = {
      capabilityId: 'arc-market-snapshot',
      description: 'Repeat deterministic Arc Testnet network snapshot for bounded Agent consumption.',
      offerId: 'off_arc_snapshot_v2',
      priceMicroUsdc: parseUsdcAmount('0.10'),
      providerBusinessId: provider.businessId,
      status: 'ACTIVE',
      termsVersion: 2,
    };
    const intent: AgentPurchaseIntent = {
      actionType: 'PURCHASE_SERVICE',
      amountMicroUsdc: offer.priceMicroUsdc,
      asset: 'USDC',
      authorityDomainBusinessId: buyer.businessId,
      counterpartyBusinessId: provider.businessId,
      environment: config.environment,
      grantId,
      intentId,
      offerId: offer.offerId,
      purpose: 'Refresh the Ops Pilot Arc network operating snapshot.',
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
      idempotencyKey: '2095d425-8a8c-4e96-9e55-2df76edab5db',
      obligation,
      settlementId,
    });
    const expiresAt = new Date(Date.parse(requestedAt) + 15 * 60 * 1000).toISOString();

    const result = await persistence.transaction(async (transaction) => {
      const authority = await authorities.authorizePurchaseInTransaction(transaction, {
        evaluatedAt: requestedAt,
        executionAuthorizationExpiresAt: expiresAt,
        identifiers: { authorizationId, decisionId },
        intent,
        policyVersion: 1,
      });
      const prepared = await commerce.prepareCommerce({ obligation, offer, settlement }, transaction);
      await authorities.consumeAuthorizationInTransaction(transaction, {
        authorizationId: authority.authorizationId,
        consumedAt: requestedAt,
        obligationId,
      });
      return { authorityCreated: authority.created, commerceCreated: prepared.created };
    });

    console.log(
      `agent=${agentPrincipalId} intent=${intentId} authority=${
        result.authorityCreated ? 'ISSUED_AND_CONSUMED' : 'ALREADY_CONSUMED'
      } obligation=${obligationId} state=${result.commerceCreated ? 'AUTHORIZED' : 'ALREADY_EXISTS'}`,
    );
  } finally {
    await persistence.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Agent-triggered Alpha purchase failed.');
  process.exitCode = 1;
});
