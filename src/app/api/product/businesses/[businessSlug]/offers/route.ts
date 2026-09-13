import { hasSameProductOrigin } from '@/platform/http/request-origin.ts';
import { getProductSession } from '@/app/_auth/server.ts';
import { createProductOfferDraft } from '@/modules/business/operational-workspace.ts';
import { readDatabaseConnectionConfig } from '@/platform/persistence/config.ts';
import { PostgresPersistence } from '@/platform/persistence/database.ts';
import { PostgresOperationalWorkspaceRepository } from '@/platform/persistence/operational-workspace-repository.ts';

export const dynamic = 'force-dynamic';

type Context = { readonly params: Promise<{ readonly businessSlug: string }> };

function field(body: Record<string, unknown>, name: string): string {
  const value = body[name];
  if (typeof value !== 'string') throw new Error(`${name} is required.`);
  return value;
}

async function requestBody(request: Request): Promise<Record<string, unknown>> {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    throw new Error('Invalid JSON request.');
  }
}

export async function POST(request: Request, context: Context): Promise<Response> {
  const session = await getProductSession();
  if (session === null) return Response.json({ error: 'Product authentication is required.' }, { status: 401 });
  if (!hasSameProductOrigin(request)) return Response.json({ error:'A same-origin request is required.' },{status:403});
  if (!process.env['INOMASA_ENV']?.trim() || !process.env['DATABASE_URL']?.trim()) {
    return Response.json({ error: 'Operational Workspace persistence is not configured.' }, { status: 503 });
  }
  let persistence: PostgresPersistence | undefined;
  try {
    const { businessSlug } = await context.params;
    const body = await requestBody(request);
    const config = readDatabaseConnectionConfig('runtime');
    if (config.environment !== session.environment) {
      return Response.json({ error: 'Session and database environments do not match.' }, { status: 409 });
    }
    persistence = new PostgresPersistence(config);
    const repository = new PostgresOperationalWorkspaceRepository(persistence);
    const business = await repository.getBusinessForController({
      controllerPrincipalId: session.principalId,
      slug: businessSlug,
    });
    if (business === undefined) return Response.json({ error: 'Business not found.' }, { status: 404 });
    const offer = createProductOfferDraft({
      businessId: business.businessId,
      controllerPrincipalId: session.principalId,
      description: field(body, 'description'),
      name: field(body, 'name'),
      price: field(body, 'price'),
      protocol: field(body, 'protocol') as 'ERC8183' | 'X402',
    });
    const result = await repository.ensureOffer({
      ...offer,
      controllerPrincipalId: session.principalId,
      slug: businessSlug,
    });
    return Response.json(
      { created: result.created, offerId: offer.offerId, status: offer.status },
      { status: result.created ? 201 : 200 },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Product or Service creation failed.';
    return Response.json({ error: message }, { status: /control|required to manage/i.test(message) ? 403 : 400 });
  } finally {
    await persistence?.close();
  }
}

export async function PATCH(request: Request, context: Context): Promise<Response> {
  const session = await getProductSession();
  if (session === null) return Response.json({ error: 'Product authentication is required.' }, { status: 401 });
  if (!hasSameProductOrigin(request)) return Response.json({ error:'A same-origin request is required.' },{status:403});
  if (!process.env['INOMASA_ENV']?.trim() || !process.env['DATABASE_URL']?.trim()) {
    return Response.json({ error: 'Operational Workspace persistence is not configured.' }, { status: 503 });
  }
  let persistence: PostgresPersistence | undefined;
  try {
    const { businessSlug } = await context.params;
    const body = await requestBody(request);
    const offerId = field(body, 'offerId');
    const action = field(body, 'action');
    if (!offerId.startsWith('off_')) throw new Error('Offer ID is invalid.');
    if (!['ACTIVATE','RETIRE','SHARE','WITHDRAW'].includes(action)) throw new Error('Offer action is invalid.');
    const config = readDatabaseConnectionConfig('runtime');
    if (config.environment !== session.environment) {
      return Response.json({ error: 'Session and database environments do not match.' }, { status: 409 });
    }
    persistence = new PostgresPersistence(config);
    const repository = new PostgresOperationalWorkspaceRepository(persistence);
    if(action==='SHARE'||action==='WITHDRAW')return Response.json({offerId,result:await repository.shareOffer({controllerPrincipalId:session.principalId,slug:businessSlug,offerId,shared:action==='SHARE'})});
    const result = action === 'ACTIVATE'
      ? await repository.activateOffer({
          controllerPrincipalId: session.principalId,
          offerId,
          slug: businessSlug,
        })
      : await repository.retireOffer({
          controllerPrincipalId: session.principalId,
          offerId,
          slug: businessSlug,
        });
    return Response.json({ offerId, result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Product or Service update failed.';
    return Response.json({ error: message }, { status: /not found|control|only controller/i.test(message) ? 404 : 400 });
  } finally {
    await persistence?.close();
  }
}
