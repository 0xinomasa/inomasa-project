import 'server-only';

import { cache } from 'react';

import { readDatabaseConnectionConfig } from '../../platform/persistence/config.ts';
import { PostgresOperationalWorkspaceRepository } from '../../platform/persistence/operational-workspace-repository.ts';
import { PostgresPersistence } from '../../platform/persistence/database.ts';

export type OperationalWorkspaceLoadState =
  | 'CONNECTED'
  | 'NOT_CONFIGURED'
  | 'PERMISSION_DENIED'
  | 'UNAVAILABLE';

export interface OperationalWorkspaceView {
  readonly offers: readonly {
    readonly capabilityId: string;
    readonly commerceProtocol: string;
    readonly createdByProduct: boolean;
    readonly description: string;
    readonly offerId: string;
    readonly priceMicroUsdc: string;
    readonly status: string;
    readonly termsVersion: number;
  }[];
  readonly providerConfigured: boolean;
  readonly state: OperationalWorkspaceLoadState;
  readonly treasury: null | {
    readonly accountAssurance: string;
    readonly accountType: string;
    readonly address: string | null;
    readonly bindingId: string;
    readonly blockchain: string;
    readonly custodyModel: string;
    readonly provider: string;
    readonly status: string;
  };
}

export const loadOperationalWorkspace = cache(async (
  slug: string,
  controllerPrincipalId: `usr_${string}`,
): Promise<OperationalWorkspaceView> => {
  const providerConfigured = Boolean(
    process.env['CIRCLE_API_KEY']?.trim() &&
    process.env['CIRCLE_ENTITY_SECRET']?.trim() &&
    process.env['CIRCLE_WALLET_SET_ID']?.trim(),
  );
  if (!process.env['INOMASA_ENV']?.trim() || !process.env['DATABASE_URL']?.trim()) {
    return { offers: [], providerConfigured, state: 'NOT_CONFIGURED', treasury: null };
  }
  let persistence: PostgresPersistence | undefined;
  try {
    persistence = new PostgresPersistence(readDatabaseConnectionConfig('runtime'));
    const repository = new PostgresOperationalWorkspaceRepository(persistence);
    const [offers, treasury] = await Promise.all([
      repository.listOffers({ controllerPrincipalId, slug }),
      repository.getTreasury({ controllerPrincipalId, slug }),
    ]);
    if (offers === undefined) {
      return { offers: [], providerConfigured, state: 'PERMISSION_DENIED', treasury: null };
    }
    return {
      offers,
      providerConfigured,
      state: 'CONNECTED',
      treasury: treasury === undefined ? null : {
        accountAssurance: treasury.accountAssurance,
        accountType: treasury.accountType,
        address: treasury.address,
        bindingId: treasury.bindingId,
        blockchain: treasury.blockchain,
        custodyModel: treasury.custodyModel,
        provider: treasury.provider,
        status: treasury.status,
      },
    };
  } catch {
    return { offers: [], providerConfigured, state: 'UNAVAILABLE', treasury: null };
  } finally {
    await persistence?.close();
  }
});
