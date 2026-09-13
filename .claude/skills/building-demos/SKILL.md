---
name: building-demos
description: Build a prototype in the Playground using XUI — where a demo lives, which component to reach for, how to find an icon, and how to publish it. Use whenever someone wants to build, change or share a screen, flow, page or prototype here; when they ask "how do I make a demo", "build me a screen", "add a page"; or before writing any UI in this repo at all.
---

# Building demos

This is the Playground: prototypes built on XUI, one shared repo, a folder per
person. **Read this before writing any UI here.**

## First — read what XUI already taught us

XUI ships its accumulated corrections inside the package:

```
node_modules/@koinx/xui/.claude/learnings/
```

Short files, one per topic — or call the `get_xui_learnings` MCP tool, which
returns the same thing. **Read them before you start.** They hold what previous sessions
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
              + nav, for a web screen
  index.tsx   default export: the component
```

**Copy `src/demos/examples/empty-page/` to start.** It is the smallest correct
web demo.

`<your-name>` is the person's own folder — lowercase, hyphenated. Take it from
`git config user.name` rather than asking; setup put it there for this.

Nothing registers a demo. The Playground discovers it from the filesystem, so it
appears the moment the folder exists.

## Put the screen in the product

A web screen floating on an empty page reads as a mockup. The same screen with
KoinX's sidebar round it reads as a place in the product — which is usually the
question the prototype exists to answer. So for any **web** demo, set `nav`:

```ts
import { TransactionsIcon } from '@koinx/xui';

export default {
  title: 'Transaction filters',
  platform: 'web',
  nav: { item: 'Transactions', icon: TransactionsIcon },
} satisfies DemoMeta;
```

The Playground then draws XUI's real `AppShell` and `Sidebar` — KoinX logo, that
**one** item, selected — and puts the demo in the main column. So `index.tsx`
returns **only the page**:

- no `AppShell`, no `Sidebar`, no logo — the frame already has them
- no `min-height: 100vh` or centring the whole page — you are in a column now
- no fake extra nav items to make it look fuller; one item is the point

**The logo is the plain KoinX logo** unless the requirement names a product.
Then say which, and the frame uses that product's lockup:

```ts
nav: { item: 'Dashboard', icon: OverviewIcon, product: 'professionals' },
```

Work out where the requirement comes from — a KoinX Books brief, a Taxes one, a
Professionals one. If it does not say, leave `product` out. Books is not the
default; it was only the first lockup XUI had, and putting it on a screen that
is not Books is a claim nobody made. The same goes for a demo that builds its
own sidebar: `KoinXLogo` unless the product is known.

Name the item after where the screen lives in KoinX, and pick its icon with
`npx xui-find-icon "<section>"` — Icons v2's *Navigation & Sections* set is drawn
for exactly this: Overview, Portfolio, Transactions, Wallets, Taxes, and more.
If you are not sure where it lives, **ask** rather than guess; the nav item is a
claim about the product.

**The exception:** a demo that is *about* the navigation — several items,
sub-items, a footer, the collapse behaviour — builds its own `AppShell` and
leaves `nav` unset. `teja/professionals-dashboard` is one. Never both: that is a
sidebar inside a sidebar.

Mobile demos ignore `nav`; they render in a phone frame instead.

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
- **Check a component exists before building one.** The `xui` MCP server is
  configured in this repo (`.mcp.json`, `.cursor/mcp.json`,
  `.codex/config.toml`): `list_xui_components`, `get_xui_component` and
  `find_xui_icon` read the real contract. If the user declined the server,
  `node_modules/@koinx/xui/xui.manifest.json` is the same data.

A prototype that reinvents what the system already has is worse than no
prototype: it looks like a design decision when it is an accident.

## Publishing

```
npm run share
```

Commits their demo, pulls in everyone else's work, pushes, and prints the live
URL. They do **not** need to know git — that is the entire point of the command.

It refuses if the only changes are outside `src/demos`, because changing the
Playground itself is engineering work and wants a real commit.

## Two things that confuse people

**A local XUI edit shows here and not on the website.** If the xui repo is
sitting next door, this app reads its source directly — so an edit appears
instantly in a prototype, but the deployed Playground installs the real pinned
package. When someone says their demo "looks wrong on the site", check
`git status` in the xui folder first. See `gotchas.md` in the shipped learnings.

**Changing XUI is not a prototyping task.** It affects everyone and goes through
a PR on the xui repo. Say so plainly rather than editing it to make a demo work.

## When you are corrected

Write it down. `node_modules/@koinx/xui/.claude/skills/capture-learning/` has the
format. A correction about XUI itself belongs in the xui repo's learnings — tell
the user, since you cannot push there from here.
