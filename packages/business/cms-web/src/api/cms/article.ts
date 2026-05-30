import type { SearchRequest } from '@flexboot4/web-kit';

import type { CmsCategory } from './category';
import type { CmsTag } from './tag';
import type { CmsFileObject, CmsPageResult } from './types';

import { useFlexbootRequestClient } from '@flexboot4/web-kit';

export type CmsArticleStatus = 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'REJECTED';

export interface CmsArticle {
  author?: string;
  category?: CmsCategory;
  categoryId: string;
  content?: string;
  coverFile?: CmsFileObject;
  coverFileId?: string;
  creatBy?: string;
  createBy?: string;
  createTime?: string;
  id: string;
  lastModifyTime?: string;
  likeCount?: number;
  publishTime?: string;
  reviewComment?: string;
  sortOrder?: number;
  status?: CmsArticleStatus;
  summary?: string;
  tags?: CmsTag[];
  title: string;
  version?: number;
  viewCount?: number;
}

export interface ReviewRequest {
  reviewComment?: string;
}

export interface PreviewPageResponse {
  previewUrl: string;
  relativeUrl: string;
}

export function getArticlePage(params: SearchRequest) {
  return useFlexbootRequestClient().post<CmsPageResult<CmsArticle>>(
    '/admin/cms/article/page',
    params,
  );
}

export function getArticleList(params: SearchRequest) {
  return useFlexbootRequestClient().post<CmsArticle[]>(
    '/admin/cms/article/list',
    params,
  );
}

export function getArticleById(id: string) {
  return useFlexbootRequestClient().get<CmsArticle>(`/admin/cms/article/${id}`);
}

export function createArticle(data: Partial<CmsArticle>) {
  return useFlexbootRequestClient().post<boolean>('/admin/cms/article', data);
}

export function updateArticle(id: string, data: Partial<CmsArticle>) {
  return useFlexbootRequestClient().put<boolean>(
    `/admin/cms/article/${id}`,
    data,
  );
}

export function deleteArticle(id: string) {
  return useFlexbootRequestClient().delete<boolean>(`/admin/cms/article/${id}`);
}

export function submitArticleForReview(id: string) {
  return useFlexbootRequestClient().post<boolean>(
    `/admin/cms/article/${id}/submit`,
  );
}

export function approveArticle(id: string, data: ReviewRequest) {
  return useFlexbootRequestClient().post<boolean>(
    `/admin/cms/article/${id}/approve`,
    data,
  );
}

export function rejectArticle(id: string, data: ReviewRequest) {
  return useFlexbootRequestClient().post<boolean>(
    `/admin/cms/article/${id}/reject`,
    data,
  );
}

export function incrementArticleViewCount(id: string) {
  return useFlexbootRequestClient().post<boolean>(
    `/admin/cms/article/${id}/view`,
  );
}

export function previewArticlePage(id: string) {
  return useFlexbootRequestClient().post<PreviewPageResponse>(
    `/admin/cms/article/${id}/preview`,
  );
}
