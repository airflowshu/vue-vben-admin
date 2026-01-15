# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

调用后端的接口文档已提供在这里[api-flexboot4-1.yaml](docs/api-flexboot4-1.yaml) 

禁止修改[internal](internal)和[packages](packages)目录下的代码！
# 自定义组件:如果你的业务组件库没有提供某个组件，你可以自行封装一个组件，然后加到表单内部。
```html
<script lang="ts" setup>
import { h } from 'vue';

import { Input, message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';

const [Form] = useVbenForm({
  // 所有表单项共用，可单独在表单内覆盖
  commonConfig: {
    // 所有表单项
    componentProps: {
      class: 'w-full',
    },
    labelClass: 'w-2/6',
  },
  // 提交函数
  handleSubmit: onSubmit,
  // 垂直布局，label和input在不同行，值为vertical
  // 水平布局，label和input在同一行
  layout: 'horizontal',
  schema: [
    {
      // 组件需要在 #/adapter.ts内注册，并加上类型
      component: 'Input',
      fieldName: 'field',
      label: '自定义后缀',
      suffix: () => h('span', { class: 'text-red-600' }, '元'),
    },
    {
      component: 'Input',
      fieldName: 'field1',
      label: '自定义组件slot',
      renderComponentContent: () => ({
        prefix: () => 'prefix',
        suffix: () => 'suffix',
      }),
    },
    {
      component: h(Input, { placeholder: '请输入' }),
      fieldName: 'field2',
      label: '自定义组件',
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'field3',
      label: '自定义组件(slot)',
      rules: 'required',
    },
  ],
  wrapperClass: 'grid-cols-1',
});

function onSubmit(values: Record<string, any>) {
  message.success({
    content: `form values: ${JSON.stringify(values)}`,
  });
}
</script>

<template>
  <Form>
    <template #field3="slotProps">
      <Input placeholder="请输入" v-bind="slotProps" />
    </template>
  </Form>
</template>
```
## Project Overview

Vue Vben Admin is a Vue 3 admin template monorepo supporting multiple UI frameworks (Ant Design Vue, Element Plus, Naive UI, TDesign). Built with Vite, TypeScript, Pinia, and Turbo.

**Documentation**: https://doc.vben.pro/
**Node**: >=20.12.0 | **pnpm**: >=10.0.0

## Common Commands

```bash
# Development
pnpm dev                  # All apps
pnpm dev:antd             # Ant Design version only
pnpm dev:ele              # Element Plus version only
pnpm dev:naive            # Naive UI version only
pnpm dev:tdesign          # TDesign version only
pnpm dev:play             # Playground

# Building
pnpm build                # All packages (8GB memory limit)
pnpm build:analyze        # Bundle analysis
pnpm build:antd           # Specific UI framework

# Testing
pnpm test:unit            # Unit tests (Vitest)
pnpm test:e2e             # E2E tests (Playwright)
pnpm vitest run path/to/test.spec.ts  # Single test file

# Linting & Checking
pnpm lint                 # Run all linters
pnpm format               # Format with Prettier
pnpm check                # Type, circular deps, cspell
pnpm check:type           # TypeScript checking only
```

## Architecture

```
apps/                    # UI framework-specific apps (web-antd, web-ele, etc.)
packages/@core/          # UI-agnostic core (base, ui-kit, composables)
packages/effects/        # State/feature packages (access, layouts, request, etc.)
packages/utils/          # Utilities (use es-toolkit, not lodash)
packages/stores/         # Pinia stores with persistence
internal/                # Internal configs (eslint, vite, tailwind, etc.)
```

### Key Patterns

1. **UI Framework Agnostic Core**: `@core` packages are UI-agnostic; adapters in `apps/*/src/adapter/` handle framework differences.

2. **Effects Packages**: Contain Pinia state, localStorage logic, and UI-coupled code.

3. **Bootstrap Sequence**: `main.ts` → `bootstrap.ts` (adapters, i18n, Pinia, router guards).

4. **Router Guards** (`apps/*/src/router/guard.ts`):
   - Common guard: Page loading progress
   - Access guard: Token validation, dynamic routes, role-based access

5. **State Management**: Pinia with `pinia-plugin-persistedstate`, data encrypted with `secure-ls`.

6. **Request Pattern**: Axios-based with interceptors in `@vben/request`.

### Import Aliases

```typescript
// App-level
import { router } from './router';
import { $t } from '#/locales';

// Package-level
import { preferences } from '@vben/preferences';
import { useUserStore } from '@vben/stores';
```

## Commit Convention

Follow Angular convention: `type(scope): subject`

Types: feat, fix, docs, style, refactor, perf, test, workflow, build, ci, chore, types, wip

Example: `feat(form): add cascader component`

Use `pnpm commit` for interactive commits.
