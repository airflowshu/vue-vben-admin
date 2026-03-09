# 🚀 Vben Admin 项目开发技能矩阵 (Skills Matrix)

> 本文档基于 **Vben Admin 官方规范** 与 B 端管理系统最佳实践制定。用于指导功能开发、代码审查及 AI 辅助生成。

---

## 🏗 Vben 核心架构能力
- [ ] **高阶组件应用**: 熟练使用 `BasicTable`, `BasicForm`, `BasicTree`, `BasicModal` 等二次封装组件。
- [ ] **Schema 驱动开发**: 掌握通过 `column` 和 `schemas` 配置生成页面，避免手动编写冗长的模板。
- [ ] **权限受控**:
  - 使用 `v-auth` 指令或 `usePermission` 进行按钮级权限控制。
  - 理解动态路由过滤逻辑（基于 Role 或后台菜单动态生成）。
- [ ] **Hooks 体系**: 熟练使用内建 Hook（如 `useMessage` 弹窗、`useTable` 表格控制、`useForm` 实例操作）。

## 📝 命名与代码规范 (Strict Vben Standards)
- [ ] **文件命名**:
  - **组件**: 必须使用大驼峰 `PascalCase` (例：`MyComponent.vue`)。
  - **视图/页面**: 使用小写短横线 `kebab-case` (例：`system-log/index.vue`)。
  - **目录**: 统一使用 `kebab-case` 命名法。
- [ ] **Vue 语法**:
  - 强制使用 `<script setup>` 语法。
  - 组件 `props` 在定义时使用 `camelCase`，在模板中传参使用 `kebab-case`。
  - 必须使用 `defineProps` 和 `defineEmits` 进行显式类型定义。
- [ ] **TypeScript 约束**:
  - 严禁滥用 `any`。
  - 接口请求必须定义 `Params` 和 `Result` 类型，确保障套代码链路的类型推导。

## 🎨 UI 与样式管理
- [ ] **Tailwind CSS**: 优先使用原子化 CSS 类解决布局问题，减少自定义 `.scss` 样式编写。
- [ ] **BEM 规范**: 编写自定义样式时，严格遵守 `block__element--modifier` 命名，防止样式全局污染。
- [ ] **Iconify**: 熟练使用项目的图标方案，能够快速按需集成各种图标集。

## 📊 B 端业务逻辑处理
- [ ] **数据流转**: 掌握 Pinia 状态管理，严格区分全局状态与页面私有状态。
- [ ] **网络请求**:
  - 在 `src/api` 中统一管理接口。
  - 能够配置 `axios` 拦截器处理特定的业务错误码（如 401 自动跳转）。
- [ ] **性能优化**:
  - 针对长列表使用虚拟滚动。
  - 灵活使用 `computed` 与 `watchEffect` 减少非必要的渲染。

## 🛠 工程化与工具
- [ ] **Git 提交规范**: 严格执行 Angular 规范，提交格式为 `<type>(<scope>): <subject>` (如 `feat(sys): add user role filter`)。
- [ ] **自动化检查**:
  - 提交前运行 `pnpm lint`。
  - 理解 `CSpell` 检查机制，避免代码中出现拼写错误。
