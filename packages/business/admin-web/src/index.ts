import type { ComponentRecordType } from '@vben/types';

import {
  componentKeysFromPages,
  defineFlexbootWebModule,
} from '@flexboot4/web-kit';

const pages: ComponentRecordType = import.meta.glob(
  './views/**/*.vue',
) as ComponentRecordType;

const adminWeb = defineFlexbootWebModule({
  name: 'admin',
  pages,
  componentKeys: componentKeysFromPages(pages),
  locales: {
    'en-US': async () => ({
      default: Object.assign(
        {},
        await import('./locales/langs/en-US/devops.json').then(
          (module) => module.default,
        ),
        await import('./locales/langs/en-US/system.json').then(
          (module) => module.default,
        ),
      ),
    }),
    'zh-CN': async () => ({
      default: Object.assign(
        {},
        await import('./locales/langs/zh-CN/devops.json').then(
          (module) => module.default,
        ),
        await import('./locales/langs/zh-CN/system.json').then(
          (module) => module.default,
        ),
      ),
    }),
  },
});

export {
  bindSecurityEmailApi,
  bindSecurityPhoneApi,
  confirmMfaTotpApi,
  disableMfaTotpApi,
  sendSecurityEmailCodeApi,
  sendSecurityPhoneCodeApi,
  setupMfaTotpApi,
  updateCurrentUserPasswordApi,
  updateCurrentUserProfileApi,
  uploadCurrentUserAvatarApi,
} from './api/system/user';
export type { UserMfaTotpSetupResult } from './api/system/user';
export default adminWeb;
