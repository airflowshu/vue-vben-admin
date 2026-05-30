import type { SearchRequest } from '@flexboot4/web-kit';

import { useFlexbootRequestClient } from '@flexboot4/web-kit';

export interface CmsArticleTag {
  articleId: string;
  createTime?: string;
  id: string;
  lastModifyTime?: string;
  tagId: string;
  version?: number;
}

export function getArticleTagList(params: SearchRequest) {
  return useFlexbootRequestClient().post<CmsArticleTag[]>(
    '/admin/cms/article-tag/list',
    params,
  );
}

export function createArticleTag(data: Partial<CmsArticleTag>) {
  return useFlexbootRequestClient().post<boolean>(
    '/admin/cms/article-tag',
    data,
  );
}

export function deleteArticleTag(id: string) {
  return useFlexbootRequestClient().delete<boolean>(
    `/admin/cms/article-tag/${id}`,
  );
}
