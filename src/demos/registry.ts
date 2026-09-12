/**
 * Every demo in this repo, discovered — never listed by hand.
 *
 * Vite's `import.meta.glob` walks `src/demos/<owner>/<slug>/` at build time, so
 * a demo is in the console the moment its folder exists. Nobody has to remember
 * to register it, and nobody can forget to remove it.
 *
 * That is the same rule XUI's visual suite follows (it reads Storybook's own
 * index rather than a list), and it is there for the same reason: a hand-kept
 * list silently stops covering things, and you find out months later.
 *
 *   src/demos/<owner>/<slug>/meta.ts     title + platform, eagerly loaded
 *   src/demos/<owner>/<slug>/index.tsx   the demo, loaded only when opened
 *
 * `owner` is the folder name. `updated` comes from git via
 * `scripts/gen-demo-dates.mjs`; if that has not run, the field is simply
 * absent and the card omits it rather than showing a wrong date.
 */
import type { ComponentType } from 'react';
import type { DemoMeta } from './types';
import dates from './dates.generated.json';

export interface Demo extends DemoMeta {
  /** `<owner>/<slug>` — the URL, and unique by construction. */
  id: string;
  owner: string;
  slug: string;
  /** Relative, e.g. "3 days ago". Absent when git has not been read. */
  updated?: string;
  /**
   * A slug starting with `_` is private: .gitignore hides the folder, so it
   * renders in YOUR console and can never be committed, shared or deployed.
   * Rename it without the underscore to publish it.
   */
  isPrivate: boolean;
  /** Loaded on open, not on list — 60 demos must not all be in the first bundle. */
  load: () => Promise<{ default: ComponentType }>;
}

const metaModules = import.meta.glob<{ default: DemoMeta }>('./*/*/meta.ts', { eager: true });
const demoModules = import.meta.glob<{ default: ComponentType }>('./*/*/index.tsx');

/** "./teja/itr-filing/meta.ts" -> { owner: "teja", slug: "itr-filing" } */
function parse(path: string) {
  const [, owner, slug] = path.split('/');
  return { owner, slug };
}

export const demos: Demo[] = Object.entries(metaModules)
  .map(([path, mod]) => {
    const { owner, slug } = parse(path);
    const id = `${owner}/${slug}`;
    const loader = demoModules[`./${owner}/${slug}/index.tsx`];
    if (!loader) {
      // A meta.ts with no index.tsx beside it is half a demo. Say so loudly —
      // silently dropping it is how a demo goes missing without anyone noticing.
      throw new Error(
        `demo "${id}" has meta.ts but no index.tsx. Every demo folder needs both.`,
      );
    }
    return {
      id,
      owner,
      slug,
      ...mod.default,
      isPrivate: slug.startsWith('_'),
      updated: (dates as Record<string, string>)[id],
      load: loader,
    };
  })
  .sort((a, b) => a.title.localeCompare(b.title));

export const owners = [...new Set(demos.map((d) => d.owner))].sort();

export const countsByPlatform = {
  all: demos.length,
  mobile: demos.filter((d) => d.platform === 'mobile').length,
  web: demos.filter((d) => d.platform === 'web').length,
};
