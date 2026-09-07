import { getProductSession } from '../../../_auth/server.ts';
import { connectionIdentity } from '../../../../modules/business/external-connection.ts';
import { createBusinessGenesis } from '../../../../modules/business/model.ts';
import { createPendingCircleTreasuryBinding } from '../../../../modules/business/treasury.ts';
import { hasSameProductOrigin } from '../../../../platform/http/request-origin.ts';
import { readBoundedJson } from '../../../../platform/http/bounded-json.ts';
import { observeBusinessSource, readBusinessSources, sourceForController } from '../../../../platform/http/business-source.ts';
import { PostgresAlphaBusinessRepository } from '../../../../platform/persistence/alpha-business-repository.ts';
import { readDatabaseConnectionConfig } from '../../../../platform/persistence/config.ts';
import { PostgresPersistence } from '../../../../platform/persistence/database.ts';

export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<Response> {
  const session = await getProductSession();
  if (session === null) return Response.json({ error: 'Product authentication is required.' }, { status: 401 });
  if (!hasSameProductOrigin(request)) {
    return Response.json({ error: 'A same-origin product request is required.' }, { status: 403 });
  }
  let body: Record<string, unknown>;
  try {
    body = await readBoundedJson(request, 4096) as Record<string, unknown>;
    if (body['action'] !== 'PREVIEW' && body['action'] !== 'CONNECT') throw new Error('Invalid action.');
  } catch {
    return Response.json({ error: 'Invalid connection request.' }, { status: 400 });
  }
  let persistence: PostgresPersistence | undefined;
  try {
    const source = sourceForController(readBusinessSources(), body['sourceId'], session.principalId);
    const connection = await observeBusinessSource(source);
    if (body['action'] === 'PREVIEW') {
      return Response.json({ manifest: connection.manifest, manifestSha256: connection.manifestSha256 }, { headers: { 'cache-control': 'no-store' } });
    }
    if (body['manifestSha256'] !== connection.manifestSha256) {
      return Response.json({ error: 'The external Business description changed. Review it again before connecting.' }, { status: 409 });
    }
    const config = readDatabaseConnectionConfig('runtime');
    if (config.environment !== session.environment) throw new Error('Environment mismatch.');
    const identity = connectionIdentity(connection);
    const genesis = createBusinessGenesis({
      controller: session, commonControlGroupId: 'ccg_controlled_alpha', entryRoute: 'MIGRATE',
      externalConnection: connection, ...connection.manifest, slug: identity.slug,
      genesisRequestId: identity.genesisRequestId,
    }, identity, connection.observedAt);
    persistence = new PostgresPersistence(config);
    const result = await new PostgresAlphaBusinessRepository(persistence).registerGenesis({
      controller: session, genesis,
      treasuryBinding: createPendingCircleTreasuryBinding({ business: genesis.business, bindingId: identity.bindingId }),
    });
    return Response.json({ created: result.created, workspacePath: `/app/businesses/${identity.slug}` }, { status: result.created ? 201 : 200 });
  } catch {
    return Response.json({ error: 'Connection could not be completed. Check the configured source and database; no external system or payment was changed.' }, { status: 503 });
  } finally {
    await persistence?.close();
  }
}
