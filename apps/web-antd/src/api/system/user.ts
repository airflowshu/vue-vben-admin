import type { SearchRequest } from '#/api/common';

import { requestClient } from '#/api/request';

/**
 * 用户类型定义
 */
export interface UserRecord {
  id: string;
  username: string;
  realName: string;
  avatar?: string;
  email?: string;
  phone?: string;
  gender?: string;
  genderStr?: string;
  deptId?: string;
  status: number;
  remark?: string;
  createTime?: string;
  lastModifyTime?: string;
  createBy?: string;
  lastModifyBy?: string;
  dept?: DeptRecord;
  roles?: RoleRecord[];
}

export interface DeptRecord {
  id: string;
  parentId: string;
  deptName: string;
  orderNo: number;
  status: number;
  remark?: string;
  createTime?: string;
}

export interface RoleRecord {
  id: string;
  roleName: string;
  roleValue: string;
  status: number;
  orderNo: number;
  remark?: string;
  description?: string;
}

/**
 * 分页结果类型
 */
export interface PageResult<T> {
  pageNumber: number;
  pageSize: number;
  totalRow: number;
  totalPage: number;
  records: T[];
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
  return requestClient.post<PageResult<UserRecord>>('/admin/user/page', params);
}

/**
 * 获取用户列表
 */
export function getUserList(params: SearchRequest) {
  return requestClient.post<UserRecord[]>('/admin/user/list', params);
}

/**
 * 获取用户详情
 */
export function getUserById(id: string) {
  return requestClient.get<UserRecord>(`/admin/user/${id}`);
}

/**
 * 获取当前用户信息
 */
export function getUserInfo() {
  return requestClient.get<Record<string, any>>('/admin/user/info');
}

/**
 * 更新当前用户基本资料
 */
export function updateCurrentUserProfileApi(data: UserProfileUpdateParams) {
  return requestClient.put<Record<string, any>>('/admin/user/profile', data);
}

/**
 * 上传当前用户头像
 */
export function uploadCurrentUserAvatarApi(file: File) {
  return requestClient.upload<UserAvatarUploadResult>(
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
  return requestClient.put<string>('/admin/user/password', data);
}

/**
 * 发送当前用户密保手机绑定验证码
 */
export function sendSecurityPhoneCodeApi(phone: string) {
  return requestClient.post<string>('/admin/user/security-phone/code', {
    phone,
  });
}

/**
 * 绑定或更换当前用户密保手机
 */
export function bindSecurityPhoneApi(data: { code: string; phone: string }) {
  return requestClient.put<SecurityPhoneBindResult>(
    '/admin/user/security-phone',
    data,
  );
}

/**
 * 发送当前用户备用邮箱绑定验证码
 */
export function sendSecurityEmailCodeApi(email: string) {
  return requestClient.post<string>('/admin/user/security-email/code', {
    email,
  });
}

/**
 * 绑定或更换当前用户备用邮箱
 */
export function bindSecurityEmailApi(data: { code: string; email: string }) {
  return requestClient.put<SecurityEmailBindResult>(
    '/admin/user/security-email',
    data,
  );
}

/**
 * 初始化当前用户 TOTP MFA 绑定
 */
export function setupMfaTotpApi() {
  return requestClient.post<UserMfaTotpSetupResult>(
    '/admin/user/mfa/totp/setup',
  );
}

/**
 * 确认绑定当前用户 TOTP MFA
 */
export function confirmMfaTotpApi(data: { code: string; deviceName?: string }) {
  return requestClient.post<UserMfaTotpStatusResult>(
    '/admin/user/mfa/totp/confirm',
    data,
  );
}

/**
 * 关闭当前用户 TOTP MFA
 */
export function disableMfaTotpApi(data: { code: string; password: string }) {
  return requestClient.delete<UserMfaTotpStatusResult>('/admin/user/mfa/totp', {
    data,
  });
}

/**
 * 新增用户
 */
export function createUser(data: Partial<UserRecord>) {
  return requestClient.post('/admin/user', data);
}

/**
 * 修改用户
 */
export function updateUser(id: string, data: Partial<UserRecord>) {
  return requestClient.put(`/admin/user/${id}`, data);
}

/**
 * 删除用户
 */
export function deleteUser(id: string) {
  return requestClient.delete<boolean>(`/admin/user/${id}`);
}

/**
 * 批量删除用户
 */
export function deleteUserBatch(ids: string[]) {
  return requestClient.delete('/admin/user', { data: ids });
}

/**
 * 获取部门列表（用于用户表单选择）
 */
export function getDeptList(params: SearchRequest) {
  return requestClient.post<DeptRecord[]>('/admin/dept/list', params);
}

/**
 * 获取角色列表（用于用户表单选择）
 */
export function getRoleList(params: SearchRequest) {
  return requestClient.post<RoleRecord[]>('/admin/role/list', params);
}

/**
 * 为用户分配角色（先清除该用户的所有角色关联，再批量新增）
 */
export function assignUserRole(userId: string, roleIds: string[]) {
  return requestClient.post(`/admin/user-role/assign/${userId}`, roleIds);
}

/**
 * 管理员触发用户重置密码邮件
 */
export function adminResetPasswordApi(data: { userId: string }) {
  return requestClient.post('/admin/auth/admin/reset-password', data);
}

/**
 * 导出用户列表
 */
export function exportUsers(
  params: SearchRequest,
): Promise<DownloadBlobResponse> {
  return requestClient.download('/admin/user/export', {
    method: 'POST',
    data: params,
  }) as Promise<DownloadBlobResponse>;
}
