import { serveX402Offer } from '../_x402-service-handler.ts';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: Request,
  context: { readonly params: Promise<{ readonly offerId: string }> },
) {
  const { offerId } = await context.params;
  if (!offerId.startsWith('off_')) {
    return Response.json({ error: 'Unknown service offer.' }, { status: 404 });
  }
  return serveX402Offer(request, offerId as `off_${string}`);
}
