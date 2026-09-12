#!/usr/bin/env node
// Move the Console onto the latest XUI.
//
// The dependency is `git+https://github.com/Chebrolu-Tejopriya/xui.git`, which
// looks like it tracks main and does not: npm records the exact commit it
// resolved in package-lock.json, and every install after that gets THAT commit.
// So the lockfile is the version pin, and this is the deliberate act of moving
// it forward.
//
// That pin is a feature. Without it a Vercel build today and one tomorrow could
// ship different XUI, and a demo could change under its author with nothing in
// any history to explain why.
//
// Note this affects DEPLOYS, not local development. Locally the vite config
// aliases @koinx/xui at ../xui/src when the repo is sitting next door, so a
// `git pull` in xui is felt immediately over HMR and the lockfile is irrelevant.
// The two paths are different on purpose - see vite.config.ts.
//
//   npm run update-xui
import { execSync } from 'node:child_process';
import fs from 'node:fs';

const C = process.stdout.isTTY
  ? { g: '\x1b[32m', r: '\x1b[31m', d: '\x1b[2m', b: '\x1b[1m', x: '\x1b[0m' }
  : { g: '', r: '', d: '', b: '', x: '' };

const pinned = () => {
  try {
    const lock = JSON.parse(execSync('git show HEAD:package-lock.json').toString());
    const e = lock.packages?.['node_modules/@koinx/xui']?.resolved ?? '';
    return e.split('#')[1]?.slice(0, 7) ?? null;
  } catch {
    return null;
  }
};

const current = () => {
  const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
  return lock.packages?.['node_modules/@koinx/xui']?.resolved?.split('#')[1]?.slice(0, 7) ?? null;
};

console.log(`\n${C.b}  Updating XUI${C.x}\n`);

const before = pinned();
if (before) console.log(`  ${C.d}Currently pinned to ${before}${C.x}`);

console.log(`  ${C.d}Fetching the latest from main — this rebuilds XUI, so give it a minute.${C.x}\n`);
try {
  execSync('npm install @koinx/xui@git+https://github.com/Chebrolu-Tejopriya/xui.git', {
    stdio: 'inherit',
  });
} catch {
  console.log(`\n${C.r}  Could not fetch XUI.${C.x} Check your connection and try again.\n`);
  process.exit(1);
}

const after = current();

if (before && after === before) {
  console.log(`\n  ${C.d}Already on the latest XUI (${after}). Nothing to commit.${C.x}\n`);
  process.exit(0);
}

console.log(`\n  ${C.g}✓${C.x} ${before ? `${before} → ${after}` : `pinned to ${after}`}`);
console.log(`\n  ${C.d}Check your demos still look right (npm run dev), then publish the pin:${C.x}`);
console.log(`  ${C.d}  git add package.json package-lock.json${C.x}`);
console.log(`  ${C.d}  git commit -m "Update XUI to ${after}"${C.x}`);
console.log(`  ${C.d}  git push${C.x}`);
console.log(`\n  ${C.d}Or ask your assistant: "update xui and publish it".${C.x}\n`);
