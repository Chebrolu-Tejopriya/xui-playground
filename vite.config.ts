import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * Where XUI comes from, and why it is conditional.
 *
 * LOCALLY, if the XUI repo is sitting next to this folder, alias straight at
 * its source. Edits there show up here instantly over HMR with no build step —
 * which is the whole reason the two folders are siblings.
 *
 * ON A DEPLOY there is no sibling, so this falls through to the installed
 * `@koinx/xui` from node_modules — the real published package, built by XUI's
 * own `prepare` script on install.
 *
 * That second path is not a fallback, it is a feature. Aliasing source means
 * this app never exercises what consumers actually get: an export that never
 * reaches `dist` passes here and breaks for everyone else. Deploying makes the
 * playground eat the real package, which is the only place that class of bug
 * shows up before a user finds it.
 */
const sourceXui = path.resolve(here, '../xui');
const useSource = fs.existsSync(path.join(sourceXui, 'src/index.ts'));

export default defineConfig({
  plugins: [react()],
  resolve: {
    ...(useSource
      ? {
          alias: {
            // Longest first: Vite matches string aliases in order, so a bare
            // '@koinx/xui' rule would swallow the stylesheet path too.
            '@koinx/xui/styles.css': path.resolve(sourceXui, 'src/tokens/index.css'),
            '@koinx/xui': path.resolve(sourceXui, 'src/index.ts'),
          },
        }
      : {}),
    // XUI's source imports react too. Without this there would be two copies
    // and hooks would throw.
    dedupe: ['react', 'react-dom'],
  },
  server: {
    // Fixed so it never collides with XUI's own dev server on 5173.
    port: 5174,
    strictPort: true,
    // Vite refuses to serve files outside the project root unless told to.
    ...(useSource ? { fs: { allow: [here, sourceXui] } } : {}),
  },
});
