'use client';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { WorkResourceControls } from './work-resource.tsx';
import type { ActivatedProductOfferSummary } from '../../platform/persistence/operational-workspace-repository.ts';
import type { ProductEconomicRequestSummary } from '../../platform/persistence/product-economic-operation-repository.ts';
import type { BusinessWork, WorkFailure, WorkResourceRequirement } from '../../modules/business/work.ts';

const failures:Record<WorkFailure,string>={
  NOT_CONFIGURED:'AI access is not configured. Your source data and objective are saved.',
  QUOTA:'The AI provider reported a usage limit. Wait before explicitly trying again.',
  PROVIDER_UNAVAILABLE:'The AI provider did not return a usable response. Your progress is saved.',
  INVALID_OUTPUT:'The AI result did not meet the required format. It has not been accepted.',
  SOURCE_UNAVAILABLE:'Arc data could not be read. No observation is claimed.',
  OUTCOME_UNKNOWN:'The previous step was interrupted. Its response is unknown; an AI request may still have used quota. Review before retrying.',
  ATTEMPT_LIMIT:'This work has reached its limit of three AI attempts. Review the previous failures before starting new work.',
};
const states:Record<BusinessWork['state'],string>={READY:'Ready',RUNNING:'In progress',RETRYABLE:'Needs attention',WAITING_REVIEW:'Waiting for your review',COMPLETED:'Completed',CANCELLED:'Result not accepted'};
type Agent={readonly agentPrincipalId:string;readonly displayName:string;readonly capabilities:readonly string[];readonly status:string};
export function BusinessWorkPanel({businessSlug,controllerPrincipalId,agents}:{readonly businessSlug:string;readonly controllerPrincipalId:string;readonly agents:readonly Agent[]}){
  const endpoint=`/api/product/businesses/${encodeURIComponent(businessSlug)}/work`;
  const [work,setWork]=useState<readonly BusinessWork[]>([]);
  const [resources,setResources]=useState<{resources:WorkResourceRequirement[];offers:ActivatedProductOfferSummary[];purchases:ProductEconomicRequestSummary[]}>({resources:[],offers:[],purchases:[]});
  const [notice,setNotice]=useState<string|null>(null);
  const [loaded,setLoaded]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [busy,setBusy]=useState(false);
  const creation=useRef<{key:string;signature:string}|null>(null);
  const pendingKey=`inomasa-work-v1:${controllerPrincipalId}:${businessSlug}`;
  const reconcileCreation=useCallback((items:readonly BusinessWork[])=>{
    try {
      const raw=sessionStorage.getItem(pendingKey);
      const pending=raw?JSON.parse(raw) as {key:string;signature:string}:null;
      if(pending&&items.some(item=>item.requestKey===pending.key)){
        sessionStorage.removeItem(pendingKey);creation.current=null;
      }
    } catch { /* No stored objective, provider key or result is read from browser storage. */ }
  },[pendingKey]);
  const refresh=useCallback(async()=>{
    const response=await fetch(endpoint,{cache:'no-store'});
    if(!response.ok)throw new Error('Saved work is currently unavailable.');
    const result=await response.json() as {work:BusinessWork[]};setWork(result.work);setLoaded(true);reconcileCreation(result.work);
    const r=await fetch(`${endpoint}/resources`,{cache:'no-store'});if(!r.ok)throw new Error('Resource requirements are currently unavailable.');setResources(await r.json());
  },[endpoint,reconcileCreation]);
  useEffect(()=>{void refresh().catch(()=>setError('Saved work or resource requirements are currently unavailable.'));},[refresh]);
  async function mutate(method:string,body:unknown){
    const response=await fetch(endpoint,{method,headers:{'content-type':'application/json'},body:JSON.stringify(body)});
    const result=await response.json() as {error?:string};
    if(!response.ok)throw Object.assign(new Error(result.error??'Work could not be confirmed.'),{status:response.status});
    await refresh();
  }
  async function create(event:FormEvent<HTMLFormElement>){
    event.preventDefault();const form=event.currentTarget;const data=new FormData(form);
    const body={agentId:String(data.get('agentId')??''),objective:String(data.get('objective')??''),acceptanceCriteria:String(data.get('criteria')??'')};
    setBusy(true);setError(null);
    try{
      const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(body)));
      const signature=Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
      const retained=sessionStorage.getItem(pendingKey);
      if(creation.current===null&&retained)creation.current=JSON.parse(retained) as {key:string;signature:string};
      if(creation.current===null)creation.current={key:crypto.randomUUID(),signature};
      if(creation.current.signature!==signature)throw new Error('A previous submission is unresolved. Refresh and check saved work before changing it.');
      sessionStorage.setItem(pendingKey,JSON.stringify(creation.current));
      await mutate('POST',{...body,requestKey:creation.current.key});
      sessionStorage.removeItem(pendingKey);creation.current=null;form.reset();
    }
    catch(e){
      if(e instanceof Error&&'status' in e&&(e.status===400||e.status===404)){sessionStorage.removeItem(pendingKey);creation.current=null;}
      setError(e instanceof Error?e.message:'Work could not be confirmed.');
    }
    finally{setBusy(false);}
  }
  async function act(item:BusinessWork,action:'CONTINUE'|'REVIEW',review?:{accept:boolean;note:string}){
    setBusy(true);setError(null);
    try{await mutate('PATCH',{workId:item.workId,revision:item.revision,action,...review});}
    catch(e){setError(e instanceof Error?e.message:'Work could not be confirmed.');try{await refresh();}catch{/* Keep visible unavailable state. */}}
    finally{setBusy(false);}
  }
  async function resourceAction(body:Record<string,unknown>){
    setBusy(true);setError(null);setNotice(null);
    try{
      const r=await fetch(`${endpoint}/resources`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
      const result=await r.json() as {error?:string;message?:string};
      if(!r.ok)throw new Error(result.error??'Resource action could not be confirmed.');
      if(result.message)setNotice(result.message);
      await refresh();
    }catch(e){setError(e instanceof Error?e.message:'Resource action could not be confirmed.');try{await refresh();}catch{/* Preserve the error and saved request identity. */}}
    finally{setBusy(false);}
  }
  const researchers=agents.filter(a=>a.status==='ACTIVE'&&a.capabilities.includes('research'));
  return <section className="workspace-panel business-work-panel" id="work">
    <div className="panel-heading"><div><p className="eyebrow">Business work</p><h2>Turn an objective into a reviewed result.</h2></div><button type="button" className="button button--secondary" disabled={busy} onClick={()=>{setError(null);void refresh().catch(()=>setError('Saved work is currently unavailable.'));}}>Refresh work</button></div>
    <p className="panel-description">Research public Arc data for your Business. Each step saves its progress. Review the result against your criteria before accepting it.</p>
    {error?<p role="alert" className="operational-notice">{error}</p>:null}
    {notice?<p role="status">{notice}</p>:null}
    {!loaded?<p>{error?'Work status is unavailable.':'Loading saved work…'}</p>:null}
    {researchers.length===0?<p>Add an Agent with the research capability in the setup section to start work.</p>:<form className="work-form" onSubmit={e=>void create(e)}>
      <div className="field"><label htmlFor="work-agent">Research Agent</label><select id="work-agent" name="agentId" required disabled={busy}>{researchers.map(a=><option key={a.agentPrincipalId} value={a.agentPrincipalId}>{a.displayName}</option>)}</select></div>
      <label>Work objective<textarea name="objective" maxLength={1500} required disabled={busy} placeholder="What do you need to understand about the Arc observation?"/></label>
      <label>Acceptance criteria<textarea name="criteria" maxLength={1000} required disabled={busy} placeholder="What should a useful result explain, and which limits must it state?"/></label>
      <button className="button button--primary" disabled={busy||!loaded} type="submit">Save work</button>
    </form>}
    {loaded&&work.length===0?<p>No work has been created for this Business.</p>:null}
    {work.length===50?<p>Showing the latest 50 work items.</p>:null}
    <div className="work-list">{work.map(item=><article className="workspace-card work-item" key={item.workId}>
      <div><strong>{states[item.state]}</strong><h3>{item.objective}</h3><p>Agent: {item.context.agentName}</p><p>Success criteria: {item.acceptanceCriteria}</p></div>
      {item.failure?<p role="status" className="operational-notice">{failures[item.failure]}</p>:null}
      <WorkResourceControls work={item} resource={resources.resources.find(r=>r.workId===item.workId)} offers={resources.offers} purchase={resources.purchases.find(p=>resources.resources.some(r=>r.workId===item.workId&&r.requestId===p.requestId))} agents={agents} busy={busy} onAction={body=>void resourceAction(body)}/>
      {item.resourceInput?<p>Input received from another Business; purchase, delivery and purpose remain linked to this work.</p>:null}
      {item.observation?<p>Saved Arc observation at block {item.observation.blockNumber}. The analysis uses this saved observation.</p>:null}
      {item.generation?<div><h4>{item.generation.analysis.title}</h4><p>{item.generation.analysis.summary}</p><ul>{item.generation.analysis.findings.map((f,i)=><li key={i}>{f}</li>)}</ul><strong>Limits of this result</strong><ul>{item.generation.analysis.limitations.map((l,i)=><li key={i}>{l}</li>)}</ul><p className="scope-note">AI interpretation for your review. Source observation, result quality and economic outcomes are assessed separately.</p></div>:null}
      {['READY','RUNNING','RETRYABLE'].includes(item.state)?<button type="button" className="button button--primary" disabled={busy||item.failure==='ATTEMPT_LIMIT'||resources.resources.some(r=>r.workId===item.workId&&r.state==='PROPOSED')} onClick={()=>void act(item,'CONTINUE')}>{item.state==='RUNNING'?'Check interrupted step':item.state==='RETRYABLE'?'Retry this step':item.step==='OBSERVE'?(resources.resources.some(r=>r.workId===item.workId&&r.state==='APPROVED')?'Use received resource':'Read Arc data'):'Prepare research result'}</button>:null}
      {item.state==='WAITING_REVIEW'?<form className="work-form" onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);const submitter=(e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement|null;void act(item,'REVIEW',{accept:submitter?.value==='accept',note:String(f.get('note')??'')});}}><label>Review against your criteria<textarea name="note" maxLength={1000} required disabled={busy}/></label><div className="work-actions"><button className="button button--primary" name="decision" value="accept" disabled={busy} type="submit">Accept result</button><button className="button button--secondary" name="decision" value="reject" disabled={busy} type="submit">Do not accept</button></div></form>:null}
      {item.reviewNote?<p>Your review: {item.reviewNote}</p>:null}
      <details><summary>Source and execution details</summary><p>Work: {item.workId}</p><p>Recorded version: {item.revision}</p><p>Created: {item.createdAt}</p>{item.observation?<p>Source: Arc Testnet RPC. Observation: {item.observation.observedAt}. It is a point-in-time observation, not a payment receipt.</p>:null}{item.generation?<><p>AI: {item.generation.provider} / {item.generation.model}</p><p>Input digest: {item.generation.inputSha256}</p><p>Output digest: {item.generation.outputSha256}</p></>:null}</details>
    </article>)}</div>
  </section>;
}
