import { createHash } from 'node:crypto';

import { ArcTestnetRpc } from '../src/platform/arc/rpc.ts';
import { readDatabaseConnectionConfig } from '../src/platform/persistence/config.ts';
import { PostgresPersistence } from '../src/platform/persistence/database.ts';
import { PostgresAlphaServiceRepository } from '../src/platform/persistence/alpha-service-repository.ts';

const executionArgument = process.argv[2] ?? 'svc_arc_snapshot_v1';
const obligationArgument = process.argv[3] ?? 'obl_arc_snapshot_v1';
if (!executionArgument.startsWith('svc_')) throw new Error('Execution ID must start with svc_.');
if (!obligationArgument.startsWith('obl_')) throw new Error('Obligation ID must start with obl_.');
const executionId = executionArgument as `svc_${string}`;
const obligationId = obligationArgument as `obl_${string}`;

function digestSnapshot(snapshot: {
  readonly blockNumber: bigint;
  readonly chainId: number;
  readonly gasPriceWei: bigint;
  readonly observedAt: string;
  readonly usdcCodeSha256: string;
}): string {
  const canonicalOutput = JSON.stringify({
    blockNumber: snapshot.blockNumber.toString(),
    chainId: snapshot.chainId,
    gasPriceWei: snapshot.gasPriceWei.toString(),
    observedAt: snapshot.observedAt,
    usdcCodeSha256: snapshot.usdcCodeSha256,
  });
  return createHash('sha256').update(canonicalOutput).digest('hex');
}

async function main(): Promise<void> {
  const config = readDatabaseConnectionConfig('runtime');
  if (config.environment !== 'PRIVATE_ARC_TESTNET') {
    throw new Error('Paid Alpha service execution is restricted to PRIVATE_ARC_TESTNET.');
  }

  const persistence = new PostgresPersistence(config);
  const services = new PostgresAlphaServiceRepository(persistence);

  try {
    const authorization = await services.getExecutionAuthorization(executionId, obligationId);
    if (authorization.alreadyComplete) {
      console.log(`execution=${executionId} state=ALREADY_COMPLETE`);
      return;
    }

    const snapshot = await new ArcTestnetRpc().readNetworkSnapshot(new Date().toISOString());
    const result = await services.recordCompletedSnapshot({
      authorization,
      executionId,
      obligationId,
      outputSha256: digestSnapshot(snapshot),
      snapshot,
    });
    console.log(
      `execution=${executionId} state=${result.created ? 'COMPLETE' : 'ALREADY_COMPLETE'} source=arc-block:${snapshot.blockNumber}`,
    );
  } finally {
    await persistence.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Alpha service execution failed.');
  process.exitCode = 1;
});
