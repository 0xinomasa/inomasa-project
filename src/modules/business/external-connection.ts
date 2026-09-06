import { createHash } from 'node:crypto';

import { canonicalJson } from '../../shared/canonical-json.ts';
import { boundedText } from './creation-assistance.ts';
import type { HumanPrincipal } from './model.ts';
import { isBusinessTemplateId, type BusinessTemplateId } from './templates.ts';

export interface ExternalBusinessManifest {
  readonly version: 1;
  readonly externalBusinessId: string;
  readonly displayName: string;
  readonly summary: string;
  readonly templateId: BusinessTemplateId;
}

export interface ExternalBusinessConnection {
  readonly sourceId: string;
  readonly controllerPrincipalId: `usr_${string}`;
  readonly manifestUrl: string;
  readonly resourceUrl: string;
  readonly manifest: ExternalBusinessManifest;
  readonly manifestSha256: string;
  readonly observedAt: string;
  readonly authorityBasis: 'OPERATOR_CONFIGURED';
  readonly provenance: 'EXTERNAL_SOURCE';
}

export function validateExternalManifest(value: unknown): ExternalBusinessManifest {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('Invalid external Business manifest.');
  const record = value as Record<string, unknown>;
  if (record['version'] !== 1 || typeof record['templateId'] !== 'string' || !isBusinessTemplateId(record['templateId'])) {
    throw new Error('Unsupported external Business manifest version or template.');
  }
  // Import Business context only. Historical payments, customers and balances are not imported.
  return {
    version: 1,
    externalBusinessId: boundedText(record['externalBusinessId'], 'External Business ID', 96),
    displayName: boundedText(record['displayName'], 'Business name', 160),
    summary: boundedText(record['summary'], 'Business summary', 500),
    templateId: record['templateId'],
  };
}

export function externalManifestDigest(manifest: ExternalBusinessManifest): string {
  return createHash('sha256').update(canonicalJson(manifest)).digest('hex');
}

export function assertControlledConnection(connection: ExternalBusinessConnection, controller: HumanPrincipal): void {
  if (
    connection.controllerPrincipalId !== controller.principalId ||
    controller.actorClassification !== 'COMMON_CONTROL_TEST' ||
    !['LOCAL_DEVELOPMENT', 'PRIVATE_ARC_TESTNET', 'AUTOMATED_TEST'].includes(controller.environment) ||
    connection.authorityBasis !== 'OPERATOR_CONFIGURED' || connection.provenance !== 'EXTERNAL_SOURCE' ||
    !/^[a-z0-9][a-z0-9-]{0,47}$/.test(connection.sourceId) ||
    !Number.isFinite(Date.parse(connection.observedAt)) ||
    externalManifestDigest(validateExternalManifest(connection.manifest)) !== connection.manifestSha256
  ) throw new Error('CONNECT requires a valid operator-scoped external source for this controlled user.');
}

/** One source/remote Business/user maps to one genesis even if the remote description changes. */
export function connectionIdentity(connection: ExternalBusinessConnection) {
  const digest = createHash('sha256').update(canonicalJson([
    connection.controllerPrincipalId, connection.sourceId, connection.manifest.externalBusinessId,
  ])).digest('hex');
  return {
    businessId: `biz_connected_${digest.slice(0, 28)}` as const,
    controlId: `ctl_connected_${digest.slice(0, 28)}` as const,
    eventId: `evt_connected_${digest.slice(0, 28)}` as const,
    bindingId: `tbn_connected_${digest.slice(0, 28)}` as const,
    genesisRequestId: `connect-${digest}`,
    slug: `connected-${connection.sourceId}-${digest.slice(0, 8)}`,
  };
}
