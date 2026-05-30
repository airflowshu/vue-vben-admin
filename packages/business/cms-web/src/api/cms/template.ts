import type { CmsPageResult } from './types';

import { useFlexbootRequestClient } from '@flexboot4/web-kit';

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
  createBy?: string;
  createTime?: string;
  errorMessage?: string;
  fileCount?: number;
  id: string;
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
  return useFlexbootRequestClient().get<CmsTemplateTreeNode[]>(
    '/admin/cms/template/tree',
  );
}

export function getTemplateFile(path: string) {
  return useFlexbootRequestClient().get<CmsTemplateFileDetail>(
    '/admin/cms/template/file',
    {
      params: { path },
    },
  );
}

export function saveTemplateFile(data: { content: string; path: string }) {
  return useFlexbootRequestClient().put<boolean>(
    '/admin/cms/template/file',
    data,
  );
}

export function publishTemplateSite() {
  return useFlexbootRequestClient().post<CmsTemplatePublishResult>(
    '/admin/cms/template/publish',
  );
}

export function getTemplatePublishHistory(params?: {
  pageNumber?: number;
  pageSize?: number;
}) {
  return useFlexbootRequestClient().get<
    CmsPageResult<CmsTemplatePublishRecord>
  >('/admin/cms/template/publish/history', {
    params,
  });
}
