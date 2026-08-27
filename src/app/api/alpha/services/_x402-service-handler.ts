import {
  decodePaymentSignatureHeader,
  encodePaymentRequiredHeader,
  encodePaymentResponseHeader,
} from '@x402/core/http';
import { NextResponse } from 'next/server';

import { serviceCapabilityForOffer } from '../../../../modules/commerce/service-catalog.ts';
import type { X402PaymentPayload, X402SettlementResult } from '../../../../modules/commerce/x402-port.ts';
import { CircleGatewayFacilitatorAdapter } from '../../../../platform/circle/gateway-x402.ts';
import { PostgresAlphaServiceRepository } from '../../../../platform/persistence/alpha-service-repository.ts';
import { readDatabaseConnectionConfig } from '../../../../platform/persistence/config.ts';
import { PostgresPersistence } from '../../../../platform/persistence/database.ts';
import {
  PostgresGatewayX402Repository,
  sha256Json,
} from '../../../../platform/persistence/gateway-x402-repository.ts';

function headerValue(value: unknown): string {
  return value as string;
}

export async function serveX402Offer(request: Request, offerId: `off_${string}`) {
  const capability = serviceCapabilityForOffer(offerId);
  if (capability === null || capability.protocol !== 'X402') {
    return NextResponse.json({ error: 'Unknown x402 service offer.' }, { status: 404 });
  }
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
    if ((await payments.getPaymentOfferId(payment.paymentId)) !== offerId) {
      return NextResponse.json({ error: 'Payment is committed to a different service offer.' }, { status: 409 });
    }
    const signatureHeader = request.headers.get('payment-signature');
    if (signatureHeader === null) {
      return NextResponse.json(
        {
          error: 'Payment Required',
          offerId,
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

    const delivery = await new PostgresAlphaServiceRepository(persistence).getDeliveryForPaidOffer({
      offerId,
      paymentId: payment.paymentId,
    });
    if (delivery === null) {
      return NextResponse.json({ error: 'Settlement is complete but service delivery is pending.' }, { status: 409 });
    }
    return NextResponse.json(
      {
        capabilityId: delivery.capabilityId,
        commonControl: delivery.provenance === 'COMMON_CONTROL_TEST',
        executionId: delivery.executionId,
        offerId,
        output: delivery.output,
        outputSha256: delivery.outputSha256,
        paymentId: payment.paymentId,
        protocol: 'x402',
        settlementState: payment.state,
        sourceReference: delivery.sourceReference,
      },
      {
        headers: {
          'Cache-Control': 'private, no-store',
          'PAYMENT-RESPONSE': headerValue(encodePaymentResponseHeader(settlement as never)),
        },
      },
    );
  } finally {
    await persistence.close();
  }
}
