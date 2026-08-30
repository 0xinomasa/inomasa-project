import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';

import type {
  ContractExecutionOutcome,
  ContractExecutionPort,
  EvmAddress,
} from '../../modules/agent/erc8004.ts';
import { arcTestnet } from '../arc/config.ts';
import { withExternalOperationTimeout } from '../provider-timeout.ts';
import type { CircleDeveloperWalletConfig } from './config.ts';

const terminalFailureStates = new Set(['CANCELLED', 'DENIED', 'FAILED', 'STUCK']);

type CircleWalletsClient = ReturnType<typeof initiateDeveloperControlledWalletsClient>;
type CircleContractExecutionInput = Parameters<
  CircleWalletsClient['createContractExecutionTransaction']
>[0];

export function buildCircleContractExecutionInput(input: {
  readonly abiFunctionSignature: string;
  readonly abiParameters: readonly string[];
  readonly contractAddress: EvmAddress;
  readonly idempotencyKey: string;
  readonly referenceId: string;
  readonly sourceAddress: EvmAddress;
}): CircleContractExecutionInput {
  return {
    abiFunctionSignature: input.abiFunctionSignature,
    abiParameters: [...input.abiParameters],
    blockchain: arcTestnet.circleBlockchain,
    contractAddress: input.contractAddress,
    fee: { config: { feeLevel: 'MEDIUM' }, type: 'level' },
    idempotencyKey: input.idempotencyKey,
    refId: input.referenceId,
    walletAddress: input.sourceAddress,
  };
}
function transactionHash(value: string): `0x${string}` {
  if (!/^0x[0-9a-fA-F]{64}$/.test(value)) {
    throw new Error('Circle returned an invalid Arc transaction hash.');
  }
  return value as `0x${string}`;
}

export class CircleContractExecutionAdapter implements ContractExecutionPort {
  readonly #client: CircleWalletsClient;

  constructor(config: CircleDeveloperWalletConfig) {
    this.#client = initiateDeveloperControlledWalletsClient({
      apiKey: config.apiKey,
      entitySecret: config.entitySecret,
    });
  }

  async submit(
    input: Parameters<ContractExecutionPort['submit']>[0],
  ): Promise<{ readonly providerTransactionId: string }> {
    const response = await withExternalOperationTimeout(
      this.#client.createContractExecutionTransaction(buildCircleContractExecutionInput(input)),
      'Circle contract submission',
    );
    const providerTransactionId = response.data?.id;
    if (providerTransactionId === undefined || providerTransactionId.length === 0) {
      throw new Error('Circle contract execution returned no transaction ID.');
    }
    return { providerTransactionId };
  }

  async observe(providerTransactionId: string): Promise<ContractExecutionOutcome> {
    const response = await withExternalOperationTimeout(
      this.#client.getTransaction({ id: providerTransactionId }),
      'Circle transaction observation',
    );
    const transaction = response.data?.transaction;
    if (transaction === undefined) {
      return { providerState: 'EMPTY_RESPONSE', state: 'OUTCOME_UNKNOWN' };
    }
    if (transaction.state === 'COMPLETE') {
      if (transaction.txHash === undefined) {
        return { providerState: transaction.state, state: 'OUTCOME_UNKNOWN' };
      }
      return {
        providerState: transaction.state,
        state: 'COMPLETE',
        transactionHash: transactionHash(transaction.txHash),
      };
    }
    if (terminalFailureStates.has(transaction.state)) {
      return { providerState: transaction.state, state: 'FAILED' };
    }
    return { providerState: transaction.state, state: 'PENDING' };
  }
}
