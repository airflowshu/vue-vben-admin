import type { SearchRequest } from '@flexboot4/web-kit';

import { useFlexbootRequestClient } from '@flexboot4/web-kit';

export interface OperLog {
  businessType: number;
  businessTypeStr: string;
  costTime: number;
  deptId: string;
  errorMsg: string;
  extParams: Record<string, any>;
  id: string;
  jsonResult: Record<string, any>;
  method: string;
  operatorType: number;
  operatorTypeStr: string;
  operIp: string;
  operLocation: string;
  operName: string;
  operParam: Record<string, any>;
  operTime: string;
  operUrl: string;
  operUserId: string;
  remark: string;
  requestMethod: string;
  status: number;
  title: string;
}

export interface PageResult<T> {
  pageNumber: number;
  pageSize: number;
  records: T[];
  totalRow: number;
}

/**
 * Get oper log page list
 */
export function getOperLogPage(params: SearchRequest) {
  return useFlexbootRequestClient().post<PageResult<OperLog>>(
    '/admin/oper-log/page',
    params,
  );
}
