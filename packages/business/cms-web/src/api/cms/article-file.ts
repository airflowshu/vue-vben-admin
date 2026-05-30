import type { SearchRequest } from '@flexboot4/web-kit';

import type { CmsArticle } from './article';
import type { CmsFileObject, CmsPageResult } from './types';

import { useFlexbootRequestClient } from '@flexboot4/web-kit';

export interface CmsArticleFile {
  article?: CmsArticle;
  articleId: string;
  createTime?: string;
  file?: CmsFileObject;
  fileId: string;
  id: string;
  lastModifyTime?: string;
  sortOrder?: number;
  version?: number;
}

export function getArticleFilePage(params: SearchRequest) {
  return useFlexbootRequestClient().post<CmsPageResult<CmsArticleFile>>(
    '/admin/cms/article-file/page',
    params,
  );
}

export function createArticleFile(data: Partial<CmsArticleFile>) {
  return useFlexbootRequestClient().post<boolean>(
    '/admin/cms/article-file',
    data,
  );
}

export function deleteArticleFile(id: string) {
  return useFlexbootRequestClient().delete<boolean>(
    `/admin/cms/article-file/${id}`,
  );
}
