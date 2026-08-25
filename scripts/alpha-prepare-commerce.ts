import {
  acceptServiceOffer,
  authorizeSettlement,
  type ServiceOffer,
} from '../src/modules/commerce/model.ts';
import { parseUsdcAmount } from '../src/modules/commerce/money.ts';
import { readDatabaseConnectionConfig } from '../src/platform/persistence/config.ts';
import { PostgresAlphaBusinessRepository } from '../src/platform/persistence/alpha-business-repository.ts';
import { PostgresAlphaCommerceRepository } from '../src/platform/persistence/alpha-commerce-repository.ts';
import { PostgresPersistence } from '../src/platform/persistence/database.ts';

async function main(): Promise<void> {
  const config = readDatabaseConnectionConfig('runtime');
  if (config.environment !== 'LOCAL_DEVELOPMENT' && config.environment !== 'PRIVATE_ARC_TESTNET') {
    throw new Error(
      'Alpha commerce preparation is restricted to LOCAL_DEVELOPMENT or PRIVATE_ARC_TESTNET.',
    );
  }

  const persistence = new PostgresPersistence(config);
  const businesses = new PostgresAlphaBusinessRepository(persistence);
  const commerce = new PostgresAlphaCommerceRepository(persistence);

  try {
    const provider = await businesses.getBusiness('biz_signal_forge');
    const buyer = await businesses.getBusiness('biz_ops_pilot');
    const offer: ServiceOffer = {
      capabilityId: 'arc-market-snapshot',
      description: 'Deterministic Arc Testnet market and network snapshot.',
      offerId: 'off_arc_snapshot_v1',
      priceMicroUsdc: parseUsdcAmount('0.25'),
      providerBusinessId: provider.businessId,
      status: 'ACTIVE',
      termsVersion: 1,
    };
    const obligation = acceptServiceOffer({
      buyer,
      offer,
      obligationId: 'obl_arc_snapshot_v1',
      provider,
    });
    const settlement = authorizeSettlement({
      idempotencyKey: '38c1faaf-b4d1-407b-8d63-153500517371',
      obligation,
      settlementId: 'set_arc_snapshot_v1',
    });
    const result = await commerce.prepareCommerce({ obligation, offer, settlement });

    console.log(
      `obligation=${obligation.obligationId} state=${result.created ? 'AUTHORIZED' : 'ALREADY_EXISTS'} provenance=${obligation.provenance}`,
    );
  } finally {
    await persistence.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Alpha commerce preparation failed.');
  process.exitCode = 1;
});
