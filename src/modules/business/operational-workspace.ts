import { createHash } from 'node:crypto';

import { canonicalJson } from '../../shared/canonical-json.ts';
import type { InomasaEnvironment } from '../../shared/environment.ts';
import type { BusinessAgent } from '../agent/model.ts';
import { validateBusinessAgent } from '../agent/model.ts';
import { parseUsdcAmount, type UsdcMicroAmount } from '../commerce/money.ts';

export type ProductCommerceProtocol = 'ERC8183' | 'X402';

export interface ProductOfferDraft {
  readonly capabilityId: string;
  readonly commerceProtocol: ProductCommerceProtocol;
  readonly createdByPrincipalId: `usr_${string}`;
  readonly description: string;
  readonly idempotencyKey: string;
  readonly offerId: `off_${string}`;
  readonly priceMicroUsdc: UsdcMicroAmount;
  readonly providerBusinessId: `biz_${string}`;
  readonly status: 'DRAFT';
  readonly termsVersion: 1;
}

const agentCapabilities = new Set([
  'deliver-service',
  'operate-service',
  'purchase-service',
  'research',
]);

const agentRoles = new Set(['COMMERCE_AGENT', 'OPERATIONS_AGENT', 'RESEARCH_AGENT']);

function fingerprint(scope: string, value: unknown): string {
  return createHash('sha256').update(scope).update('\0').update(canonicalJson(value)).digest('hex');
}

function uuidFromFingerprint(value: string): string {
  const digits = value.slice(0, 32).split('');
  digits[12] = '4';
  const variant = Number.parseInt(digits[16] ?? '0', 16);
  digits[16] = ((variant & 0x3) | 0x8).toString(16);
  const joined = digits.join('');
  return `${joined.slice(0, 8)}-${joined.slice(8, 12)}-${joined.slice(12, 16)}-${joined.slice(16, 20)}-${joined.slice(20)}`;
}

export function normalizeCapabilityId(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
    .replace(/-+$/g, '');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) {
    throw new Error('Product or Service name must include letters or numbers.');
  }
  return normalized;
}

export function createProductOfferDraft(input: {
  readonly businessId: `biz_${string}`;
  readonly controllerPrincipalId: `usr_${string}`;
  readonly description: string;
  readonly name: string;
  readonly price: string;
  readonly protocol: ProductCommerceProtocol;
}): ProductOfferDraft {
  const capabilityId = normalizeCapabilityId(input.name);
  const description = input.description.trim();
  if (description.length === 0 || description.length > 500) {
    throw new Error('Product or Service description must contain 1-500 characters.');
  }
  if (input.protocol !== 'X402' && input.protocol !== 'ERC8183') {
    throw new Error('Choose instant resource or evaluated work delivery.');
  }
  const priceMicroUsdc = parseUsdcAmount(input.price);
  if (priceMicroUsdc <= 0n || priceMicroUsdc > parseUsdcAmount('10')) {
    throw new Error('Controlled Alpha price must be greater than 0 and at most 10 USDC.');
  }
  const digest = fingerprint('product-offer-v1', {
    businessId: input.businessId,
    capabilityId,
    controllerPrincipalId: input.controllerPrincipalId,
    description,
    priceMicroUsdc: priceMicroUsdc.toString(),
    protocol: input.protocol,
  });
  return {
    capabilityId,
    commerceProtocol: input.protocol,
    createdByPrincipalId: input.controllerPrincipalId,
    description,
    idempotencyKey: uuidFromFingerprint(digest),
    offerId: `off_product_${digest.slice(0, 28)}`,
    priceMicroUsdc,
    providerBusinessId: input.businessId,
    status: 'DRAFT',
    termsVersion: 1,
  };
}

export function createOperationalAgent(input: {
  readonly businessId: `biz_${string}`;
  readonly capability: string;
  readonly displayName: string;
  readonly environment: InomasaEnvironment;
  readonly role: string;
}): BusinessAgent {
  const displayName = input.displayName.trim();
  const role = input.role.trim().toUpperCase();
  const capability = input.capability.trim().toLowerCase();
  if (displayName.length === 0 || displayName.length > 120) {
    throw new Error('Agent name must contain 1-120 characters.');
  }
  if (!agentRoles.has(role)) throw new Error('Choose a supported bounded Agent role.');
  if (!agentCapabilities.has(capability)) {
    throw new Error('Choose a supported bounded Agent capability.');
  }
  const digest = fingerprint('operational-agent-v1', {
    businessId: input.businessId,
    capability,
    displayName,
    role,
  });
  return validateBusinessAgent({
    agentPrincipalId: `agt_product_${digest.slice(0, 28)}`,
    businessId: input.businessId,
    capabilities: [capability],
    displayName,
    environment: input.environment,
    providerOfRecordPrincipalId: input.businessId,
    role,
    runtimeClass: 'OPERATOR_INVOKED',
    softwareVersion: 'inomasa-operator-runtime@1',
    status: 'ACTIVE',
  });
}

export function deriveTreasuryProvisioningIdentity(input: {
  readonly businessId: `biz_${string}`;
  readonly controllerPrincipalId: `usr_${string}`;
  readonly pendingBindingId: `tbn_${string}`;
}): { readonly activeBindingId: `tbn_${string}`; readonly idempotencyKey: string } {
  const digest = fingerprint('treasury-provisioning-v1', input);
  return {
    activeBindingId: `tbn_product_${digest.slice(0, 28)}`,
    idempotencyKey: uuidFromFingerprint(digest),
  };
}
