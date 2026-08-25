import type { InomasaEnvironment } from '../../shared/environment.ts';

import {
  getAlphaBusinessTemplate,
  type AlphaBusinessTemplateId,
} from './templates.ts';

export type ActorClassification = 'COMMON_CONTROL_TEST' | 'INDEPENDENT';
export type PrincipalKind = 'BUSINESS' | 'HUMAN';

export interface HumanPrincipal {
  readonly actorClassification: ActorClassification;
  readonly displayName: string;
  readonly environment: InomasaEnvironment;
  readonly principalId: `usr_${string}`;
}

export interface BusinessInstance {
  readonly actorClassification: ActorClassification;
  readonly businessId: `biz_${string}`;
  readonly businessPrincipalId: `biz_${string}`;
  readonly commonControlGroupId?: string;
  readonly displayName: string;
  readonly environment: InomasaEnvironment;
  readonly genesisRequestId: string;
  readonly status: 'ACTIVE';
  readonly templateId: AlphaBusinessTemplateId;
  readonly templateVersion: number;
}

export interface BusinessControl {
  readonly acceptedAt: string;
  readonly businessId: BusinessInstance['businessId'];
  readonly controlId: `ctl_${string}`;
  readonly controlVersion: 1;
  readonly controllerPrincipalId: HumanPrincipal['principalId'];
  readonly status: 'ACTIVE';
}

export interface BusinessGenesisEvent {
  readonly actorPrincipalId: HumanPrincipal['principalId'];
  readonly businessId: BusinessInstance['businessId'];
  readonly eventId: `evt_${string}`;
  readonly eventType: 'BUSINESS_GENESIS_ACCEPTED';
  readonly occurredAt: string;
  readonly requestId: string;
}

export interface BusinessGenesis {
  readonly business: BusinessInstance;
  readonly businessPrincipal: {
    readonly actorClassification: ActorClassification;
    readonly displayName: string;
    readonly environment: InomasaEnvironment;
    readonly principalId: `biz_${string}`;
    readonly principalKind: 'BUSINESS';
  };
  readonly control: BusinessControl;
  readonly event: BusinessGenesisEvent;
}

export interface BusinessGenesisCommand {
  readonly commonControlGroupId?: string;
  readonly controller: HumanPrincipal;
  readonly displayName?: string;
  readonly genesisRequestId: string;
  readonly templateId: AlphaBusinessTemplateId;
}

export interface GenesisIdentifiers {
  readonly businessId: `biz_${string}`;
  readonly controlId: `ctl_${string}`;
  readonly eventId: `evt_${string}`;
}

function requireNonEmpty(value: string, label: string): string {
  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new Error(`${label} must not be empty.`);
  }

  return normalized;
}

export function createBusinessGenesis(
  command: BusinessGenesisCommand,
  identifiers: GenesisIdentifiers,
  occurredAt: string,
): BusinessGenesis {
  const template = getAlphaBusinessTemplate(command.templateId);
  const genesisRequestId = requireNonEmpty(command.genesisRequestId, 'Genesis request ID');
  const displayName = requireNonEmpty(command.displayName ?? template.defaultName, 'Business name');

  if (command.controller.actorClassification === 'COMMON_CONTROL_TEST') {
    requireNonEmpty(command.commonControlGroupId ?? '', 'Common-control group ID');
  }

  const business: BusinessInstance = {
    actorClassification: command.controller.actorClassification,
    businessId: identifiers.businessId,
    businessPrincipalId: identifiers.businessId,
    ...(command.commonControlGroupId === undefined
      ? {}
      : { commonControlGroupId: command.commonControlGroupId }),
    displayName,
    environment: command.controller.environment,
    genesisRequestId,
    status: 'ACTIVE',
    templateId: template.templateId,
    templateVersion: template.version,
  };

  return {
    business,
    businessPrincipal: {
      actorClassification: business.actorClassification,
      displayName: business.displayName,
      environment: business.environment,
      principalId: business.businessPrincipalId,
      principalKind: 'BUSINESS',
    },
    control: {
      acceptedAt: occurredAt,
      businessId: business.businessId,
      controlId: identifiers.controlId,
      controlVersion: 1,
      controllerPrincipalId: command.controller.principalId,
      status: 'ACTIVE',
    },
    event: {
      actorPrincipalId: command.controller.principalId,
      businessId: business.businessId,
      eventId: identifiers.eventId,
      eventType: 'BUSINESS_GENESIS_ACCEPTED',
      occurredAt,
      requestId: genesisRequestId,
    },
  };
}
