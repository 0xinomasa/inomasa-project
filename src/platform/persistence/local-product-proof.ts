import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';

import { proposalDigest, type BusinessCreationProposal } from '../../modules/business/creation-assistance.ts';
import { connectionIdentity, externalManifestDigest } from '../../modules/business/external-connection.ts';
import { createBusinessGenesis } from '../../modules/business/model.ts';
import { createPendingCircleTreasuryBinding } from '../../modules/business/treasury.ts';
import { canonicalJson } from '../../shared/canonical-json.ts';
import { PostgresAlphaBusinessRepository } from './alpha-business-repository.ts';
import { PostgresAlphaServiceRepository, type AlphaServiceExecutionAuthorization } from './alpha-service-repository.ts';
import { applicationSchema, type PostgresPersistence } from './database.ts';

/** Isolated synthetic persistence proof. No provider call or real payment occurs. */
export async function runLocalProductPersistenceProof(persistence: PostgresPersistence): Promise<void> {
  const id = randomUUID().replaceAll('-', '');
  const now = new Date().toISOString();
  const controller = { principalId: `usr_local_${id}`, displayName: 'Local proof controller', actorClassification: 'COMMON_CONTROL_TEST', environment: 'PRIVATE_ARC_TESTNET' } as const;
  const database = persistence.databaseForApplication.withSchema(applicationSchema);
  const businesses = new PostgresAlphaBusinessRepository(persistence);
  const services = new PostgresAlphaServiceRepository(persistence);
  const manifest = { version: 1, externalBusinessId: id, displayName: 'Connected proof Business', summary: 'An isolated synthetic external origin.', templateId: 'api-data-compute' } as const;
  const connection = {
    sourceId: 'local-proof', controllerPrincipalId: controller.principalId,
    manifestUrl: 'https://example.com/inomasa.json', resourceUrl: 'https://example.com/resource.json',
    manifest, manifestSha256: externalManifestDigest(manifest), observedAt: now,
    authorityBasis: 'OPERATOR_CONFIGURED', provenance: 'EXTERNAL_SOURCE',
  } as const;
  const connectedIds = connectionIdentity(connection);
  const connected = createBusinessGenesis({ controller, commonControlGroupId: 'ccg_local_proof', ...manifest,
    entryRoute: 'MIGRATE', externalConnection: connection, ...connectedIds }, connectedIds, now);
  const proposal: BusinessCreationProposal = { displayName: 'Assisted proof Business', summary: 'A synthetic accepted proposal.',
    templateId: 'api-data-compute', firstService: 'A bounded data service.', economicReason: 'Pay for the service in Arc Testnet USDC.', nextSteps: ['Review the proposed service.'] };
  const assisted = createBusinessGenesis({ controller, commonControlGroupId: 'ccg_local_proof', ...proposal,
    slug: `assisted-proof-${id}`, genesisRequestId: `local-proof-${id}`,
    creationAssistance: { provider: 'GEMINI', model: 'gemini-test-fixture', generatedAt: now,
      inputSha256: createHash('sha256').update('synthetic proof input').digest('hex'), outputSha256: proposalDigest(proposal), proposal },
  }, { businessId: `biz_local_${id}`, controlId: `ctl_local_${id}`, eventId: `evt_local_${id}` }, now);
  const businessIds = [connected.business.businessId, assisted.business.businessId];
  const genesisIds = [connected.business.genesisRequestId, assisted.business.genesisRequestId];
  const offerId = `off_product_local_${id}` as const;
  const obligationId = `obl_local_${id}` as const;
  const settlementId = `set_local_${id}` as const;
  const executionId = `svc_local_${id}` as const;
  const authorization: AlphaServiceExecutionAuthorization = { alreadyComplete: false,
    buyerBusinessId: assisted.business.businessId, sellerBusinessId: connected.business.businessId,
    capabilityId: 'local-proof-resource', offerId, settlementId, environment: 'PRIVATE_ARC_TESTNET', provenance: 'COMMON_CONTROL_TEST' };
  const output = { data: { proof: 'synthetic-delivery' }, provenance: 'EXTERNAL_SOURCE' };
  const delivery = { authorization, executionId, obligationId, output,
    outputSha256: createHash('sha256').update(canonicalJson(output)).digest('hex'), completedAt: now,
    sourceReference: `external:local-proof:${id}`, sourceType: 'EXTERNAL_HTTP_JSON', factType: 'EXTERNAL_JSON_RESOURCE_DELIVERED' } as const;
  try {
    for (const genesis of [connected, assisted]) {
      const input = { controller, genesis, treasuryBinding: createPendingCircleTreasuryBinding({
        business: genesis.business, bindingId: `tbn_${genesis.business.businessId.slice(4)}`,
      }) };
      assert.equal((await businesses.registerGenesis(input)).created, true);
      assert.equal((await businesses.registerGenesis(input)).created, false);
    }
    assert.deepEqual((await businesses.getGenesisContext(assisted.business.businessId)).creationAssistance, assisted.creationAssistance);
    assert.deepEqual((await businesses.getGenesisContext(connected.business.businessId)).externalConnection, connection);
    assert.equal((await businesses.getBusinessSiteBySlug(connected.business.slug))?.externalConnection, undefined);
    assert.equal(await businesses.getBusinessSiteBySlug(connected.business.slug, `usr_other_${id}`), undefined);
    assert.deepEqual((await businesses.getBusinessSiteBySlug(connected.business.slug, controller.principalId))?.externalConnection, connection);
    await assert.rejects(businesses.registerGenesis({ controller,
      genesis: { ...connected, externalConnection: { ...connection, resourceUrl: 'https://example.com/changed.json' } },
      treasuryBinding: createPendingCircleTreasuryBinding({ business: connected.business, bindingId: connectedIds.bindingId }),
    }), /different context/);
    const treasuries = await database.selectFrom('treasury_bindings').select(['status', 'address'])
      .where('business_id', 'in', businessIds).execute();
    assert.equal(treasuries.length, 2);
    assert.ok(treasuries.every((treasury) => treasury.status === 'PENDING' && treasury.address === null));

    await database.insertInto('service_offers').values({ offer_id: offerId, capability_id: authorization.capabilityId,
      commerce_protocol: 'X402', created_by_principal_id: controller.principalId, description: 'Synthetic persistence proof.',
      idempotency_key: id, price_micro_usdc: '10000', provider_business_id: connected.business.businessId,
      status: 'ACTIVE', terms_version: 1 }).execute();
    await database.insertInto('obligations').values({ obligation_id: obligationId, amount_micro_usdc: '10000', asset: 'USDC',
      buyer_business_id: assisted.business.businessId, seller_business_id: connected.business.businessId, offer_id: offerId,
      environment: 'PRIVATE_ARC_TESTNET', provenance: 'COMMON_CONTROL_TEST', state: 'OPEN', settled_at: null,
      terms_version: 1, execution_authorization_id: null, represented_business_id: null, requester_principal_id: null }).execute();
    await database.insertInto('settlement_operations').values({ settlement_id: settlementId, obligation_id: obligationId,
      amount_micro_usdc: '10000', asset_address: '0x3600000000000000000000000000000000000000', chain_id: 5042002, idempotency_key: randomUUID(),
      provider: 'CIRCLE', state: 'AUTHORIZED', provider_state: null, provider_transaction_id: null, transaction_hash: null, updated_at: now }).execute();
    await assert.rejects(services.getExecutionAuthorization(executionId, obligationId), /COMPLETE/);
    await assert.rejects(services.recordCompletedResource(delivery), /COMPLETE/);
    assert.equal((await database.selectFrom('service_executions').select('execution_id').where('obligation_id', '=', obligationId).execute()).length, 0);

    // Synthetic settled rows exercise the persistence boundary only, without chain evidence.
    await database.updateTable('obligations').set({ state: 'SETTLED', settled_at: now }).where('obligation_id', '=', obligationId).execute();
    await database.updateTable('settlement_operations').set({ state: 'COMPLETE' }).where('settlement_id', '=', settlementId).execute();
    await assert.rejects(services.recordCompletedResource({ ...delivery, authorization: { ...authorization, buyerBusinessId: connected.business.businessId } }), /matching/);
    await assert.rejects(services.recordCompletedResource({ ...delivery, authorization: { ...authorization, capabilityId: 'wrong-capability' } }), /matching/);
    await assert.rejects(services.recordCompletedResource({ ...delivery, outputSha256: '0'.repeat(64) }), /digest/);
    await assert.rejects(services.recordCompletedResource({ ...delivery, sourceType: 'ARC_TESTNET_RPC' }), /classification/);
    assert.equal((await services.getExecutionAuthorization(executionId, obligationId)).alreadyComplete, false);
    assert.equal((await services.recordCompletedResource(delivery)).created, true);
    assert.equal((await services.recordCompletedResource(delivery)).created, false);
    assert.equal((await services.getExecutionAuthorization(executionId, obligationId)).alreadyComplete, true);
    await assert.rejects(services.getExecutionAuthorization(executionId, `obl_other_${id}`), /another obligation/);
    await assert.rejects(services.recordCompletedResource({ ...delivery, executionId: `svc_other_${id}` }), /different service/);
    const evidence = await database.selectFrom('evidence_facts').selectAll().where('subject_id', '=', executionId).execute();
    assert.equal(evidence.length, 1);
    assert.equal(evidence[0]?.verification, 'PROVIDER_REPORTED');
    assert.equal(evidence[0]?.source_type, 'EXTERNAL_HTTP_JSON');
    assert.equal((await database.selectFrom('economic_entries').select('entry_id').where('business_id', 'in', businessIds).execute()).length, 0);
  } finally {
    await persistence.transaction(async (transaction) => {
      const cleanup = transaction.withSchema(applicationSchema);
      await cleanup.deleteFrom('evidence_facts').where('subject_id', '=', executionId).execute();
      await cleanup.deleteFrom('service_executions').where('obligation_id', '=', obligationId).execute();
      await cleanup.deleteFrom('settlement_operations').where('settlement_id', '=', settlementId).execute();
      await cleanup.deleteFrom('obligations').where('obligation_id', '=', obligationId).execute();
      await cleanup.deleteFrom('service_offers').where('offer_id', '=', offerId).execute();
      await cleanup.deleteFrom('treasury_bindings').where('business_id', 'in', businessIds).execute();
      await cleanup.deleteFrom('business_events').where('business_id', 'in', businessIds).execute();
      await cleanup.deleteFrom('business_controls').where('business_id', 'in', businessIds).execute();
      await cleanup.deleteFrom('business_sites').where('business_id', 'in', businessIds).execute();
      await cleanup.deleteFrom('businesses').where('business_id', 'in', businessIds).execute();
      await cleanup.deleteFrom('genesis_requests').where('genesis_request_id', 'in', genesisIds).execute();
      await cleanup.deleteFrom('principals').where('principal_id', 'in', [...businessIds, controller.principalId]).execute();
    });
  }
  assert.equal((await database.selectFrom('principals').select('principal_id').where('principal_id', 'in', [...businessIds, controller.principalId]).execute()).length, 0);
}
