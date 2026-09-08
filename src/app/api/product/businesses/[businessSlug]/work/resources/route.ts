import { getProductSession } from '@/app/_auth/server.ts';
import { executeProductEconomicAction } from '@/app/_commerce/application.ts';
import { WorkError } from '@/modules/business/work.ts';
import { readBoundedJson } from '@/platform/http/bounded-json.ts';
import { hasSameProductOrigin } from '@/platform/http/request-origin.ts';
import { readDatabaseConnectionConfig } from '@/platform/persistence/config.ts';
import { PostgresPersistence } from '@/platform/persistence/database.ts';
import { PostgresWorkResourceRepository } from '@/platform/persistence/work-resource-repository.ts';
import { PostgresOperationalWorkspaceRepository } from '@/platform/persistence/operational-workspace-repository.ts';
import { PostgresProductEconomicOperationRepository } from '@/platform/persistence/product-economic-operation-repository.ts';

export const dynamic='force-dynamic';
type Context={readonly params:Promise<{readonly businessSlug:string}>};
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
function field(body:Record<string,unknown>,key:string){const v=body[key];if(typeof v!=='string')throw new WorkError('INVALID',`${key} is required.`);return v;}
async function handle(request:Request,context:Context){
  const session=await getProductSession();if(!session)return json({error:'Product authentication is required.'},401);
  if(request.method!=='GET'&&!hasSameProductOrigin(request))return json({error:'A same-origin request is required.'},403);
  let persistence:PostgresPersistence|undefined;
  try{
    const config=readDatabaseConnectionConfig('runtime');
    if(config.environment!==session.environment)return json({error:'Session environment does not match.'},409);
    persistence=new PostgresPersistence(config);
    const {businessSlug}=await context.params;
    const scope={controllerPrincipalId:session.principalId,slug:businessSlug,environment:config.environment};
    const repo=new PostgresWorkResourceRepository(persistence);
    const resources=await repo.list(scope);
    if(request.method==='GET'){
      const offers=await new PostgresOperationalWorkspaceRepository(persistence).listActivatedProductOffersForBuyer(scope);
      const requests=await new PostgresProductEconomicOperationRepository(persistence).listRequests(scope);
      return json({resources,offers:offers?.filter(o=>o.commerceProtocol==='X402')??[],purchases:(requests??[]).filter(r=>resources.some(n=>n.requestId===r.requestId))});
    }
    let body:Record<string,unknown>;
    try{body=await readBoundedJson(request,5000) as Record<string,unknown>;if(!body||typeof body!=='object'||Array.isArray(body))throw new Error();}
    catch{throw new WorkError('INVALID','A bounded resource request is required.');}
    const workId=field(body,'workId');const revision=body['revision'];
    if(typeof revision!=='number'||!Number.isSafeInteger(revision)||revision<0)throw new WorkError('INVALID','The observed work revision is required.');
    if(body['action']==='PROPOSE')return json(await repo.propose(scope,{workId,revision,offerId:field(body,'offerId'),reason:field(body,'reason')}));
    if(body['action']==='DECLINE'){await repo.decline(scope,workId,revision);return json({declined:true});}
    const resource=resources.find(r=>r.workId===workId);
    if(!resource)throw new WorkError('NOT_FOUND','Resource requirement not found.');
    if(body['action']==='APPROVE'){
      if(body['confirmed']!==true)throw new WorkError('INVALID','Explicit purchase confirmation is required.');
      return json(await executeProductEconomicAction({action:'PREPARE',kind:'X402_PURCHASE',businessSlug,controllerPrincipalId:session.principalId,
        requestId:resource.requestId,offerId:resource.terms.offerId,agentPrincipalId:field(body,'agentId'),workResource:{workId,revision}}));
    }
    if(body['action']==='ADVANCE'&&['APPROVED','ATTACHED'].includes(resource.state))return json(await executeProductEconomicAction({action:'ADVANCE',businessSlug,controllerPrincipalId:session.principalId,requestId:resource.requestId}));
    throw new WorkError('INVALID','Choose a supported resource action.');
  }catch(error){
    if(error instanceof WorkError)return json({error:error.message},error.code==='NOT_FOUND'?404:error.code==='INVALID'?400:409);
    // Never send provider bodies, keys, connection strings or submitted data to the browser.
    return json({error:'The purchase could not be confirmed. Check active funded business accounts and a verified purchase Agent, then refresh the saved request before continuing.'},409);
  }finally{await persistence?.close();}
}
export const GET=handle;
export const POST=handle;
