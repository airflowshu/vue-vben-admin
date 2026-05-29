import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requestClient } from '#/api/request';

import { getAllMenusApi } from './menu';

vi.mock('#/api/request', () => ({
  requestClient: {
    get: vi.fn(),
  },
}));

describe('getAllMenusApi permission mapping', () => {
  beforeEach(() => {
    vi.mocked(requestClient.get).mockReset();
  });

  it('maps backend authCode to route meta authority for protected pages', async () => {
    vi.mocked(requestClient.get).mockResolvedValue([
      {
        component: '/system/user/list',
        name: 'SystemUser',
        path: '/system/user',
        authCode: 'sys:user:list',
        meta: { title: 'system.user.title' },
        children: [
          {
            component: '',
            name: 'SystemUserResetPassword',
            path: 'reset-password',
            authCode: 'sys:user:reset-password',
            meta: {
              authority: ['sys:user:list'],
              title: 'common.resetPassword',
            },
          },
        ],
      },
      {
        component: '/devops/log/index',
        name: 'DevopsLog',
        path: '/devops/log',
        authCode: 'sys:oper:log:list',
        meta: { title: 'devops.log.title' },
      },
      {
        component: '/devops/monitor/index',
        name: 'DevopsMonitor',
        path: '/devops/monitor',
        authCode: 'sys:monitor:stats',
        meta: { title: 'devops.monitor.title' },
      },
    ]);

    const routes = await getAllMenusApi();

    expect(routes[0]?.meta?.authority).toContain('sys:user:list');
    expect(routes[0]?.children?.[0]?.meta?.authority).toEqual([
      'sys:user:list',
      'sys:user:reset-password',
    ]);
    expect(routes[1]?.meta?.authority).toContain('sys:oper:log:list');
    expect(routes[2]?.meta?.authority).toContain('sys:monitor:stats');
  });

  it('filters non-route button nodes from backend route tree', async () => {
    vi.mocked(requestClient.get).mockResolvedValue([
      {
        component: 'BasicLayout',
        name: 'System',
        path: '/system',
        type: 'catalog',
        meta: { title: 'system.title' },
        children: [
          {
            component: '/system/user/list',
            name: 'SystemUser',
            path: '/system/user',
            type: 'menu',
            meta: { title: 'system.user.title' },
            children: [
              {
                authCode: 'sys:user:add',
                name: 'SystemUserAdd',
                path: '',
                type: 'button',
                meta: { title: 'common.add' },
              },
            ],
          },
        ],
      },
    ]);

    const routes = await getAllMenusApi();

    expect(routes).toHaveLength(1);
    expect(routes[0]?.children).toHaveLength(1);
    expect(routes[0]?.children?.[0]?.children).toBeUndefined();
  });
});
