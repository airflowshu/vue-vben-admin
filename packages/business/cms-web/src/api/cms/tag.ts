import type { SearchRequest } from '@flexboot4/web-kit';

import type { CmsPageResult } from './types';

import { useFlexbootRequestClient } from '@flexboot4/web-kit';

export interface CmsTag {
  createTime?: string;
  id: string;
  lastModifyTime?: string;
  tagColor?: string;
  tagName: string;
  useCount?: number;
  version?: number;
}

export function getTagPage(params: SearchRequest) {
  return useFlexbootRequestClient().post<CmsPageResult<CmsTag>>(
    '/admin/cms/tag/page',
    params,
  );
}

export function getTagList(params: SearchRequest) {
  return useFlexbootRequestClient().post<CmsTag[]>(
    '/admin/cms/tag/list',
    params,
  );
}

export function createTag(data: Partial<CmsTag>) {
  return useFlexbootRequestClient().post<boolean>('/admin/cms/tag', data);
}

export function updateTag(id: string, data: Partial<CmsTag>) {
  return useFlexbootRequestClient().put<boolean>(`/admin/cms/tag/${id}`, data);
}

export function deleteTag(id: string) {
  return useFlexbootRequestClient().delete<boolean>(`/admin/cms/tag/${id}`);
}
