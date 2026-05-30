import type { SearchRequest } from '@flexboot4/web-kit';

import { useFlexbootRequestClient } from '@flexboot4/web-kit';

/**
 * 用户类型定义
 */
export interface UserRecord {
  avatar?: string;
  createBy?: string;
  createTime?: string;
  dept?: DeptRecord;
  deptId?: string;
  email?: string;
  gender?: string;
  genderStr?: string;
  id: string;
  lastModifyBy?: string;
  lastModifyTime?: string;
  phone?: string;
  realName: string;
  remark?: string;
  roles?: RoleRecord[];
  status: number;
  username: string;
}

export interface DeptRecord {
  createTime?: string;
  deptName: string;
  id: string;
  orderNo: number;
  parentId: string;
  remark?: string;
  status: number;
}

export interface RoleRecord {
  description?: string;
  id: string;
  orderNo: number;
  remark?: string;
  roleName: string;
  roleValue: string;
  status: number;
}

/**
 * 分页结果类型
 */
export interface PageResult<T> {
  pageNumber: number;
  pageSize: number;
  records: T[];
  totalPage: number;
  totalRow: number;
}

export interface DownloadBlobResponse {
  data: Blob;
  headers?: Record<string, string>;
}

export interface UserAvatarUploadResult {
  expireAt?: string;
  fileId: string;
  url: string;
}

export interface SecurityPhoneBindResult {
  bound: boolean;
  phoneMasked: string;
}

export interface SecurityEmailBindResult {
  bound: boolean;
  emailMasked: string;
}

export interface UserProfileUpdateParams {
  profileFileId?: string;
  realName: string;
  remark?: string;
}

export interface UserMfaTotpSetupResult {
  accountName: string;
  digits: number;
  issuer: string;
  manualKey: string;
  otpauthUri: string;
  period: number;
}

export interface UserMfaTotpStatusResult {
  deviceName?: null | string;
  enabled: boolean;
  type?: 'TOTP' | null | string;
}

export interface CurrentUserPasswordUpdateParams {
  confirmPassword: string;
  newPassword: string;
  oldPassword: string;
}

/**
 * 获取用户分页列表
 */
export function getUserPage(params: SearchRequest) {
  return useFlexbootRequestClient().post<PageResult<UserRecord>>(
    '/admin/user/page',
    params,
  );
}

/**
 * 获取用户列表
 */
export function getUserList(params: SearchRequest) {
  return useFlexbootRequestClient().post<UserRecord[]>(
    '/admin/user/list',
    params,
  );
}

/**
 * 获取用户详情
 */
export function getUserById(id: string) {
  return useFlexbootRequestClient().get<UserRecord>(`/admin/user/${id}`);
}

/**
 * 获取当前用户信息
 */
export function getUserInfo() {
  return useFlexbootRequestClient().get<Record<string, any>>(
    '/admin/user/info',
  );
}

/**
 * 更新当前用户基本资料
 */
export function updateCurrentUserProfileApi(data: UserProfileUpdateParams) {
  return useFlexbootRequestClient().put<Record<string, any>>(
    '/admin/user/profile',
    data,
  );
}

/**
 * 上传当前用户头像
 */
export function uploadCurrentUserAvatarApi(file: File) {
  return useFlexbootRequestClient().upload<UserAvatarUploadResult>(
    '/admin/user/avatar/upload',
    { file },
    {
      headers: {
        'Content-Type': undefined,
      },
    },
  );
}

/**
 * 修改当前用户密码
 */
export function updateCurrentUserPasswordApi(
  data: CurrentUserPasswordUpdateParams,
) {
  return useFlexbootRequestClient().put<string>('/admin/user/password', data);
}

/**
 * 发送当前用户密保手机绑定验证码
 */
export function sendSecurityPhoneCodeApi(phone: string) {
  return useFlexbootRequestClient().post<string>(
    '/admin/user/security-phone/code',
    {
      phone,
    },
  );
}

/**
 * 绑定或更换当前用户密保手机
 */
export function bindSecurityPhoneApi(data: { code: string; phone: string }) {
  return useFlexbootRequestClient().put<SecurityPhoneBindResult>(
    '/admin/user/security-phone',
    data,
  );
}

/**
 * 发送当前用户备用邮箱绑定验证码
 */
export function sendSecurityEmailCodeApi(email: string) {
  return useFlexbootRequestClient().post<string>(
    '/admin/user/security-email/code',
    {
      email,
    },
  );
}

/**
 * 绑定或更换当前用户备用邮箱
 */
export function bindSecurityEmailApi(data: { code: string; email: string }) {
  return useFlexbootRequestClient().put<SecurityEmailBindResult>(
    '/admin/user/security-email',
    data,
  );
}

/**
 * 初始化当前用户 TOTP MFA 绑定
 */
export function setupMfaTotpApi() {
  return useFlexbootRequestClient().post<UserMfaTotpSetupResult>(
    '/admin/user/mfa/totp/setup',
  );
}

/**
 * 确认绑定当前用户 TOTP MFA
 */
export function confirmMfaTotpApi(data: { code: string; deviceName?: string }) {
  return useFlexbootRequestClient().post<UserMfaTotpStatusResult>(
    '/admin/user/mfa/totp/confirm',
    data,
  );
}

/**
 * 关闭当前用户 TOTP MFA
 */
export function disableMfaTotpApi(data: { code: string; password: string }) {
  return useFlexbootRequestClient().delete<UserMfaTotpStatusResult>(
    '/admin/user/mfa/totp',
    {
      data,
    },
  );
}

/**
 * 新增用户
 */
export function createUser(data: Partial<UserRecord>) {
  return useFlexbootRequestClient().post('/admin/user', data);
}

/**
 * 修改用户
 */
export function updateUser(id: string, data: Partial<UserRecord>) {
  return useFlexbootRequestClient().put(`/admin/user/${id}`, data);
}

/**
 * 删除用户
 */
export function deleteUser(id: string) {
  return useFlexbootRequestClient().delete<boolean>(`/admin/user/${id}`);
}

/**
 * 批量删除用户
 */
export function deleteUserBatch(ids: string[]) {
  return useFlexbootRequestClient().delete('/admin/user', { data: ids });
}

/**
 * 获取部门列表（用于用户表单选择）
 */
export function getDeptList(params: SearchRequest) {
  return useFlexbootRequestClient().post<DeptRecord[]>(
    '/admin/dept/list',
    params,
  );
}

/**
 * 获取角色列表（用于用户表单选择）
 */
export function getRoleList(params: SearchRequest) {
  return useFlexbootRequestClient().post<RoleRecord[]>(
    '/admin/role/list',
    params,
  );
}

/**
 * 为用户分配角色（先清除该用户的所有角色关联，再批量新增）
 */
export function assignUserRole(userId: string, roleIds: string[]) {
  return useFlexbootRequestClient().post(
    `/admin/user-role/assign/${userId}`,
    roleIds,
  );
}

/**
 * 管理员触发用户重置密码邮件
 */
export function adminResetPasswordApi(data: { userId: string }) {
  return useFlexbootRequestClient().post(
    '/admin/auth/admin/reset-password',
    data,
  );
}

/**
 * 导出用户列表
 */
export function exportUsers(
  params: SearchRequest,
): Promise<DownloadBlobResponse> {
  return useFlexbootRequestClient().download('/admin/user/export', {
    method: 'POST',
    data: params,
  }) as Promise<DownloadBlobResponse>;
}
