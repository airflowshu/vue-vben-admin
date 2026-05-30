import type { FileAccessDescriptor } from '@flexboot4/admin-web/api/file';

import type { CmsFileObject } from './types';

import { useFlexbootRequestClient } from '@flexboot4/web-kit';

export interface CmsUploadParams {
  bizId?: string;
  tenantId?: string;
}

export async function uploadCmsFileApi(file: File, params?: CmsUploadParams) {
  return useFlexbootRequestClient().upload<CmsFileObject>(
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
  return useFlexbootRequestClient().get<FileAccessDescriptor>(
    `/admin/cms/file/${id}/access-url`,
    {
      params: {
        ttlSeconds,
        attachment,
      },
    },
  );
}
