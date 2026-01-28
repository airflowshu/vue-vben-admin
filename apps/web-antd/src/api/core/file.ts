import { requestClient } from '#/api/request';

/**
 * 文件上传参数
 */
export interface UploadFileParams {
  /** 业务ID */
  bizId?: string;
  /** 业务类型，传入 `sys_user_avatar` 时文件会上传到公有库 */
  bizType?: string;
  /** 文件对象 */
  file: File;
  /** 项目ID */
  projectId?: string;
}

/**
 * 文件对象
 */
export interface FileObject {
  /** AI状态 */
  aiStatus?: string;
  /** 业务ID */
  bizId?: string;
  /** 业务类型 */
  bizType?: string;
  /** 分块数量 */
  chunkCount?: number;
  /** 嵌入模型 */
  embeddingModel?: string;
  /** 文件扩展名 */
  fileExt?: string;
  /** 文件名 */
  fileName?: string;
  /** 文件hash */
  fileHash?: string;
  /** 文件大小 */
  fileSize?: number;
  /** ID */
  id?: string;
  /** 文件位置信息 */
  location?: {
    bucket?: string;
    endpoint?: string;
    objectKey?: string;
    region?: string;
    storageType?: 'ALI_OSS' | 'LOCAL' | 'MINIO' | 'S3';
  };
  /** Mime类型 */
  mimeType?: string;
  /** 项目ID */
  projectId?: string;
  /** 租户ID */
  tenantId?: string;
  /** Token估算 */
  tokenEstimate?: number;
}

/**
 * 上传文件
 *
 * @param params 上传参数
 * @returns 文件信息
 */
export async function uploadFileApi(params: UploadFileParams) {
  const { bizType = 'sys_user_avatar', bizId, file, projectId } = params;

  const formData = new FormData();
  // 第三个参数指定文件名，确保后端能正确识别
  formData.append('file', file, file.name);

  // 直接传 FormData，浏览器会自动设置正确的 Content-Type
  return requestClient.post<FileObject>('/admin/file/upload', formData, {
    params: {
      bizType,
      bizId,
      projectId,
    },
  });
}
