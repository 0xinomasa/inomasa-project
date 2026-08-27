import { serveX402Offer } from '../_x402-service-handler.ts';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  return serveX402Offer(request, 'off_arc_snapshot_x402_v1');
}
