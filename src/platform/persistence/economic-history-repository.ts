import {
  deriveActivityOutcome,
  deriveActivityProtocols,
  deriveActivityStatus,
  type ActivityProof,
  type EconomicActivity,
  type EconomicHistoryInventory,
} from '../../modules/economic-history/model.ts';
import type { PostgresPersistence } from './database.ts';
import { applicationSchema } from './database.ts';

interface EconomicHistoryQuery {
  readonly businessId?: `biz_${string}`;
  readonly limit?: number;
}

function proofKind(sourceType: string, reference: string): ActivityProof['kind'] {
  if (sourceType === 'CIRCLE_GATEWAY_X402') return 'PROVIDER_RECEIPT';
  if (reference.startsWith('arc-block:')) return 'ARC_BLOCK';
  if (
    sourceType === 'ARC_TESTNET_TRANSACTION' ||
    sourceType === 'ARC_ERC8183_CONTRACT' ||
    sourceType === 'ARC_ERC8004'
  ) {
    return 'ARC_TRANSACTION';
  }
  return 'APPLICATION_RECORD';
}

function uniqueProofs(proofs: readonly ActivityProof[]): readonly ActivityProof[] {
  const seen = new Set<string>();
  return proofs.filter((proof) => {
    const key = `${proof.kind}:${proof.scope}:${proof.reference}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export class PostgresEconomicHistoryRepository {
  readonly #persistence: PostgresPersistence;

  constructor(persistence: PostgresPersistence) {
    this.#persistence = persistence;
  }

  async loadInventory(): Promise<EconomicHistoryInventory> {
    const database = this.#persistence.databaseForApplication.withSchema(applicationSchema);
    const [agents, businesses, evidence, deliveries] = await Promise.all([
      database
        .selectFrom('agent_registrations')
        .select((expression) => expression.fn.countAll<string>().as('count'))
        .executeTakeFirstOrThrow(),
      database
        .selectFrom('businesses')
        .select((expression) => expression.fn.countAll<string>().as('count'))
        .executeTakeFirstOrThrow(),
      database
        .selectFrom('evidence_facts')
        .select((expression) => expression.fn.countAll<string>().as('count'))
        .executeTakeFirstOrThrow(),
      database
        .selectFrom('service_executions')
        .select((expression) => expression.fn.countAll<string>().as('count'))
        .executeTakeFirstOrThrow(),
    ]);
    return {
      agentCount: Number(agents.count),
      businessCount: Number(businesses.count),
      evidenceCount: Number(evidence.count),
      serviceDeliveryCount: Number(deliveries.count),
    };
  }

  async listActivities(query: EconomicHistoryQuery = {}): Promise<readonly EconomicActivity[]> {
    const database = this.#persistence.databaseForApplication.withSchema(applicationSchema);
    const baseQuery = database
      .selectFrom('obligations as obligation')
      .innerJoin('service_offers as offer', 'offer.offer_id', 'obligation.offer_id')
      .innerJoin('businesses as buyer', 'buyer.business_id', 'obligation.buyer_business_id')
      .innerJoin('businesses as seller', 'seller.business_id', 'obligation.seller_business_id')
      .leftJoin(
        'settlement_operations as settlement',
        'settlement.obligation_id',
        'obligation.obligation_id',
      )
      .leftJoin(
        'x402_payment_operations as payment',
        'payment.obligation_id',
        'obligation.obligation_id',
      )
      .leftJoin(
        'service_executions as execution',
        'execution.obligation_id',
        'obligation.obligation_id',
      )
      .leftJoin('erc8183_jobs as job', 'job.obligation_id', 'obligation.obligation_id')
      .leftJoin(
        'execution_authorizations as authorization',
        'authorization.authorization_id',
        'obligation.execution_authorization_id',
      )
      .leftJoin('action_intents as intent', 'intent.intent_id', 'authorization.intent_id')
      .leftJoin('principals as requester', 'requester.principal_id', 'obligation.requester_principal_id')
      .leftJoin(
        'erc8004_identity_operations as identity',
        'identity.identity_id',
        'intent.erc8004_identity_id',
      )
      .select([
        'obligation.amount_micro_usdc as amountMicroUsdc',
        'obligation.asset',
        'obligation.buyer_business_id as buyerBusinessId',
        'buyer.display_name as buyerDisplayName',
        'buyer.slug as buyerSlug',
        'obligation.created_at as createdAt',
        'obligation.environment',
        'obligation.obligation_id as obligationId',
        'obligation.provenance',
        'obligation.requester_principal_id as requesterPrincipalId',
        'requester.display_name as requesterDisplayName',
        'requester.principal_kind as requesterPrincipalKind',
        'obligation.seller_business_id as sellerBusinessId',
        'seller.display_name as sellerDisplayName',
        'seller.slug as sellerSlug',
        'obligation.settled_at as settledAt',
        'obligation.terms_version as termsVersion',
        'offer.capability_id as capabilityId',
        'offer.description as offerDescription',
        'offer.offer_id as offerId',
        'settlement.provider as settlementProvider',
        'settlement.settlement_id as settlementId',
        'settlement.state as settlementState',
        'settlement.transaction_hash as settlementTransactionHash',
        'settlement.updated_at as settlementUpdatedAt',
        'payment.payment_id as paymentId',
        'payment.provider_transaction_id as paymentProviderReference',
        'payment.state as paymentState',
        'execution.completed_at as deliveryCompletedAt',
        'execution.execution_id as executionId',
        'execution.output_sha256 as outputSha256',
        'execution.source_reference as deliverySourceReference',
        'execution.state as deliveryState',
        'job.job_id as jobId',
        'job.contract_address as jobContractAddress',
        'job.protocol_job_id as protocolJobId',
        'job.protocol_status as jobStatus',
        'job.terminal_at as jobTerminalAt',
        'identity.agent_id as erc8004AgentId',
        'identity.agent_registry as erc8004AgentRegistry',
        'identity.identity_id as erc8004IdentityId',
      ])
      .orderBy('obligation.created_at', 'desc');

    const businessId = query.businessId;
    const filteredQuery =
      businessId === undefined
        ? baseQuery
        : baseQuery.where((expression) =>
            expression.or([
              expression('obligation.buyer_business_id', '=', businessId),
              expression('obligation.seller_business_id', '=', businessId),
            ]),
          );
    const rows = await (query.limit === undefined
      ? filteredQuery
      : filteredQuery.limit(query.limit)
    ).execute();

    if (rows.length === 0) return [];

    const obligationIds = rows.map((row) => row.obligationId);
    const jobIds = rows.flatMap((row) => (row.jobId === null ? [] : [row.jobId]));
    const subjectIds = rows.flatMap((row) =>
      [row.settlementId, row.executionId, row.jobId, row.erc8004IdentityId].filter(
        (value): value is string => value !== null,
      ),
    );

    const [effects, operations, evidence] = await Promise.all([
      database
        .selectFrom('economic_entries')
        .select([
          'amount_micro_usdc as amountMicroUsdc',
          'business_id as businessId',
          'category',
          'direction',
          'obligation_id as obligationId',
        ])
        .where('obligation_id', 'in', obligationIds)
        .orderBy('occurred_at')
        .execute(),
      jobIds.length === 0
        ? Promise.resolve([])
        : database
            .selectFrom('erc8183_job_operations')
            .select([
              'job_id as jobId',
              'leg',
              'state',
              'transaction_hash as transactionHash',
            ])
            .where('job_id', 'in', jobIds)
            .orderBy('created_at')
            .execute(),
      subjectIds.length === 0
        ? Promise.resolve([])
        : database
            .selectFrom('evidence_facts')
            .select([
              'coverage',
              'fact_type as factType',
              'source_reference as sourceReference',
              'source_type as sourceType',
              'subject_id as subjectId',
              'verification',
            ])
            .where('subject_id', 'in', subjectIds)
            .orderBy('observed_at')
            .execute(),
    ]);

    return rows.map((row) => {
      const jobOperations = operations.filter((operation) => operation.jobId === row.jobId);
      const evidenceSubjectIds = new Set(
        [row.settlementId, row.executionId, row.jobId, row.erc8004IdentityId].filter(
          (value): value is string => value !== null,
        ),
      );
      const statusInput = {
        deliveryState: row.deliveryState,
        jobOperationStates: jobOperations.map((operation) => operation.state),
        jobStatus: row.jobStatus,
        paymentState: row.paymentState,
        settlementState: row.settlementState,
      } as const;
      const proofs: ActivityProof[] = [
        {
          kind: 'APPLICATION_RECORD',
          label: 'Inomasa Business context',
          reference: row.obligationId,
          scope: 'BUSINESS_CONTEXT',
          verification: 'APPLICATION_RECORDED',
        },
      ];

      for (const fact of evidence) {
        if (!evidenceSubjectIds.has(fact.subjectId)) continue;
        proofs.push({
          kind: proofKind(fact.sourceType, fact.sourceReference),
          label: fact.factType.replaceAll('_', ' '),
          reference: fact.sourceReference,
          scope: fact.coverage,
          verification: fact.verification,
        });
      }
      for (const operation of jobOperations) {
        if (operation.transactionHash === null) continue;
        proofs.push({
          kind: 'ARC_TRANSACTION',
          label: `ERC-8183 ${operation.leg.replaceAll('_', ' ')}`,
          reference: operation.transactionHash,
          scope: 'JOB_LIFECYCLE',
          verification: 'CHAIN_VERIFIED',
        });
      }
      if (row.jobContractAddress !== null) {
        proofs.push({
          kind: 'ARC_CONTRACT',
          label: `ERC-8183 contract${row.protocolJobId === null ? '' : ` · job ${row.protocolJobId}`}`,
          reference: row.jobContractAddress,
          scope: 'JOB_LIFECYCLE',
          verification: 'CHAIN_VERIFIED',
        });
      }
      if (row.deliverySourceReference !== null) {
        proofs.push({
          kind: row.deliverySourceReference.startsWith('arc-block:')
            ? 'ARC_BLOCK'
            : 'APPLICATION_RECORD',
          label: 'Service delivery source',
          reference: row.deliverySourceReference,
          scope: 'SERVICE_OUTPUT',
          verification: 'PROVIDER_REPORTED',
        });
      }
      if (row.outputSha256 !== null) {
        proofs.push({
          kind: 'CONTENT_DIGEST',
          label: 'Service output SHA-256',
          reference: row.outputSha256,
          scope: 'SERVICE_OUTPUT',
          verification: 'APPLICATION_RECORDED',
        });
      }
      if (
        row.paymentProviderReference !== null &&
        !proofs.some((proof) => proof.reference === row.paymentProviderReference)
      ) {
        proofs.push({
          kind: 'PROVIDER_RECEIPT',
          label: 'Circle Gateway x402 receipt',
          reference: row.paymentProviderReference,
          scope: 'PROTOCOL_PAYMENT',
          verification: 'PROVIDER_REPORTED',
        });
      }
      if (
        row.settlementTransactionHash !== null &&
        !proofs.some((proof) => proof.reference === row.settlementTransactionHash)
      ) {
        proofs.push({
          kind: 'ARC_TRANSACTION',
          label: 'Arc USDC settlement',
          reference: row.settlementTransactionHash,
          scope: 'SETTLEMENT_ONLY',
          verification: 'CHAIN_VERIFIED',
        });
      }

      const occurredAt =
        row.deliveryCompletedAt ??
        row.jobTerminalAt ??
        row.settledAt ??
        row.settlementUpdatedAt ??
        row.createdAt;

      return {
        activityId: row.obligationId as `obl_${string}`,
        agent:
          row.requesterPrincipalId === null || row.requesterPrincipalKind !== 'AGENT'
            ? null
            : {
                agentId: row.erc8004AgentId,
                agentPrincipalId: row.requesterPrincipalId as `agt_${string}`,
                agentRegistry: row.erc8004AgentRegistry,
                displayName: row.requesterDisplayName ?? row.requesterPrincipalId,
                identityId: row.erc8004IdentityId as `aid_${string}` | null,
              },
        amountMicroUsdc: row.amountMicroUsdc,
        asset: 'USDC',
        buyer: {
          businessId: row.buyerBusinessId as `biz_${string}`,
          displayName: row.buyerDisplayName,
          slug: row.buyerSlug,
        },
        economicEffects: effects
          .filter((effect) => effect.obligationId === row.obligationId)
          .map((effect) => ({
            amountMicroUsdc: effect.amountMicroUsdc,
            businessId: effect.businessId as `biz_${string}`,
            category: effect.category,
            direction: effect.direction,
          })),
        environment: row.environment,
        occurredAt,
        offer: {
          capabilityId: row.capabilityId,
          description: row.offerDescription,
          offerId: row.offerId as `off_${string}`,
          termsVersion: row.termsVersion,
        },
        outcome: deriveActivityOutcome(statusInput),
        proofs: uniqueProofs(proofs),
        protocols: deriveActivityProtocols({
          hasArcUsdcSettlement: row.settlementId !== null,
          hasErc8004Identity: row.erc8004IdentityId !== null,
          hasErc8183Job: row.jobId !== null,
          hasX402Payment: row.paymentId !== null,
        }),
        provenance: row.provenance as EconomicActivity['provenance'],
        seller: {
          businessId: row.sellerBusinessId as `biz_${string}`,
          displayName: row.sellerDisplayName,
          slug: row.sellerSlug,
        },
        settlement: {
          provider: row.settlementProvider,
          settlementId: row.settlementId as `set_${string}` | null,
          state: row.settlementState,
        },
        status: deriveActivityStatus(statusInput),
        work:
          row.jobId === null
            ? null
            : {
                jobId: row.jobId as `job_${string}`,
                protocolJobId: row.protocolJobId,
                protocolStatus: row.jobStatus ?? 'UNCREATED',
              },
      } satisfies EconomicActivity;
    });
  }
}
