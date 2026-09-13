#!/usr/bin/env node
// First-run setup for the Playground. The designer does nothing; this does it.
//
// This is the entry point for someone who wants to BUILD something. The xui
// repo has its own setup for people working on the design system itself, but a
// designer does not need it: this app installs @koinx/xui from GitHub like any
// other consumer, and only uses a local copy if one happens to be sitting next
// door.
//
// Rules, same as xui's: never install Node or a package manager behind
// someone's back, never fail on something optional, and finish by printing ONE
// command rather than three.
//
//   node scripts/setup.mjs
import { execSync, spawnSync } from 'node:child_process';
import readline from 'node:readline';

const C = process.stdout.isTTY
  ? { g: '\x1b[32m', r: '\x1b[31m', y: '\x1b[33m', d: '\x1b[2m', b: '\x1b[1m', x: '\x1b[0m' }
  : { g: '', r: '', y: '', d: '', b: '', x: '' };

const ok = (m) => console.log(`  ${C.g}✓${C.x} ${m}`);
const warn = (m) => console.log(`  ${C.y}!${C.x} ${m}`);
const bad = (m) => console.log(`  ${C.r}✗${C.x} ${m}`);
const head = (m) => console.log(`\n${C.b}${m}${C.x}`);

const problems = [];
const tryRun = (cmd) => {
  try {
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return null;
  }
};
const run = (cmd, args) =>
  spawnSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' }).status === 0;

const ask = async (q) => {
  if (!process.stdin.isTTY) return '';
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const a = await new Promise((res) => rl.question(q, res));
  rl.close();
  return a.trim();
};

console.log(`
${C.b}  Playground — first-run setup${C.x}
  ${C.d}Prototypes built with XUI · this window does the work${C.x}
`);

head('Checking your machine');

const major = Number(process.versions.node.split('.')[0]);
if (major >= 22) ok(`Node.js ${process.versions.node}`);
else {
  bad(`Node.js ${process.versions.node} — this needs 22 or newer`);
  problems.push(
    process.platform === 'win32'
      ? 'Install Node 22+:  winget install OpenJS.NodeJS.LTS   (or nodejs.org)'
      : 'Install Node 22+:  brew install node   (or nodejs.org)',
  );
}

const git = tryRun('git --version');
if (git) ok(git.replace('git version', 'Git'));
else {
  bad('Git is not installed');
  problems.push(
    process.platform === 'win32'
      ? 'Install Git:  winget install Git.Git'
      : 'Install Git:  brew install git',
  );
}

head('Who you are');

let name = tryRun('git config user.name');
let email = tryRun('git config user.email');
if (!name) {
  const a = await ask('  Your first name (it goes on your demos): ');
  if (a) {
    execSync(`git config --global user.name ${JSON.stringify(a)}`);
    name = a;
  }
}
if (!email) {
  const a = await ask('  Your email: ');
  if (a) {
    execSync(`git config --global user.email ${JSON.stringify(a)}`);
    email = a;
  }
}
if (name) ok(`${name}${email ? ` <${email}>` : ''}`);
else {
  warn('No git identity set');
  problems.push('Set it:  git config --global user.name "Your Name"');
}

if (!problems.length) {
  head('Installing');
  console.log(`  ${C.d}A few minutes the first time — XUI builds itself on install. Leave it running.${C.x}\n`);
  if (run('npm', ['install'])) ok('Dependencies');
  else problems.push('npm install failed — send the output above to teja');
}

/* ---- your folder ---------------------------------------------------------- */

const slug = (name || 'you').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

if (problems.length) {
  console.log(`\n${C.r}${C.b}  Setup stopped — ${problems.length} thing(s) need you first${C.x}\n`);
  for (const p of problems) console.log(`    ${p}`);
  console.log(`\n  Then run this again.\n`);
  process.exit(1);
}

console.log(`\n${C.g}${C.b}  Ready.${C.x}\n`);
console.log(`  Go back to your AI assistant and say:  ${C.b}"Setup is done, start the Playground"${C.x}\n`);
console.log(`  ${C.d}Your demos live in  src/demos/${slug}/<name>/  — the assistant will make them.${C.x}`);
console.log(`  ${C.d}When you want the team to see one, say "share my work".${C.x}\n`);
console.log(`  ${C.d}Typing it yourself instead:${C.x}`);
console.log(`  ${C.d}  npm run dev      the Playground, on http://localhost:5174${C.x}`);
console.log(`  ${C.d}  npm run share    publish to https://xui-playground.vercel.app${C.x}\n`);
