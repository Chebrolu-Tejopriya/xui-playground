import { EmptyState } from '@koinx/xui';

/**
 * The starting point for a web demo.
 *
 * `nav` in meta.ts is what draws the KoinX sidebar round this — the demo itself
 * renders only the page. So there is no AppShell, no Sidebar and no logo here:
 * whatever this returns lands in the main column, beside the nav item.
 *
 * Replace the EmptyState with your screen.
 */
export default function EmptyPage() {
  return (
    <EmptyState
      style={{ flex: 1, justifyContent: 'center' }}
      title="Your screen goes here"
      description="Copy this folder to src/demos/<your-name>/<demo>/, set the nav item in meta.ts, and replace this with what you are building."
    />
  );
}
