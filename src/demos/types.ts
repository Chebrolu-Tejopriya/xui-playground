import type { ComponentType } from 'react';
import type { IconProps } from '@koinx/xui';

/**
 * What a demo declares about itself.
 *
 * Only what cannot be derived. The owner comes from the folder name and the
 * date from git, because both of those rot the moment they are typed by hand —
 * the same reason nothing in XUI keeps a list of components by hand either.
 */
export interface DemoMeta {
  /** Shown on the card and in the sidebar. Sentence case, no "Demo" suffix. */
  title: string;
  /** Drives the ALL / MOBILE / WEB filter, and the frame the demo renders in. */
  platform: 'mobile' | 'web';
  /** One line under the title. Optional; say what it explores, not what it is. */
  note?: string;
  /**
   * Where this screen lives in KoinX. Set it, and a web demo renders inside the
   * product — KoinX sidebar on the left, this item selected, your screen in the
   * main area — instead of floating on an empty page.
   *
   *   nav: { item: 'Wallets', icon: WalletIcon }
   *
   * OPT-IN on purpose. A demo that builds its own AppShell (professionals-
   * dashboard, bulk-edit-transactions) must leave this unset, or it would get a
   * sidebar inside a sidebar.
   *
   * Pick the icon with `npx xui-find-icon "<what it is>"`. Icons v2's
   * "Navigation & Sections" set is drawn for exactly this — Overview,
   * Portfolio, Transactions, Wallets, Taxes and the rest.
   */
  nav?: {
    /** The nav item's label — the screen's place in the product. */
    item: string;
    /** An Icons v2 component, passed as the component itself, not an element. */
    icon: ComponentType<IconProps>;
    /**
     * Which KoinX product the screen belongs to, and so which logo heads the
     * sidebar. Leave it out unless the requirement says: the plain KoinX logo
     * is the default, and a product logo on a screen that is not that product
     * is a claim nobody made. `'books'` is not the default just because it was
     * the first lockup XUI had.
     */
    product?: 'books' | 'taxes' | 'professionals';
  };
}
