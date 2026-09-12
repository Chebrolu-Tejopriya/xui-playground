---
name: building-demos
description: Build a prototype in the Console using XUI — where a demo lives, which component to reach for, how to find an icon, and how to publish it. Use whenever someone wants to build, change or share a screen, flow, page or prototype here; when they ask "how do I make a demo", "build me a screen", "add a page"; or before writing any UI in this repo at all.
---

# Building demos

This is the Console: prototypes built on XUI, one shared repo, a folder per
person. **Read this before writing any UI here.**

## First — read what XUI already taught us

XUI ships its accumulated corrections inside the package:

```
node_modules/@koinx/xui/.claude/learnings/
```

Six short files. **Read them before you start.** They hold what previous sessions
were told and are the part that is *not* derivable from the code — an
`owner-correction` in there is settled, and relitigating it is how the same
argument gets had twice.

The two that matter most here:

- `components.md` — which component to reach for, and what NOT to build. It
  will stop you writing a menu (Select already is one) or a styled `<span>`
  (Badge already exists).
- `icons.md` — search, never draw.

They arrive with the package rather than being copied into this repo, so there
is one source and no stale duplicate. If `node_modules` is not installed yet,
run setup first.

## Where a demo goes

```
src/demos/<your-name>/<demo-slug>/
  meta.ts     title + platform ('mobile' | 'web') + an optional one-line note
  index.tsx   default export: the component
```

`<your-name>` is the person's own folder — lowercase, hyphenated. Take it from
`git config user.name` rather than asking; setup put it there for this.

Nothing registers a demo. The console discovers it from the filesystem, so it
appears the moment the folder exists.

## Building it

**Everything comes from XUI.** Two imports and no exceptions:

```tsx
import { Button, Badge, Table, Select } from '@koinx/xui';
```

- **Never write a raw colour.** No hex, no `rgb()`, no primitive like
  `var(--gray-04)`. Semantic tokens only: `var(--surface-raised)`,
  `var(--content-primary)`. `npm run lint:tokens` runs XUI's own linter here and
  will fail you.
- **Never hand-write an `<svg>` for an icon.** `npx xui-find-icon "<what you
  mean>"` searches all 275 by meaning and prints the import.
- **Check a component exists before building one.** The `find_xui_icon` and
  `list_xui_components` MCP tools read the real contract; `xui.manifest.json`
  ships in the package if MCP is not configured.

A prototype that reinvents what the system already has is worse than no
prototype: it looks like a design decision when it is an accident.

## Publishing

```
npm run share
```

Commits their demo, pulls in everyone else's work, pushes, and prints the live
URL. They do **not** need to know git — that is the entire point of the command.

It refuses if the only changes are outside `src/demos`, because changing the
console itself is engineering work and wants a real commit.

## Two things that confuse people

**A local XUI edit shows here and not on the website.** If the xui repo is
sitting next door, this app reads its source directly — so an edit appears
instantly in a prototype, but the deployed Console installs the real pinned
package. When someone says their demo "looks wrong on the site", check
`git status` in the xui folder first. See `gotchas.md` in the shipped learnings.

**Changing XUI is not a prototyping task.** It affects everyone and goes through
a PR on the xui repo. Say so plainly rather than editing it to make a demo work.

## When you are corrected

Write it down. `node_modules/@koinx/xui/.claude/skills/capture-learning/` has the
format. A correction about XUI itself belongs in the xui repo's learnings — tell
the user, since you cannot push there from here.
