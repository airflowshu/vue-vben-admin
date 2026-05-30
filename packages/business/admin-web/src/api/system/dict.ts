import type { SearchRequest } from '@flexboot4/web-kit';

import { useFlexbootRequestClient } from '@flexboot4/web-kit';

export interface DictItem {
  createTime?: string;
  id: string;
  itemCode: string; // From json: itemCode (e.g. "china")
  itemText: string;
  itemValue: string;
  orderNo: number;
  parentCode?: null | string;
  remark?: string;
  status: number; // 1: enabled, 0: disabled
  typeCode?: string;
  version: number;
}

export interface DictItemCreateRequest extends Partial<DictItem> {
  typeId?: string;
}

export interface DictType {
  code: string;
  createTime?: string;
  dictItems?: DictItem[];
  id: string;
  name: string;
  orderNo: number;
  remark?: string;
  status: number;
  version: number;
}

export interface PageResult<T> {
  pageNumber: number;
  pageSize: number;
  records: T[];
  totalRow: number;
}

/**
 * Get dict type page list
 */
export function getDictTypePage(params: SearchRequest) {
  return useFlexbootRequestClient().post<PageResult<DictType>>(
    '/admin/dict-type/page',
    params,
  );
}

/**
 * Create dict type
 */
export function createDictType(data: Partial<DictType>) {
  return useFlexbootRequestClient().post('/admin/dict-type', data);
}

/**
 * Update dict type
 */
export function updateDictType(id: string, data: Partial<DictType>) {
  return useFlexbootRequestClient().put(`/admin/dict-type/${id}`, data);
}

/**
 * Delete dict type
 */
export function deleteDictType(id: string) {
  return useFlexbootRequestClient().delete<boolean>(`/admin/dict-type/${id}`);
}

/**
 * Get dict item list by type id or code
 */
export function getDictItemList(params: SearchRequest) {
  return useFlexbootRequestClient().post<DictItem[]>(
    '/admin/dict-item/list',
    params,
  );
}

/**
 * Create dict item
 */
export function createDictItem(data: DictItemCreateRequest) {
  return useFlexbootRequestClient().post('/admin/dict-item', data);
}

/**
 * Update dict item
 */
export function updateDictItem(id: string, data: Partial<DictItem>) {
  return useFlexbootRequestClient().put(`/admin/dict-item/${id}`, data);
}

/**
 * Delete dict item
 */
export function deleteDictItem(id: string) {
  return useFlexbootRequestClient().delete(`/admin/dict-item/${id}`);
}
