import type {
  ComponentRecordType,
  GenerateMenuAndRoutesOptions,
} from '@vben/types';

import { generateAccessible } from '@vben/access';
import { preferences } from '@vben/preferences';

import { mergeFlexbootPages } from '@flexboot4/web-kit';
import { message } from 'ant-design-vue';

import { getAllMenusApi } from '#/api';
import { BasicLayout, IFrameView } from '#/layouts';
import { $t } from '#/locales';
import { enabledFlexbootModules } from '#/modules/enabled';

const forbiddenComponent = () => import('#/views/_core/fallback/forbidden.vue');

async function generateAccess(options: GenerateMenuAndRoutesOptions) {
  const corePageMap: ComponentRecordType = import.meta.glob(
    '../views/**/*.vue',
  );
  const pageMap: ComponentRecordType = {
    ...corePageMap,
    ...mergeFlexbootPages(enabledFlexbootModules),
  };

  const layoutMap: ComponentRecordType = {
    BasicLayout,
    IFrameView,
  };

  return await generateAccessible(preferences.app.accessMode, {
    ...options,
    fetchMenuListAsync: async () => {
      message.loading({
        content: `${$t('common.loadingMenu')}...`,
        duration: 1.5,
      });
      return await getAllMenusApi();
    },
    // 可以指定没有权限跳转403页面
    forbiddenComponent,
    // 如果 route.meta.menuVisibleWithForbidden = true
    layoutMap,
    pageMap,
  });
}

export { generateAccess };
