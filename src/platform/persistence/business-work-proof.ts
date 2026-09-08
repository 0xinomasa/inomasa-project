import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createBusinessGenesis } from '../../modules/business/model.ts';
import { createPendingCircleTreasuryBinding } from '../../modules/business/treasury.ts';
import { createOperationalAgent } from '../../modules/business/operational-workspace.ts';
import { executeWorkStep, workDigest, WorkProviderError, type WorkAnalyst, type WorkObservation, type WorkScope } from '../../modules/business/work.ts';
import { PostgresAlphaBusinessRepository } from './alpha-business-repository.ts';
import { PostgresAgentRepository } from './agent-repository.ts';
import { PostgresBusinessWorkRepository } from './business-work-repository.ts';
import { applicationSchema, type PostgresPersistence } from './database.ts';

/** Isolated synthetic proof with explicit crash injection; no live provider or financial calls. */
export async function runBusinessWorkPersistenceProof(persistence:PostgresPersistence):Promise<void>{
  const id=randomUUID().replaceAll('-','');
  const db=persistence.databaseForApplication.withSchema(applicationSchema);
  const businesses=new PostgresAlphaBusinessRepository(persistence);
  const agents=new PostgresAgentRepository(persistence);
  const repo=new PostgresBusinessWorkRepository(persistence);
  const businessIds:`biz_${string}`[]=[];const principalIds:string[]=[];const requests:string[]=[];const agentIds:string[]=[];
  const scopes:WorkScope[]=[];
  const now=new Date().toISOString();
  const observation:WorkObservation={chainId:5042002,blockNumber:'100',gasPriceWei:'12345',usdcCodeSha256:'a'.repeat(64),observedAt:now,source:'ARC_TESTNET_RPC'};
  let sourceCalls=0,aiCalls=0;
  const observe=async()=>{sourceCalls++;return observation;};
  const analyst:WorkAnalyst={provider:'TEST',model:'synthetic-proof',analyze:async input=>{
    aiCalls++;const analysis={title:'Synthetic proof result',summary:'Only an isolated mechanics test.',findings:['A synthetic source input was retained.'],limitations:['Not a live Arc or Gemini result.']};
    return{provider:'TEST',model:'synthetic-proof',generatedAt:now,inputSha256:workDigest(input),outputSha256:workDigest(analysis),analysis};
  }};
  try{
    for(let n=0;n<2;n++){
      const controller={principalId:`usr_work_${id}_${n}`,displayName:'Synthetic work controller',actorClassification:'COMMON_CONTROL_TEST',environment:'AUTOMATED_TEST'} as const;
      const genesis=createBusinessGenesis({controller,displayName:`Synthetic work business ${n}`,summary:'Isolated reusable Business work proof.',templateId:'api-data-compute',commonControlGroupId:'ccg_business_work_proof',slug:`work-proof-${id}-${n}`,genesisRequestId:`work-${id}-${n}`},
        {businessId:`biz_work_${id}_${n}`,controlId:`ctl_work_${id}_${n}`,eventId:`evt_work_${id}_${n}`},now);
      await businesses.registerGenesis({controller,genesis,treasuryBinding:createPendingCircleTreasuryBinding({business:genesis.business,bindingId:`tbn_work_${id}_${n}`})});
      businessIds.push(genesis.business.businessId);principalIds.push(controller.principalId,genesis.business.businessId);requests.push(genesis.business.genesisRequestId);
      const agent=createOperationalAgent({businessId:genesis.business.businessId,capability:'research',displayName:'Synthetic research Agent',environment:'AUTOMATED_TEST',role:'RESEARCH_AGENT'});
      await agents.ensureAgent(agent,controller.principalId);agentIds.push(agent.agentPrincipalId);
      scopes.push({controllerPrincipalId:controller.principalId,slug:genesis.business.slug,environment:'AUTOMATED_TEST'});
    }
    const first=scopes[0]!;const second=scopes[1]!;
    const create={requestKey:randomUUID(),agentId:agentIds[0]!,objective:'Inspect supplied public network data.',acceptanceCriteria:'Explain the observation limits.'};
    const original=await repo.create(first,create);assert.equal(original.created,true);
    assert.equal((await repo.create(first,create)).created,false);
    await assert.rejects(repo.create(first,{...create,objective:'Changed intent'}),/different content/);
    await assert.rejects(repo.create(first,{...create,requestKey:randomUUID(),agentId:agentIds[1]!}),/research-capable/);
    await assert.rejects(repo.get(second,original.work.workId),/not found/);
    await assert.rejects(repo.list({...first,environment:'PRIVATE_ARC_TESTNET'}),/not found/);
    const claims=await Promise.allSettled([repo.claim(first,original.work.workId,0,analyst),repo.claim(first,original.work.workId,0,analyst)]);
    assert.equal(claims.filter(c=>c.status==='fulfilled').length,1);
    const claimed=claims.find(c=>c.status==='fulfilled');assert.ok(claimed?.status==='fulfilled');assert.ok(claimed.value.attemptId);
    const resumed=new PostgresBusinessWorkRepository(persistence);
    let work=await resumed.finish(first,original.work.workId,claimed.value.attemptId,{observation});
    await assert.rejects(repo.finish(first,work.workId,claimed.value.attemptId,{observation}),/no longer owns/);
    assert.deepEqual((await resumed.get(first,work.workId)).observation,observation);
    work=await executeWorkStep({repository:resumed,scope:first,workId:work.workId,revision:work.revision,observe,analyst:null});
    assert.equal(work.failure,'NOT_CONFIGURED');
    work=await executeWorkStep({repository:resumed,scope:first,workId:work.workId,revision:work.revision,observe,analyst:{...analyst,analyze:async()=>{throw new WorkProviderError('QUOTA');}}});
    assert.equal(work.failure,'QUOTA');assert.deepEqual(work.observation,observation);
    work=await executeWorkStep({repository:resumed,scope:first,workId:work.workId,revision:work.revision,observe,analyst});
    assert.equal(work.state,'WAITING_REVIEW');assert.equal(sourceCalls,0);assert.equal(aiCalls,1);
    await assert.rejects(resumed.review(second,work.workId,work.revision,true,'Cross owner'),/not found/);
    const beforeReview=work.revision;work=await resumed.review(first,work.workId,beforeReview,true,'Synthetic result satisfies this mechanics proof only.');
    assert.equal(work.state,'COMPLETED');assert.equal(work.reviewedBy,first.controllerPrincipalId);
    await assert.rejects(resumed.review(first,work.workId,beforeReview,true,'Replay'),/changed/);
    work=await executeWorkStep({repository:resumed,scope:first,workId:work.workId,revision:work.revision,observe,analyst});assert.equal(aiCalls,1);
    assert.equal(work.state,'COMPLETED');

    // A second controller and Business use exactly the same executor and tables.
    let other=(await repo.create(second,{...create,requestKey:randomUUID(),agentId:agentIds[1]!})).work;
    const abandoned=await repo.claim(second,other.workId,other.revision,analyst);assert.ok(abandoned.attemptId);
    // Fault injection only in this isolated proof, never against historical evidence.
    await db.updateTable('business_work').set({lease_until:new Date(Date.now()-1000)}).where('work_id','=',other.workId).execute();
    await assert.rejects(repo.finish(second,other.workId,abandoned.attemptId,{observation}),/no longer owns/);
    const beforeRecovery=sourceCalls;
    other=await executeWorkStep({repository:repo,scope:second,workId:other.workId,revision:abandoned.work.revision,observe,analyst});
    assert.equal(other.failure,'OUTCOME_UNKNOWN');assert.equal(sourceCalls,beforeRecovery);
    const next=await repo.claim(second,other.workId,other.revision,analyst);assert.ok(next.attemptId);
    await assert.rejects(repo.finish(second,other.workId,abandoned.attemptId,{observation}),/no longer owns/);
    other=await repo.finish(second,other.workId,next.attemptId,{observation});
    // A lost model response consumes an attempt, is inspectable, and is not silently retried.
    const lostAi=await repo.claim(second,other.workId,other.revision,analyst);assert.ok(lostAi.attemptId);
    await db.updateTable('business_work').set({lease_until:new Date(Date.now()-1000)}).where('work_id','=',other.workId).execute();
    other=await executeWorkStep({repository:repo,scope:second,workId:other.workId,revision:lostAi.work.revision,observe,analyst});
    assert.equal(other.failure,'OUTCOME_UNKNOWN');assert.equal(aiCalls,1);
    other=await executeWorkStep({repository:repo,scope:second,workId:other.workId,revision:other.revision,observe,analyst});
    assert.equal(other.state,'WAITING_REVIEW');assert.equal(aiCalls,2);
    other=await repo.review(second,other.workId,other.revision,false,'Reject this synthetic result.');assert.equal(other.state,'CANCELLED');assert.ok(other.generation);
    assert.equal((await db.selectFrom('business_work_attempts').selectAll().where('work_id','=',other.workId).where('state','=','OUTCOME_UNKNOWN').execute()).length,2);

    let blocked=(await repo.create(first,{...create,requestKey:randomUUID()})).work;
    await db.updateTable('agent_registrations').set({status:'RETIRED'}).where('agent_principal_id','=',agentIds[0]!).execute();
    await assert.rejects(repo.claim(first,blocked.workId,blocked.revision,analyst),/research-capable/);
    await db.updateTable('agent_registrations').set({status:'ACTIVE'}).where('agent_principal_id','=',agentIds[0]!).execute();
    blocked=await executeWorkStep({repository:repo,scope:first,workId:blocked.workId,revision:blocked.revision,observe,analyst});
    for(let n=0;n<4;n++)blocked=await executeWorkStep({repository:repo,scope:first,workId:blocked.workId,revision:blocked.revision,observe,analyst:{...analyst,analyze:async()=>{throw new WorkProviderError('INVALID_OUTPUT');}}});
    assert.equal(blocked.failure,'ATTEMPT_LIMIT');
    assert.equal((await db.selectFrom('business_work_attempts').selectAll().where('work_id','=',blocked.workId).where('step','=','ANALYZE').execute()).length,3);
    assert.equal((await db.selectFrom('economic_entries').select('entry_id').where('business_id','in',businessIds).execute()).length,0);
    assert.equal((await db.selectFrom('obligations').select('obligation_id').where('buyer_business_id','in',businessIds).execute()).length,0);
  }finally{
    await persistence.transaction(async tx=>{
      const clean=tx.withSchema(applicationSchema);
      const works=await clean.selectFrom('business_work').select('work_id').where('business_id','in',businessIds).execute();
      if(works.length)await clean.deleteFrom('business_work_attempts').where('work_id','in',works.map(w=>w.work_id)).execute();
      if(businessIds.length){
        await clean.deleteFrom('business_work').where('business_id','in',businessIds).execute();
        await clean.deleteFrom('agent_registrations').where('business_id','in',businessIds).execute();
        await clean.deleteFrom('treasury_bindings').where('business_id','in',businessIds).execute();
        await clean.deleteFrom('business_events').where('business_id','in',businessIds).execute();
        await clean.deleteFrom('business_controls').where('business_id','in',businessIds).execute();
        await clean.deleteFrom('business_sites').where('business_id','in',businessIds).execute();
        await clean.deleteFrom('businesses').where('business_id','in',businessIds).execute();
      }
      if(requests.length)await clean.deleteFrom('genesis_requests').where('genesis_request_id','in',requests).execute();
      if(principalIds.length)await clean.deleteFrom('principals').where('principal_id','in',[...agentIds,...principalIds]).execute();
    });
  }
}
