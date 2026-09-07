import { execFileSync } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import { Client } from 'pg';

import { ArcTestnetRpc } from '../src/platform/arc/rpc.ts';
import { readGeminiConfig } from '../src/platform/ai/gemini.ts';
import { readCircleDeveloperWalletConfig } from '../src/platform/circle/config.ts';
import { readBusinessSources } from '../src/platform/http/business-source.ts';
import { readDatabaseConnectionConfig } from '../src/platform/persistence/config.ts';

type Check = { name: string; state: 'PASS' | 'BLOCKED' | 'NOT_CONFIGURED' | 'NOT_CHECKED'; detail: string };
const checks: Check[] = [];
const configuredValue = (name: string) => {
  const value = process.env[name]?.trim();
  return Boolean(value && !value.includes('<') && !value.includes('>'));
};

async function main(): Promise<void> {
  const supported = ['LOCAL_DEVELOPMENT', 'PRIVATE_ARC_TESTNET'].includes(process.env['INOMASA_ENV'] ?? '');
  checks.push({ name: 'node', state: process.versions.node.split('.')[0] === '22' ? 'PASS' : 'BLOCKED', detail: `Node ${process.versions.node}; project requires Node 22.` });
  checks.push({ name: 'environment', state: supported ? 'PASS' : 'BLOCKED', detail: 'Local application testing requires LOCAL_DEVELOPMENT or PRIVATE_ARC_TESTNET. Arc settlement proof uses PRIVATE_ARC_TESTNET.' });
  const authReady = configuredValue('INOMASA_AUTH_SECRET') && (process.env['INOMASA_AUTH_SECRET']?.length ?? 0) >= 32 && configuredValue('INOMASA_ALPHA_INVITES');
  checks.push({ name: 'product_login', state: authReady ? 'PASS' : 'NOT_CONFIGURED', detail: 'Checks configuration presence only; no invitation or session secret is printed.' });
  try {
    readCircleDeveloperWalletConfig();
    if (!['CIRCLE_API_KEY', 'CIRCLE_ENTITY_SECRET', 'CIRCLE_WALLET_SET_ID'].every(configuredValue)) throw new Error('Placeholder.');
    checks.push({ name: 'circle', state: 'PASS', detail: 'Configuration present; provider access, wallet ownership and balances are NOT verified.' });
  } catch {
    checks.push({ name: 'circle', state: 'NOT_CONFIGURED', detail: 'Authorized Circle test configuration is needed for wallet and payment execution.' });
  }
  try {
    readGeminiConfig();
    checks.push({ name: 'ai', state: 'PASS', detail: 'Configuration present; no generation, quota use or model-availability claim.' });
  } catch {
    checks.push({ name: 'ai', state: 'NOT_CONFIGURED', detail: 'AI drafting requires an authorized Gemini key and explicit model selection.' });
  }
  try {
    const sources = readBusinessSources();
    checks.push({ name: 'connect', state: sources.length > 0 ? 'PASS' : 'NOT_CONFIGURED', detail: `${sources.length} configured sources; external data and control are not yet verified.` });
  } catch {
    checks.push({ name: 'connect', state: 'BLOCKED', detail: 'Invalid or unsupported source configuration. Values were not logged.' });
  }
  let database: Client | undefined;
  try {
    if (!supported) throw new Error('Unsupported environment.');
    database = new Client({
      connectionString: readDatabaseConnectionConfig('runtime').connectionString,
      connectionTimeoutMillis: 5000, statement_timeout: 5000, query_timeout: 6000,
    });
    await database.connect();
    const expected = (await readdir(new URL('../migrations/', import.meta.url))).filter((name) => name.endsWith('.ts')).map((name) => name.slice(0, -3));
    const applied = await database.query<{ name: string }>('select name from public.kysely_migration');
    const missing = expected.filter((name) => !applied.rows.some((row) => row.name === name));
    checks.push({ name: 'database', state: missing.length === 0 ? 'PASS' : 'BLOCKED', detail: `${missing.length} unapplied migrations; this command only reads, never migrates or seeds.` });
  } catch {
    checks.push({ name: 'database', state: 'BLOCKED', detail: 'Database or migration state could not be read. Connection details were not logged.' });
  } finally { await database?.end(); }
  if (supported && !process.argv.includes('--offline')) {
    try {
      const snapshot = await new ArcTestnetRpc().readNetworkSnapshot(new Date().toISOString());
      checks.push({ name: 'arc_read', state: 'PASS', detail: `Arc chain ${snapshot.chainId}, block ${snapshot.blockNumber}; read-only connectivity, not a payment proof.` });
    } catch {
      checks.push({ name: 'arc_read', state: 'BLOCKED', detail: 'Arc read could not be verified. TLS and the selected network were not changed.' });
    }
  } else {
    checks.push({ name: 'arc_read', state: 'NOT_CHECKED', detail: 'Network inspection skipped.' });
  }
  let commit = 'UNAVAILABLE';
  try { commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { /* Source is explicitly unavailable. */ }
  console.log(JSON.stringify({ commit, checks, moneyMoved: false, deploymentCreated: false }, null, 2));
  if (checks.some((check) => check.state === 'BLOCKED')) process.exitCode = 1;
}

main().catch(() => { console.error('Local readiness inspection failed. No configuration values were logged.'); process.exitCode = 1; });
