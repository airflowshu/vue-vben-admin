import type { CmsFileObject } from './types';

import type { FileAccessDescriptor } from '#/api/core/file';

import { requestClient } from '#/api/request';

export interface CmsUploadParams {
  bizId?: string;
  tenantId?: string;
}

export async function uploadCmsFileApi(file: File, params?: CmsUploadParams) {
  return requestClient.upload<CmsFileObject>(
    '/admin/cms/file/upload',
    { file },
    {
      params,
      headers: {
        'Content-Type': undefined,
      },
    },
  );
}

export function getCmsFileAccessUrl(
  id: string,
  ttlSeconds?: number,
  attachment?: boolean,
) {
  return requestClient.get<FileAccessDescriptor>(
    `/admin/cms/file/${id}/access-url`,
    {
      params: {
        ttlSeconds,
        attachment,
      },
    },
  );
}
