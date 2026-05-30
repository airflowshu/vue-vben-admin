import type { SearchRequest } from '@flexboot4/web-kit';

import { useFlexbootRequestClient } from '@flexboot4/web-kit';

export interface SmsConfig {
  accessKeyId?: string;
  accessKeySecret?: string;
  configId: string;
  configName: string;
  createBy?: string;
  createTime?: string;
  extParams?: null | Record<string, any>;
  id: string;
  isDefault?: number;
  lastModifyBy?: string;
  lastModifyTime?: string;
  remark?: string;
  sdkAppId?: string;
  signature?: string;
  status: number;
  statusStr?: string;
  supplierType: string;
  supplierTypeStr?: string;
  templateId?: string;
  weight?: number;
}

/**
 * Get sms config list.
 */
export function getSmsConfigList(params: SearchRequest) {
  return useFlexbootRequestClient().post<SmsConfig[]>(
    '/admin/sms/config/list',
    params,
  );
}

/**
 * Update a sms config.
 */
export function updateSmsConfig(id: string, data: Partial<SmsConfig>) {
  return useFlexbootRequestClient().put<boolean>(
    `/admin/sms/config/${id}`,
    data,
  );
}

/**
 * Create a new sms config.
 */
export function createSmsConfig(data: Partial<SmsConfig>) {
  return useFlexbootRequestClient().post<boolean>('/admin/sms/config', data);
}
