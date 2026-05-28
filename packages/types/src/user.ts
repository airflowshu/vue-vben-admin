import type { BasicUserInfo } from '@vben-core/typings';

/** 用户信息 */
interface UserInfo extends BasicUserInfo {
  /**
   * 用户描述
   */
  desc: string;
  /**
   * 首页地址
   */
  homePath: string;

  /**
   * accessToken
   */
  token: string;

  /**
   * 是否已绑定密保手机
   */
  securityPhoneBound?: boolean;

  /**
   * 脱敏后的密保手机
   */
  securityPhoneMasked?: null | string;

  /**
   * 是否已绑定备用邮箱
   */
  securityEmailBound?: boolean;

  /**
   * 脱敏后的备用邮箱
   */
  securityEmailMasked?: null | string;

  /**
   * 是否已启用 MFA
   */
  mfaEnabled?: boolean;

  /**
   * MFA 类型
   */
  mfaType?: null | string;

  /**
   * MFA 设备名称
   */
  mfaDeviceName?: null | string;
}

export type { UserInfo };
