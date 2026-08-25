import type { InomasaEnvironment } from '../../shared/environment.ts';

import type { BusinessInstance } from './model.ts';

export type TreasuryBindingStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED';

export interface TreasuryBinding {
  readonly accountAssurance: 'PLATFORM_CONTROLLED_EXTERNAL';
  readonly accountType: 'EOA';
  readonly address?: `0x${string}`;
  readonly bindingId: `tbn_${string}`;
  readonly bindingVersion: number;
  readonly blockchain: 'ARC-TESTNET';
  readonly businessId: BusinessInstance['businessId'];
  readonly custodyModel: 'DEVELOPER_CONTROLLED';
  readonly environment: InomasaEnvironment;
  readonly provider: 'CIRCLE';
  readonly providerWalletId?: string;
  readonly status: TreasuryBindingStatus;
}

export function createPendingCircleTreasuryBinding(input: {
  readonly bindingId: `tbn_${string}`;
  readonly business: BusinessInstance;
}): TreasuryBinding {
  return {
    accountAssurance: 'PLATFORM_CONTROLLED_EXTERNAL',
    accountType: 'EOA',
    bindingId: input.bindingId,
    bindingVersion: 1,
    blockchain: 'ARC-TESTNET',
    businessId: input.business.businessId,
    custodyModel: 'DEVELOPER_CONTROLLED',
    environment: input.business.environment,
    provider: 'CIRCLE',
    status: 'PENDING',
  };
}

export function activateCircleTreasuryBinding(
  binding: TreasuryBinding,
  activeBindingId: `tbn_${string}`,
  providerWalletId: string,
  address: string,
): TreasuryBinding {
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
    throw new Error('Circle wallet address must be a 20-byte EVM address.');
  }

  if (providerWalletId.trim().length === 0) {
    throw new Error('Circle wallet ID must not be empty.');
  }

  return {
    ...binding,
    bindingId: activeBindingId,
    address: address as `0x${string}`,
    bindingVersion: binding.bindingVersion + 1,
    providerWalletId,
    status: 'ACTIVE',
  };
}
