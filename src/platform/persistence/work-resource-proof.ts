import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createBusinessGenesis } from '../../modules/business/model.ts';
import { createPendingCircleTreasuryBinding } from '../../modules/business/treasury.ts';
import { createOperationalAgent, createProductOfferDraft } from '../../modules/business/operational-workspace.ts';
import { executeWorkStep, workDigest, type WorkScope, type WorkAnalyst } from '../../modules/business/work.ts';
import { PostgresAlphaBusinessRepository } from './alpha-business-repository.ts';
import { PostgresAgentRepository } from './agent-repository.ts';
import { PostgresBusinessWorkRepository } from './business-work-repository.ts';
import { PostgresWorkResourceRepository } from './work-resource-repository.ts';
import { PostgresOperationalWorkspaceRepository } from './operational-workspace-repository.ts';
import { PostgresGatewayX402Repository } from './gateway-x402-repository.ts';
import { PostgresAlphaServiceRepository } from './alpha-service-repository.ts';
import { arcGatewayTestnet } from '../circle/gateway-x402.ts';
import { applicationSchema, type PostgresPersistence } from './database.ts';
import type { prepareProductEconomicOperation } from '../../app/_commerce/application.ts';

/** Synthetic identities/provider outcomes in an isolated DB; uses the actual PREPARE composition. */
export async function runWorkResourceProof(persistence:PostgresPersistence,prepare:typeof prepareProductEconomicOperation):Promise<void>{
  const id=randomUUID().replaceAll('-','').slice(0,16),now=new Date().toISOString();
  const db=persistence.databaseForApplication.withSchema(applicationSchema);
  const biz=new PostgresAlphaBusinessRepository(persistence),agents=new PostgresAgentRepository(persistence);
  const works=new PostgresBusinessWorkRepository(persistence),resources=new PostgresWorkResourceRepository(persistence),operations=new PostgresOperationalWorkspaceRepository(persistence);
  const scopes:WorkScope[]=[],businessIds:string[]=[],agentIds:string[]=[],genesisIds:string[]=[],principalIds:string[]=[];
  const accounts=['0x1111111111111111111111111111111111111111','0x2222222222222222222222222222222222222222'] as const;
  try{
    for(let n=0;n<2;n++){
      const controller={principalId:`usr_res_${id}_${n}`,displayName:'Synthetic resource owner',actorClassification:'COMMON_CONTROL_TEST',environment:'PRIVATE_ARC_TESTNET'} as const;
      const genesis=createBusinessGenesis({controller,displayName:`Resource proof ${n}`,summary:'Synthetic closed economy mechanics proof.',templateId:'api-data-compute',commonControlGroupId:'ccg_work_resource',slug:`res-${id}-${n}`,genesisRequestId:`res-gen-${id}-${n}`},
        {businessId:`biz_res_${id}_${n}`,controlId:`ctl_res_${id}_${n}`,eventId:`evt_res_${id}_${n}`},now);
      await biz.registerGenesis({controller,genesis,treasuryBinding:createPendingCircleTreasuryBinding({business:genesis.business,bindingId:`tbn_res_${id}_${n}`})});
      scopes.push({controllerPrincipalId:controller.principalId,slug:genesis.business.slug,environment:'PRIVATE_ARC_TESTNET'});
      businessIds.push(genesis.business.businessId);principalIds.push(controller.principalId,genesis.business.businessId);genesisIds.push(genesis.business.genesisRequestId);
      // Isolated fixture preparation, not Circle wallet provisioning.
      await db.updateTable('treasury_bindings').set({status:'ACTIVE',address:accounts[n]!,provider_wallet_id:`synthetic-wallet-${n}`}).where('business_id','=',genesis.business.businessId).execute();
      for(const capability of ['research','purchase-service'] as const){
        const agent=createOperationalAgent({businessId:genesis.business.businessId,capability,displayName:`Resource ${capability}`,environment:'PRIVATE_ARC_TESTNET',role:capability==='research'?'RESEARCH_AGENT':'COMMERCE_AGENT'});
        await agents.ensureAgent(agent,controller.principalId);agentIds.push(agent.agentPrincipalId);
        if(capability==='purchase-service')await db.insertInto('erc8004_identity_operations').values({identity_id:`aid_res_${id}_${n}`,agent_principal_id:agent.agentPrincipalId,chain_id:5042002,
          identity_registry_address:accounts[0],reputation_registry_address:accounts[1],owner_address:accounts[n]!,agent_id:'1',agent_registry:'synthetic-registry',
          registration_uri:null,registration_provider_transaction_id:null,registration_transaction_hash:null,metadata_provider_transaction_id:null,metadata_transaction_hash:null,
          provider_state:'SYNTHETIC',state:'VERIFIED',provenance:'COMMON_CONTROL_TEST',verified_at:now,updated_at:now}).execute();
      }
    }
    const buyer=scopes[0]!,seller=scopes[1]!;
    const offer=createProductOfferDraft({businessId:businessIds[1] as `biz_${string}`,controllerPrincipalId:seller.controllerPrincipalId,name:'Arc data service',description:'Arc network snapshot for this controlled resource proof.',price:'0.05',protocol:'X402'});
    await operations.ensureOffer({...offer,controllerPrincipalId:seller.controllerPrincipalId,slug:seller.slug});
    await operations.activateOffer({...seller,offerId:offer.offerId});
    assert.equal((await operations.listActivatedProductOffersForBuyer(buyer))?.length,0);
    await assert.rejects(operations.shareOffer({...buyer,offerId:offer.offerId,shared:true}),/controlling/);
    await operations.shareOffer({...seller,offerId:offer.offerId,shared:true});
    assert.equal((await operations.listActivatedProductOffersForBuyer(buyer))?.length,1);
    await db.updateTable('businesses').set({environment:'AUTOMATED_TEST'}).where('business_id','=',businessIds[1]!).execute();
    assert.equal((await operations.listActivatedProductOffersForBuyer(buyer))?.length,0);
    await db.updateTable('businesses').set({environment:'PRIVATE_ARC_TESTNET'}).where('business_id','=',businessIds[1]!).execute();
    let work=(await works.create(buyer,{requestKey:randomUUID(),agentId:agentIds[0]!,objective:'Explain the delivered network snapshot.',acceptanceCriteria:'Use the purchased data and state its limits.'})).work;
    const proposal={workId:work.workId,revision:work.revision,offerId:offer.offerId,reason:'Obtain the provider snapshot as the recorded input for this research.'};
    const requirement=await resources.propose(buyer,proposal);
    assert.equal((await resources.propose(buyer,proposal)).requestId,requirement.requestId);
    await assert.rejects(resources.propose(buyer,{...proposal,reason:'A different purpose'}),/different/);
    await assert.rejects(resources.propose(seller,proposal),/not found/);
    work=await works.get(buyer,work.workId);
    await assert.rejects(works.claim(buyer,work.workId,work.revision,null),/waiting/);
    let requirementsCalls=0;
    const readRequirements:NonNullable<Parameters<typeof prepare>[2]>=async input=>{requirementsCalls++;return {scheme:'exact',network:'eip155:5042002',asset:'0x3600000000000000000000000000000000000000',amount:input.amountMicroUsdc.toString(),payTo:input.payToAddress,maxTimeoutSeconds:3600,
      extra:{name:'GatewayWalletBatched',version:'1',verifyingContract:arcGatewayTestnet.contractAddress,minValiditySeconds:3600}};};
    const confirm={action:'PREPARE',businessSlug:buyer.slug,controllerPrincipalId:buyer.controllerPrincipalId,kind:'X402_PURCHASE',offerId:offer.offerId,requestId:requirement.requestId,agentPrincipalId:agentIds[1]!,workResource:{workId:work.workId,revision:work.revision}} as const;
    const count=async()=>Number((await db.selectFrom('obligations').select(({fn})=>fn.countAll<string>().as('n')).where('buyer_business_id','=',businessIds[0]!).executeTakeFirstOrThrow()).n);
    await assert.rejects(prepare(persistence,{...confirm,agentPrincipalId:agentIds[0]!},readRequirements),/purchase-service/);
    await assert.rejects(prepare(persistence,{...confirm,workResource:undefined} as unknown as Parameters<typeof prepare>[1],readRequirements),/original work/);
    await operations.shareOffer({...seller,offerId:offer.offerId,shared:false});
    await assert.rejects(prepare(persistence,confirm,readRequirements),/not active/);
    await operations.shareOffer({...seller,offerId:offer.offerId,shared:true});
    await db.updateTable('service_offers').set({price_micro_usdc:'60000'}).where('offer_id','=',offer.offerId).execute();
    await assert.rejects(prepare(persistence,confirm,readRequirements),/terms or recipient changed/);assert.equal(await count(),0);
    assert.equal((await resources.list(buyer))[0]?.state,'PROPOSED');
    await db.updateTable('service_offers').set({price_micro_usdc:'50000'}).where('offer_id','=',offer.offerId).execute();
    // Withdrawal during provider discovery must abort the entire confirmation transaction.
    await assert.rejects(prepare(persistence,confirm,async input=>{await operations.shareOffer({...seller,offerId:offer.offerId,shared:false});return readRequirements(input);}),/no longer available/);
    assert.equal(await count(),0);
    await operations.shareOffer({...seller,offerId:offer.offerId,shared:true});
    const prepared=await prepare(persistence,confirm,readRequirements);
    assert.equal(await count(),1);assert.equal((await resources.list(buyer))[0]?.state,'APPROVED');
    const afterPrepare=requirementsCalls;
    assert.equal((await prepare(persistence,confirm,readRequirements)).request.requestId,requirement.requestId);
    assert.equal(requirementsCalls,afterPrepare);assert.equal(await count(),1);
    await assert.rejects(prepare(persistence,{...confirm,agentPrincipalId:agentIds[3]!},readRequirements),/replay changed/);
    await operations.shareOffer({...seller,offerId:offer.offerId,shared:false});
    work=await works.get(buyer,work.workId);
    await assert.rejects(resources.decline(buyer,work.workId,work.revision),/unconfirmed/);
    await assert.rejects(works.claim(buyer,work.workId,work.revision,null),/pending/);
    const payments=new PostgresGatewayX402Repository(persistence),services=new PostgresAlphaServiceRepository(persistence);
    const paymentId=prepared.request.paymentId as `pay_${string}`,obligationId=prepared.request.obligationId as `obl_${string}`,executionId=prepared.request.serviceExecutionId as `svc_${string}`;
    // Explicit synthetic signature/verification injection; no external signing or funds.
    await db.updateTable('x402_payment_operations').set({state:'OUTCOME_UNKNOWN',payment_payload:JSON.stringify({synthetic:true}),payment_payload_sha256:workDigest({synthetic:true})}).where('payment_id','=',paymentId).execute();
    await assert.rejects(works.claim(buyer,work.workId,work.revision,null),/pending/);
    const completion={paymentId,observedAt:now,providerTransactionId:`synthetic-receipt-${id}`};
    await payments.recordComplete(completion);await payments.recordComplete(completion);
    await assert.rejects(works.claim(buyer,work.workId,work.revision,null),/pending/);
    const snapshot={blockNumber:123n,chainId:5042002 as const,gasPriceWei:456n,observedAt:now,usdcCodeSha256:'a'.repeat(64)};
    const output={...snapshot,blockNumber:'123',gasPriceWei:'456'};
    const authorization=await services.getExecutionAuthorization(executionId,obligationId);
    await services.recordCompletedSnapshot({authorization,executionId,obligationId,snapshot,outputSha256:workDigest(output)});
    await services.recordCompletedSnapshot({authorization,executionId,obligationId,snapshot,outputSha256:workDigest(output)});
    // A corrupted result must not be attached even when money is settled.
    await db.updateTable('service_executions').set({output_sha256:'b'.repeat(64)}).where('execution_id','=',executionId).execute();
    await assert.rejects(works.claim(buyer,work.workId,work.revision,null),/evidence does not match/);
    await db.updateTable('service_executions').set({output_sha256:workDigest(output)}).where('execution_id','=',executionId).execute();
    let observed=0,analyzed=0;
    const analyst:WorkAnalyst={provider:'SYNTHETIC',model:'resource-proof',analyze:async input=>{analyzed++;assert.equal(input.observation.blockNumber,'123');assert.equal(input.resource?.requestId,requirement.requestId);assert.equal(input.resource?.outputSha256,workDigest(output));
      const analysis={title:'Synthetic resource analysis',summary:'This verifies stored input linkage only.',findings:['Input is attributed to the approved purchase.'],limitations:['No real provider or independent demand was tested.']};
      return {provider:'SYNTHETIC',model:'resource-proof',generatedAt:now,inputSha256:workDigest(input),outputSha256:workDigest(analysis),analysis};}};
    const observe=async()=>{observed++;throw new Error('Paid work must not read a replacement source.');};
    work=await executeWorkStep({repository:new PostgresBusinessWorkRepository(persistence),scope:buyer,workId:work.workId,revision:work.revision,observe,analyst});
    assert.equal(work.step,'ANALYZE');assert.equal(observed,0);assert.equal((await resources.list(buyer))[0]?.state,'ATTACHED');
    work=await executeWorkStep({repository:new PostgresBusinessWorkRepository(persistence),scope:buyer,workId:work.workId,revision:work.revision,observe,analyst});
    assert.equal(analyzed,1);work=await works.review(buyer,work.workId,work.revision,true,'Mechanics proof accepted; not independent output-quality proof.');
    assert.equal(work.state,'COMPLETED');assert.equal(await count(),1);
    assert.equal((await db.selectFrom('economic_entries').selectAll().where('settlement_id','=',prepared.request.settlementId).execute()).length,2);
    assert.equal((await db.selectFrom('service_executions').selectAll().where('obligation_id','=',obligationId).execute()).length,1);
    await assert.rejects(works.get(seller,work.workId),/not found/);
    assert.equal((await resources.list(seller)).length,0);
  }finally{
    await persistence.transaction(async tx=>{
      const c=tx.withSchema(applicationSchema);
      const workRows=await c.selectFrom('business_work').select('work_id').where('business_id','in',businessIds).execute();
      if(workRows.length){const ids=workRows.map(w=>w.work_id);await c.deleteFrom('business_work_resources').where('work_id','in',ids).execute();await c.deleteFrom('business_work_attempts').where('work_id','in',ids).execute();await c.deleteFrom('business_work').where('work_id','in',ids).execute();}
      const requests=await c.selectFrom('product_economic_requests').selectAll().where('buyer_business_id','in',businessIds).execute();
      for(const r of requests){
        await c.deleteFrom('evidence_facts').where('subject_id','in',[r.settlement_id,r.service_execution_id]).execute();
        await c.deleteFrom('economic_entries').where('settlement_id','=',r.settlement_id).execute();
        await c.deleteFrom('service_executions').where('obligation_id','=',r.obligation_id).execute();
        await c.deleteFrom('product_economic_requests').where('request_id','=',r.request_id).execute();
        await c.deleteFrom('x402_payment_operations').where('obligation_id','=',r.obligation_id).execute();
        await c.deleteFrom('settlement_operations').where('settlement_id','=',r.settlement_id).execute();
        await c.updateTable('execution_authorizations').set({obligation_id:null,consumed_at:null,state:'REVOKED'}).where('obligation_id','=',r.obligation_id).execute();
        await c.deleteFrom('obligations').where('obligation_id','=',r.obligation_id).execute();
      }
      const grants=await c.selectFrom('standing_authority_grants').select('grant_id').where('represented_business_id','in',businessIds).execute();
      if(grants.length){const ids=grants.map(g=>g.grant_id);await c.deleteFrom('execution_authorizations').where('grant_id','in',ids).execute();await c.deleteFrom('authority_policy_decisions').where('grant_id','in',ids).execute();await c.deleteFrom('action_intents').where('grant_id','in',ids).execute();await c.deleteFrom('standing_authority_grants').where('grant_id','in',ids).execute();}
      await c.deleteFrom('service_offers').where('provider_business_id','in',businessIds).execute();
      await c.deleteFrom('erc8004_identity_operations').where('agent_principal_id','in',agentIds).execute();
      await c.deleteFrom('agent_registrations').where('business_id','in',businessIds).execute();
      await c.deleteFrom('treasury_bindings').where('business_id','in',businessIds).execute();
      await c.deleteFrom('business_events').where('business_id','in',businessIds).execute();
      await c.deleteFrom('business_controls').where('business_id','in',businessIds).execute();
      await c.deleteFrom('business_sites').where('business_id','in',businessIds).execute();
      await c.deleteFrom('businesses').where('business_id','in',businessIds).execute();
      await c.deleteFrom('genesis_requests').where('genesis_request_id','in',genesisIds).execute();
      await c.deleteFrom('principals').where('principal_id','in',[...principalIds,...agentIds]).execute();
    });
  }
}
