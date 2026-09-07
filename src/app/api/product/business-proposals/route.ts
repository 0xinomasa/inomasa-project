import { getProductSession } from '../../../_auth/server.ts';
import { creationIdea } from '../../../../modules/business/creation-assistance.ts';
import { GeminiBusinessCreationAssistant, readGeminiConfig } from '../../../../platform/ai/gemini.ts';
import { signCreationAssistance } from '../../../../platform/ai/proposal-proof.ts';
import { hasSameProductOrigin } from '../../../../platform/http/request-origin.ts';
import { readBoundedJson } from '../../../../platform/http/bounded-json.ts';

export const dynamic = 'force-dynamic';

// Single-process local Alpha limit, not a distributed quota or durable request log.
const recentRequests = new Map<string, number>();

export async function POST(request: Request): Promise<Response> {
  const session = await getProductSession();
  if (session === null) return Response.json({ error: 'Product authentication is required.' }, { status: 401 });
  if (!hasSameProductOrigin(request)) {
    return Response.json({ error: 'A same-origin product request is required.' }, { status: 403 });
  }
  let idea: string;
  try {
    const body = await readBoundedJson(request, 16_384) as Record<string, unknown>;
    idea = creationIdea(body['idea']);
  } catch {
    return Response.json({ error: 'Enter a Business idea containing 1-3000 characters.' }, { status: 400 });
  }
  const now = Date.now();
  for (const [principal, timestamp] of recentRequests) if (now - timestamp > 60_000) recentRequests.delete(principal);
  if (recentRequests.has(session.principalId)) {
    return Response.json({ error: 'Please wait one minute before requesting another AI proposal.' }, { status: 429 });
  }
  let config: ReturnType<typeof readGeminiConfig>;
  try {
    config = readGeminiConfig();
  } catch {
    return Response.json({ code: 'AI_NOT_CONFIGURED', error: 'AI drafting is not configured for this environment. Manual template creation remains available for Alpha testing.' }, { status: 503 });
  }
  try {
    const assistant = new GeminiBusinessCreationAssistant(config);
    recentRequests.set(session.principalId, now);
    const assistance = await assistant.propose(idea);
    const proof = signCreationAssistance(assistance, session.principalId, process.env['INOMASA_AUTH_SECRET'] ?? '');
    return Response.json({ assistance, proof }, { headers: { 'cache-control': 'no-store' } });
  } catch {
    return Response.json({ code: 'AI_UNAVAILABLE', error: 'AI could not return a valid Business proposal. No Business was created. Manual template creation remains available for Alpha testing.' }, { status: 503 });
  }
}
