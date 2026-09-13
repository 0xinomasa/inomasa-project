'use client';
import type { BusinessWork, WorkResourceRequirement } from '../../modules/business/work.ts';
import type { ActivatedProductOfferSummary } from '../../platform/persistence/operational-workspace-repository.ts';
import type { ProductEconomicRequestSummary } from '../../platform/persistence/product-economic-operation-repository.ts';
import { formatUsdcAmount, type UsdcMicroAmount } from '../../modules/commerce/money.ts';

const amount=(value:string)=>`${formatUsdcAmount(BigInt(value) as UsdcMicroAmount)} test USDC`;
export function WorkResourceControls({work,resource,offers,purchase,agents,busy,onAction}:{
  readonly work:BusinessWork;readonly resource:WorkResourceRequirement|undefined;
  readonly offers:readonly ActivatedProductOfferSummary[];readonly purchase:ProductEconomicRequestSummary|undefined;
  readonly agents:readonly {agentPrincipalId:string;displayName:string;capabilities:readonly string[];status:string}[];
  readonly busy:boolean;readonly onAction:(body:Record<string,unknown>)=>void;
}){
  const act=(body:Record<string,unknown>)=>onAction({workId:work.workId,revision:work.revision,...body});
  const buyers=agents.filter(a=>a.status==='ACTIVE'&&a.capabilities.includes('purchase-service'));
  if(!resource){
    if(work.step!=='OBSERVE'||!['READY','RETRYABLE'].includes(work.state))return null;
    return <details className="work-resource"><summary>Use a resource from another Business</summary>
      <p>The current supported resource is an Arc network snapshot. Explain why buying this input is useful. Public data can also be read directly without a purchase.</p>
      {offers.length===0?<p>No active instant resource is available. A provider can activate and share an offer from its own Business.</p>:<form className="work-form" onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);act({action:'PROPOSE',offerId:String(f.get('offerId')),reason:String(f.get('reason'))});}}>
        <div className="field"><label htmlFor={`resource-offer-${work.workId}`}>Resource provider</label><select id={`resource-offer-${work.workId}`} name="offerId" required disabled={busy}>{offers.map(o=><option key={o.offerId} value={o.offerId}>{o.providerDisplayName}: {o.capabilityId} · {amount(o.priceMicroUsdc)}</option>)}</select></div>
        <label>Why this resource is needed<textarea name="reason" required maxLength={1000} disabled={busy}/></label>
        <button className="button button--secondary" disabled={busy}>Save resource requirement</button>
      </form>}
    </details>;
  }
  if(resource.state==='DECLINED')return <p>Resource purchase declined. This work can use the direct public observation.</p>;
  return <section className="work-resource" aria-label="Work resource purchase">
    <h4>{resource.terms.providerDisplayName} · Arc snapshot resource</h4>
    <p>{resource.terms.description}</p><p>Purpose: {resource.reason}</p><p>Exact purchase amount: <strong>{amount(resource.terms.amountMicroUsdc)}</strong></p>
    {resource.state==='PROPOSED'?<><p>Waiting for your decision. Saving a requirement has not authorized spending.</p>
      {buyers.length===0?<p>Add a purchase-capable Agent and verify its economic identity before confirming.</p>:<form className="work-form" onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);act({action:'APPROVE',agentId:String(f.get('agentId')),confirmed:f.get('confirm')==='yes'});}}>
        <div className="field"><label htmlFor={`purchase-agent-${work.workId}`}>Purchasing Agent</label><select id={`purchase-agent-${work.workId}`} name="agentId" required disabled={busy}>{buyers.map(a=><option key={a.agentPrincipalId} value={a.agentPrincipalId}>{a.displayName}</option>)}</select></div>
        <p className="scope-note">An active funded business account and verified purchasing identity are required. Research authority does not authorize this purchase.</p>
        <label><input type="checkbox" name="confirm" value="yes" required disabled={busy}/> I authorize this one purchase for the displayed amount and provider.</label>
        <button className="button button--primary" disabled={busy}>Confirm resource purchase</button>
      </form>}
      <button className="button button--secondary" type="button" disabled={busy} onClick={()=>act({action:'DECLINE'})}>Decline resource purchase</button>
    </>:<>
      <p>Purchase: {purchase?.paymentState??'Checking saved state'} · Delivery: {purchase?.deliveryState??'Not received'}</p>
      {resource.state==='ATTACHED'?<p>The delivered resource is saved as this work’s input. Analysis and review determine the resulting output.</p>:<>
        <p>Continue the existing purchase to reconcile payment and receive the resource. If the result is unknown, the purchase stays on hold.</p>
        <button className="button button--secondary" type="button" disabled={busy} onClick={()=>act({action:'ADVANCE'})}>Continue existing resource purchase</button>
        <p className="scope-note">This uses the existing Circle/Gateway payment path, including explicitly advancing any required balance preparation. Provider receipts are not individual Arc transaction hashes.</p>
      </>}
    </>}
    <details><summary>Purchase evidence and recipient</summary><p>Request: {resource.requestId}</p><p>Receiving account: {resource.terms.recipient}</p><p>Offer terms version: {resource.terms.termsVersion}</p>{purchase?<><p>Obligation: {purchase.obligationId}</p><p>Settlement: {purchase.settlementState}</p><p>Provider receipt: {purchase.paymentProviderReference??'Not observed'}</p><p>Delivery: {purchase.serviceExecutionId}</p></>:null}</details>
  </section>;
}
