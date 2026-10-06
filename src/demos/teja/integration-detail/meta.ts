import { AddIntegrationIcon } from '@koinx/xui';
import type { DemoMeta } from '../../types';

export default {
  title: 'Integration detail',
  platform: 'web',
  note: 'Integration transaction totals include archived activity',
  nav: { item: 'Integrations', icon: AddIntegrationIcon, product: 'taxes' },
} satisfies DemoMeta;
