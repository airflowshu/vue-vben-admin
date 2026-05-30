import type { SearchRequest } from '@flexboot4/web-kit';

import { useFlexbootRequestClient } from '@flexboot4/web-kit';

export interface AiApiKey {
  apiKey: string;
  createBy?: string;
  createTime?: string;
  expiresAt?: string;
  id: string;
  keyName: string;
  lastModifyBy?: string;
  lastModifyTime?: string;
  lastUsedTime?: string;
  modelScope: string;
  notes?: string;
  quote: number;
  remark?: string;
  status: number;
  statusStr: string;
  used: number;
  user?: {
    id: string;
    realName?: string;
    username?: string;
  };
  userId: string;
}

export interface PageResult<T> {
  pageNumber: number;
  pageSize: number;
  records: T[];
  totalPage?: number;
  totalRow: number;
}

/**
 * Get API Key page list
 */
export function getApiKeyPage(params: SearchRequest) {
  return useFlexbootRequestClient().post<PageResult<AiApiKey>>(
    '/admin/api-key/page',
    params,
  );
}

/**
 * Get API Key by ID
 */
export function getApiKeyById(id: string) {
  return useFlexbootRequestClient().get<AiApiKey>(`/admin/api-key/${id}`);
}

/**
 * Create API Key
 */
export function createApiKey(data: Partial<AiApiKey>) {
  return useFlexbootRequestClient().post<boolean>('/admin/api-key', data);
}

/**
 * Update API Key
 */
export function updateApiKey(id: string, data: Partial<AiApiKey>) {
  return useFlexbootRequestClient().put<boolean>(`/admin/api-key/${id}`, data);
}

/**
 * Delete API Key
 */
export function deleteApiKey(id: string) {
  return useFlexbootRequestClient().delete<boolean>(`/admin/api-key/${id}`);
}

/**
 * Batch delete API Keys
 */
export function batchDeleteApiKey(ids: string[]) {
  return useFlexbootRequestClient().delete<boolean>('/admin/api-key', {
    data: ids,
  });
}

/**
 * Toggle API Key status (enable/disable)
 */
export function toggleApiKeyStatus(id: string, status: number) {
  return useFlexbootRequestClient().put<boolean>(`/admin/api-key/${id}`, {
    status,
  });
}

/**
 * 用户选项类型（用于下拉选择）
 */
export interface UserOption {
  id: string;
  realName: string;
  username: string;
}

/**
 * 获取用户列表（用于创建 API Key 时选择用户）
 */
export function getUserOptions() {
  return useFlexbootRequestClient().get<UserOption[]>(
    '/admin/api-key/orphaned-users',
    {},
  );
}
