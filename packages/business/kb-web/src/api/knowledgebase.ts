import type { SearchRequest } from '@flexboot4/web-kit';

import { useFlexbootRequestClient } from '@flexboot4/web-kit';

/**
 * 知识库类型
 */
export type KbType = 'private' | 'public' | 'team';

/**
 * 知识库状态
 */
export type KbStatus = 0 | 1;

/**
 * 知识库成员信息
 */
export interface KbMember {
  joinTime: string;
  realName: string;
  role: string;
  userId: string;
  username: string;
}

/**
 * 知识库文件关联信息
 */
export interface KbFileRelation {
  createTime?: string;
  fileId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  id: string;
  indexed: boolean;
  indexedAt?: string;
  remark?: string;
  status: string;
}

/**
 * 知识库
 */
export interface KnowledgeBase {
  createBy?: string;
  createTime?: string;
  description?: string;
  embeddingModel?: string;
  fileCount?: number;
  id: string;
  lastModifyBy?: string;
  lastModifyTime?: string;
  memberCount?: number;
  name: string;
  ownerId: string;
  ownerName?: string;
  remark?: string;
  status: KbStatus;
  type: KbType;
}

/**
 * 知识库列表请求参数
 */
export interface KnowledgeBaseSearch extends SearchRequest {
  name?: string;
  status?: KbStatus;
  type?: KbType;
}

/**
 * 分页结果
 */
export interface PageResult<T> {
  pageNumber: number;
  pageSize: number;
  records: T[];
  totalPage?: number;
  totalRow: number;
}

/**
 * 获取知识库列表
 */
export function getKnowledgeBaseList(params?: KnowledgeBaseSearch) {
  return useFlexbootRequestClient().post<KnowledgeBase[]>(
    '/admin/kb/list',
    params || {},
  );
}

/**
 * 获取知识库分页
 */
export function getKnowledgeBasePage(params: KnowledgeBaseSearch) {
  return useFlexbootRequestClient().post<PageResult<KnowledgeBase>>(
    '/admin/kb/page',
    params,
  );
}

/**
 * 获取知识库详情
 */
export function getKnowledgeBaseById(id: string) {
  return useFlexbootRequestClient().get<KnowledgeBase>(`/admin/kb/${id}`);
}

/**
 * 创建知识库
 */
export function createKnowledgeBase(data: Partial<KnowledgeBase>) {
  return useFlexbootRequestClient().post<KnowledgeBase>('/admin/kb', data);
}

/**
 * 更新知识库
 */
export function updateKnowledgeBase(id: string, data: Partial<KnowledgeBase>) {
  return useFlexbootRequestClient().put<boolean>(`/admin/kb/${id}`, data);
}

/**
 * 删除知识库
 */
export function deleteKnowledgeBase(id: string) {
  return useFlexbootRequestClient().delete<boolean>(`/admin/kb/${id}`);
}

/**
 * 手动触发知识库索引
 */
export function triggerKnowledgeBaseIndex(kbId: string) {
  return useFlexbootRequestClient().post<boolean>(`/admin/kb/${kbId}/index`);
}

/**
 * 获取知识库成员列表
 */
export function getKnowledgeBaseMembers(kbId: string) {
  return useFlexbootRequestClient().get<KbMember[]>(
    `/admin/kb/${kbId}/members`,
  );
}

/**
 * 添加知识库成员
 */
export function addKnowledgeBaseMember(kbId: string, userIds: string[]) {
  return useFlexbootRequestClient().post<boolean>(`/admin/kb/${kbId}/members`, {
    userIds,
  });
}

/**
 * 移除知识库成员
 */
export function removeKnowledgeBaseMember(kbId: string, userId: string) {
  return useFlexbootRequestClient().delete<boolean>(
    `/admin/kb/${kbId}/members`,
    {
      data: { userId },
    },
  );
}

/**
 * 获取知识库关联文件列表
 */
export function getKnowledgeBaseFiles(kbId: string) {
  return useFlexbootRequestClient().get<KbFileRelation[]>(
    `/admin/kb/${kbId}/files`,
  );
}

/**
 * 关联文件到知识库
 */
export function addKnowledgeBaseFile(kbId: string, fileIds: string[]) {
  return useFlexbootRequestClient().post<boolean>(`/admin/kb/${kbId}/files`, {
    fileIds,
  });
}

/**
 * 取消知识库文件关联
 */
export function removeKnowledgeBaseFile(kbId: string, fileId: string) {
  return useFlexbootRequestClient().delete<boolean>(`/admin/kb/${kbId}/files`, {
    data: { fileId },
  });
}

/**
 * 知识库文件/文件夹项
 */
export interface KbFileItem {
  aiEmbedStatus?: null | string;
  aiParseStatus?: null | string;
  aiStatus?: string;
  bizId?: null | string;
  bizType?: null | string;
  bucketName?: null | string;
  chunkCount?: number;
  createBy?: string;
  createTime?: string;
  embeddingModel?: null | string;
  fileExt?: null | string;
  fileHash?: null | string;
  fileName?: string;
  fileSize?: number;
  id: string;
  isFolder: number;
  kbId?: string;
  lastModifyBy?: null | string;
  lastModifyTime?: string;
  mimeType?: null | string;
  name?: string;
  objectKey?: null | string;
  parentId?: null | string;
  remark?: null | string;
  storageType?: string;
  sysFile?: Partial<KbFileItem>;
  tenantId?: string;
  tokenEstimate?: null | string;
  type?: 'FILE' | 'FOLDER';
  version?: null | string;
}

/**
 * 列表响应
 */
export interface KbFileListResponse {
  code: number;
  data: KbFileItem[];
}

/**
 * 新建文件夹请求
 */
export interface FolderCreateRequest {
  name: string;
  parentId?: string;
}

/**
 * 列出目录下文件/文件夹
 * 由于 requestClient 配置了 responseReturn: 'data'，直接返回数组
 */
export function listKbFiles(kbId: string, parentId?: string) {
  return useFlexbootRequestClient().get<KbFileItem[]>(
    `/admin/kb/${kbId}/fs/list`,
    {
      params: { parentId },
    },
  );
}

/**
 * 新建文件夹
 */
export function createKbFolder(kbId: string, data: FolderCreateRequest) {
  return useFlexbootRequestClient().post<boolean>(
    `/admin/kb/${kbId}/fs/folder`,
    data,
  );
}

/**
 * 删除文件/文件夹
 */
export function deleteKbFile(kbId: string, id: string) {
  return useFlexbootRequestClient().delete<boolean>(
    `/admin/kb/${kbId}/fs/delete/${id}`,
  );
}

/**
 * 重命名文件/文件夹
 */
export function renameKbFile(kbId: string, id: string, newName: string) {
  return useFlexbootRequestClient().put<boolean>(
    `/admin/kb/${kbId}/fs/rename/${id}`,
    {
      name: newName,
    },
  );
}

/**
 * 手动触发知识库索引
 */
export function buildKbIndex(kbId: string, fileTreeIds: string[]) {
  return useFlexbootRequestClient().post<number>(
    `/admin/kb/${kbId}/index`,
    fileTreeIds,
  );
}

/**
 * 移动文件/文件夹
 */
export function moveKbFile(kbId: string, id: string, targetParentId: string) {
  return useFlexbootRequestClient().post<boolean>(
    `/admin/kb/${kbId}/fs/move/${id}`,
    {
      targetParentId,
    },
  );
}

/**
 * 文件上传请求参数
 */
export interface FileUploadParams {
  bizId?: string;
  bizType?: string;
  kbId: string;
  parentId?: string;
}

/**
 * 上传文件
 */
export function uploadFile(params: FileUploadParams, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return useFlexbootRequestClient().post<{ id: string; name: string }>(
    '/admin/file/upload-single',
    formData,
    {
      params: {
        kbId: params.kbId,
        parentId: params.parentId,
        bizType: params.bizType,
        bizId: params.bizId,
      },
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );
}

/**
 * 批量上传文件到知识库
 */
export function uploadFiles(kbId: string, files: File[], parentId?: string) {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });
  if (parentId) {
    formData.append('parentId', parentId);
  }
  return useFlexbootRequestClient().post<string[]>(
    `/admin/kb/${kbId}/files/upload`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );
}

/**
 * 目录树节点类型
 */
export type TreeNodeType = 'file' | 'folder';

/**
 * 目录树节点
 */
export interface KbTreeNode {
  aiStatus?: string;
  children?: KbTreeNode[];
  createTime?: string;
  expanded?: boolean;
  fileExt?: null | string;
  fileSize?: number;
  id: string;
  isLeaf?: boolean;
  lastModifyTime?: string;
  loading?: boolean;
  name: string;
  parentId?: null | string;
  type: TreeNodeType;
}

/**
 * 创建文件夹请求
 */
export interface CreateFolderRequest {
  name: string;
  parentId?: string;
}

/**
 * 获取目录树
 */
export function getKbTree(kbId: string) {
  return useFlexbootRequestClient().get<KbTreeNode[]>(`/admin/kb/${kbId}/tree`);
}

/**
 * 获取目录树子节点
 */
export function getKbTreeChildren(kbId: string, parentId?: string) {
  return useFlexbootRequestClient().get<KbTreeNode[]>(
    `/admin/kb/${kbId}/tree/children`,
    {
      params: { parentId },
    },
  );
}

/**
 * 创建文件夹
 */
export function createKbTreeFolder(kbId: string, data: CreateFolderRequest) {
  return useFlexbootRequestClient().post(
    `/admin/kb/${kbId}/tree/folders`,
    data,
  );
}

/**
 * 删除目录树节点
 */
export function deleteKbTreeNode(kbId: string, id: string) {
  return useFlexbootRequestClient().delete(`/admin/kb/${kbId}/tree/${id}`);
}

/**
 * 重命名目录树节点
 */
export function renameKbTreeNode(kbId: string, id: string, name: string) {
  return useFlexbootRequestClient().post(
    `/admin/kb/${kbId}/tree/${id}/rename`,
    { name },
  );
}

/**
 * 文件列表项
 */
export interface KbFileListItem {
  delFlag: number;
  fileId?: null | string;
  id: string;
  kbId: string;
  name: string;
  parentId: null | string;
  sortOrder: number;
  type: 'FILE' | 'FOLDER';
}

/**
 * 获取文件列表
 */
export function getKbFileList(kbId: string, parentId?: string) {
  return useFlexbootRequestClient().get<KbFileListItem[]>(
    `/admin/kb/${kbId}/file-list`,
    {
      params: { parentId },
    },
  );
}
