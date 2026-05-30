import type { SearchRequest } from '@flexboot4/web-kit';

import { useFlexbootRequestClient } from '@flexboot4/web-kit';

/**
 * 角色类型定义
 */
export interface RoleRecord {
  createBy?: string;
  createTime?: string;
  id: string;
  lastModifyBy?: string;
  lastModifyTime?: string;
  menus?: MenuTreeNode[];
  remark?: string;
  roleName: string;
  roleValue: string;
  status: number;
}

/**
 * 角色菜单关联类型定义
 */
export interface RoleMenuRecord {
  createBy?: string;
  createTime?: string;
  id: string;
  lastModifyBy?: string;
  lastModifyTime?: string;
  menuId: string;
  remark?: string;
  roleId: string;
}

/**
 * 菜单树节点类型
 */
export interface MenuTreeNode {
  checked?: boolean;
  children?: MenuTreeNode[];
  halfChecked?: boolean;
  icon?: string;
  id: string;
  key: string;
  name: string;
  parentId: null | string;
  title: string;
  type: string;
}

/**
 * 分页结果类型
 */
export interface PageResult<T> {
  pageNumber: number;
  pageSize: number;
  records: T[];
  totalPage: number;
  totalRow: number;
}

/**
 * 获取角色分页列表
 */
export function getRolePage(params: SearchRequest) {
  return useFlexbootRequestClient().post<PageResult<RoleRecord>>(
    '/admin/role/page',
    params,
  );
}

/**
 * 获取角色列表
 */
export function getRoleList(params: SearchRequest) {
  return useFlexbootRequestClient().post<RoleRecord[]>(
    '/admin/role/list',
    params,
  );
}

/**
 * 获取角色详情
 */
export function getRoleById(id: string) {
  return useFlexbootRequestClient().get<RoleRecord>(`/admin/role/${id}`);
}

/**
 * 新增角色
 */
export function createRole(data: Partial<RoleRecord>) {
  return useFlexbootRequestClient().post('/admin/role', data);
}

/**
 * 修改角色
 */
export function updateRole(id: string, data: Partial<RoleRecord>) {
  return useFlexbootRequestClient().put(`/admin/role/${id}`, data);
}

/**
 * 删除角色
 */
export function deleteRole(id: string) {
  return useFlexbootRequestClient().delete<boolean>(`/admin/role/${id}`);
}

/**
 * 获取角色关联的菜单ID列表
 */
export function getRoleMenuIds(roleId: string) {
  return useFlexbootRequestClient().get<string[]>(`/admin/role-menu/${roleId}`);
}

/**
 * 保存角色菜单权限
 * @param roleId 角色ID
 * @param menuIds 菜单ID数组
 */
export function saveRoleMenus(roleId: string, menuIds: string[]) {
  return useFlexbootRequestClient().post(
    `/admin/role-menu/assign/${roleId}`,
    menuIds,
  );
}

/**
 * 获取菜单树列表（用于权限分配）
 */
export function getMenuTree(params?: Partial<SearchRequest>) {
  return useFlexbootRequestClient().post<MenuTreeNode[]>(
    '/admin/menu/list',
    params ?? {},
  );
}
