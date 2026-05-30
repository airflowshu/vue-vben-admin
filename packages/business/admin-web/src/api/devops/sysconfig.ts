import type { SearchRequest } from '@flexboot4/web-kit';

import { useFlexbootRequestClient } from '@flexboot4/web-kit';

export interface SysConfig {
  configKey: string;
  configType: string;
  configValue: string;
  createBy?: string;
  createTime?: string;
  description?: string;
  id: string;
  lastModifyBy?: string;
  lastModifyTime?: string;
  remark?: string;
  status: number;
  statusStr?: string;
}

export interface PageResult<T> {
  pageNumber: number;
  pageSize: number;
  records: T[];
  totalPage?: number;
  totalRow: number;
}

/**
 * Get config page list
 */
export function getConfigPage(params: SearchRequest) {
  return useFlexbootRequestClient().post<PageResult<SysConfig>>(
    '/admin/config/page',
    params,
  );
}

/**
 * Get config by ID
 */
export function getConfigById(id: string) {
  return useFlexbootRequestClient().get<SysConfig>(`/admin/config/${id}`);
}

/**
 * Create config
 */
export function createConfig(data: Partial<SysConfig>) {
  return useFlexbootRequestClient().post<boolean>('/admin/config', data);
}

/**
 * Update config
 */
export function updateConfig(id: string, data: Partial<SysConfig>) {
  return useFlexbootRequestClient().put<boolean>(`/admin/config/${id}`, data);
}

/**
 * Delete config
 */
export function deleteConfig(id: string) {
  return useFlexbootRequestClient().delete<boolean>(`/admin/config/${id}`);
}

/**
 * Batch delete configs
 */
export function batchDeleteConfig(ids: string[]) {
  return useFlexbootRequestClient().delete<boolean>('/admin/config', {
    data: ids,
  });
}

/**
 * Toggle config status (enable/disable)
 */
export function toggleConfigStatus(id: string, status: number) {
  return useFlexbootRequestClient().put<boolean>(`/admin/config/${id}`, {
    status,
  });
}
