import type { CmsPageResult } from './types';

import { requestClient } from '#/api/request';

export interface CmsTemplateTreeNode {
  children: CmsTemplateTreeNode[];
  directory: boolean;
  name: string;
  path: string;
}

export interface CmsTemplateFileDetail {
  assetBaseUrl?: null | string;
  content: string;
  lastModifiedTime?: string;
  name: string;
  path: string;
  previewContent: string;
  size: number;
}

export interface CmsTemplatePublishRecord {
  id: string;
  createBy?: string;
  createTime?: string;
  errorMessage?: string;
  fileCount?: number;
  indexRelativeUrl?: string;
  publishDir?: string;
  publishName?: string;
  status?: 'FAILED' | 'SUCCESS';
  zipFilePath?: string;
  zipRelativeUrl?: string;
}

export interface CmsTemplatePublishResult {
  errorMessage?: null | string;
  fileCount: number;
  indexRelativeUrl?: null | string;
  indexUrl?: null | string;
  publishDir: string;
  publishName: string;
  recordId?: null | string;
  status: 'FAILED' | 'SUCCESS';
  zipRelativeUrl?: null | string;
  zipUrl?: null | string;
}

export function getTemplateTree() {
  return requestClient.get<CmsTemplateTreeNode[]>('/admin/cms/template/tree');
}

export function getTemplateFile(path: string) {
  return requestClient.get<CmsTemplateFileDetail>('/admin/cms/template/file', {
    params: { path },
  });
}

export function saveTemplateFile(data: { content: string; path: string }) {
  return requestClient.put<boolean>('/admin/cms/template/file', data);
}

export function publishTemplateSite() {
  return requestClient.post<CmsTemplatePublishResult>('/admin/cms/template/publish');
}

export function getTemplatePublishHistory(params?: {
  pageNumber?: number;
  pageSize?: number;
}) {
  return requestClient.get<CmsPageResult<CmsTemplatePublishRecord>>(
    '/admin/cms/template/publish/history',
    {
      params,
    },
  );
}
