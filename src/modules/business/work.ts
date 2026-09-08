import { createHash } from 'node:crypto';
import { canonicalJson } from '../../shared/canonical-json.ts';
import type { InomasaEnvironment } from '../../shared/environment.ts';
import { boundedText } from './creation-assistance.ts';

export type WorkState = 'READY' | 'RUNNING' | 'RETRYABLE' | 'WAITING_REVIEW' | 'COMPLETED' | 'CANCELLED';
export type WorkStep = 'OBSERVE' | 'ANALYZE' | 'REVIEW';
export type WorkFailure = 'NOT_CONFIGURED' | 'QUOTA' | 'PROVIDER_UNAVAILABLE' | 'INVALID_OUTPUT' | 'SOURCE_UNAVAILABLE' | 'OUTCOME_UNKNOWN' | 'ATTEMPT_LIMIT';
export interface WorkScope {
  readonly controllerPrincipalId: `usr_${string}`;
  readonly slug: string;
  readonly environment: InomasaEnvironment;
}
export interface WorkObservation {
  readonly chainId: 5042002;
  readonly blockNumber: string;
  readonly gasPriceWei: string;
  readonly usdcCodeSha256: string;
  readonly observedAt: string;
  readonly source: 'ARC_TESTNET_RPC';
}
export interface WorkAnalysis {
  readonly title: string;
  readonly summary: string;
  readonly findings: readonly string[];
  readonly limitations: readonly string[];
}
export interface WorkGeneration {
  readonly provider: string;
  readonly model: string;
  readonly generatedAt: string;
  readonly inputSha256: string;
  readonly outputSha256: string;
  readonly analysis: WorkAnalysis;
}
export interface BusinessWork {
  readonly workId: string;
  readonly requestKey: string;
  readonly businessId: `biz_${string}`;
  readonly agentPrincipalId: `agt_${string}`;
  readonly objective: string;
  readonly acceptanceCriteria: string;
  readonly context: { readonly businessName: string; readonly agentName: string; readonly role: string; readonly softwareVersion: string };
  readonly state: WorkState;
  readonly step: WorkStep;
  readonly revision: number;
  readonly observation: WorkObservation | null;
  readonly generation: WorkGeneration | null;
  readonly failure: WorkFailure | null;
  readonly leaseUntil: string | null;
  readonly reviewedBy: string | null;
  readonly reviewNote: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}
export interface WorkAnalysisInput {
  readonly objective: string;
  readonly acceptanceCriteria: string;
  readonly businessName: string;
  readonly observation: WorkObservation;
}
export interface WorkAnalyst {
  readonly provider: string;
  readonly model: string;
  analyze(input: WorkAnalysisInput): Promise<WorkGeneration>;
}
export class WorkError extends Error {
  override readonly name = 'WorkError';
  readonly code: 'NOT_FOUND' | 'CONFLICT' | 'INVALID' | 'AGENT_UNAVAILABLE';
  constructor(code: WorkError['code'], message: string) { super(message); this.code=code; }
}
export class WorkProviderError extends Error {
  override readonly name = 'WorkProviderError';
  readonly code: WorkFailure;
  constructor(code: WorkFailure) { super(code); this.code=code; }
}
export function workDigest(value: unknown): string {
  return createHash('sha256').update(canonicalJson(value)).digest('hex');
}
export function workIdentity(businessId: string, requestKey: string): string {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestKey)) {
    throw new WorkError('INVALID', 'A valid work request identity is required.');
  }
  return `wrk_${workDigest({ businessId, requestKey }).slice(0, 32)}`;
}
export function validateWorkObservation(value: WorkObservation): WorkObservation {
  if (value.chainId !== 5042002 || value.source !== 'ARC_TESTNET_RPC' ||
    !/^\d{1,40}$/.test(value.blockNumber) || !/^\d{1,40}$/.test(value.gasPriceWei) ||
    !/^[a-f0-9]{64}$/.test(value.usdcCodeSha256) || !Number.isFinite(Date.parse(value.observedAt))) {
    throw new WorkProviderError('SOURCE_UNAVAILABLE');
  }
  return value;
}
export function validateWorkAnalysis(value: unknown): WorkAnalysis {
  try {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
    const r = value as Record<string, unknown>;
    if (Object.keys(r).some(key => !['title', 'summary', 'findings', 'limitations'].includes(key))) throw new Error();
    const lines = (key: string): readonly string[] => {
      const list = r[key];
      if (!Array.isArray(list) || list.length < 1 || list.length > 5) throw new Error();
      return list.map(item => boundedText(item, key, 700));
    };
    return { title: boundedText(r['title'], 'Title', 160), summary: boundedText(r['summary'], 'Summary', 1500), findings: lines('findings'), limitations: lines('limitations') };
  } catch { throw new WorkProviderError('INVALID_OUTPUT'); }
}
export function workAnalysisInput(work: BusinessWork): WorkAnalysisInput {
  if (work.observation === null) throw new WorkError('CONFLICT', 'Stored source data is required.');
  return { objective: work.objective, acceptanceCriteria: work.acceptanceCriteria, businessName: work.context.businessName, observation: work.observation };
}
export interface WorkRepository {
  claim(scope: WorkScope, workId: string, revision: number, analyst: Pick<WorkAnalyst, 'provider' | 'model'> | null): Promise<{ readonly work: BusinessWork; readonly attemptId: string | null }>;
  finish(scope: WorkScope, workId: string, attemptId: string, result: { readonly observation: WorkObservation } | { readonly generation: WorkGeneration } | { readonly failure: WorkFailure }): Promise<BusinessWork>;
}
/** One explicitly requested step; no process-local queue, recursive agent, payment, or automatic retry. */
export async function executeWorkStep(input: {
  readonly repository: WorkRepository; readonly scope: WorkScope; readonly workId: string; readonly revision: number;
  readonly observe: () => Promise<WorkObservation>; readonly analyst: WorkAnalyst | null;
}): Promise<BusinessWork> {
  const claim = await input.repository.claim(input.scope, input.workId, input.revision, input.analyst);
  if (claim.attemptId === null) return claim.work;
  let result: Parameters<WorkRepository['finish']>[3];
  try {
    if (claim.work.step === 'OBSERVE') result = { observation: validateWorkObservation(await input.observe()) };
    else {
      if (input.analyst === null) throw new WorkProviderError('NOT_CONFIGURED');
      const context = workAnalysisInput(claim.work);
      const generation = await input.analyst.analyze(context);
      const analysis = validateWorkAnalysis(generation.analysis);
      if (generation.provider !== input.analyst.provider || generation.model !== input.analyst.model ||
        generation.inputSha256 !== workDigest(context) || generation.outputSha256 !== workDigest(analysis) ||
        !Number.isFinite(Date.parse(generation.generatedAt))) throw new WorkProviderError('INVALID_OUTPUT');
      result = { generation: { ...generation, analysis } };
    }
  } catch (error) {
    result = { failure: error instanceof WorkProviderError ? error.code : claim.work.step === 'OBSERVE' ? 'SOURCE_UNAVAILABLE' : 'PROVIDER_UNAVAILABLE' };
  }
  // A failed persistence handoff is not a failed provider call: leave the claim for reconciliation.
  return input.repository.finish(input.scope, input.workId, claim.attemptId, result);
}
