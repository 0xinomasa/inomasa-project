import { getProductSession } from '@/app/_auth/server.ts';
import { createOperationalAgent } from '@/modules/business/operational-workspace.ts';
import { readDatabaseConnectionConfig } from '@/platform/persistence/config.ts';
import { PostgresAgentRepository } from '@/platform/persistence/agent-repository.ts';
import { PostgresPersistence } from '@/platform/persistence/database.ts';
import { PostgresOperationalWorkspaceRepository } from '@/platform/persistence/operational-workspace-repository.ts';

export const dynamic = 'force-dynamic';

type Context = { readonly params: Promise<{ readonly businessSlug: string }> };

function field(body: Record<string, unknown>, name: string): string {
  const value = body[name];
  if (typeof value !== 'string') throw new Error(`${name} is required.`);
  return value;
}

export async function POST(request: Request, context: Context): Promise<Response> {
  const session = await getProductSession();
  if (session === null) return Response.json({ error: 'Product authentication is required.' }, { status: 401 });
  if (!process.env['INOMASA_ENV']?.trim() || !process.env['DATABASE_URL']?.trim()) {
    return Response.json({ error: 'Operational Workspace persistence is not configured.' }, { status: 503 });
  }
  let persistence: PostgresPersistence | undefined;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const { businessSlug } = await context.params;
    const config = readDatabaseConnectionConfig('runtime');
    if (config.environment !== session.environment) {
      return Response.json({ error: 'Session and database environments do not match.' }, { status: 409 });
    }
    persistence = new PostgresPersistence(config);
    const business = await new PostgresOperationalWorkspaceRepository(persistence)
      .getBusinessForController({ controllerPrincipalId: session.principalId, slug: businessSlug });
    if (business === undefined) return Response.json({ error: 'Business not found.' }, { status: 404 });
    const agent = createOperationalAgent({
      businessId: business.businessId,
      capability: field(body, 'capability'),
      displayName: field(body, 'displayName'),
      environment: business.environment,
      role: field(body, 'role'),
    });
    const result = await new PostgresAgentRepository(persistence)
      .ensureAgent(agent, session.principalId);
    return Response.json(
      {
        agentPrincipalId: agent.agentPrincipalId,
        created: result.created,
        intelligenceProvider: 'NOT_CONFIGURED',
        runtimeClass: agent.runtimeClass,
      },
      { status: result.created ? 201 : 200 },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Agent creation failed.';
    return Response.json({ error: message }, { status: /control is required/i.test(message) ? 403 : 400 });
  } finally {
    await persistence?.close();
  }
}
