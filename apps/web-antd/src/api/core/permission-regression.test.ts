import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = process.cwd();

function read(path: string): string {
  return readFileSync(resolve(root, path), 'utf8');
}

describe('admin permission regression contract', () => {
  it('keeps user reset password button aligned with backend permission code', () => {
    const source = read('apps/web-antd/src/views/system/user/user-drawer.vue');

    expect(source).toContain("['sys:user:reset-password']");
    expect(source).toContain('adminResetPasswordApi');
  });

  it('keeps user create button aligned with backend BaseController add permission', () => {
    const source = read('apps/web-antd/src/views/system/user/list.vue');

    expect(source).toContain("['sys:user:add']");
    expect(source).not.toContain("['sys:user:create']");
  });

  it('keeps oper log page API aligned with backend permission code', () => {
    const source = read('apps/web-antd/src/api/system/operlog.ts');

    expect(source).toContain("'/admin/oper-log/page'");
  });

  it('keeps monitor stats page API aligned with backend permission code', () => {
    const source = read('apps/web-antd/src/views/devops/monitor/index.vue');

    expect(source).toContain("'/admin/monitor/stats'");
  });
});
