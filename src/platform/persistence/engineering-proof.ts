import { randomUUID } from 'node:crypto';

import type { PostgresPersistence } from './database.ts';
import { engineeringProbeTable, engineeringSchema } from './database.ts';

const rollbackSignal = Symbol('B3_ROLLBACK_PROOF');

export interface EngineeringPersistenceProof {
  readonly probeId: string;
  readonly rollbackVerified: boolean;
  readonly valueVerified: boolean;
}

export async function runEngineeringPersistenceProof(
  persistence: PostgresPersistence,
): Promise<EngineeringPersistenceProof> {
  const probeId = `b3-${randomUUID()}`;
  const expectedValue = randomUUID();
  let valueVerified = false;

  try {
    await persistence.transaction(async (transaction) => {
      const engineeringDatabase = transaction.withSchema(engineeringSchema);

      await engineeringDatabase
        .insertInto(engineeringProbeTable)
        .values({ probe_id: probeId, probe_value: expectedValue })
        .executeTakeFirstOrThrow();

      const row = await engineeringDatabase
        .selectFrom(engineeringProbeTable)
        .select(['probe_id', 'probe_value'])
        .where('probe_id', '=', probeId)
        .executeTakeFirstOrThrow();

      valueVerified = row.probe_id === probeId && row.probe_value === expectedValue;
      if (!valueVerified) {
        throw new Error('The persistence probe read did not match the written value.');
      }

      throw rollbackSignal;
    });
  } catch (error) {
    if (error !== rollbackSignal) {
      throw error;
    }
  }

  const remaining = await persistence.databaseForEngineeringProof
    .withSchema(engineeringSchema)
    .selectFrom(engineeringProbeTable)
    .select(({ fn }) => fn.countAll<number>().as('count'))
    .where('probe_id', '=', probeId)
    .executeTakeFirstOrThrow();

  return {
    probeId,
    rollbackVerified: Number(remaining.count) === 0,
    valueVerified,
  };
}
