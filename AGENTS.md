# AGENTS.md

This file provides guidance for agentic coding agents working in this Vue Vben Admin monorepo.

## Project Overview

Vue Vben Admin is a Vue 3 admin template monorepo supporting multiple UI frameworks (Ant Design Vue, Element Plus, Naive UI, TDesign). Built with Vite, TypeScript, Pinia, and Turbo.

**Node**: >=20.12.0 | **pnpm**: >=10.0.0  
**Documentation**: https://doc.vben.pro/

## Build/Lint/Test Commands

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
pnpm build:ele            # Element Plus version
pnpm build:naive          # Naive UI version
pnpm build:tdesign        # TDesign version
pnpm build:play           # Playground

# Testing
pnpm test:unit            # Unit tests (Vitest)
pnpm test:e2e             # E2E tests (Playwright)
pnpm vitest run path/to/test.spec.ts  # Single test file
pnpm vitest                # Watch mode

# Linting & Checking
pnpm lint                 # Run all linters (ESLint, Stylelint)
pnpm format               # Format with Prettier
pnpm check                # Type, circular deps, cspell
pnpm check:type           # TypeScript checking only
pnpm check:circular       # Circular dependency检查
pnpm check:dep            # Dependency checking
pnpm check:cspell         # Spell checking
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

## Code Style Guidelines

### Import Patterns & Aliases

```typescript
// App-level imports (use #/ prefix)
import { router } from './router';
import { $t } from '#/locales';
import { useVbenForm } from '#/adapter/form';

// Package-level imports (use @vben/ prefix)
import { preferences } from '@vben/preferences';
import { useUserStore } from '@vben/stores';
import { Button } from '@vben/common-ui';
```

### TypeScript Conventions

- **Strict mode enabled**: All files must pass TypeScript strict checks
- **Explicit types**: Use explicit return types for functions and interfaces
- **No any types**: Forbidden to use `any`, `@ts-ignore`, `@ts-expect-error`
- **Type imports**: Use `import type` for type-only imports

```typescript
// ✅ Good
import type { ComponentType } from './types';
import { defineComponent, ref } from 'vue';

interface UserData {
  id: string;
  name: string;
}

const fetchData = async (): Promise<UserData[]> => {
  // implementation
};

// ❌ Bad
import { any } from 'some-lib';
const data: any = await fetchData();
```

### Component Structure

```typescript
<script lang="ts" setup>
import { computed, ref } from 'vue';

// Define component name
defineOptions({ name: 'ComponentName' });

// Props (if needed)
interface Props {
  title: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});

// Emits (if needed)
interface Emits {
  update: [value: string];
  change: [event: Event];
}

const emit = defineEmits<Emits>();

// Reactive state
const isLoading = ref(false);
const localValue = ref('');

// Computed properties
const computedValue = computed(() => {
  return props.title.toUpperCase();
});

// Methods
const handleClick = () => {
  emit('update', localValue.value);
};
</script>

<template>
  <div class="component-name">
    <h1>{{ computedValue }}</h1>
    <button @click="handleClick" :disabled="props.disabled">
      Click me
    </button>
  </div>
</template>
```

### Naming Conventions

- **Components**: PascalCase (UserProfile, DataTable)
- **Files**: kebab-case for folders, PascalCase for component files
- **Variables**: camelCase (userName, isLoading)
- **Constants**: UPPER_SNAKE_CASE (API_BASE_URL, MAX_ITEMS)
- **Functions**: camelCase with descriptive names (fetchUserData, validateForm)

### Error Handling

```typescript
// ✅ Good - Proper error handling
try {
  const response = await api.getData();
  return response.data;
} catch (error) {
  console.error('Failed to fetch data:', error);
  throw new Error(`Data fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
}

// ❌ Bad - Empty catch blocks
try {
  await api.getData();
} catch (e) {
  // Do nothing
}
```

### Vue Composition API Patterns

```typescript
// ✅ Good - Use composition API consistently
<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@vben/stores';

const router = useRouter();
const userStore = useUserStore();

const data = ref([]);
const loading = ref(false);

const filteredData = computed(() => {
  return data.value.filter(item => item.active);
});

watch(() => props.userId, (newId) => {
  fetchData(newId);
});

onMounted(() => {
  fetchData();
});
</script>
```

### State Management (Pinia)

```typescript
// stores/example.ts
import { defineStore } from 'pinia';
import type { Ref } from 'vue';

interface ExampleState {
  data: any[];
  loading: boolean;
}

export const useExampleStore = defineStore('example', {
  state: (): ExampleState => ({
    data: [],
    loading: false,
  }),
  
  getters: {
    filteredData: (state) => state.data.filter(item => item.active),
  },
  
  actions: {
    async fetchData() {
      this.loading = true;
      try {
        const response = await api.get('/example');
        this.data = response.data;
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        this.loading = false;
      }
    },
  },
});
```

### API Request Patterns

```typescript
import { request } from '@vben/request';

// ✅ Good - Use request client
export const getUserList = async (params: UserListParams): Promise<UserListResponse> => {
  return request.get('/api/users', { params });
};

export const createUser = async (userData: CreateUserData): Promise<User> => {
  return request.post('/api/users', userData);
};

export const updateUser = async (id: string, userData: UpdateUserData): Promise<User> => {
  return request.put(`/api/users/${id}`, userData);
};
```

### Form Patterns (VbenForm)

```typescript
import { useVbenForm, z } from '#/adapter/form';

const [Form] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelClass: 'w-2/6',
  },
  layout: 'horizontal',
  schema: [
    {
      component: 'Input',
      fieldName: 'username',
      label: 'Username',
      rules: z.string().min(1, 'Username is required'),
    },
    {
      component: 'Select',
      fieldName: 'role',
      label: 'Role',
      componentProps: {
        options: [
          { label: 'Admin', value: 'admin' },
          { label: 'User', value: 'user' },
        ],
      },
      rules: z.string().min(1, 'Role is required'),
    },
  ],
  handleSubmit: onSubmit,
});
```

## Testing Guidelines

### Test Structure

```typescript
// Example test file: user.test.ts
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import UserProfile from './UserProfile.vue';

describe('UserProfile', () => {
  it('renders user name correctly', () => {
    const wrapper = mount(UserProfile, {
      props: {
        user: { name: 'John Doe', email: 'john@example.com' },
      },
    });
    
    expect(wrapper.find('.user-name').text()).toBe('John Doe');
  });

  it('emits update event when form is submitted', async () => {
    const wrapper = mount(UserProfile);
    
    await wrapper.find('form').trigger('submit');
    
    expect(wrapper.emitted('update')).toBeTruthy();
  });
});
```

## Important Rules

### DO NOT MODIFY
- **Never modify code in `internal/` directory**
- **Never modify code in `packages/` directory** (unless working on packages)

### MUST FOLLOW
- **Use Vue 3 Composition API** consistently
- **TypeScript strict mode** - no type suppression
- **Import aliases**: Use `#/` for app-level, `@vben/` for package-level
- **Error handling**: Always handle errors properly, no empty catch blocks
- **Form patterns**: Use `useVbenForm` for all forms
- **State management**: Use Pinia stores for global state

### FORMATTING
- **Date formatting**: Table time columns should display as `yyyy-MM-dd HH:mm:ss`
- **API docs**: Reference `docs/api-flexboot4-1.yaml` and `docs/api-1.yaml`

### COMMIT CONVENTION
Follow Angular convention: `type(scope): subject`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `workflow`, `build`, `ci`, `chore`, `types`, `wip`
- Example: `feat(form): add cascader component`
- Use `pnpm commit` for interactive commits

### UI FRAMEWORK ADAPTERS
- Components must be registered in `apps/*/src/adapter/component/index.ts`
- Use `#/adapter/form` for form components
- Framework-specific adapters handle UI differences

## Development Workflow

1. **Setup**: `pnpm install`
2. **Development**: `pnpm dev:antd` (or other UI framework)
3. **Type checking**: `pnpm check:type`
4. **Linting**: `pnpm lint`
5. **Testing**: `pnpm test:unit`
6. **Building**: `pnpm build:antd`

Always run type checking and linting before committing changes.