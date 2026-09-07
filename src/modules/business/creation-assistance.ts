import { createHash } from 'node:crypto';

import { canonicalJson } from '../../shared/canonical-json.ts';
import { isBusinessTemplateId, type BusinessTemplateId } from './templates.ts';

export interface BusinessCreationProposal {
  readonly displayName: string;
  readonly summary: string;
  readonly templateId: BusinessTemplateId;
  readonly firstService: string;
  readonly economicReason: string;
  readonly nextSteps: readonly string[];
}

export interface CreationAssistance {
  readonly provider: 'GEMINI';
  readonly model: string;
  readonly generatedAt: string;
  readonly inputSha256: string;
  readonly outputSha256: string;
  readonly proposal: BusinessCreationProposal;
}

export interface BusinessCreationAssistant {
  propose(idea: string): Promise<CreationAssistance>;
}

export function boundedText(value: unknown, label: string, maximum: number): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > maximum) {
    throw new Error(`${label} must contain 1-${maximum} characters.`);
  }
  return value.trim();
}

export function creationIdea(value: unknown): string {
  return boundedText(value, 'Business idea', 3000);
}

/** Provider output is data. It never contains executable authority or tool calls. */
export function validateCreationProposal(value: unknown): BusinessCreationProposal {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('AI returned an invalid Business proposal.');
  }
  const record = value as Record<string, unknown>;
  const allowed = ['displayName', 'summary', 'templateId', 'firstService', 'economicReason', 'nextSteps'];
  if (Object.keys(record).some((key) => !allowed.includes(key))) {
    throw new Error('AI returned unsupported Business proposal fields.');
  }
  const templateId = record['templateId'];
  if (typeof templateId !== 'string' || !isBusinessTemplateId(templateId)) {
    throw new Error('AI must select an existing Business template.');
  }
  const steps = record['nextSteps'];
  if (!Array.isArray(steps) || steps.length < 1 || steps.length > 5) {
    throw new Error('AI must return between one and five next steps.');
  }
  return {
    displayName: boundedText(record['displayName'], 'Business name', 160),
    summary: boundedText(record['summary'], 'Business summary', 500),
    templateId,
    firstService: boundedText(record['firstService'], 'First service', 500),
    economicReason: boundedText(record['economicReason'], 'Arc economic purpose', 500),
    nextSteps: steps.map((step) => boundedText(step, 'Next step', 280)),
  };
}

export function proposalDigest(proposal: BusinessCreationProposal): string {
  return createHash('sha256').update(canonicalJson(proposal)).digest('hex');
}
