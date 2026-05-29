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
    data: string;
    status: number;
  }

  export interface LoginMethodOption {
    codeLength?: number;
    cooldownSeconds?: number;
    enabled: boolean;
    providers?: string[];
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
