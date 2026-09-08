import { randomUUID } from 'node:crypto';
import { sql, type Selectable } from 'kysely';
import { boundedText } from '../../modules/business/creation-assistance.ts';
import {
  WorkError, workIdentity, workDigest, workAnalysisInput, validateWorkAnalysis, validateWorkObservation,
  type BusinessWork, type WorkAnalyst, type WorkRepository, type WorkScope,
} from '../../modules/business/work.ts';
import { applicationSchema, type PersistenceDatabase, type PersistenceTransaction, type PostgresPersistence } from './database.ts';
import { PostgresOperationalWorkspaceRepository } from './operational-workspace-repository.ts';

type Row = Selectable<PersistenceDatabase['business_work']>;
function view(row: Row): BusinessWork {
  return { workId: row.work_id, requestKey: row.request_key, businessId: row.business_id as `biz_${string}`, agentPrincipalId: row.agent_principal_id as `agt_${string}`,
    objective: row.objective, acceptanceCriteria: row.acceptance_criteria, context: row.context as BusinessWork['context'],
    state: row.state as BusinessWork['state'], step: row.step as BusinessWork['step'], revision: row.revision,
    observation: row.observation as BusinessWork['observation'], generation: row.generation as BusinessWork['generation'],
    failure: row.failure as BusinessWork['failure'], leaseUntil: row.lease_until?.toISOString() ?? null,
    reviewedBy: row.reviewed_by, reviewNote: row.review_note, createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString() };
}
const notFound = () => new WorkError('NOT_FOUND', 'Business work not found.');
export class PostgresBusinessWorkRepository implements WorkRepository {
  readonly persistence: PostgresPersistence;
  constructor(persistence: PostgresPersistence) { this.persistence=persistence; }
  async #business(scope: WorkScope, tx?: PersistenceTransaction) {
    if (!['LOCAL_DEVELOPMENT','AUTOMATED_TEST','PRIVATE_ARC_TESTNET'].includes(scope.environment)) throw notFound();
    const business = await new PostgresOperationalWorkspaceRepository(this.persistence).getBusinessForController(scope, tx);
    if (!business || business.environment !== scope.environment) throw notFound();
    if (tx) {
      const control = await tx.withSchema(applicationSchema).selectFrom('business_controls').select('control_id')
        .where('business_id','=',business.businessId).where('controller_principal_id','=',scope.controllerPrincipalId)
        .where('status','=','ACTIVE').forShare().executeTakeFirst();
      if (!control) throw notFound();
    }
    return business;
  }
  async #agent(tx: PersistenceTransaction, businessId: string, agentId: string) {
    const agent = await tx.withSchema(applicationSchema).selectFrom('agent_registrations as agent')
      .innerJoin('principals as principal','principal.principal_id','agent.agent_principal_id')
      .select(['agent.business_id','agent.capabilities','agent.role','agent.software_version','agent.status','principal.display_name'])
      .where('agent.agent_principal_id','=',agentId).where('agent.business_id','=',businessId).forShare().executeTakeFirst();
    if (!agent || agent.status !== 'ACTIVE' || !Array.isArray(agent.capabilities) || !agent.capabilities.includes('research')) {
      throw new WorkError('AGENT_UNAVAILABLE','Choose an active research-capable Agent in this Business.');
    }
    return agent;
  }
  async #locked(scope: WorkScope, workId: string, tx: PersistenceTransaction): Promise<Row> {
    const business = await this.#business(scope,tx);
    const row = await tx.withSchema(applicationSchema).selectFrom('business_work').selectAll()
      .where('business_id','=',business.businessId).where('work_id','=',workId).forUpdate().executeTakeFirst();
    if (!row) throw notFound();
    return row;
  }
  async #now(tx: PersistenceTransaction): Promise<Date> {
    const r = await tx.selectNoFrom(sql<Date>`clock_timestamp()`.as('now')).executeTakeFirstOrThrow();
    return r.now;
  }
  async create(scope: WorkScope, input: { readonly requestKey: string; readonly agentId: string; readonly objective: string; readonly acceptanceCriteria: string }) {
    let objective:string,criteria:string;
    try { objective=boundedText(input.objective,'Objective',1500); criteria=boundedText(input.acceptanceCriteria,'Acceptance criteria',1000); }
    catch { throw new WorkError('INVALID','Enter an objective of 1–1500 characters and criteria of 1–1000 characters.'); }
    return this.persistence.transaction(async tx => {
      const business = await this.#business(scope,tx);
      const agent = await this.#agent(tx,business.businessId,input.agentId);
      const workId = workIdentity(business.businessId,input.requestKey);
      const db = tx.withSchema(applicationSchema);
      const inserted = await db.insertInto('business_work').values({work_id:workId,business_id:business.businessId,agent_principal_id:input.agentId,
        created_by:scope.controllerPrincipalId,environment:scope.environment,request_key:input.requestKey,objective,acceptance_criteria:criteria,
        context:JSON.stringify({businessName:business.displayName,agentName:agent.display_name,role:agent.role,softwareVersion:agent.software_version}),
        state:'READY',step:'OBSERVE',revision:0,active_attempt_id:null,lease_until:null,observation:null,generation:null,failure:null,
        reviewed_by:null,review_note:null,updated_at:await this.#now(tx)})
        .onConflict(c=>c.column('work_id').doNothing()).returning('work_id').executeTakeFirst();
      const row = await db.selectFrom('business_work').selectAll().where('work_id','=',workId).executeTakeFirstOrThrow();
      if (row.objective !== objective || row.acceptance_criteria !== criteria || row.agent_principal_id !== input.agentId || row.created_by !== scope.controllerPrincipalId) {
        throw new WorkError('CONFLICT','This work request already has different content.');
      }
      return {created:Boolean(inserted),work:view(row)};
    });
  }
  async get(scope: WorkScope, workId: string): Promise<BusinessWork> {
    const business = await this.#business(scope);
    const row = await this.persistence.databaseForApplication.withSchema(applicationSchema).selectFrom('business_work').selectAll()
      .where('work_id','=',workId).where('business_id','=',business.businessId).executeTakeFirst();
    if (!row) throw notFound();
    return view(row);
  }
  async list(scope: WorkScope): Promise<readonly BusinessWork[]> {
    const business = await this.#business(scope);
    const rows = await this.persistence.databaseForApplication.withSchema(applicationSchema).selectFrom('business_work').selectAll()
      .where('business_id','=',business.businessId).orderBy('created_at','desc').limit(50).execute();
    return rows.map(view);
  }
  async claim(scope: WorkScope, workId: string, revision: number, analyst: Pick<WorkAnalyst,'provider'|'model'> | null) {
    return this.persistence.transaction(async tx => {
      const row = await this.#locked(scope,workId,tx);
      if (row.revision !== revision) throw new WorkError('CONFLICT','Work changed. Refresh before continuing.');
      const db = tx.withSchema(applicationSchema);
      const now = await this.#now(tx);
      if (['COMPLETED','CANCELLED','WAITING_REVIEW'].includes(row.state)) return {work:view(row),attemptId:null};
      if (row.state === 'RUNNING') {
        if (row.lease_until && row.lease_until > now) return {work:view(row),attemptId:null};
        if (row.active_attempt_id) await db.updateTable('business_work_attempts').set({state:'OUTCOME_UNKNOWN',failure:'OUTCOME_UNKNOWN',finished_at:now})
          .where('attempt_id','=',row.active_attempt_id).where('state','=','RUNNING').execute();
        const recovered = await db.updateTable('business_work').set({state:'RETRYABLE',failure:'OUTCOME_UNKNOWN',active_attempt_id:null,lease_until:null,revision:row.revision+1,updated_at:now})
          .where('work_id','=',workId).returningAll().executeTakeFirstOrThrow();
        return {work:view(recovered),attemptId:null};
      }
      await this.#agent(tx,row.business_id,row.agent_principal_id);
      if (row.step === 'ANALYZE') {
        const attempts = await db.selectFrom('business_work_attempts').select(({fn})=>fn.countAll<string>().as('n'))
          .where('work_id','=',workId).where('step','=','ANALYZE').executeTakeFirstOrThrow();
        const failure = analyst === null ? 'NOT_CONFIGURED' : Number(attempts.n) >= 3 ? 'ATTEMPT_LIMIT' : null;
        if (failure) {
          const blocked = await db.updateTable('business_work').set({state:'RETRYABLE',failure,revision:row.revision+1,updated_at:now})
            .where('work_id','=',workId).returningAll().executeTakeFirstOrThrow();
          return {work:view(blocked),attemptId:null};
        }
      }
      const attemptId = randomUUID();
      await db.insertInto('business_work_attempts').values({attempt_id:attemptId,work_id:workId,step:row.step,state:'RUNNING',provider:row.step==='ANALYZE'?analyst?.provider??null:null,
        model:row.step==='ANALYZE'?analyst?.model??null:null,failure:null,finished_at:null}).execute();
      const claimed = await db.updateTable('business_work').set({state:'RUNNING',active_attempt_id:attemptId,lease_until:new Date(now.getTime()+90_000),
        failure:null,revision:row.revision+1,updated_at:now}).where('work_id','=',workId).returningAll().executeTakeFirstOrThrow();
      return {work:view(claimed),attemptId};
    });
  }
  async finish(scope: WorkScope, workId: string, attemptId: string, result: Parameters<WorkRepository['finish']>[3]): Promise<BusinessWork> {
    return this.persistence.transaction(async tx=>{
      const row = await this.#locked(scope,workId,tx);
      const now = await this.#now(tx);
      if (row.state !== 'RUNNING' || row.active_attempt_id !== attemptId || row.lease_until === null || row.lease_until <= now) {
        throw new WorkError('CONFLICT','Execution no longer owns this work. Refresh and inspect its state.');
      }
      const db = tx.withSchema(applicationSchema);
      if ('observation' in result && row.step !== 'OBSERVE' || 'generation' in result && row.step !== 'ANALYZE') throw new WorkError('CONFLICT','Wrong work step.');
      if ('observation' in result) validateWorkObservation(result.observation);
      if ('generation' in result) {
        const g = result.generation;
        const attempt = await db.selectFrom('business_work_attempts').select(['provider','model']).where('attempt_id','=',attemptId).executeTakeFirstOrThrow();
        if (g.inputSha256 !== workDigest(workAnalysisInput(view(row))) || g.outputSha256 !== workDigest(validateWorkAnalysis(g.analysis)) ||
          g.provider !== attempt.provider || g.model !== attempt.model || !Number.isFinite(Date.parse(g.generatedAt))) throw new WorkError('CONFLICT','Work output attribution does not match.');
      }
      await db.updateTable('business_work_attempts').set({state:'failure' in result?'FAILED':'COMPLETED',failure:'failure' in result?result.failure:null,finished_at:now})
        .where('attempt_id','=',attemptId).execute();
      const updated = await db.updateTable('business_work').set({state:'failure' in result?'RETRYABLE':'generation' in result?'WAITING_REVIEW':'READY',
        step:'failure' in result?row.step:'generation' in result?'REVIEW':'ANALYZE',
        observation:'observation' in result?JSON.stringify(result.observation):row.observation===null?null:JSON.stringify(row.observation),
        generation:'generation' in result?JSON.stringify(result.generation):null,failure:'failure' in result?result.failure:null,
        active_attempt_id:null,lease_until:null,revision:row.revision+1,updated_at:now})
        .where('work_id','=',workId).returningAll().executeTakeFirstOrThrow();
      return view(updated);
    });
  }
  async review(scope: WorkScope, workId: string, revision: number, accept: boolean, note: string): Promise<BusinessWork> {
    let reviewNote:string;
    try { reviewNote=boundedText(note,'Review note',1000); } catch { throw new WorkError('INVALID','Enter a review note of 1–1000 characters.'); }
    return this.persistence.transaction(async tx=>{
      const row = await this.#locked(scope,workId,tx);
      if (row.revision !== revision) throw new WorkError('CONFLICT','Work changed. Refresh before reviewing.');
      if (row.state !== 'WAITING_REVIEW') throw new WorkError('CONFLICT','A generated result is required for review.');
      const r = await tx.withSchema(applicationSchema).updateTable('business_work').set({state:accept?'COMPLETED':'CANCELLED',reviewed_by:scope.controllerPrincipalId,
        review_note:reviewNote,revision:row.revision+1,updated_at:await this.#now(tx)}).where('work_id','=',workId).returningAll().executeTakeFirstOrThrow();
      return view(r);
    });
  }
}
