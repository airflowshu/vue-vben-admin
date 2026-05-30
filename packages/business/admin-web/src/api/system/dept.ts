import type { SearchRequest } from '@flexboot4/web-kit';

import { useFlexbootRequestClient } from '@flexboot4/web-kit';

/**
 * 菜单类型定义
 * 参照 response.json 结构
 */
export interface DeptRecord {
  children?: DeptRecord[];
  createTime?: string;
  deptName: string;
  id: string;
  orderNo: number;
  parentId: string;
  remark: string;
  status: number;
  version: number;
}

/**
 * 获取菜单列表
 */
export function getDeptList(params: SearchRequest) {
  return useFlexbootRequestClient().post<DeptRecord[]>(
    '/admin/dept/list',
    params,
  );
}

/**
 * 删除菜单
 */
export function deleteDept(id: string) {
  return useFlexbootRequestClient().delete<boolean>(`/admin/dept/${id}`);
}

/**
 * 新增菜单
 */
export function createDept(params: Partial<DeptRecord>) {
  return useFlexbootRequestClient().post('/admin/dept', params);
}

/**
 * 修改菜单
 */
export function updateDept(id: string, params: Partial<DeptRecord>) {
  return useFlexbootRequestClient().put(`/admin/dept/${id}`, params);
}
