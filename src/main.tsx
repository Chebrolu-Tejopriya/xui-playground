import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Playground from './Playground';

// The built package emits its CSS separately - dist/xui.js does NOT import it -
// so a real consumer has to ask for it by hand or every token is undefined.
// Aliased to XUI's source in local dev; the actual stylesheet on a deploy.
import '@koinx/xui/styles.css';

/**
 * One entry. The Playground reads `?demo=<owner>/<slug>` and either lists every
 * demo or renders one — see src/demos/registry.ts, which discovers them from
 * the filesystem rather than from a list anybody has to maintain.
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Playground />
  </StrictMode>,
);
