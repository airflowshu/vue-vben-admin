import type { Recordable, UserInfo } from '@vben/types';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';
import { resetAllStores, useAccessStore, useUserStore } from '@vben/stores';

import { notification } from 'ant-design-vue';
import { defineStore } from 'pinia';

import {
  getAccessCodesApi,
  getLoginOptionsApi,
  getUserInfoApi,
  loginApi,
  logoutApi,
  verifyMfaApi,
} from '#/api';
import type { AuthApi } from '#/api';
import { $t } from '#/locales';

interface MfaChallengeState {
  expiresIn?: number;
  methods: string[];
  token: string;
}

export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const router = useRouter();

  const loginLoading = ref(false);
  const loginOptions = ref<AuthApi.LoginOptions | null>(null);
  const mfaChallenge = ref<MfaChallengeState | null>(null);

  /**
   * 异步处理登录操作
   * Asynchronously handle the login process
   * @param params 登录表单数据
   */
  async function authLogin(
    params: Recordable<unknown>,
    onSuccess?: () => Promise<void> | void,
  ) {
    // 异步处理用户登录操作并获取 accessToken
    let userInfo: null | UserInfo = null;
    try {
      loginLoading.value = true;
      const result = await loginApi(params);
      setMfaChallenge(result);
      const { accessToken } = result;

      // 如果成功获取到 accessToken
      if (accessToken) {
        userInfo = await completeLogin(accessToken, onSuccess);
      }
    } finally {
      loginLoading.value = false;
    }

    return {
      userInfo,
    };
  }

  async function authVerifyMfa(code: string, onSuccess?: () => Promise<void> | void) {
    if (!mfaChallenge.value?.token) {
      throw new Error('MFA challenge is missing');
    }
    let userInfo: null | UserInfo = null;
    try {
      loginLoading.value = true;
      const result = await verifyMfaApi({
        challengeToken: mfaChallenge.value.token,
        code,
      });
      if (result.accessToken) {
        userInfo = await completeLogin(result.accessToken, onSuccess);
        clearMfaChallenge();
      }
    } finally {
      loginLoading.value = false;
    }
    return {
      userInfo,
    };
  }

  function setMfaChallenge(result: AuthApi.LoginResult) {
    if (!result.mfaRequired || !result.mfaChallengeToken) {
      mfaChallenge.value = null;
      return;
    }
    mfaChallenge.value = {
      expiresIn: result.expiresIn,
      methods: result.mfaMethods ?? ['totp'],
      token: result.mfaChallengeToken,
    };
  }

  function clearMfaChallenge() {
    mfaChallenge.value = null;
  }

  async function completeLogin(
    accessToken: string,
    onSuccess?: () => Promise<void> | void,
  ) {
    accessStore.setAccessToken(accessToken);

    // 获取用户信息并存储到 accessStore 中
    const [fetchUserInfoResult, accessCodes] = await Promise.all([
      fetchUserInfo(),
      getAccessCodesApi(),
    ]);

    const userInfo = fetchUserInfoResult;

    userStore.setUserInfo(userInfo);
    accessStore.setAccessCodes(accessCodes);

    if (accessStore.loginExpired) {
      accessStore.setLoginExpired(false);
    } else {
      onSuccess
        ? await onSuccess?.()
        : await router.push(userInfo.homePath || preferences.app.defaultHomePath);
    }

    if (userInfo?.realName) {
      notification.success({
        description: `${$t('authentication.loginSuccessDesc')}:${userInfo?.realName}`,
        duration: 3,
        message: $t('authentication.loginSuccess'),
      });
    }

    return userInfo;
  }

  async function logout(redirect: boolean = true) {
    try {
      await logoutApi();
    } catch {
      // 不做任何处理
    }
    resetAllStores();
    accessStore.setLoginExpired(false);

    // 回登录页带上当前路由地址
    await router.replace({
      path: LOGIN_PATH,
      query: redirect
        ? {
            redirect: encodeURIComponent(router.currentRoute.value.fullPath),
          }
        : {},
    });
  }

  async function fetchUserInfo() {
    const userInfo = await getUserInfoApi();
    userStore.setUserInfo(userInfo);
    return userInfo;
  }

  function $reset() {
    loginLoading.value = false;
    mfaChallenge.value = null;
  }

  async function fetchLoginOptions() {
    loginOptions.value = await getLoginOptionsApi();
    return loginOptions.value;
  }

  return {
    $reset,
    authLogin,
    authVerifyMfa,
    clearMfaChallenge,
    fetchLoginOptions,
    fetchUserInfo,
    loginLoading,
    loginOptions,
    logout,
    mfaChallenge,
    setMfaChallenge,
  };
});
