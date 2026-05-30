import type { ComponentRecordType } from '@vben/types';

import {
  componentKeysFromPages,
  defineFlexbootWebModule,
} from '@flexboot4/web-kit';

const pages: ComponentRecordType = import.meta.glob(
  './views/**/*.vue',
) as ComponentRecordType;

const mediaWeb = defineFlexbootWebModule({
  name: 'media',
  pages,
  componentKeys: componentKeysFromPages(pages),
  locales: {
    'en-US': () => import('./locales/langs/en-US/media.json'),
    'zh-CN': () => import('./locales/langs/zh-CN/media.json'),
  },
});

export * from './api/media/cascade';
export * from './api/media/device';
export * from './api/media/gateway';
export * from './api/media/screen';
export * from './api/media/server';
export * from './api/media/types';
export default mediaWeb;
