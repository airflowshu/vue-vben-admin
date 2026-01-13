import type { SearchRequest } from '#/api/common';

import { requestClient } from '#/api/request';

export interface DictItem {
  id: string;
  itemText: string;
  itemValue: string;
  itemCode: string; // From json: itemCode (e.g. "china")
  orderNo: number;
  status: number; // 1: enabled, 0: disabled
  remark?: string;
  parentCode?: null | string;
  typeCode?: string;
  createTime?: string;
  version: number;
}

export interface DictType {
  id: string;
  name: string;
  code: string;
  orderNo: number;
  status: number;
  remark?: string;
  createTime?: string;
  dictItems?: DictItem[];
  version: number;
}

export interface PageResult<T> {
  pageNumber: number;
  pageSize: number;
  totalRow: number;
  records: T[];
}

/**
 * Get dict type page list
 */
export function getDictTypePage(params: SearchRequest) {
  return requestClient.post<PageResult<DictType>>('/dict-type/page', params);
}

/**
 * Create dict type
 */
export function createDictType(data: Partial<DictType>) {
  return requestClient.post('/dict-type', data);
}

/**
 * Update dict type
 */
export function updateDictType(id: string, data: Partial<DictType>) {
  return requestClient.put(`/dict-type/${id}`, data);
}

/**
 * Delete dict type
 */
export function deleteDictType(id: string) {
  return requestClient.delete<boolean>(`/dict-type/${id}`);
}

/**
 * Get dict item list by type id or code
 * Note: Since dictItems are nested in the response json, we might not need this if we always load from the parent.
 * But typically there is a separate endpoint for items. Assuming standard REST structure.
 */
export function getDictItemList(typeId: string) {
  return requestClient.get<DictItem[]>(`/dict-type/${typeId}/items`);
}

/**
 * Create dict item
 */
export function createDictItem(data: Partial<DictItem>) {
  return requestClient.post('/dict-item', data);
}

/**
 * Update dict item
 */
export function updateDictItem(id: string, data: Partial<DictItem>) {
  return requestClient.put(`/dict-item/${id}`, data);
}

/**
 * Delete dict item
 */
export function deleteDictItem(id: string) {
  return requestClient.delete(`/dict-item/${id}`);
}
