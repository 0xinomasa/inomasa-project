import { acceptServiceOffer, authorizeSettlement, type ServiceOffer } from '../src/modules/commerce/model.ts';
import { parseUsdcAmount } from '../src/modules/commerce/money.ts';
import { readDatabaseConnectionConfig } from '../src/platform/persistence/config.ts';
import { PostgresAlphaBusinessRepository } from '../src/platform/persistence/alpha-business-repository.ts';
import { PostgresAlphaCommerceRepository } from '../src/platform/persistence/alpha-commerce-repository.ts';
import { PostgresCapitalRepository } from '../src/platform/persistence/capital-repository.ts';
import { PostgresPersistence } from '../src/platform/persistence/database.ts';

async function main(): Promise<void> {
  const config = readDatabaseConnectionConfig('runtime');
  if (config.environment !== 'PRIVATE_ARC_TESTNET') {
    throw new Error('Checkpoint F Capital use is restricted to PRIVATE_ARC_TESTNET.');
  }
  const persistence = new PostgresPersistence(config);
  try {
    const businesses = new PostgresAlphaBusinessRepository(persistence);
    const commerce = new PostgresAlphaCommerceRepository(persistence);
    const capital = new PostgresCapitalRepository(persistence);
    const allocation = await capital.getAllocationExecutionContext('cal_ops_pilot_northstar_v1');
    if (allocation.state !== 'COMPLETE') {
      throw new Error('Capital use cannot be created before the allocation is chain complete.');
    }
    const [buyer, provider] = await Promise.all([
      businesses.getBusiness('biz_ops_pilot'),
      businesses.getBusiness('biz_signal_forge'),
    ]);
    const offer: ServiceOffer = {
      capabilityId: 'capital-funded-arc-snapshot',
      description: 'A later bounded operating service procured from an accepted Capital allocation.',
      offerId: 'off_capital_funded_snapshot_v1',
      priceMicroUsdc: parseUsdcAmount('0.10'),
      providerBusinessId: provider.businessId,
      status: 'ACTIVE',
      termsVersion: 1,
    };
    const obligation = acceptServiceOffer({
      buyer,
      offer,
      obligationId: 'obl_capital_funded_snapshot_v1',
      provider,
    });
    const settlement = authorizeSettlement({
      idempotencyKey: 'd4338016-d480-4812-99dc-90c161a62ef3',
      obligation,
      settlementId: 'set_capital_funded_snapshot_v1',
    });
    await commerce.prepareCommerce({ obligation, offer, settlement });
    await capital.linkCapitalUse({
      allocationId: allocation.allocationId,
      amountMicroUsdc: offer.priceMicroUsdc,
      capitalUseId: 'cpu_ops_pilot_northstar_v1',
      linkedAt: new Date().toISOString(),
      linkedByPrincipalId: 'usr_alpha_operator',
      obligationId: obligation.obligationId,
    });
    console.log(
      `capital_use=cpu_ops_pilot_northstar_v1 amount_micro_usdc=${offer.priceMicroUsdc} obligation=${obligation.obligationId} settlement=${settlement.settlementId}`,
    );
  } finally {
    await persistence.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Checkpoint F Capital use failed.');
  process.exitCode = 1;
});
