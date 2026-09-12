# XUI Playground

A scratch project for building and testing screens with the XUI design system.
**Not part of XUI** — it sits beside the repo and consumes it.

```bash
npm install
npm run dev     # http://localhost:5174
```

Everything comes from one import:

```tsx
import { AppShell, Sidebar, Button, Badge } from '@koinx/xui';
```

That also loads the design tokens, so there is no setup step.

## How it finds XUI

`vite.config.ts` aliases `@koinx/xui` to `../xui/src/index.ts` — the **source**, not a
built package. Edits in the XUI repo show up here immediately over HMR, with no
build in between. If you move either folder, change the `XUI` constant there and
the `paths` entry in `tsconfig.json`.

## What it cannot do

Nothing here can change the design system. XUI's manifest, parity gates and
component docs only scan its own `src/components`, so experiments never leak
into it. If something you need is not exported from `@koinx/xui`, that is a real gap in
the public surface — worth raising rather than importing from XUI's internals.
