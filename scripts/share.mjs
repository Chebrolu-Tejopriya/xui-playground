#!/usr/bin/env node
// Put your work on the Console, where the team can see it.
//
// This is the step that was missing. A designer could build a demo and it would
// sit on their laptop forever, because publishing it meant `git add`, `git
// commit`, `git push` — three commands and a mental model of git, for someone
// who was promised they would not need a terminal.
//
// WHAT IT WILL NOT DO, and why each guard is here:
//
//   - It stages ONLY src/demos, package.json and package-lock.json. Never
//     `git add -A`: that staged a credentials file in this very repo an hour
//     after the note warning about it was written.
//   - It refuses if the only changes are outside src/demos. Editing the console
//     itself is engineering work and should go through a normal commit, not a
//     button meant for publishing a prototype.
//   - It pulls with --rebase before pushing, so two designers sharing at the
//     same time do not produce a merge someone has to resolve by hand.
//
//   npm run share            commit + push everything under src/demos
//   npm run share -- "note"  with your own message
import { execSync, spawnSync } from 'node:child_process';

const SITE = 'https://xui-playground.vercel.app';

const C = process.stdout.isTTY
  ? { g: '\x1b[32m', r: '\x1b[31m', y: '\x1b[33m', d: '\x1b[2m', b: '\x1b[1m', x: '\x1b[0m' }
  : { g: '', r: '', y: '', d: '', b: '', x: '' };

const git = (cmd) => execSync(`git ${cmd}`, { stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
const stop = (msg, fix) => {
  console.log(`\n${C.r}  ${msg}${C.x}`);
  if (fix) console.log(`  ${C.d}${fix}${C.x}`);
  console.log('');
  process.exit(1);
};

console.log(`\n${C.b}  Sharing your work${C.x}\n`);

/* ---- is there anything to share? ------------------------------------------ */

let changed;
try {
  changed = git('status --porcelain')
    .split('\n')
    .map((l) => l.slice(3).trim())
    .filter(Boolean);
} catch {
  stop('This folder is not a git repository.', 'Run setup first — double-click start.cmd or start.command.');
}

// A real demo is src/demos/<owner>/<slug>/<file> - four segments or more.
// Anything shallower is shared scaffolding: types.ts, and dates.generated.json,
// which is rebuilt from git on every dev and build and is not somebody's work.
const isDemo = (f) => f.startsWith('src/demos/') && f.split('/').length >= 4;
// `npm run share checkout-v3` publishes ONLY that demo. Without a name,
// everything changed goes - fine when you have been working on one thing, a
// surprise when you have three on the go. The narrow form means publishing one
// prototype never quietly publishes a half-finished second.
const pick = process.argv.slice(2).join(' ').trim().toLowerCase();
const slugOf = (f) => f.split('/')[3];
const allMine = changed.filter(isDemo);
const mine = pick ? allMine.filter((f) => slugOf(f).toLowerCase() === pick) : allMine;
const other = changed.filter((f) => !isDemo(f));

if (pick && !mine.length && allMine.length) {
  stop(
    `No changed demo called \"${pick}\".`,
    'Run `npm run share` with no name to publish all of them. Changed now: ' +
      [...new Set(allMine.map(slugOf))].join(', '),
  );
}

if (!mine.length) {
  if (other.length) {
    stop(
      'Nothing changed under src/demos — nothing to share.',
      `You have changed ${other.length} other file(s). Those are console changes rather than a\n` +
        `  demo, so commit them normally rather than with share.`,
    );
  }
  // Not an error: they may have already shared and just want the link.
  console.log(`  ${C.d}Nothing new to share. Everything is already on the Console.${C.x}`);
  console.log(`\n  ${SITE}\n`);
  console.log(`  ${C.d}Working on a demo whose folder starts with _ ? That one is private${C.x}`);
  console.log(`  ${C.d}on purpose - rename it without the underscore to publish it.${C.x}`);
  process.exit(0);
}

const demos = [...new Set(mine.map((f) => f.split('/').slice(0, 4).join('/')))];
console.log(`  ${demos.length} demo(s) changed:`);
for (const d of demos) console.log(`    ${d.replace('src/demos/', '')}`);
const held = [...new Set(allMine.map(slugOf))].filter(
  (d) => !demos.some((path) => path.endsWith('/' + d)),
);
if (held.length) {
  console.log('');
  console.log(`  ${C.y}Holding back ${held.length} other changed demo(s)${C.x}`);
  for (const d of held) console.log(`    ${d}`);
}
if (other.length) {
  console.log(`\n  ${C.y}Leaving ${other.length} other changed file(s) alone${C.x}`);
  console.log(`  ${C.d}share only publishes demos; commit console changes yourself.${C.x}`);
}

/* ---- commit, rebase, push -------------------------------------------------- */

const who = (() => {
  try {
    return git('config user.name');
  } catch {
    return '';
  }
})();
const message = `${demos.map((d) => d.replace('src/demos/', '')).join(', ')}${who ? ' — ' + who : ''}`;

console.log('');
try {
  // Explicit paths, never -A.
  // Stage the chosen demo folders by name rather than all of src/demos, so a
  // narrowed share really is narrow. Explicit paths, never -A.
  spawnSync('git', ['add', ...demos, 'package.json', 'package-lock.json'], { stdio: 'inherit' });
  git(`commit -m ${JSON.stringify(message)}`);
  console.log(`  ${C.g}✓${C.x} Saved  ${C.d}${message}${C.x}`);
} catch (e) {
  stop('Could not save your changes.', String(e.message ?? e).split('\n')[0]);
}

try {
  // Someone else may have shared since you last pulled. Rebase keeps the
  // history linear instead of producing a merge nobody asked for.
  execSync('git pull --rebase --quiet', { stdio: ['ignore', 'pipe', 'pipe'] });
} catch {
  stop(
    'Someone else changed the same files, and it could not be merged automatically.',
    'Ask your AI assistant to help — say "share failed, there is a conflict".',
  );
}

try {
  execSync('git push --quiet', { stdio: ['ignore', 'pipe', 'pipe'] });
} catch (e) {
  const msg = String(e.message ?? e);
  if (/permission|denied|403/i.test(msg)) {
    stop(
      'You do not have permission to publish to this repository yet.',
      'Ask teja to add you as a collaborator on Chebrolu-Tejopriya/xui-playground.',
    );
  }
  stop('Could not publish.', msg.split('\n').slice(0, 2).join(' '));
}

console.log(`  ${C.g}✓${C.x} Published`);
console.log(`\n${C.g}${C.b}  Done.${C.x} Live in about a minute:\n`);
console.log(`  ${SITE}\n`);
console.log(`  ${C.d}Vercel rebuilds on every push; refresh if it is not there yet.${C.x}\n`);
