export interface CmsPageResult<T> {
  pageNumber: number;
  pageSize: number;
  records: T[];
  totalRow: number;
}

export interface CmsFileObject {
  fileExt?: string;
  fileName?: string;
  fileSize?: number;
  id?: string;
  location?: {
    bucket?: string;
    endpoint?: string;
    objectKey?: string;
    region?: string;
    storageType?: 'ALI_OSS' | 'LOCAL' | 'MINIO' | 'S3';
  };
}
