import { getProductSession } from '@/app/_auth/server.ts';
import { readDatabaseConnectionConfig } from '@/platform/persistence/config.ts';
import { PostgresCapitalRepository } from '@/platform/persistence/capital-repository.ts';
import { PostgresPersistence } from '@/platform/persistence/database.ts';

export const dynamic = 'force-dynamic';

type Context = {
  readonly params: Promise<{
    readonly allocationId: string;
    readonly businessSlug: string;
  }>;
};

export async function POST(request: Request, context: Context): Promise<Response> {
  const session = await getProductSession();
  if (session === null) {
    return Response.json({ error: 'Product authentication is required.' }, { status: 401 });
  }
  if (!process.env['INOMASA_ENV']?.trim() || !process.env['DATABASE_URL']?.trim()) {
    return Response.json({ error: 'Capital persistence is not configured.' }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'Invalid JSON request.' }, { status: 400 });
  }
  if (body['action'] !== 'ACCEPT') {
    return Response.json({ error: 'Choose the supported Capital action.' }, { status: 400 });
  }

  let persistence: PostgresPersistence | undefined;
  try {
    const { allocationId, businessSlug } = await context.params;
    if (!allocationId.startsWith('cal_')) {
      return Response.json({ error: 'Capital allocation ID is invalid.' }, { status: 400 });
    }
    const config = readDatabaseConnectionConfig('runtime');
    if (config.environment !== session.environment) {
      return Response.json({ error: 'Session and database environments do not match.' }, { status: 409 });
    }
    persistence = new PostgresPersistence(config);
    const repository = new PostgresCapitalRepository(persistence);
    const scopedPaths = await repository.listCapitalPaths({
      businessSlug,
      controllerPrincipalId: session.principalId,
    });
    if (!scopedPaths.some((path) => path.allocationId === allocationId)) {
      return Response.json({ error: 'Capital allocation not found.' }, { status: 404 });
    }
    await repository.acceptAllocation({
      acceptedAt: new Date().toISOString(),
      acceptedByPrincipalId: session.principalId,
      allocationId: allocationId as `cal_${string}`,
      businessSlug,
    });
    const updated = (await repository.listCapitalPaths({
      businessSlug,
      controllerPrincipalId: session.principalId,
    })).find((path) => path.allocationId === allocationId);
    return Response.json({ allocationId, state: updated?.allocationState ?? 'UNKNOWN' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Capital acceptance failed.';
    const forbidden = /active Business controller|different semantics/i.test(message);
    return Response.json(
      { error: forbidden ? 'This Capital allocation is not available in the controlled Business context.' : message },
      { status: forbidden ? 403 : 409 },
    );
  } finally {
    await persistence?.close();
  }
}
