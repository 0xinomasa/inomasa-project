import { getProductSession } from '../../../_auth/server.ts';
import {
  createBusinessGenesis,
  normalizeBusinessSlug,
  type HumanPrincipal,
} from '../../../../modules/business/model.ts';
import { getBusinessTemplate, isBusinessTemplateId } from '../../../../modules/business/templates.ts';
import { createPendingCircleTreasuryBinding } from '../../../../modules/business/treasury.ts';
import { readDatabaseConnectionConfig } from '../../../../platform/persistence/config.ts';
import { PostgresAlphaBusinessRepository } from '../../../../platform/persistence/alpha-business-repository.ts';
import { PostgresPersistence } from '../../../../platform/persistence/database.ts';
import { deriveBusinessGenesisIdentity } from './request-identity.ts';

export const dynamic = 'force-dynamic';

function textField(value: unknown, label: string, maxLength: number): string {
  if (typeof value !== 'string') throw new Error(label + ' is required.');
  const normalized = value.trim();
  if (normalized.length === 0 || normalized.length > maxLength) {
    throw new Error(label + ' must contain 1-' + maxLength + ' characters.');
  }
  return normalized;
}

export async function GET(): Promise<Response> {
  const session = await getProductSession();
  if (session === null) {
    return Response.json({ error: 'Product authentication is required.' }, { status: 401 });
  }
  if (!process.env['INOMASA_ENV']?.trim() || !process.env['DATABASE_URL']?.trim()) {
    return Response.json({ businesses: [], state: 'NOT_CONFIGURED' as const });
  }

  let persistence: PostgresPersistence | undefined;
  try {
    persistence = new PostgresPersistence(readDatabaseConnectionConfig('runtime'));
    const businesses = await new PostgresAlphaBusinessRepository(persistence).listBusinesses(
      session.principalId,
    );
    return Response.json({ businesses, state: 'CONNECTED' as const });
  } catch {
    return Response.json({ businesses: [], state: 'UNAVAILABLE' as const }, { status: 503 });
  } finally {
    await persistence?.close();
  }
}

export async function POST(request: Request): Promise<Response> {
  const session = await getProductSession();
  if (session === null) {
    return Response.json({ error: 'Product authentication is required.' }, { status: 401 });
  }
  if (!process.env['INOMASA_ENV']?.trim() || !process.env['DATABASE_URL']?.trim()) {
    return Response.json(
      { error: 'Business creation requires the configured local or private Arc Testnet runtime.' },
      { status: 503 },
    );
  }
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'Invalid JSON request.' }, { status: 400 });
  }

  try {
    const templateId = textField(body['templateId'], 'Template', 64);
    if (!isBusinessTemplateId(templateId)) {
      return Response.json({ error: 'Choose one of the four active BUILD templates.' }, { status: 400 });
    }

    const displayName = textField(body['displayName'], 'Business name', 160);
    const rawSlug = body['slug'];
    const slugInput = rawSlug === undefined || rawSlug === null ||
      (typeof rawSlug === 'string' && rawSlug.trim() === '')
      ? displayName
      : textField(rawSlug, 'Business slug', 96);
    const slug = normalizeBusinessSlug(slugInput);
    const rawSummary = body['summary'];
    const summary = rawSummary === undefined || rawSummary === null ||
      (typeof rawSummary === 'string' && rawSummary.trim() === '')
      ? undefined
      : textField(rawSummary, 'Business description', 500);
    const effectiveSummary = summary ?? getBusinessTemplate(templateId).description;
    const identity = deriveBusinessGenesisIdentity({
      displayName,
      principalId: session.principalId,
      slug,
      summary: effectiveSummary,
      templateId,
    });
    const occurredAt = new Date().toISOString();
    const controller: HumanPrincipal = {
      actorClassification: session.actorClassification,
      displayName: session.displayName,
      environment: session.environment,
      principalId: session.principalId,
    };
    const genesis = createBusinessGenesis(
      {
        commonControlGroupId: 'ccg_controlled_alpha',
        controller,
        displayName,
        genesisRequestId: identity.genesisRequestId,
        slug,
        ...(summary === undefined ? {} : { summary }),
        templateId,
      },
      {
        businessId: identity.businessId,
        controlId: ('ctl_' + slug.replaceAll('-', '_').slice(0, 40) + '_' + identity.genesisRequestId.slice(-16)) as
          `ctl_${string}`,
        eventId: ('evt_' + slug.replaceAll('-', '_').slice(0, 40) + '_' + identity.genesisRequestId.slice(-16)) as
          `evt_${string}`,
      },
      occurredAt,
    );

    const config = readDatabaseConnectionConfig('runtime');
    if (config.environment !== session.environment) {
      return Response.json({ error: 'Session and database environments do not match.' }, { status: 409 });
    }
    let persistence: PostgresPersistence | undefined;
    try {
      persistence = new PostgresPersistence(config);
      const result = await new PostgresAlphaBusinessRepository(persistence).registerGenesis({
        controller,
        genesis,
        treasuryBinding: createPendingCircleTreasuryBinding({
          bindingId: ('tbn_' + slug.replaceAll('-', '_').slice(0, 40) + '_' + identity.genesisRequestId.slice(-16)) as
            `tbn_${string}`,
          business: genesis.business,
        }),
      });
      return Response.json(
        {
          businessId: result.businessId,
          created: result.created,
          slug: genesis.business.slug,
          workspacePath: '/app/businesses/' + genesis.business.slug,
        },
        { status: result.created ? 201 : 200 },
      );
    } finally {
      await persistence?.close();
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Business creation failed.';
    const duplicate = /already exists|duplicate|unique/i.test(message);
    return Response.json(
      { error: duplicate ? 'That Business name or slug is already in use.' : message },
      { status: duplicate ? 409 : 400 },
    );
  }
}
