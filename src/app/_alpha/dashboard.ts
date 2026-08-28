import {
  alphaFixtureProfiles,
  businessTemplates,
} from '../../modules/business/templates.ts';
import { arcTestnet } from '../../platform/arc/config.ts';
import { readDatabaseConnectionConfig } from '../../platform/persistence/config.ts';
import { PostgresAgentAuthorityRepository } from '../../platform/persistence/agent-authority-repository.ts';
import { PostgresAlphaBusinessRepository } from '../../platform/persistence/alpha-business-repository.ts';
import { PostgresAlphaCommerceRepository } from '../../platform/persistence/alpha-commerce-repository.ts';
import { PostgresPersistence } from '../../platform/persistence/database.ts';
import { PostgresGatewayX402Repository } from '../../platform/persistence/gateway-x402-repository.ts';
import { PostgresAlphaServiceRepository } from '../../platform/persistence/alpha-service-repository.ts';

export interface AlphaDashboard {
  readonly agentAuthorities: readonly {
    readonly agentPrincipalId: string;
    readonly allowanceConsumedMicroUsdc: string;
    readonly allowanceTotalMicroUsdc: string;
    readonly allowedCounterpartyBusinessId: string;
    readonly allowedOfferId: string;
    readonly expiresAt: Date;
    readonly grantId: string;
    readonly grantStatus: string;
    readonly providerOfRecordPrincipalId: string;
    readonly runtimeClass: string;
  }[];
  readonly businesses: readonly {
    readonly actorClassification: string;
    readonly address: string | null;
    readonly businessId: string;
    readonly controllerPrincipalId: string;
    readonly displayName: string;
    readonly entryRoute: string;
    readonly siteStatus: string;
    readonly slug: string;
    readonly summary: string;
    readonly templateId: string;
    readonly templateVersion: number;
    readonly treasuryStatus: string;
  }[];
  readonly commerce: readonly {
    readonly amountMicroUsdc: string;
    readonly buyerBusinessId: string;
    readonly obligationId: string;
    readonly provenance: string;
    readonly provider: string | null;
    readonly providerTransactionId: string | null;
    readonly sellerBusinessId: string;
    readonly settlementId: string | null;
    readonly settlementState: string | null;
    readonly transactionHash: string | null;
  }[];
  readonly gatewayFunding: readonly {
    readonly amountMicroUsdc: string;
    readonly businessId: string;
    readonly fundingId: string;
    readonly state: string;
  }[];
  readonly economicEntries: readonly {
    readonly amountMicroUsdc: string;
    readonly businessId: string;
    readonly capitalAllocationId: string | null;
    readonly category: string;
    readonly direction: string;
    readonly provenance: string;
    readonly settlementId: string | null;
  }[];
  readonly evidence: readonly {
    readonly coverage: string;
    readonly environment: string;
    readonly evidenceId: string;
    readonly factType: string;
    readonly observedAt: Date;
    readonly provenance: string;
    readonly sourceReference: string;
    readonly sourceType: string;
    readonly verification: string;
  }[];
  readonly circle: {
    readonly accountType: 'EOA';
    readonly custody: 'PLATFORM_CONTROLLED';
    readonly integration: 'CONFIGURED' | 'NOT_CONFIGURED';
    readonly provider: 'CIRCLE_DEVELOPER_WALLETS';
  };
  readonly network: typeof arcTestnet;
  readonly persistence: 'CONNECTED' | 'NOT_CONFIGURED' | 'UNAVAILABLE';
  readonly serviceDeliveries: readonly {
    readonly capabilityId: string;
    readonly completedAt: Date;
    readonly consumerBusinessId: string;
    readonly executionId: string;
    readonly obligationId: string;
    readonly output: unknown;
    readonly outputSha256: string;
    readonly provenance: string;
    readonly providerBusinessId: string;
    readonly sourceReference: string;
    readonly state: string;
  }[];
  readonly fixtureProfiles: typeof alphaFixtureProfiles;
  readonly templates: typeof businessTemplates;
  readonly x402Payments: readonly {
    readonly amountMicroUsdc: string;
    readonly network: string;
    readonly paymentId: string;
    readonly providerState: string | null;
    readonly providerTransactionId: string | null;
    readonly scheme: string;
    readonly state: string;
  }[];
}

function hasRuntimeDatabaseConfiguration(): boolean {
  return Boolean(process.env['INOMASA_ENV']?.trim() && process.env['DATABASE_URL']?.trim());
}

function hasCircleConfiguration(): boolean {
  return Boolean(
    process.env['CIRCLE_API_KEY']?.trim() &&
      process.env['CIRCLE_ENTITY_SECRET']?.trim() &&
      process.env['CIRCLE_WALLET_SET_ID']?.trim(),
  );
}

export async function loadAlphaDashboard(): Promise<AlphaDashboard> {
  const base = {
    circle: {
      accountType: 'EOA',
      custody: 'PLATFORM_CONTROLLED',
      integration: hasCircleConfiguration() ? 'CONFIGURED' : 'NOT_CONFIGURED',
      provider: 'CIRCLE_DEVELOPER_WALLETS',
    },
    network: arcTestnet,
    fixtureProfiles: alphaFixtureProfiles,
    templates: businessTemplates,
  } as const;

  if (!hasRuntimeDatabaseConfiguration()) {
    return {
      ...base,
      agentAuthorities: [],
      businesses: [],
      commerce: [],
      economicEntries: [],
      evidence: [],
      gatewayFunding: [],
      persistence: 'NOT_CONFIGURED',
      serviceDeliveries: [],
      x402Payments: [],
    };
  }

  let persistence: PostgresPersistence | undefined;
  try {
    persistence = new PostgresPersistence(readDatabaseConnectionConfig('runtime'));
    const businessRepository = new PostgresAlphaBusinessRepository(persistence);
    const authorityRepository = new PostgresAgentAuthorityRepository(persistence);
    const commerceRepository = new PostgresAlphaCommerceRepository(persistence);
    const serviceRepository = new PostgresAlphaServiceRepository(persistence);
    const gatewayRepository = new PostgresGatewayX402Repository(persistence);
    const [
      agentAuthorities,
      businesses,
      commerce,
      economicEntries,
      evidence,
      gatewayFunding,
      serviceDeliveries,
      x402Payments,
    ] = await Promise.all([
      authorityRepository.listAgentAuthorities(),
      businessRepository.listBusinesses(),
      commerceRepository.listCommerce(),
      commerceRepository.listEconomicEntries(),
      commerceRepository.listEvidenceFacts(),
      gatewayRepository.listFunding(),
      serviceRepository.listServiceDeliveries(),
      gatewayRepository.listPayments(),
    ]);
    return {
      ...base,
      agentAuthorities,
      businesses,
      commerce,
      economicEntries,
      evidence,
      gatewayFunding,
      persistence: 'CONNECTED',
      serviceDeliveries,
      x402Payments,
    };
  } catch {
    return {
      ...base,
      agentAuthorities: [],
      businesses: [],
      commerce: [],
      economicEntries: [],
      evidence: [],
      gatewayFunding: [],
      persistence: 'UNAVAILABLE',
      serviceDeliveries: [],
      x402Payments: [],
    };
  } finally {
    await persistence?.close();
  }
}
