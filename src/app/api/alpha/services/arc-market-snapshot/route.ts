import {
  decodePaymentSignatureHeader,
  encodePaymentRequiredHeader,
  encodePaymentResponseHeader,
} from '@x402/core/http';
import { NextResponse } from 'next/server';

import type { X402PaymentPayload, X402SettlementResult } from '../../../../../modules/commerce/x402-port';
import { CircleGatewayFacilitatorAdapter } from '../../../../../platform/circle/gateway-x402';
import { readDatabaseConnectionConfig } from '../../../../../platform/persistence/config';
import { PostgresPersistence } from '../../../../../platform/persistence/database';
import {
  PostgresGatewayX402Repository,
  sha256Json,
} from '../../../../../platform/persistence/gateway-x402-repository';
import { PostgresAlphaServiceRepository } from '../../../../../platform/persistence/alpha-service-repository';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function headerValue(value: unknown): string {
  return value as string;
}

export async function GET(request: Request) {
  const paymentId = new URL(request.url).searchParams.get('paymentId');
  if (paymentId === null || !paymentId.startsWith('pay_')) {
    return NextResponse.json({ error: 'A valid paymentId is required.' }, { status: 400 });
  }

  const config = readDatabaseConnectionConfig('runtime');
  if (config.environment !== 'PRIVATE_ARC_TESTNET') {
    return NextResponse.json({ error: 'This resource is testnet-only.' }, { status: 403 });
  }
  const persistence = new PostgresPersistence(config);
  const payments = new PostgresGatewayX402Repository(persistence);
  try {
    let payment = await payments.getPayment(paymentId as `pay_${string}`);
    const signatureHeader = request.headers.get('payment-signature');
    if (signatureHeader === null) {
      return NextResponse.json(
        {
          error: 'Payment Required',
          paymentId: payment.paymentId,
          provenance: 'COMMON_CONTROL_TEST',
          valueClassification: 'TESTNET_USDC',
        },
        {
          headers: {
            'Cache-Control': 'private, no-store',
            'PAYMENT-REQUIRED': headerValue(
              encodePaymentRequiredHeader(payment.paymentRequired as never),
            ),
          },
          status: 402,
        },
      );
    }

    const supplied = decodePaymentSignatureHeader(signatureHeader) as unknown as X402PaymentPayload;
    if (
      payment.paymentPayload === null ||
      sha256Json(supplied) !== sha256Json(payment.paymentPayload)
    ) {
      return NextResponse.json({ error: 'Payment payload does not match the committed authorization.' }, { status: 409 });
    }

    let settlement: X402SettlementResult = {
      network: payment.requirements.network,
      success: true,
      transaction: payment.providerTransactionId ?? '',
    };
    if (payment.state !== 'COMPLETE') {
      const facilitator = new CircleGatewayFacilitatorAdapter();
      const verification = await facilitator.verify(supplied, payment.requirements);
      if (!verification.isValid) {
        await payments.recordFailed(payment.paymentId, verification.invalidReason ?? 'VERIFY_REJECTED');
        return NextResponse.json({ error: verification.invalidReason ?? 'Payment rejected.' }, { status: 402 });
      }
      await payments.recordVerified(payment.paymentId);
      try {
        settlement = await facilitator.settle(supplied, payment.requirements);
      } catch (error) {
        await payments.recordOutcomeUnknown(payment.paymentId, 'HTTP_SETTLE_AMBIGUOUS');
        throw error;
      }
      if (!settlement.success) {
        await payments.recordFailed(payment.paymentId, settlement.errorReason ?? 'SETTLE_REJECTED');
        return NextResponse.json({ error: settlement.errorReason ?? 'Settlement failed.' }, { status: 402 });
      }
      await payments.recordComplete({
        observedAt: new Date().toISOString(),
        paymentId: payment.paymentId,
        providerTransactionId: settlement.transaction,
      });
      payment = await payments.getPayment(payment.paymentId);
    }

    const delivery = (await new PostgresAlphaServiceRepository(persistence).listServiceDeliveries()).find(
      (candidate) => candidate.obligationId === payment.obligationId,
    );
    if (delivery === undefined) {
      return NextResponse.json({ error: 'Settlement is complete but service delivery is pending.' }, { status: 409 });
    }
    const response = {
      capabilityId: delivery.capabilityId,
      commonControl: delivery.provenance === 'COMMON_CONTROL_TEST',
      executionId: delivery.executionId,
      output: delivery.output,
      outputSha256: delivery.outputSha256,
      paymentId: payment.paymentId,
      settlementState: payment.state,
      sourceReference: delivery.sourceReference,
    };
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'private, no-store',
        'PAYMENT-RESPONSE': headerValue(encodePaymentResponseHeader(settlement as never)),
      },
    });
  } finally {
    await persistence.close();
  }
}
