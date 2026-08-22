import { rm } from 'node:fs/promises';
import { URL } from 'node:url';

for (const directory of ['../.next', '../dist']) {
  await rm(new URL(directory, import.meta.url), {
    force: true,
    recursive: true,
  });
}
