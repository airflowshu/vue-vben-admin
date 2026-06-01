import type { ComponentRecordType } from '@vben/types';

import {
  componentKeysFromPages,
  defineFlexbootWebModule,
} from '@flexboot4/web-kit';

const pages: ComponentRecordType = import.meta.glob(
  './views/**/*.vue',
) as ComponentRecordType;

const sms4jWeb = defineFlexbootWebModule({
  name: 'sms4j',
  localeNamespace: 'sms',
  pages,
  componentKeys: componentKeysFromPages(pages),
  locales: {
    'en-US': () => import('./locales/langs/en-US/sms.json'),
    'zh-CN': () => import('./locales/langs/zh-CN/sms.json'),
  },
});

export * from './api/sms';
export default sms4jWeb;
