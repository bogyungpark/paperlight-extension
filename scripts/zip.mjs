#!/usr/bin/env node
// Packages dist/ into paperlight-extension-<version>.zip for Chrome Web Store upload.
// Uses Node's built-in capabilities via child_process to spawn `zip` on macOS/Linux,
// falling back to a JS implementation if `zip` isn't available.

import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const dist = join(root, 'dist');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const out = join(root, `paperlight-extension-${pkg.version}.zip`);

if (!existsSync(dist)) {
  console.error(`dist/ does not exist — run "npm run build" first.`);
  process.exit(1);
}

const res = spawnSync('zip', ['-r', out, '.'], { cwd: dist, stdio: 'inherit' });
if (res.status === 0) {
  console.log(`packaged → ${out}`);
} else {
  console.error('zip failed; ensure /usr/bin/zip is installed.');
  process.exit(res.status ?? 1);
}
