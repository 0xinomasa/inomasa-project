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
const resourceUrl = `${baseUrl}/api/alpha/services/arc-market-snapshot?paymentId=${paymentId}`;

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

    const unpaid = await fetch(resourceUrl);
    const requiredHeader = unpaid.headers.get('payment-required');
    if (unpaid.status !== 402 || requiredHeader === null) {
      throw new Error(`Expected HTTP 402 challenge, received ${unpaid.status}.`);
    }
    const required = decodePaymentRequiredHeader(requiredHeader);
    if (sha256Json(required) !== sha256Json(stored.paymentRequired)) {
      throw new Error('HTTP PAYMENT-REQUIRED differs from the committed challenge.');
    }

    const paid = await fetch(resourceUrl, {
      headers: {
        'PAYMENT-SIGNATURE': encodePaymentSignatureHeader(
          stored.paymentPayload as unknown as Parameters<typeof encodePaymentSignatureHeader>[0],
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
      readonly paymentId?: string;
      readonly settlementState?: string;
    };
    if (
      !settlement.success ||
      body.paymentId !== paymentId ||
      body.settlementState !== 'COMPLETE'
    ) {
      throw new Error('Paid x402 response does not prove the committed complete operation.');
    }
    console.log(
      `x402_http challenge=402 paid_status=${paid.status} payment=${body.paymentId} settlement=${body.settlementState} execution=${body.executionId}`,
    );
  } finally {
    await persistence.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'x402 HTTP proof failed.');
  process.exitCode = 1;
});
