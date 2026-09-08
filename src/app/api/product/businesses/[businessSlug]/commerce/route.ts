import { hasSameProductOrigin } from '@/platform/http/request-origin.ts';
import { getProductSession } from '@/app/_auth/server.ts';
import { executeProductEconomicAction } from '@/app/_commerce/application.ts';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type Context = { readonly params: Promise<{ readonly businessSlug: string }> };

function optionalField(body: Record<string, unknown>, name: string): string | undefined {
  const value = body[name];
  if (value === undefined) return undefined;
  if (typeof value !== 'string') throw new Error(`${name} must be text.`);
  return value;
}

export async function POST(request: Request, context: Context): Promise<Response> {
  const session = await getProductSession();
  if (session === null) {
    return Response.json({ error: 'Product authentication is required.' }, { status: 401 });
  }
  if(!hasSameProductOrigin(request))return Response.json({error:'A same-origin request is required.'},{status:403});
  if(session.environment!==process.env['INOMASA_ENV'])return Response.json({error:'Session environment does not match.'},{status:409});
  if (!process.env['INOMASA_ENV']?.trim() || !process.env['DATABASE_URL']?.trim()) {
    return Response.json({ error: 'Economic operation persistence is not configured.' }, { status: 503 });
  }
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'Invalid JSON request.' }, { status: 400 });
  }
  try {
    const { businessSlug } = await context.params;
    const action = optionalField(body, 'action');
    const requestId = optionalField(body, 'requestId');
    if (action !== 'PREPARE' && action !== 'ADVANCE') {
      throw new Error('Choose a supported economic action.');
    }
    if (requestId === undefined) throw new Error('requestId is required.');
    const agentPrincipalId = optionalField(body, 'agentPrincipalId');
    const kind = optionalField(body, 'kind') as 'ERC8183_JOB' | 'X402_PURCHASE' | undefined;
    const offerId = optionalField(body, 'offerId');
    const result = await executeProductEconomicAction({
      action,
      ...(agentPrincipalId === undefined ? {} : { agentPrincipalId }),
      businessSlug,
      controllerPrincipalId: session.principalId,
      ...(kind === undefined ? {} : { kind }),
      ...(offerId === undefined ? {} : { offerId }),
      requestId,
    });
    return Response.json(result, { status: action === 'PREPARE' ? 201 : 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Economic operation failed.';
    const status = /timed out/i.test(message)
      ? 503
      : /not found|Business control/i.test(message)
      ? 404
      : /restricted|environment|requires active|connect and fund|unavailable|not configured/i.test(message)
        ? 409
        : 400;
    return Response.json({ error: message }, { status });
  }
}
