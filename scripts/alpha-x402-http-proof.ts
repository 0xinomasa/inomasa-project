import {
  decodePaymentRequiredHeader,
  decodePaymentResponseHeader,
  encodePaymentSignatureHeader,
} from '@x402/core/http';

import { readDatabaseConnectionConfig } from '../src/platform/persistence/config.ts';
import { PostgresPersistence } from '../src/platform/persistence/database.ts';
import {
  PostgresGatewayX402Repository,
  sha256Json,
} from '../src/platform/persistence/gateway-x402-repository.ts';

const baseUrl = process.env['INOMASA_ALPHA_BASE_URL']?.trim() ?? 'http://127.0.0.1:3000';
const paymentId = 'pay_arc_snapshot_x402_v1' as const;
const offerId = 'off_arc_snapshot_x402_v1' as const;

async function proveResource(input: {
  readonly paymentPayload: NonNullable<Awaited<ReturnType<PostgresGatewayX402Repository['getPayment']>>['paymentPayload']>;
  readonly paymentRequired: Awaited<ReturnType<PostgresGatewayX402Repository['getPayment']>>['paymentRequired'];
  readonly resourceUrl: string;
}) {
  const unpaid = await fetch(input.resourceUrl);
  const requiredHeader = unpaid.headers.get('payment-required');
  if (unpaid.status !== 402 || requiredHeader === null) {
    throw new Error(`Expected HTTP 402 challenge, received ${unpaid.status}.`);
  }
  const required = decodePaymentRequiredHeader(requiredHeader);
  if (sha256Json(required) !== sha256Json(input.paymentRequired)) {
    throw new Error('HTTP PAYMENT-REQUIRED differs from the committed challenge.');
  }

  const paid = await fetch(input.resourceUrl, {
    headers: {
      'PAYMENT-SIGNATURE': encodePaymentSignatureHeader(
        input.paymentPayload as unknown as Parameters<typeof encodePaymentSignatureHeader>[0],
      ),
    },
  });
  const responseHeader = paid.headers.get('payment-response');
  if (!paid.ok || responseHeader === null) {
    throw new Error(`Paid x402 request failed with HTTP ${paid.status}.`);
  }
  const settlement = decodePaymentResponseHeader(responseHeader);
  const body = (await paid.json()) as {
    readonly executionId?: string;
    readonly offerId?: string;
    readonly paymentId?: string;
    readonly protocol?: string;
    readonly settlementState?: string;
  };
  if (
    !settlement.success ||
    body.offerId !== offerId ||
    body.paymentId !== paymentId ||
    body.protocol !== 'x402' ||
    body.settlementState !== 'COMPLETE'
  ) {
    throw new Error('Paid x402 response does not prove the committed complete operation.');
  }
  return body;
}

async function main(): Promise<void> {
  const config = readDatabaseConnectionConfig('runtime');
  if (config.environment !== 'PRIVATE_ARC_TESTNET') {
    throw new Error('x402 HTTP proof is restricted to PRIVATE_ARC_TESTNET.');
  }
  const persistence = new PostgresPersistence(config);
  try {
    const stored = await new PostgresGatewayX402Repository(persistence).getPayment(paymentId);
    if (stored.state !== 'COMPLETE' || stored.paymentPayload === null) {
      throw new Error('x402 HTTP proof requires the completed committed Alpha payment.');
    }

    const [legacy, generic] = await Promise.all([
      proveResource({
        paymentPayload: stored.paymentPayload,
        paymentRequired: stored.paymentRequired,
        resourceUrl: `${baseUrl}/api/alpha/services/arc-market-snapshot?paymentId=${paymentId}`,
      }),
      proveResource({
        paymentPayload: stored.paymentPayload,
        paymentRequired: stored.paymentRequired,
        resourceUrl: `${baseUrl}/api/alpha/services/${offerId}?paymentId=${paymentId}`,
      }),
    ]);
    console.log(
      `x402_http challenge=402 legacy=200 generic=200 payment=${generic.paymentId} offer=${generic.offerId} settlement=${generic.settlementState} execution=${legacy.executionId}`,
    );
  } finally {
    await persistence.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'x402 HTTP proof failed.');
  process.exitCode = 1;
});
