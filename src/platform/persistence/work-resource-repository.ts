import { randomUUID } from 'node:crypto';
import { WorkError, workDigest, validateWorkObservation, type WorkResourceRequirement, type WorkResourceTerms, type WorkResourceInput, type WorkScope } from '../../modules/business/work.ts';
import { boundedText } from '../../modules/business/creation-assistance.ts';
import { applicationSchema, type PostgresPersistence, type PersistenceTransaction } from './database.ts';
import { PostgresOperationalWorkspaceRepository } from './operational-workspace-repository.ts';

const conflict=(message:string)=>new WorkError('CONFLICT',message);
export class PostgresWorkResourceRepository {
  readonly persistence:PostgresPersistence;
  constructor(persistence:PostgresPersistence){this.persistence=persistence;}
  async #work(scope:WorkScope,workId:string,tx:PersistenceTransaction){
    const business=await new PostgresOperationalWorkspaceRepository(this.persistence).getBusinessForController(scope,tx);
    if(!business||business.environment!==scope.environment||!['LOCAL_DEVELOPMENT','AUTOMATED_TEST','PRIVATE_ARC_TESTNET'].includes(scope.environment))throw new WorkError('NOT_FOUND','Business work not found.');
    const db=tx.withSchema(applicationSchema);
    const control=await db.selectFrom('business_controls').select('control_id').where('business_id','=',business.businessId)
      .where('controller_principal_id','=',scope.controllerPrincipalId).where('status','=','ACTIVE').forShare().executeTakeFirst();
    const work=await db.selectFrom('business_work').selectAll().where('work_id','=',workId).where('business_id','=',business.businessId).forUpdate().executeTakeFirst();
    if(!control||!work)throw new WorkError('NOT_FOUND','Business work not found.');
    return work;
  }
  async #terms(scope:WorkScope,offerId:string,tx:PersistenceTransaction):Promise<WorkResourceTerms>{
    const db=tx.withSchema(applicationSchema);
    // Sharing withdrawal and confirmation serialize on this offer row.
    const offer=await db.selectFrom('service_offers').selectAll().where('offer_id','=',offerId).forShare().executeTakeFirst();
    const choices=await new PostgresOperationalWorkspaceRepository(this.persistence).listActivatedProductOffersForBuyer(scope,tx);
    const choice=choices?.find(c=>c.offerId===offerId&&c.commerceProtocol==='X402');
    if(!offer||!choice||!offerId.startsWith('off_product_'))throw conflict('This instant resource is not available to this Business.');
    const events=await db.selectFrom('business_events').select('payload').where('business_id','=',choice.providerBusinessId).where('event_type','=','BUSINESS_GENESIS_ACCEPTED').execute();
    if(events.some(e=>(e.payload as {externalConnection?:unknown})?.externalConnection))throw conflict('This work requires the supported Arc snapshot resource, not an external resource.');
    const binding=await db.selectFrom('treasury_bindings').select('address').where('business_id','=',choice.providerBusinessId)
      .where('status','=','ACTIVE').where('environment','=',scope.environment).forShare().executeTakeFirst();
    if(!binding?.address||!/^0x[0-9a-fA-F]{40}$/.test(binding.address))throw conflict('The resource provider needs an active receiving account.');
    return {offerId,providerBusinessId:choice.providerBusinessId,providerDisplayName:choice.providerDisplayName,description:choice.description,
      capabilityId:choice.capabilityId,amountMicroUsdc:choice.priceMicroUsdc,termsVersion:choice.termsVersion,recipient:binding.address.toLowerCase()};
  }
  async list(scope:WorkScope):Promise<readonly WorkResourceRequirement[]>{
    const business=await new PostgresOperationalWorkspaceRepository(this.persistence).getBusinessForController(scope);
    if(!business||business.environment!==scope.environment)throw new WorkError('NOT_FOUND','Business not found.');
    const rows=await this.persistence.databaseForApplication.withSchema(applicationSchema).selectFrom('business_work_resources as resource')
      .innerJoin('business_work as work','work.work_id','resource.work_id').selectAll('resource').where('work.business_id','=',business.businessId).execute();
    return rows.map(r=>({workId:r.work_id,requestId:r.request_id,reason:r.reason,terms:r.terms as WorkResourceTerms,state:r.state as WorkResourceRequirement['state'],purchaseAgentId:r.purchase_agent_id}));
  }
  async propose(scope:WorkScope,input:{workId:string;revision:number;offerId:string;reason:string}){
    let reason:string;try{reason=boundedText(input.reason,'Resource purpose',1000);}catch{throw new WorkError('INVALID','Explain the resource purpose in 1–1000 characters.');}
    return this.persistence.transaction(async tx=>{
      const work=await this.#work(scope,input.workId,tx);
      const db=tx.withSchema(applicationSchema);
      const existing=await db.selectFrom('business_work_resources').selectAll().where('work_id','=',input.workId).executeTakeFirst();
      if(existing){
        if(existing.offer_id!==input.offerId||existing.reason!==reason)throw conflict('This work already has a different resource requirement.');
        return {requestId:existing.request_id,created:false};
      }
      if(work.revision!==input.revision||!['READY','RETRYABLE'].includes(work.state)||work.step!=='OBSERVE')throw conflict('Choose a resource before this work starts observing. Refresh its state.');
      const terms=await this.#terms(scope,input.offerId,tx);
      const requestId=randomUUID();
      await db.insertInto('business_work_resources').values({work_id:input.workId,request_id:requestId,offer_id:input.offerId,reason,terms:JSON.stringify(terms),state:'PROPOSED',
        proposed_by:scope.controllerPrincipalId,approved_by:null,approved_at:null,purchase_agent_id:null,canonical_request_id:null}).execute();
      await db.updateTable('business_work').set({revision:work.revision+1,updated_at:new Date()}).where('work_id','=',input.workId).execute();
      return {requestId,created:true};
    });
  }
  async decline(scope:WorkScope,workId:string,revision:number){
    return this.persistence.transaction(async tx=>{
      const work=await this.#work(scope,workId,tx);
      const db=tx.withSchema(applicationSchema);
      const r=await db.selectFrom('business_work_resources').selectAll().where('work_id','=',workId).executeTakeFirst();
      if(r?.state==='DECLINED')return;
      if(work.revision!==revision||r?.state!=='PROPOSED')throw conflict('Only an unconfirmed resource requirement can be declined.');
      await db.updateTable('business_work_resources').set({state:'DECLINED'}).where('work_id','=',workId).execute();
      await db.updateTable('business_work').set({revision:work.revision+1,updated_at:new Date()}).where('work_id','=',workId).execute();
    });
  }
  /** Called inside the canonical PREPARE transaction, after its request was inserted. */
  async confirmInTransaction(tx:PersistenceTransaction,scope:WorkScope,input:{workId:string;revision:number;requestId:string;agentId:string;offerId:string;amount:string;recipient:string}){
    const work=await this.#work(scope,input.workId,tx);
    const db=tx.withSchema(applicationSchema);
    const r=await db.selectFrom('business_work_resources').selectAll().where('work_id','=',input.workId).forUpdate().executeTakeFirst();
    if(!r||r.request_id!==input.requestId||r.offer_id!==input.offerId)throw conflict('The economic request does not match this resource requirement.');
    if(r.state==='APPROVED'||r.state==='ATTACHED'){
      if(r.purchase_agent_id!==input.agentId||r.approved_by!==scope.controllerPrincipalId)throw conflict('The resource confirmation already used a different Agent.');
      return;
    }
    if(r.state!=='PROPOSED'||work.revision!==input.revision||!['READY','RETRYABLE'].includes(work.state)||work.step!=='OBSERVE')throw conflict('Work or its resource decision changed. Refresh before confirming.');
    const terms=await this.#terms(scope,input.offerId,tx);
    if(workDigest(terms)!==workDigest(r.terms)||terms.amountMicroUsdc!==input.amount||terms.recipient!==input.recipient.toLowerCase())throw conflict('Resource terms or recipient changed. No purchase was confirmed.');
    const agent=await db.selectFrom('agent_registrations').select(['business_id','status','runtime_class','capabilities']).where('agent_principal_id','=',input.agentId).forShare().executeTakeFirst();
    const identity=await db.selectFrom('erc8004_identity_operations').select('identity_id').where('agent_principal_id','=',input.agentId).where('state','=','VERIFIED').forShare().executeTakeFirst();
    if(!agent||agent.business_id!==work.business_id||agent.status!=='ACTIVE'||agent.runtime_class!=='OPERATOR_INVOKED'||!Array.isArray(agent.capabilities)||!agent.capabilities.includes('purchase-service')||!identity)throw conflict('The purchasing Agent requires current bounded capability and verified identity.');
    const request=await db.selectFrom('product_economic_requests').selectAll().where('request_id','=',input.requestId).executeTakeFirstOrThrow();
    if(request.buyer_business_id!==work.business_id||request.controller_principal_id!==scope.controllerPrincipalId||request.agent_principal_id!==input.agentId||request.offer_id!==r.offer_id||request.operation_kind!=='X402_PURCHASE')throw conflict('Canonical request attribution does not match.');
    await db.updateTable('business_work_resources').set({state:'APPROVED',canonical_request_id:input.requestId,approved_by:scope.controllerPrincipalId,approved_at:new Date(),purchase_agent_id:input.agentId}).where('work_id','=',input.workId).execute();
    await db.updateTable('business_work').set({revision:work.revision+1,updated_at:new Date()}).where('work_id','=',input.workId).execute();
  }
  /** The caller already owns the work lock. No provider call or financial posting. */
  async attachInTransaction(tx:PersistenceTransaction,workId:string):Promise<{observation:ReturnType<typeof validateWorkObservation>;resource:WorkResourceInput}|null>{
    const db=tx.withSchema(applicationSchema);
    const r=await db.selectFrom('business_work_resources').selectAll().where('work_id','=',workId).forUpdate().executeTakeFirst();
    if(!r||r.state==='DECLINED')return null;
    if(r.state!=='APPROVED')throw conflict('This work is waiting for its resource decision.');
    const terms=r.terms as WorkResourceTerms;
    const row=await db.selectFrom('product_economic_requests as request')
      .innerJoin('business_work as work',join=>join.on('work.work_id','=',workId))
      .innerJoin('obligations as obligation','obligation.obligation_id','request.obligation_id')
      .innerJoin('settlement_operations as settlement','settlement.settlement_id','request.settlement_id')
      .innerJoin('x402_payment_operations as payment','payment.payment_id','request.payment_id')
      .innerJoin('service_executions as delivery','delivery.execution_id','request.service_execution_id')
      .select(['request.buyer_business_id','work.business_id','request.agent_principal_id','request.obligation_id','request.settlement_id',
        'obligation.execution_authorization_id','obligation.state as obligationState','obligation.seller_business_id','obligation.amount_micro_usdc','obligation.provenance',
        'settlement.state as settlementState','payment.state as paymentState','delivery.state as deliveryState','delivery.output','delivery.output_sha256',
        'delivery.source_reference','delivery.execution_id','delivery.obligation_id as deliveryObligation','delivery.consumer_business_id','delivery.provider_business_id'])
      .where('request.request_id','=',r.request_id).executeTakeFirst();
    if(!row||row.obligationState!=='SETTLED'||row.settlementState!=='COMPLETE'||row.paymentState!=='COMPLETE'||row.deliveryState!=='COMPLETE')throw conflict('Payment or resource delivery is still pending. Continue the existing purchase; do not create another payment.');
    if(!row.execution_authorization_id||row.buyer_business_id!==row.business_id||row.consumer_business_id!==row.business_id||row.seller_business_id!==terms.providerBusinessId||row.provider_business_id!==terms.providerBusinessId||row.agent_principal_id!==r.purchase_agent_id||row.amount_micro_usdc!==terms.amountMicroUsdc||row.deliveryObligation!==row.obligation_id||workDigest(row.output)!==row.output_sha256)throw conflict('Delivered resource evidence does not match the approved purchase.');
    const evidence=await db.selectFrom('evidence_facts').select('evidence_id').where('subject_id','=',row.execution_id)
      .where('source_type','=','ARC_TESTNET_RPC').where('fact_type','=','ARC_NETWORK_SNAPSHOT_DELIVERED').executeTakeFirst();
    if(!evidence)throw conflict('This work requires an attributed Arc snapshot delivery.');
    const observation=validateWorkObservation({...row.output as Omit<ReturnType<typeof validateWorkObservation>,'source'>,source:'ARC_TESTNET_RPC'});
    const resource:WorkResourceInput={executionAuthorizationId:row.execution_authorization_id,requestId:r.request_id,obligationId:row.obligation_id,settlementId:row.settlement_id,executionId:row.execution_id,
      providerBusinessId:row.provider_business_id,purchaseAgentId:r.purchase_agent_id!,outputSha256:row.output_sha256,sourceReference:row.source_reference,
      amountMicroUsdc:row.amount_micro_usdc,reason:r.reason,provenance:row.provenance};
    await db.updateTable('business_work_resources').set({state:'ATTACHED'}).where('work_id','=',workId).execute();
    return {observation,resource};
  }
}
