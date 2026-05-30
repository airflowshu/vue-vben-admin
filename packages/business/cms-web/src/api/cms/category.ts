import type { SearchRequest } from '@flexboot4/web-kit';

import type { CmsPageResult } from './types';

import { useFlexbootRequestClient } from '@flexboot4/web-kit';

export interface CmsCategory {
  categoryCode: string;
  categoryName: string;
  coverFileId?: string;
  createTime?: string;
  description?: string;
  id: string;
  lastModifyTime?: string;
  parentId?: null | string;
  sortOrder?: number;
  status?: number;
  version?: number;
}

export function getCategoryPage(params: SearchRequest) {
  return useFlexbootRequestClient().post<CmsPageResult<CmsCategory>>(
    '/admin/cms/category/page',
    params,
  );
}

export function getCategoryList(params: SearchRequest) {
  return useFlexbootRequestClient().post<CmsCategory[]>(
    '/admin/cms/category/list',
    params,
  );
}

export function createCategory(data: Partial<CmsCategory>) {
  return useFlexbootRequestClient().post<boolean>('/admin/cms/category', data);
}

export function updateCategory(id: string, data: Partial<CmsCategory>) {
  return useFlexbootRequestClient().put<boolean>(
    `/admin/cms/category/${id}`,
    data,
  );
}

export function deleteCategory(id: string) {
  return useFlexbootRequestClient().delete<boolean>(
    `/admin/cms/category/${id}`,
  );
}
