import { WalletIcon } from '@koinx/xui';
import type { DemoMeta } from '../../types';

export default {
  title: 'Empty page',
  platform: 'web',
  note: 'Start here — copy this folder, rename the nav item, build inside it',
  // The one line that puts a screen inside KoinX instead of on a blank page.
  // Change both to wherever your screen lives: 'Transactions' +
  // TransactionsIcon, 'Taxes' + TaxesIcon, and so on.
  nav: { item: 'Wallets', icon: WalletIcon },
} satisfies DemoMeta;
