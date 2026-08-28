import { acceptServiceOffer, authorizeSettlement, type ServiceOffer } from '../src/modules/commerce/model.ts';
import { parseUsdcAmount } from '../src/modules/commerce/money.ts';
import { sql } from 'kysely';
import { readDatabaseConnectionConfig } from '../src/platform/persistence/config.ts';
import { PostgresAlphaBusinessRepository } from '../src/platform/persistence/alpha-business-repository.ts';
import { PostgresAlphaCommerceRepository } from '../src/platform/persistence/alpha-commerce-repository.ts';
import { PostgresCapitalRepository } from '../src/platform/persistence/capital-repository.ts';
import { PostgresPersistence } from '../src/platform/persistence/database.ts';
import { alphaServiceCatalog } from '../src/modules/commerce/service-catalog.ts';

async function main(): Promise<void> {
  const referenceEconomy = process.argv.includes('--reference-economy');
  const config = readDatabaseConnectionConfig('runtime');
  if (config.environment !== 'PRIVATE_ARC_TESTNET') {
    throw new Error('Checkpoint F Capital use is restricted to PRIVATE_ARC_TESTNET.');
  }
  const persistence = new PostgresPersistence(config);
  try {
    const businesses = new PostgresAlphaBusinessRepository(persistence);
    const commerce = new PostgresAlphaCommerceRepository(persistence);
    const capital = new PostgresCapitalRepository(persistence);
    const allocation = await capital.getAllocationExecutionContext(
      referenceEconomy ? 'cal_reference_workbench_seed_v1' : 'cal_ops_pilot_northstar_v1',
    );
    if (allocation.state !== 'COMPLETE') {
      throw new Error('Capital use cannot be created before the allocation is chain complete.');
    }
    const [buyer, provider] = await Promise.all([
      businesses.getBusiness(referenceEconomy ? 'biz_reference_workbench' : 'biz_ops_pilot'),
      businesses.getBusiness(referenceEconomy ? 'biz_reference_signal' : 'biz_signal_forge'),
    ]);
    const offer: ServiceOffer = referenceEconomy ? alphaServiceCatalog.referenceCapitalUse.offer : {
      capabilityId: 'capital-funded-arc-snapshot',
      description: 'A later bounded operating service procured from an accepted Capital allocation.',
      offerId: 'off_capital_funded_snapshot_v1',
      priceMicroUsdc: parseUsdcAmount('0.10'),
      providerBusinessId: provider.businessId,
      status: 'ACTIVE',
      termsVersion: 1,
    };
    const obligationId = referenceEconomy
      ? ('obl_reference_capital_use_v1' as const)
      : ('obl_capital_funded_snapshot_v1' as const);
    const settlementId = referenceEconomy
      ? ('set_reference_capital_use_v1' as const)
      : ('set_capital_funded_snapshot_v1' as const);
    const obligation = acceptServiceOffer({
      buyer,
      offer,
      obligationId,
      provider,
    });
    const settlement = authorizeSettlement({
      idempotencyKey: referenceEconomy
        ? 'c6105820-485d-4682-a7aa-001bbb85c52b'
        : 'd4338016-d480-4812-99dc-90c161a62ef3',
      obligation,
      settlementId,
    });
    await commerce.prepareCommerce({ obligation, offer, settlement });
    const databaseNow = await persistence.databaseForApplication
      .selectNoFrom(sql<Date>`current_timestamp`.as('value'))
      .executeTakeFirstOrThrow();
    await capital.linkCapitalUse({
      allocationId: allocation.allocationId,
      amountMicroUsdc: offer.priceMicroUsdc,
      capitalUseId: referenceEconomy
        ? 'cpu_reference_workbench_seed_v1'
        : 'cpu_ops_pilot_northstar_v1',
      linkedAt: databaseNow.value.toISOString(),
      linkedByPrincipalId: referenceEconomy ? 'usr_reference_workbench' : 'usr_alpha_operator',
      obligationId: obligation.obligationId,
    });
    console.log(
      `capital_use=${referenceEconomy ? 'cpu_reference_workbench_seed_v1' : 'cpu_ops_pilot_northstar_v1'} amount_micro_usdc=${offer.priceMicroUsdc} obligation=${obligation.obligationId} settlement=${settlement.settlementId}`,
    );
  } finally {
    await persistence.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Checkpoint F Capital use failed.');
  process.exitCode = 1;
});
