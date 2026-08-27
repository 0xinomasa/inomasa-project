import type { InomasaEnvironment } from '../../shared/environment.ts';

export type AgentRuntimeClass = 'OPERATOR_INVOKED' | 'HOSTED';
export type AgentRelationshipStatus = 'ACTIVE' | 'RETIRED';

export interface BusinessAgent {
  readonly agentPrincipalId: `agt_${string}`;
  readonly businessId: `biz_${string}`;
  readonly capabilities: readonly string[];
  readonly displayName: string;
  readonly environment: InomasaEnvironment;
  readonly providerOfRecordPrincipalId: `biz_${string}`;
  readonly role: string;
  readonly runtimeClass: AgentRuntimeClass;
  readonly softwareVersion: string;
  readonly status: AgentRelationshipStatus;
}
export function validateBusinessAgent(agent: BusinessAgent): BusinessAgent {
  if (agent.businessId !== agent.providerOfRecordPrincipalId) {
    throw new Error('The controlled Alpha provider-of-record must be the related Business.');
  }
  if (agent.displayName.trim().length === 0 || agent.role.trim().length === 0) {
    throw new Error('Agent display name and Business role are required.');
  }
  if (agent.capabilities.length === 0 || new Set(agent.capabilities).size !== agent.capabilities.length) {
    throw new Error('Agent capabilities must be a non-empty unique list.');
  }
  if (agent.capabilities.some((capability) => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(capability))) {
    throw new Error('Agent capabilities must use stable kebab-case identifiers.');
  }
  return agent;
}
