import { createHash } from 'node:crypto';

import {
  externalManifestDigest, validateExternalManifest, type ExternalBusinessConnection,
} from '../../modules/business/external-connection.ts';
import { canonicalJson } from '../../shared/canonical-json.ts';
import { readBoundedJson } from './bounded-json.ts';

export interface ConfiguredBusinessSource {
  readonly sourceId: string;
  readonly label: string;
  readonly controllerPrincipalId: `usr_${string}`;
  readonly manifestUrl: string;
  readonly resourceUrl: string;
}

export function sourceUrl(value: unknown, allowLoopback: boolean): string {
  if (typeof value !== 'string' || value.length > 512) throw new Error('Invalid configured source URL.');
  const url = new URL(value);
  const loopback = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
  if (url.username || url.password || url.search || url.hash ||
    (url.protocol !== 'https:' && !(allowLoopback && loopback && url.protocol === 'http:')) ||
    (loopback && !allowLoopback)) {
    throw new Error('Sources require HTTPS without credentials, query or fragment; explicit local tests may use loopback HTTP.');
  }
  return url.href;
}

export function readBusinessSources(environment: Readonly<Record<string, string | undefined>> = process.env): readonly ConfiguredBusinessSource[] {
  const configured = environment['INOMASA_CONNECT_SOURCES']?.trim();
  if (!configured) return [];
  if (!['LOCAL_DEVELOPMENT', 'PRIVATE_ARC_TESTNET', 'AUTOMATED_TEST'].includes(environment['INOMASA_ENV'] ?? '')) {
    throw new Error('CONNECT requires a controlled local or test environment.');
  }
  const records = JSON.parse(configured) as unknown;
  if (!Array.isArray(records) || records.length > 20) throw new Error('Invalid configured CONNECT sources.');
  const allowLoopback = environment['INOMASA_CONNECT_ALLOW_LOOPBACK'] === 'true';
  const sources = records.map((value: unknown): ConfiguredBusinessSource => {
    if (typeof value !== 'object' || value === null) throw new Error('Invalid configured source.');
    const row = value as Record<string, unknown>;
    if (typeof row['sourceId'] !== 'string' || !/^[a-z0-9][a-z0-9-]{0,47}$/.test(row['sourceId']) ||
      typeof row['label'] !== 'string' || !row['label'].trim() || row['label'].length > 80 ||
      typeof row['controllerPrincipalId'] !== 'string' || !/^usr_[a-z0-9_]{1,70}$/.test(row['controllerPrincipalId'])) {
      throw new Error('Invalid configured source ownership or identifier.');
    }
    return {
      sourceId: row['sourceId'], label: row['label'], controllerPrincipalId: row['controllerPrincipalId'] as `usr_${string}`,
      manifestUrl: sourceUrl(row['manifestUrl'], allowLoopback), resourceUrl: sourceUrl(row['resourceUrl'], allowLoopback),
    };
  });
  if (new Set(sources.map((source) => source.sourceId)).size !== sources.length) throw new Error('CONNECT source identifiers must be unique.');
  return sources;
}

export function sourceForController(sources: readonly ConfiguredBusinessSource[], sourceId: unknown, principalId: string): ConfiguredBusinessSource {
  const source = sources.find((candidate) => candidate.sourceId === sourceId && candidate.controllerPrincipalId === principalId);
  if (!source) throw new Error('No authorized external source is configured for this user.');
  return source;
}

async function fetchSource(url: string, transport: typeof fetch): Promise<unknown> {
  const response = await transport(url, {
    method: 'GET', cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(8000),
    headers: { accept: 'application/json' },
  });
  if (!response.ok) { await response.body?.cancel(); throw new Error('External source is unavailable.'); }
  return readBoundedJson(response, 131_072);
}

export async function observeBusinessSource(source: ConfiguredBusinessSource, transport: typeof fetch = fetch): Promise<ExternalBusinessConnection> {
  const manifest = validateExternalManifest(await fetchSource(source.manifestUrl, transport));
  return {
    sourceId: source.sourceId, controllerPrincipalId: source.controllerPrincipalId,
    manifestUrl: source.manifestUrl, resourceUrl: source.resourceUrl,
    manifest, manifestSha256: externalManifestDigest(manifest), observedAt: new Date().toISOString(),
    authorityBasis: 'OPERATOR_CONFIGURED', provenance: 'EXTERNAL_SOURCE',
  };
}

export async function readConnectedResource(connection: ExternalBusinessConnection, sources: readonly ConfiguredBusinessSource[], transport: typeof fetch = fetch) {
  const source = sourceForController(sources, connection.sourceId, connection.controllerPrincipalId);
  if (source.resourceUrl !== connection.resourceUrl || source.manifestUrl !== connection.manifestUrl) {
    throw new Error('The configured source changed. Existing paid delivery cannot be silently retargeted.');
  }
  const data = await fetchSource(source.resourceUrl, transport);
  const observedAt = new Date().toISOString();
  const output = { data, observedAt, sourceId: source.sourceId, provenance: 'EXTERNAL_SOURCE' as const };
  return {
    output, observedAt, outputSha256: createHash('sha256').update(canonicalJson(output)).digest('hex'),
    sourceReference: `external:${source.sourceId}:${createHash('sha256').update(source.resourceUrl).digest('hex')}`,
  };
}
