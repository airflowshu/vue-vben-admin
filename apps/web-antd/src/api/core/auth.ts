import { baseRequestClient, requestClient } from '#/api/request';

export namespace AuthApi {
  /** 登录接口参数 */
  export interface LoginParams {
    code?: string;
    loginType?: 'password' | 'sms' | string;
    password?: string;
    phone?: string;
    username?: string;
  }

  /** 登录接口返回值 */
  export interface LoginResult {
    accessToken?: string;
    expiresIn?: number;
    mfaChallengeToken?: string;
    mfaMethods?: string[];
    mfaRequired?: boolean;
  }

  export interface RefreshTokenResult {
    code: number;
    data: string;
    message?: string;
  }

  export interface LoginMethodOption {
    codeLength?: number;
    cooldownSeconds?: number;
    enabled: boolean;
    providers?: LoginProviderOption[];
  }

  export interface LoginProviderOption {
    code: string;
    enabled?: boolean;
  }

  export interface LoginOptions {
    methods: {
      forgetPassword?: LoginMethodOption;
      password?: LoginMethodOption;
      qrcode?: LoginMethodOption;
      register?: LoginMethodOption;
      sms?: LoginMethodOption;
      thirdParty?: LoginMethodOption;
    };
  }

  export type OAuthCallbackStatus =
    | 'BIND_REQUIRED'
    | 'ERROR'
    | 'LOGIN_SUCCESS'
    | 'MFA_REQUIRED';

  export interface OAuthUserSnapshot {
    avatarUrl?: string;
    email?: string;
    emailVerified?: boolean;
    nickname?: string;
    provider?: string;
    providerUsername?: string;
  }

  export interface OAuthBindCandidate {
    emailMasked?: string;
    realName?: string;
    userId: string;
    username: string;
  }

  export interface OAuthCallbackResult {
    bindTicket?: string;
    candidates?: OAuthBindCandidate[];
    externalUser?: OAuthUserSnapshot;
    login?: LoginResult;
    message?: string;
    status: OAuthCallbackStatus;
  }
}

/**
 * 获取登录方式开关
 */
export async function getLoginOptionsApi() {
  return requestClient.get<AuthApi.LoginOptions>('/admin/auth/options');
}

/**
 * 登录
 */
export async function loginApi(data: AuthApi.LoginParams) {
  return requestClient.post<AuthApi.LoginResult>('/admin/auth/login', data);
}

/**
 * MFA 二次验证
 */
export async function verifyMfaApi(data: {
  challengeToken: string;
  code: string;
}) {
  return requestClient.post<AuthApi.LoginResult>(
    '/admin/auth/mfa/verify',
    data,
  );
}

/**
 * 获取第三方登录回调结果
 */
export async function getOAuthResultApi(ticket: string) {
  return requestClient.get<AuthApi.OAuthCallbackResult>(
    `/admin/auth/oauth/result/${encodeURIComponent(ticket)}`,
    {
      withCredentials: true,
    },
  );
}

/**
 * 绑定第三方账号到已有系统账号
 */
export async function bindOAuthAccountApi(
  provider: string,
  data: {
    bindTicket: string;
    password: string;
    username: string;
  },
) {
  return requestClient.post<AuthApi.LoginResult>(
    `/admin/auth/oauth/${encodeURIComponent(provider)}/bind`,
    data,
    {
      withCredentials: true,
    },
  );
}

/**
 * 发送手机号登录验证码
 */
export async function sendSmsCodeApi(phone: string) {
  return requestClient.post<string>('/admin/auth/sms-code', { phone });
}

/**
 * 刷新accessToken
 */
export async function refreshTokenApi() {
  return baseRequestClient.post<AuthApi.RefreshTokenResult>(
    '/admin/auth/refresh',
    undefined,
    {
      withCredentials: true,
    },
  );
}

/**
 * 退出登录
 */
export async function logoutApi() {
  return requestClient.post('/admin/auth/logout', undefined, {
    withCredentials: true,
  });
}

/**
 * 获取用户权限码
 */
export async function getAccessCodesApi() {
  return requestClient.get<string[]>('/admin/auth/codes');
}

/**
 * 忘记密码 - 发送重置邮件
 */
export async function forgetPasswordApi(email: string) {
  return requestClient.post('/admin/auth/forget-password', { email });
}

/**
 * 重置密码 - 提交新密码
 */
export async function resetPasswordApi(data: {
  email: string;
  newPassword: string;
  token: string;
}) {
  return requestClient.post('/admin/auth/reset-password', data);
}
