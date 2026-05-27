import type { RouteRecordStringComponent } from '@vben/types';

import { requestClient } from '#/api/request';

type BackendMenuRoute = RouteRecordStringComponent & {
  authCode?: string;
  type?: string;
};

/**
 * 获取用户所有菜单
 */
export async function getAllMenusApi() {
  const data =
    await requestClient.get<RouteRecordStringComponent[]>('/admin/menu/all');

  function normalize(
    list: null | RouteRecordStringComponent[] | undefined,
  ): RouteRecordStringComponent[] {
    if (!Array.isArray(list)) return [];
    return list
      .map((item) => {
        const backendItem = item as BackendMenuRoute;
        if (backendItem.type === 'button') return null;
        let path: null | string = null;
        if (backendItem.path && backendItem.path.length > 0) {
          path = backendItem.path.startsWith('/')
            ? backendItem.path
            : `/${backendItem.path}`;
        }
        if (path === null) return null;
        const name =
          typeof backendItem.name === 'string' && backendItem.name.length > 0
            ? backendItem.name
            : path.slice(1).replaceAll('/', '_');
        const children = normalize(backendItem.children);
        const authCode =
          typeof backendItem.authCode === 'string'
            ? backendItem.authCode.trim()
            : '';
        const authority = Array.isArray(backendItem.meta?.authority)
          ? [...backendItem.meta.authority]
          : [];
        if (authCode && !authority.includes(authCode)) {
          authority.push(authCode);
        }
        const meta = {
          ...(backendItem.meta ?? {}),
          ...(authority.length > 0 ? { authority } : {}),
        };
        return {
          ...backendItem,
          meta,
          name,
          path,
          children: children.length > 0 ? children : undefined,
        } as any as RouteRecordStringComponent;
      })
      .filter((v): v is RouteRecordStringComponent => v !== null);
  }
  return normalize(data);
}
