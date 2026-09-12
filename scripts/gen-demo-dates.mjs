// When was each demo last touched? Ask git, not a person.
//
// The console shows "7d ago" on every card. A hand-typed date is wrong the day
// after it is typed and nobody ever notices, so this reads the last commit that
// touched each demo folder and writes src/demos/dates.generated.json.
//
// Runs before dev and before build. If git is unavailable — a tarball, a fresh
// clone mid-setup, a CI checkout with no history — it writes an EMPTY object
// rather than failing or guessing. The cards then omit the date, which is
// honest; a made-up date is not.
//
//   node scripts/gen-demo-dates.mjs
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const demosDir = path.join(root, 'src/demos');
const out = path.join(demosDir, 'dates.generated.json');

const dates = {};
let gitWorked = false;

if (fs.existsSync(demosDir)) {
  for (const owner of fs.readdirSync(demosDir, { withFileTypes: true })) {
    if (!owner.isDirectory()) continue;
    for (const slug of fs.readdirSync(path.join(demosDir, owner.name), { withFileTypes: true })) {
      if (!slug.isDirectory()) continue;
      const rel = `src/demos/${owner.name}/${slug.name}`;
      try {
        // %ar is git's own relative format - "3 days ago", "2 months ago".
        const when = execSync(`git log -1 --format=%ar -- "${rel}"`, {
          cwd: root,
          stdio: ['ignore', 'pipe', 'ignore'],
        })
          .toString()
          .trim();
        if (when) {
          dates[`${owner.name}/${slug.name}`] = when;
          gitWorked = true;
        }
      } catch {
        // No git, or no commit touching this path yet. Leave it out.
      }
    }
  }
}

fs.writeFileSync(out, JSON.stringify(dates, null, 2) + '\n');

const n = Object.keys(dates).length;
if (n) console.log(`demo dates: ${n} from git -> ${path.relative(root, out)}`);
else if (gitWorked) console.log('demo dates: none yet — no commits touch src/demos');
else console.log('demo dates: git unavailable or uncommitted; cards will omit the date');
