import { alphaBusinessTemplates } from '../../modules/business/templates.ts';
import { arcTestnet } from '../../platform/arc/config.ts';
import { readDatabaseConnectionConfig } from '../../platform/persistence/config.ts';
import { PostgresAlphaBusinessRepository } from '../../platform/persistence/alpha-business-repository.ts';
import { PostgresAlphaCommerceRepository } from '../../platform/persistence/alpha-commerce-repository.ts';
import { PostgresPersistence } from '../../platform/persistence/database.ts';
import { PostgresAlphaServiceRepository } from '../../platform/persistence/alpha-service-repository.ts';

export interface AlphaDashboard {
  readonly businesses: readonly {
    readonly actorClassification: string;
    readonly address: string | null;
    readonly businessId: string;
    readonly controllerPrincipalId: string;
    readonly displayName: string;
    readonly templateId: string;
    readonly templateVersion: number;
    readonly treasuryStatus: string;
  }[];
  readonly commerce: readonly {
    readonly amountMicroUsdc: string;
    readonly buyerBusinessId: string;
    readonly obligationId: string;
    readonly provenance: string;
    readonly sellerBusinessId: string;
    readonly settlementId: string | null;
    readonly settlementState: string | null;
    readonly transactionHash: string | null;
  }[];
  readonly economicEntries: readonly {
    readonly amountMicroUsdc: string;
    readonly businessId: string;
    readonly category: string;
    readonly direction: string;
    readonly provenance: string;
    readonly settlementId: string;
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
    readonly outputSha256: string;
    readonly providerBusinessId: string;
    readonly sourceReference: string;
    readonly state: string;
  }[];
  readonly templates: typeof alphaBusinessTemplates;
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
    templates: alphaBusinessTemplates,
  } as const;

  if (!hasRuntimeDatabaseConfiguration()) {
    return {
      ...base,
      businesses: [],
      commerce: [],
      economicEntries: [],
      evidence: [],
      persistence: 'NOT_CONFIGURED',
      serviceDeliveries: [],
    };
  }

  let persistence: PostgresPersistence | undefined;
  try {
    persistence = new PostgresPersistence(readDatabaseConnectionConfig('runtime'));
    const businessRepository = new PostgresAlphaBusinessRepository(persistence);
    const commerceRepository = new PostgresAlphaCommerceRepository(persistence);
    const serviceRepository = new PostgresAlphaServiceRepository(persistence);
    const [businesses, commerce, economicEntries, evidence, serviceDeliveries] = await Promise.all([
      businessRepository.listBusinesses(),
      commerceRepository.listCommerce(),
      commerceRepository.listEconomicEntries(),
      commerceRepository.listEvidenceFacts(),
      serviceRepository.listServiceDeliveries(),
    ]);
    return {
      ...base,
      businesses,
      commerce,
      economicEntries,
      evidence,
      persistence: 'CONNECTED',
      serviceDeliveries,
    };
  } catch {
    return {
      ...base,
      businesses: [],
      commerce: [],
      economicEntries: [],
      evidence: [],
      persistence: 'UNAVAILABLE',
      serviceDeliveries: [],
    };
  } finally {
    await persistence?.close();
  }
}
