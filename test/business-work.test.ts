import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { executeWorkStep, validateWorkAnalysis, validateWorkObservation, workIdentity, workDigest, WorkProviderError, type BusinessWork, type WorkAnalysisInput, type WorkRepository } from '../src/modules/business/work.ts';
import { GeminiWorkAnalyst } from '../src/platform/ai/gemini-work.ts';
const observation={chainId:5042002,blockNumber:'100',gasPriceWei:'12345',usdcCodeSha256:'a'.repeat(64),observedAt:'2026-09-07T00:00:00.000Z',source:'ARC_TESTNET_RPC'} as const;
const analysis={title:'Observed network',summary:'A single observation.',findings:['A block was observed.'],limitations:['No performance series or payment is evidenced.']};
const input:WorkAnalysisInput={objective:'Inspect the network',acceptanceCriteria:'Explain limits',businessName:'New business',observation};
const scope={controllerPrincipalId:'usr_test',slug:'sample',environment:'AUTOMATED_TEST'} as const;
const work:BusinessWork={workId:'wrk_test',requestKey:randomUUID(),businessId:'biz_test',agentPrincipalId:'agt_test',objective:input.objective,acceptanceCriteria:input.acceptanceCriteria,
  context:{businessName:input.businessName,agentName:'Research',role:'RESEARCH_AGENT',softwareVersion:'test'},state:'RUNNING',step:'ANALYZE',revision:1,observation,generation:null,
  failure:null,leaseUntil:null,reviewedBy:null,reviewNote:null,createdAt:observation.observedAt,updatedAt:observation.observedAt};
function response(body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});}
test('work identity is business-scoped and preserves a stable request identity',()=>{
  const key=randomUUID();assert.equal(workIdentity('biz_a',key),workIdentity('biz_a',key));assert.notEqual(workIdentity('biz_a',key),workIdentity('biz_b',key));
  assert.throws(()=>workIdentity('biz_a','invalid'));
});
test('work rejects invented authority fields, unbounded text and incorrect chain observations',()=>{
  assert.throws(()=>validateWorkAnalysis({...analysis,pay:{amount:'100'}}));assert.throws(()=>validateWorkAnalysis({...analysis,summary:'a'.repeat(1501)}));
  assert.throws(()=>validateWorkObservation({...observation,blockNumber:'NaN'}));assert.throws(()=>validateWorkObservation({...observation,chainId:1} as unknown as typeof observation));
});
test('Gemini research uses stored bounded context, attributes digests and has no tools',async()=>{
  let count=0;
  const transport:typeof fetch=async(_url,init)=>{
    count++;const body=JSON.parse(String(init?.body));assert.equal(body.tools,undefined);assert.deepEqual(JSON.parse(body.contents[0].parts[0].text),input);
    assert.equal(init?.redirect,'error');return response({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(analysis)}]}}]});
  };
  const result=await new GeminiWorkAnalyst({apiKey:'synthetic-test-key',model:'gemini-test'},transport).analyze(input);
  assert.equal(count,1);assert.equal(result.provider,'GEMINI');assert.equal(result.inputSha256,workDigest(input));assert.equal(result.outputSha256,workDigest(analysis));
});
test('quota, provider failure and invalid output are distinguishable without raw response leaks or retries',async()=>{
  for(const [status,body,code] of [[429,{error:'synthetic-secret-marker'},'QUOTA'],[503,{error:'synthetic-secret-marker'},'PROVIDER_UNAVAILABLE'],[200,{candidates:[{finishReason:'MAX_TOKENS'}]},'INVALID_OUTPUT']] as const){
    let calls=0;const analyst=new GeminiWorkAnalyst({apiKey:'test',model:'gemini-test'},async()=>{calls++;return response(body,status);});
    await assert.rejects(analyst.analyze(input),e=>e instanceof WorkProviderError&&e.code===code&&!e.message.includes('secret'));assert.equal(calls,1);
  }
});
test('an already handled work request never invokes a provider',async()=>{
  let calls=0;const repo:WorkRepository={claim:async()=>({work:{...work,state:'COMPLETED'},attemptId:null}),finish:async()=>{throw new Error('unexpected');}};
  await executeWorkStep({repository:repo,scope,workId:work.workId,revision:1,analyst:null,observe:async()=>{calls++;return observation;}});assert.equal(calls,0);
});
test('a persistence failure after successful generation remains an unresolved handoff, not a provider failure',async()=>{
  let finishes=0;const repo:WorkRepository={claim:async()=>({work,attemptId:'a'}),finish:async(_s,_w,_a,result)=>{finishes++;assert.ok('generation' in result);throw new Error('database unavailable');}};
  await assert.rejects(executeWorkStep({repository:repo,scope,workId:work.workId,revision:0,observe:async()=>observation,analyst:{provider:'TEST',model:'synthetic',analyze:async()=>({provider:'TEST',model:'synthetic',generatedAt:observation.observedAt,inputSha256:workDigest(input),outputSha256:workDigest(analysis),analysis})}}),/database unavailable/);
  assert.equal(finishes,1);
});
test('an invalid provider attribution never persists as a generated result',async()=>{
  const repo:WorkRepository={claim:async()=>({work,attemptId:'a'}),finish:async(_s,_w,_a,result)=>{assert.deepEqual(result,{failure:'INVALID_OUTPUT'});return work;}};
  await executeWorkStep({repository:repo,scope,workId:work.workId,revision:0,observe:async()=>observation,analyst:{provider:'TEST',model:'synthetic',analyze:async()=>({provider:'TEST',model:'synthetic',generatedAt:observation.observedAt,inputSha256:'f'.repeat(64),outputSha256:workDigest(analysis),analysis})}});
});
