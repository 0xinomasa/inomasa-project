import { createHash } from 'node:crypto';

export interface BusinessGenesisIdentityInput {
  readonly displayName: string;
  readonly principalId: `usr_${string}`;
  readonly slug: string;
  readonly summary: string;
  readonly templateId: string;
}

export interface BusinessGenesisIdentity {
  readonly businessId: `biz_${string}`;
  readonly genesisRequestId: string;
}

/**
 * Derive stable identifiers from the authenticated request semantics.
 * Replaying the same product request therefore reuses the kernel's existing
 * genesis-request idempotency boundary instead of creating another Business.
 */
export function deriveBusinessGenesisIdentity(
  input: BusinessGenesisIdentityInput,
): BusinessGenesisIdentity {
  const fingerprint = createHash('sha256')
    .update(
      JSON.stringify([
        input.principalId,
        input.templateId,
        input.displayName,
        input.slug,
        input.summary,
      ]),
      'utf8',
    )
    .digest('hex');
  const suffix = fingerprint.slice(0, 16);
  const slugPart = input.slug.replaceAll('-', '_').slice(0, 40);

  return {
    businessId: (`biz_${slugPart}_${suffix}`) as `biz_${string}`,
    genesisRequestId: `genesis-${input.principalId}-${fingerprint.slice(0, 32)}`,
  };
}
