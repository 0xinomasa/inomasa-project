import type { InomasaEnvironment } from '../../shared/environment.ts';
import type { CreationAssistance } from './creation-assistance.ts';
import { assertControlledConnection, type ExternalBusinessConnection } from './external-connection.ts';

import {
  getBusinessTemplateDefinition,
  type BusinessTemplateReferenceId,
} from './templates.ts';

export type ActorClassification = 'COMMON_CONTROL_TEST' | 'INDEPENDENT';
export type PrincipalKind = 'BUSINESS' | 'HUMAN';
export type BusinessEntryRoute = 'BUILD' | 'MIGRATE';

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
  readonly entryRoute: BusinessEntryRoute;
  readonly environment: InomasaEnvironment;
  readonly genesisRequestId: string;
  readonly slug: string;
  readonly status: 'ACTIVE';
  readonly summary: string;
  readonly templateId: BusinessTemplateReferenceId;
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
  readonly creationAssistance?: CreationAssistance;
  readonly externalConnection?: ExternalBusinessConnection;
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
  readonly creationAssistance?: CreationAssistance;
  readonly externalConnection?: ExternalBusinessConnection;
  readonly commonControlGroupId?: string;
  readonly controller: HumanPrincipal;
  readonly displayName?: string;
  readonly entryRoute?: BusinessEntryRoute;
  readonly genesisRequestId: string;
  readonly slug?: string;
  readonly summary?: string;
  readonly templateId: BusinessTemplateReferenceId;
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

export function normalizeBusinessSlug(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (slug.length < 3 || slug.length > 96) {
    throw new Error('Business slug must contain between 3 and 96 URL-safe characters.');
  }

  return slug;
}

export function assertBusinessEntryRouteOpen(entryRoute: BusinessEntryRoute): void {
  if (entryRoute === 'MIGRATE') {
    throw new Error('MIGRATE is a system-ready boundary and remains LOCKED / NOT YET OPEN.');
  }
}

export function createBusinessGenesis(
  command: BusinessGenesisCommand,
  identifiers: GenesisIdentifiers,
  occurredAt: string,
): BusinessGenesis {
  const template = getBusinessTemplateDefinition(command.templateId);
  const genesisRequestId = requireNonEmpty(command.genesisRequestId, 'Genesis request ID');
  const displayName = requireNonEmpty(command.displayName ?? template.defaultName, 'Business name');
  const entryRoute = command.entryRoute ?? 'BUILD';
  const slug = normalizeBusinessSlug(command.slug ?? displayName);
  const summary = requireNonEmpty(command.summary ?? template.description, 'Business summary');

  if (entryRoute === 'MIGRATE' && command.externalConnection !== undefined) {
    assertControlledConnection(command.externalConnection, command.controller);
    const manifest = command.externalConnection.manifest;
    if (displayName !== manifest.displayName || summary !== manifest.summary || template.templateId !== manifest.templateId) {
      throw new Error('Connected Business context must match the observed external manifest.');
    }
  } else {
    assertBusinessEntryRouteOpen(entryRoute);
    if (command.externalConnection !== undefined) throw new Error('External origin cannot be labeled as BUILD.');
  }

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
    entryRoute,
    environment: command.controller.environment,
    genesisRequestId,
    slug,
    status: 'ACTIVE',
    summary,
    templateId: template.templateId,
    templateVersion: template.version,
  };

  return {
    ...(command.creationAssistance === undefined ? {} : { creationAssistance: command.creationAssistance }),
    ...(command.externalConnection === undefined ? {} : { externalConnection: command.externalConnection }),
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
