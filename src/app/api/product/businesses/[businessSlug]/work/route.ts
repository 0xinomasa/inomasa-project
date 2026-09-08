import { getProductSession } from '@/app/_auth/server.ts';
import { executeWorkStep, WorkError } from '@/modules/business/work.ts';
import { GeminiWorkAnalyst } from '@/platform/ai/gemini-work.ts';
import { readGeminiConfig } from '@/platform/ai/gemini.ts';
import { ArcTestnetRpc } from '@/platform/arc/rpc.ts';
import { readBoundedJson } from '@/platform/http/bounded-json.ts';
import { hasSameProductOrigin } from '@/platform/http/request-origin.ts';
import { readDatabaseConnectionConfig } from '@/platform/persistence/config.ts';
import { PostgresPersistence } from '@/platform/persistence/database.ts';
import { PostgresBusinessWorkRepository } from '@/platform/persistence/business-work-repository.ts';

export const dynamic='force-dynamic';
type Context={readonly params:Promise<{readonly businessSlug:string}>};
function textField(body:Record<string,unknown>,key:string):string{
  const value=body[key];if(typeof value!=='string')throw new WorkError('INVALID',`${key} is required.`);return value;
}
function json(value:unknown,status=200){return Response.json(value,{status,headers:{'cache-control':'no-store'}});}
async function handle(request:Request,context:Context):Promise<Response>{
  const session=await getProductSession();
  if(!session)return json({error:'Product authentication is required.'},401);
  if(request.method!=='GET'&&!hasSameProductOrigin(request))return json({error:'A same-origin request is required.'},403);
  let persistence:PostgresPersistence|undefined;
  try{
    const config=readDatabaseConnectionConfig('runtime');
    if(config.environment!==session.environment)return json({error:'Session environment does not match.'},409);
    persistence=new PostgresPersistence(config);
    const repository=new PostgresBusinessWorkRepository(persistence);
    const {businessSlug}=await context.params;
    const scope={controllerPrincipalId:session.principalId,slug:businessSlug,environment:config.environment};
    if(request.method==='GET')return json({work:await repository.list(scope)});
    let body:Record<string,unknown>;
    try{body=await readBoundedJson(request,12_000) as Record<string,unknown>;if(!body||Array.isArray(body)||typeof body!=='object')throw new Error();}
    catch{return json({error:'A bounded work request is required.'},400);}
    if(request.method==='POST'){
      const result=await repository.create(scope,{requestKey:textField(body,'requestKey'),agentId:textField(body,'agentId'),objective:textField(body,'objective'),acceptanceCriteria:textField(body,'acceptanceCriteria')});
      return json(result,result.created?201:200);
    }
    const workId=textField(body,'workId');
    const revision=body['revision'];
    if(typeof revision!=='number'||!Number.isSafeInteger(revision)||revision<0)throw new WorkError('INVALID','The observed work revision is required.');
    if(body['action']==='REVIEW'){
      if(typeof body['accept']!=='boolean')throw new WorkError('INVALID','An explicit review decision is required.');
      return json({work:await repository.review(scope,workId,revision,body['accept'],textField(body,'note'))});
    }
    if(body['action']!=='CONTINUE')throw new WorkError('INVALID','Choose a supported work action.');
    let analyst:GeminiWorkAnalyst|null=null;
    try{analyst=new GeminiWorkAnalyst(readGeminiConfig());}catch{/* Report NOT_CONFIGURED in persisted work; no fabricated output. */}
    const work=await executeWorkStep({repository,scope,workId,revision,analyst,observe:async()=>{
      const snapshot=await new ArcTestnetRpc().readNetworkSnapshot(new Date().toISOString());
      return {...snapshot,blockNumber:snapshot.blockNumber.toString(),gasPriceWei:snapshot.gasPriceWei.toString(),source:'ARC_TESTNET_RPC'};
    }});
    return json({work});
  }catch(error){
    if(error instanceof WorkError)return json({error:error.message,code:error.code},error.code==='NOT_FOUND'?404:error.code==='INVALID'?400:409);
    // Database/provider diagnostics can contain submitted data and connection material.
    return json({error:'Work could not be confirmed. Refresh its state before trying again.'},503);
  }finally{await persistence?.close();}
}
export const GET=handle;
export const POST=handle;
export const PATCH=handle;
