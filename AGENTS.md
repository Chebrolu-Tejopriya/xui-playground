# The Console

Prototypes built on the KoinX design system. One shared repo, a folder per
person, deployed at <https://xui-playground.vercel.app>.

**Read `node_modules/@koinx/xui/.claude/learnings/` before writing any UI here.**
Six short files that ship with the design system, holding what previous sessions
were told — which component to reach for, what not to build, and the traps. They
are the part that is not derivable from the code.

Then read the `building-demos` skill in `.claude/skills/`, which covers where a
demo goes, the rules, and how to publish.

## The shape

```
src/demos/<person>/<slug>/
  meta.ts      title + platform
  index.tsx    the demo
```

Discovered from the filesystem, never registered. A demo is in the console the
moment its folder exists.

## The commands

```bash
npm run dev          the console, on :5174
npm run share        publish a demo — commits, pulls, pushes, prints the URL
npm run lint:tokens  XUI's own linter, run against this repo
npm run update-xui   move the deployed version onto the latest XUI
```

## What comes from XUI, and what does not

The **package** carries the whole system: every component, icon and token, the
machine-readable contract (`xui.manifest.json`), the colour rulebook, the
searchable icon index, the MCP server, the token linter, and the learnings.

The design system's **repo** — its gates, its Storybook, its Figma parity
skills — does not, and should not. Changing XUI is a separate job in a separate
repo: <https://xui.koinx.com>.

## The rules, short

1. **Never write a raw colour.** Semantic tokens only. The linter enforces it.
2. **Never hand-write an `<svg>` for an icon.** `npx xui-find-icon "<meaning>"`.
3. **Check the system has it before building it.** It usually does.
4. **Do not edit XUI to make a demo work.** That is a PR on the other repo.
