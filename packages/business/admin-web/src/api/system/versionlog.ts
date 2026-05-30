import type { SearchRequest } from '@flexboot4/web-kit';

import { useFlexbootRequestClient } from '@flexboot4/web-kit';

export interface SysVersionLog {
  createBy?: string;
  createTime?: string;
  description?: string;
  features?: string[];
  fixes?: string[];
  id: string;
  lastModifyBy?: string;
  lastModifyTime?: string;
  releaseDate?: string;
  remark?: string;
  status?: number;
  title?: string;
  type?: string;
  typeStr?: string;
  versionNo?: string;
}

export interface PageResult<T> {
  pageNumber: number;
  pageSize: number;
  records: T[];
  totalPage?: number;
  totalRow: number;
}

export function getVersionLogPage(params: SearchRequest) {
  return useFlexbootRequestClient().post<PageResult<SysVersionLog>>(
    '/admin/version-log/page',
    params,
  );
}

export function getVersionLogList(params: SearchRequest) {
  return useFlexbootRequestClient().post<SysVersionLog[]>(
    '/admin/version-log/list',
    params,
  );
}

export function createVersionLog(data: Partial<SysVersionLog>) {
  return useFlexbootRequestClient().post<boolean>('/admin/version-log', data);
}

export function updateVersionLog(id: string, data: Partial<SysVersionLog>) {
  return useFlexbootRequestClient().put<boolean>(
    `/admin/version-log/${id}`,
    data,
  );
}

export function deleteVersionLog(id: string) {
  return useFlexbootRequestClient().delete<boolean>(`/admin/version-log/${id}`);
}
