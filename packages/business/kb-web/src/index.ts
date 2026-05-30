import type { ComponentRecordType } from '@vben/types';

import {
  componentKeysFromPages,
  defineFlexbootWebModule,
} from '@flexboot4/web-kit';

const pages: ComponentRecordType = import.meta.glob(
  './views/**/*.vue',
) as ComponentRecordType;

const kbWeb = defineFlexbootWebModule({
  name: 'kb',
  pages,
  componentKeys: componentKeysFromPages(pages),
  locales: {
    'en-US': () => import('./locales/langs/en-US/kb.json'),
    'zh-CN': () => import('./locales/langs/zh-CN/kb.json'),
  },
});

export * from './api/knowledgebase';
export default kbWeb;
