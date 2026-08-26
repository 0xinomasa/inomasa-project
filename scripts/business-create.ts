import { randomUUID } from 'node:crypto';

import {
  createBusinessGenesis,
  type HumanPrincipal,
  normalizeBusinessSlug,
} from '../src/modules/business/model.ts';
import { isBusinessTemplateId } from '../src/modules/business/templates.ts';
import { createPendingCircleTreasuryBinding } from '../src/modules/business/treasury.ts';
import { readDatabaseConnectionConfig } from '../src/platform/persistence/config.ts';
import { PostgresAlphaBusinessRepository } from '../src/platform/persistence/alpha-business-repository.ts';
import { PostgresPersistence } from '../src/platform/persistence/database.ts';

interface CreateBusinessArguments {
  readonly controllerDisplayName: string;
  readonly controllerId: `usr_${string}`;
  readonly displayName: string;
  readonly slug: string;
  readonly summary?: string;
  readonly templateId: string;
}

function option(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

function requiredOption(name: string): string {
  const value = option(name)?.trim();
  if (!value) {
    throw new Error(`Missing required --${name} option.`);
  }
  return value;
}

function readArguments(): CreateBusinessArguments {
  const controllerId = requiredOption('controller-id');
  if (!/^usr_[a-zA-Z0-9_-]+$/.test(controllerId)) {
    throw new Error('--controller-id must use the usr_ namespace.');
  }

  return {
    controllerDisplayName: requiredOption('controller-name'),
    controllerId: controllerId as `usr_${string}`,
    displayName: requiredOption('name'),
    slug: requiredOption('slug'),
    ...(option('summary') === undefined ? {} : { summary: requiredOption('summary') }),
    templateId: requiredOption('template'),
  };
}

async function main(): Promise<void> {
  const input = readArguments();
  if (!isBusinessTemplateId(input.templateId)) {
    throw new Error(
      'Unknown --template. Use api-data-compute, saas-micro-saas, agent-as-a-service, or web3-native-digital.',
    );
  }

  const config = readDatabaseConnectionConfig('runtime');
  if (config.environment !== 'LOCAL_DEVELOPMENT' && config.environment !== 'PRIVATE_ARC_TESTNET') {
    throw new Error(
      'Controlled Business creation is restricted to LOCAL_DEVELOPMENT or PRIVATE_ARC_TESTNET.',
    );
  }

  const controller: HumanPrincipal = {
    actorClassification: 'COMMON_CONTROL_TEST',
    displayName: input.controllerDisplayName,
    environment: config.environment,
    principalId: input.controllerId,
  };
  const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
  const normalizedSlug = normalizeBusinessSlug(input.slug);
  const safeSlugId = normalizedSlug.replaceAll('-', '_').slice(0, 40);
  const businessId = `biz_${safeSlugId}_${suffix}` as const;
  const occurredAt = new Date().toISOString();
  const genesis = createBusinessGenesis(
    {
      commonControlGroupId: 'ccg_controlled_alpha',
      controller,
      displayName: input.displayName,
      genesisRequestId: `genesis-${safeSlugId}-${suffix}`,
      slug: normalizedSlug,
      ...(input.summary === undefined ? {} : { summary: input.summary }),
      templateId: input.templateId,
    },
    {
      businessId,
      controlId: `ctl_${safeSlugId}_${suffix}`,
      eventId: `evt_${safeSlugId}_${suffix}`,
    },
    occurredAt,
  );
  const persistence = new PostgresPersistence(config);

  try {
    const result = await new PostgresAlphaBusinessRepository(persistence).registerGenesis({
      controller,
      genesis,
      treasuryBinding: createPendingCircleTreasuryBinding({
        bindingId: `tbn_${safeSlugId}_${suffix}`,
        business: genesis.business,
      }),
    });
    console.log(
      `business=${result.businessId} genesis=${result.created ? 'CREATED' : 'ALREADY_EXISTS'} site=/business/${genesis.business.slug} treasury=PENDING provenance=COMMON_CONTROL_TEST`,
    );
  } finally {
    await persistence.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Business creation failed.');
  process.exitCode = 1;
});
