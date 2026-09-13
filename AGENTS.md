# The Playground

Prototypes built on the KoinX design system. One shared repo, a folder per
person, deployed at <https://xui-playground.vercel.app>.

**Read `node_modules/@koinx/xui/.claude/learnings/` before writing any UI here**
(or call the `get_xui_learnings` tool). Short files that ship with the design
system, holding what previous sessions were told — which component to reach for, what not to build, and the traps. They
are the part that is not derivable from the code.

Then read the `building-demos` skill in `.claude/skills/`, which covers where a
demo goes, the rules, and how to publish.

## The shape

```
src/demos/<person>/<slug>/
  meta.ts      title + platform (+ nav, for a web screen)
  index.tsx    the demo
```

Discovered from the filesystem, never registered. A demo is in the Playground the
moment its folder exists.

**A web screen goes inside KoinX, not on a blank page.** Set `nav` in `meta.ts` —
`{ item: 'Transactions', icon: TransactionsIcon }` — and the Playground draws the
KoinX sidebar with that one item selected, and your screen in the main column.
The demo then renders only the page: no AppShell, no Sidebar, no logo of its own.
Start from `src/demos/examples/empty-page/`.

## The MCP server

XUI's own MCP server is already configured — `.mcp.json` for Claude Code,
`.cursor/mcp.json` for Cursor, `.codex/config.toml` for Codex. The first time,
your tool asks whether to allow the `xui` server: say yes. It runs from the
installed package, so it answers for the exact XUI this Playground is pinned to.

Use it instead of guessing: `list_xui_components` before building anything,
`get_xui_component` before using one, `find_xui_icon` for icons,
`get_xui_tokens` instead of picking a colour, `get_xui_learnings` for what
earlier sessions were corrected on.

## The commands

```bash
npm run dev          the Playground, on :5174
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
repo: <https://xui-five.vercel.app>.

## The rules, short

1. **Never write a raw colour.** Semantic tokens only. The linter enforces it.
2. **Never hand-write an `<svg>` for an icon.** `npx xui-find-icon "<meaning>"`.
3. **Check the system has it before building it.** It usually does.
4. **A web screen sets `nav`**, unless it deliberately builds a whole sidebar of
   its own. Never both — that is a sidebar inside a sidebar.
5. **Do not edit XUI to make a demo work.** That is a PR on the other repo.
