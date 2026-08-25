import {
  createBusinessGenesis,
  type HumanPrincipal,
} from '../src/modules/business/model.ts';
import { createPendingCircleTreasuryBinding } from '../src/modules/business/treasury.ts';
import { readDatabaseConnectionConfig } from '../src/platform/persistence/config.ts';
import { PostgresAlphaBusinessRepository } from '../src/platform/persistence/alpha-business-repository.ts';
import { PostgresPersistence } from '../src/platform/persistence/database.ts';

const genesisInputs = [
  {
    bindingId: 'tbn_signal_forge_1' as const,
    businessId: 'biz_signal_forge' as const,
    controlId: 'ctl_signal_forge_1' as const,
    eventId: 'evt_signal_forge_genesis' as const,
    genesisRequestId: 'alpha-genesis-signal-forge-v1',
    templateId: 'signal-forge' as const,
  },
  {
    bindingId: 'tbn_ops_pilot_1' as const,
    businessId: 'biz_ops_pilot' as const,
    controlId: 'ctl_ops_pilot_1' as const,
    eventId: 'evt_ops_pilot_genesis' as const,
    genesisRequestId: 'alpha-genesis-ops-pilot-v1',
    templateId: 'ops-pilot' as const,
  },
] as const;

async function main(): Promise<void> {
  const config = readDatabaseConnectionConfig('runtime');
  if (config.environment !== 'LOCAL_DEVELOPMENT' && config.environment !== 'PRIVATE_ARC_TESTNET') {
    throw new Error(
      'Alpha bootstrap is restricted to LOCAL_DEVELOPMENT or PRIVATE_ARC_TESTNET.',
    );
  }

  const alphaOperator: HumanPrincipal = {
    actorClassification: 'COMMON_CONTROL_TEST',
    displayName: 'Inomasa Alpha Operator',
    environment: config.environment,
    principalId: 'usr_alpha_operator',
  };

  const persistence = new PostgresPersistence(config);
  const repository = new PostgresAlphaBusinessRepository(persistence);

  try {
    for (const input of genesisInputs) {
      const occurredAt = new Date().toISOString();
      const genesis = createBusinessGenesis(
        {
          commonControlGroupId: 'ccg_alpha_operator',
          controller: alphaOperator,
          genesisRequestId: input.genesisRequestId,
          templateId: input.templateId,
        },
        {
          businessId: input.businessId,
          controlId: input.controlId,
          eventId: input.eventId,
        },
        occurredAt,
      );
      const result = await repository.registerGenesis({
        controller: alphaOperator,
        genesis,
        treasuryBinding: createPendingCircleTreasuryBinding({
          bindingId: input.bindingId,
          business: genesis.business,
        }),
      });

      console.log(
        `business=${result.businessId} genesis=${result.created ? 'CREATED' : 'ALREADY_EXISTS'} treasury=PENDING`,
      );
    }
  } finally {
    await persistence.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Alpha bootstrap failed.');
  process.exitCode = 1;
});
