import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import process from 'node:process';

const staticRoot = join(process.cwd(), '.next', 'static');
const readableExtensions = new Set(['.css', '.html', '.js', '.json', '.map', '.txt']);
const privateEnvironmentNames = [
  'CIRCLE_API_KEY',
  'CIRCLE_ENTITY_SECRET',
  'CIRCLE_WALLET_SET_ID',
  'DATABASE_DIRECT_URL',
  'DATABASE_URL',
  'VERCEL_OIDC_TOKEN',
];

async function filesBelow(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? filesBelow(path) : [path];
    }),
  );
  return nested.flat();
}

const files = (await filesBelow(staticRoot)).filter((path) =>
  readableExtensions.has(extname(path)),
);
assert.ok(files.length > 0, 'Checkpoint H client-safety proof requires a completed Next.js build.');

for (const path of files) {
  const contents = await readFile(path, 'utf8');
  for (const privateName of privateEnvironmentNames) {
    assert.equal(
      contents.includes(privateName),
      false,
      `Private environment name ${privateName} reached browser artifact ${path}.`,
    );
  }
}

process.stdout.write(
  `checkpoint_h_client_safety=PASS browser_artifacts=${files.length} private_environment_names=${privateEnvironmentNames.length}\n`,
);
