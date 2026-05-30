import type { ComponentRecordType } from '@vben/types';

import {
  componentKeysFromPages,
  defineFlexbootWebModule,
} from '@flexboot4/web-kit';

const pages: ComponentRecordType = import.meta.glob(
  './views/**/*.vue',
) as ComponentRecordType;

const cmsWeb = defineFlexbootWebModule({
  name: 'cms',
  pages,
  componentKeys: componentKeysFromPages(pages),
  locales: {
    'en-US': () => import('./locales/langs/en-US/cms.json'),
    'zh-CN': () => import('./locales/langs/zh-CN/cms.json'),
  },
});

export * from './api/cms/article';
export * from './api/cms/article-file';
export * from './api/cms/article-tag';
export * from './api/cms/category';
export * from './api/cms/tag';
export * from './api/cms/template';
export * from './api/cms/types';
export * from './api/cms/upload';
export default cmsWeb;
