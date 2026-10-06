import { TransactionsIcon } from '@koinx/xui';
import type { DemoMeta } from '../../types';

export default {
  title: 'Transaction archive',
  platform: 'web',
  note: 'Exclude transactions from tax calculations and portfolio while retaining them in the account',
  nav: { item: 'Transactions', icon: TransactionsIcon, product: 'taxes' },
} satisfies DemoMeta;
