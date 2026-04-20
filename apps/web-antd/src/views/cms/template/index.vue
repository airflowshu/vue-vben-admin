<script lang="ts" setup>
import type * as Monaco from 'monaco-editor';

import type {
  CmsTemplateFileDetail,
  CmsTemplatePublishRecord,
  CmsTemplatePublishResult,
  CmsTemplateTreeNode,
} from '#/api/cms/template';

import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from 'vue';
import { onBeforeRouteLeave } from 'vue-router';

import { AccessControl } from '@vben/access';
import { ColPage } from '@vben/common-ui';

import { useDebounceFn } from '@vueuse/core';
import {
  Button,
  Empty,
  message,
  Modal,
  Skeleton,
  Tag,
  Tree,
} from 'ant-design-vue';
import dayjs from 'dayjs';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';

import {
  getTemplateFile,
  getTemplatePublishHistory,
  getTemplateTree,
  publishTemplateSite,
  saveTemplateFile,
} from '#/api/cms/template';

declare global {
  interface Window {
    MonacoEnvironment?: {
      getWorker: (workerId: string, label: string) => Worker;
    };
  }
}

defineOptions({ name: 'CmsTemplatePage' });

type TemplateTreeDataNode = CmsTemplateTreeNode & {
  children?: TemplateTreeDataNode[];
  isLeaf: boolean;
  key: string;
  selectable: boolean;
};

const treeLoading = ref(false);
const fileLoading = ref(false);
const saveLoading = ref(false);
const publishLoading = ref(false);
const historyLoading = ref(false);
const monacoLoading = ref(false);
const monacoAvailable = ref(true);
const monacoReady = ref(false);

const treeSource = ref<CmsTemplateTreeNode[]>([]);
const expandedKeys = ref<string[]>([]);
const selectedKeys = ref<string[]>([]);
const currentFile = ref<CmsTemplateFileDetail | null>(null);
const editorContent = ref('');
const originalContent = ref('');
const previewContent = ref('');
const lastPublishResult = ref<CmsTemplatePublishResult | null>(null);
const publishHistory = ref<CmsTemplatePublishRecord[]>([]);
const editorContainerRef = ref<HTMLDivElement | null>(null);

const historyPagination = reactive({
  current: 1,
  pageSize: 5,
  total: 0,
});

const historyColumns = [
  {
    dataIndex: 'publishName',
    key: 'publishName',
    title: '发布批次',
    width: 220,
  },
  { dataIndex: 'status', key: 'status', title: '状态', width: 100 },
  { dataIndex: 'fileCount', key: 'fileCount', title: '文件数', width: 90 },
  { dataIndex: 'createTime', key: 'createTime', title: '发布时间', width: 180 },
  { dataIndex: 'createBy', key: 'createBy', title: '操作者', width: 120 },
  {
    dataIndex: 'publishDir',
    key: 'publishDir',
    title: '发布目录',
    ellipsis: true,
  },
  {
    dataIndex: 'action',
    key: 'action',
    title: '操作',
    width: 180,
    fixed: 'right' as const,
  },
];

const treeData = computed<TemplateTreeDataNode[]>(() =>
  mapTreeNodes(treeSource.value),
);
const htmlFileCount = computed(() => countHtmlFiles(treeSource.value));
const hasTemplates = computed(() => htmlFileCount.value > 0);
const isDirty = computed(
  () => !!currentFile.value && editorContent.value !== originalContent.value,
);
const editorStats = computed(() => {
  const lines = editorContent.value
    ? editorContent.value.split(/\r?\n/).length
    : 0;
  return {
    chars: editorContent.value.length,
    lines,
  };
});
const historyPaginationConfig = computed(() => ({
  current: historyPagination.current,
  pageSize: historyPagination.pageSize,
  showSizeChanger: true,
  total: historyPagination.total,
  showTotal: (total: number) => `共 ${total} 条`,
}));
const editorReady = computed(
  () => !!currentFile.value && (!monacoAvailable.value || monacoReady.value),
);

let monacoModule: null | typeof import('monaco-editor') = null;
let monacoEditorInstance: Monaco.editor.IStandaloneCodeEditor | null = null;
let themeObserver: MutationObserver | null = null;
let syncingEditorValue = false;

function ensureMonacoEnvironment() {
  if (typeof window === 'undefined' || window.MonacoEnvironment) {
    return;
  }
  window.MonacoEnvironment = {
    getWorker(_workerId: string, label: string) {
      if (label === 'handlebars' || label === 'html' || label === 'razor') {
        return new htmlWorker();
      }
      return new editorWorker();
    },
  };
}

function applyMonacoTheme() {
  if (!monacoModule) {
    return;
  }
  const isDark = document.documentElement.classList.contains('dark');
  monacoModule.editor.setTheme(isDark ? 'vs-dark' : 'vs');
}

function startThemeObserver() {
  if (typeof window === 'undefined' || themeObserver) {
    return;
  }
  themeObserver = new MutationObserver(() => {
    applyMonacoTheme();
  });
  themeObserver.observe(document.documentElement, {
    attributeFilter: ['class'],
    attributes: true,
  });
}

async function initMonacoEditor() {
  if (
    !editorContainerRef.value ||
    monacoEditorInstance ||
    !monacoAvailable.value
  ) {
    return;
  }

  try {
    monacoLoading.value = true;
    ensureMonacoEnvironment();
    monacoModule = await import('monaco-editor');
    applyMonacoTheme();

    monacoEditorInstance = monacoModule.editor.create(
      editorContainerRef.value,
      {
        automaticLayout: true,
        fontFamily: 'JetBrains Mono, Consolas, Courier New, monospace',
        fontLigatures: true,
        fontSize: 13,
        formatOnPaste: true,
        formatOnType: true,
        language: 'html',
        lineNumbersMinChars: 3,
        minimap: { enabled: false },
        roundedSelection: true,
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        tabSize: 2,
        theme: document.documentElement.classList.contains('dark')
          ? 'vs-dark'
          : 'vs',
        value: editorContent.value,
        wordWrap: 'on',
      },
    );

    monacoEditorInstance.onDidChangeModelContent(() => {
      if (syncingEditorValue || !monacoEditorInstance) {
        return;
      }
      editorContent.value = monacoEditorInstance.getValue();
    });

    monacoEditorInstance.addCommand(
      monacoModule.KeyMod.CtrlCmd | monacoModule.KeyCode.KeyS,
      () => {
        void handleSave();
      },
    );

    monacoReady.value = true;
    startThemeObserver();
  } catch (error) {
    console.error(error);
    monacoAvailable.value = false;
    monacoReady.value = false;
    message.warning('Monaco 编辑器初始化失败，已回退为文本编辑器');
  } finally {
    monacoLoading.value = false;
  }
}

function destroyMonacoEditor() {
  monacoEditorInstance?.dispose();
  monacoEditorInstance = null;
  monacoReady.value = false;
  themeObserver?.disconnect();
  themeObserver = null;
}

watch(
  editorContainerRef,
  async (value) => {
    if (value) {
      await initMonacoEditor();
    }
  },
  { flush: 'post' },
);

watch(editorContent, (value) => {
  if (!monacoEditorInstance) {
    return;
  }
  if (monacoEditorInstance.getValue() === value) {
    return;
  }
  syncingEditorValue = true;
  monacoEditorInstance.setValue(value);
  syncingEditorValue = false;
});

function normalizeAssetBaseUrl(assetBaseUrl?: null | string) {
  if (!assetBaseUrl) {
    return '';
  }
  return assetBaseUrl.replace(/\/+$/, '');
}

function rewritePreviewUrl(value: string, assetBaseUrl: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return trimmed;
  }
  if (trimmed.startsWith('http://localhost:8080/uploads/')) {
    return `${assetBaseUrl}${trimmed.slice('http://localhost:8080'.length)}`;
  }
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('//') ||
    trimmed.startsWith('#') ||
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }
  if (trimmed.startsWith('/')) {
    return `${assetBaseUrl}${trimmed}`;
  }
  return trimmed;
}

function buildPreviewHtml(html: string, assetBaseUrl?: null | string) {
  if (!html) {
    return '';
  }

  const normalizedAssetBaseUrl = normalizeAssetBaseUrl(assetBaseUrl);
  if (!normalizedAssetBaseUrl) {
    return html;
  }

  const normalizedHtml = html.replaceAll(
    'http://localhost:8080/uploads/',
    `${normalizedAssetBaseUrl}/uploads/`,
  );
  const parser = new DOMParser();
  const documentNode = parser.parseFromString(normalizedHtml, 'text/html');

  documentNode.querySelectorAll('base').forEach((element) => element.remove());
  const baseElement = documentNode.createElement('base');
  baseElement.setAttribute('href', `${normalizedAssetBaseUrl}/`);
  documentNode.head.prepend(baseElement);

  ['href', 'src', 'poster', 'data-src'].forEach((attrName) => {
    documentNode
      .querySelectorAll<HTMLElement>(`[${attrName}]`)
      .forEach((element) => {
        const attrValue = element.getAttribute(attrName);
        if (!attrValue) {
          return;
        }
        element.setAttribute(
          attrName,
          rewritePreviewUrl(attrValue, normalizedAssetBaseUrl),
        );
      });
  });

  return `<!DOCTYPE html>\n${documentNode.documentElement.outerHTML}`;
}

function renderPreview() {
  previewContent.value = buildPreviewHtml(
    editorContent.value,
    currentFile.value?.assetBaseUrl,
  );
}

const scheduleRenderPreview = useDebounceFn(renderPreview, 120);
watch([editorContent, () => currentFile.value?.assetBaseUrl], () => {
  scheduleRenderPreview();
});

function mapTreeNodes(nodes: CmsTemplateTreeNode[]): TemplateTreeDataNode[] {
  return nodes.map((node) => ({
    ...node,
    key: node.path,
    isLeaf: !node.directory,
    selectable: !node.directory,
    children: node.children ? mapTreeNodes(node.children) : [],
  }));
}

function collectExpandedKeys(nodes: CmsTemplateTreeNode[]) {
  const keys: string[] = [];
  const walk = (items: CmsTemplateTreeNode[]) => {
    items.forEach((item) => {
      if (item.directory) {
        keys.push(item.path);
        if (item.children?.length) {
          walk(item.children);
        }
      }
    });
  };
  walk(nodes);
  return keys;
}

function findFirstFilePath(nodes: CmsTemplateTreeNode[]): null | string {
  for (const node of nodes) {
    if (!node.directory) {
      return node.path;
    }
    const childPath = findFirstFilePath(node.children ?? []);
    if (childPath) {
      return childPath;
    }
  }
  return null;
}

function countHtmlFiles(nodes: CmsTemplateTreeNode[]): number {
  return nodes.reduce((count, node) => {
    if (!node.directory) {
      return count + 1;
    }
    return count + countHtmlFiles(node.children ?? []);
  }, 0);
}

function formatBytes(size?: number) {
  if (!size && size !== 0) {
    return '-';
  }
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

function formatDateTime(value?: null | string) {
  if (!value) {
    return '-';
  }
  return dayjs(value).isValid()
    ? dayjs(value).format('YYYY-MM-DD HH:mm:ss')
    : value;
}

function statusColor(status?: string) {
  return status === 'SUCCESS'
    ? 'success'
    : (status === 'FAILED'
      ? 'error'
      : 'default');
}

function openLink(url?: null | string) {
  if (!url) {
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

function createDirtyConfirm(content: string) {
  if (!isDirty.value) {
    return Promise.resolve(true);
  }
  return new Promise<boolean>((resolve) => {
    Modal.confirm({
      title: '当前模板存在未保存修改',
      content,
      okText: '放弃修改',
      cancelText: '取消',
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
    });
  });
}

async function loadPublishHistory(
  pageNumber = historyPagination.current,
  pageSize = historyPagination.pageSize,
) {
  historyLoading.value = true;
  try {
    const data = await getTemplatePublishHistory({ pageNumber, pageSize });
    publishHistory.value = data.records;
    historyPagination.current = data.pageNumber;
    historyPagination.pageSize = data.pageSize;
    historyPagination.total = data.totalRow;
  } finally {
    historyLoading.value = false;
  }
}

async function fetchTemplateFile(path: string) {
  fileLoading.value = true;
  try {
    const detail = await getTemplateFile(path);
    currentFile.value = detail;
    editorContent.value = detail.content;
    originalContent.value = detail.content;
    previewContent.value = detail.previewContent;
    selectedKeys.value = [detail.path];
  } finally {
    fileLoading.value = false;
  }
}

async function loadTree(preferredPath?: null | string) {
  treeLoading.value = true;
  try {
    const data = await getTemplateTree();
    treeSource.value = data;
    expandedKeys.value = collectExpandedKeys(data);

    const targetPath =
      preferredPath || currentFile.value?.path || findFirstFilePath(data);
    if (targetPath) {
      await fetchTemplateFile(targetPath);
    } else {
      currentFile.value = null;
      editorContent.value = '';
      originalContent.value = '';
      previewContent.value = '';
      selectedKeys.value = [];
    }
  } finally {
    treeLoading.value = false;
  }
}

async function handleSelect(keys: Array<number | string>) {
  const nextPath = String(keys[0] ?? '');
  if (!nextPath || nextPath === currentFile.value?.path) {
    return;
  }

  const confirmed = await createDirtyConfirm(
    '切换模板文件会丢失未保存内容，是否继续？',
  );
  if (!confirmed) {
    return;
  }

  await fetchTemplateFile(nextPath);
}

async function handleReload() {
  if (!currentFile.value) {
    await loadTree();
    return;
  }

  const confirmed = await createDirtyConfirm(
    '重新加载将放弃当前编辑内容，是否继续？',
  );
  if (!confirmed) {
    return;
  }

  await fetchTemplateFile(currentFile.value.path);
  message.success('已重新加载模板文件');
}

async function handleRefreshTree() {
  const confirmed = await createDirtyConfirm(
    '刷新模板树会重新加载当前文件，是否继续？',
  );
  if (!confirmed) {
    return;
  }
  await loadTree(currentFile.value?.path);
}

async function handleSave(showSuccess = true) {
  if (!currentFile.value) {
    message.warning('请先选择要保存的 HTML 模板文件');
    return false;
  }

  if (!isDirty.value) {
    if (showSuccess) {
      message.info('当前没有需要保存的修改');
    }
    return true;
  }

  saveLoading.value = true;
  try {
    await saveTemplateFile({
      path: currentFile.value.path,
      content: editorContent.value,
    });
    await fetchTemplateFile(currentFile.value.path);
    if (showSuccess) {
      message.success('模板文件保存成功');
    }
    return true;
  } catch (error) {
    console.error(error);
    message.error('模板文件保存失败');
    return false;
  } finally {
    saveLoading.value = false;
  }
}

async function handleFormatDocument() {
  if (!currentFile.value) {
    message.warning('请先选择要编辑的 HTML 模板文件');
    return;
  }

  if (!monacoAvailable.value || !monacoEditorInstance) {
    message.info('当前编辑器未启用 Monaco，暂不支持一键格式化');
    return;
  }

  try {
    const action = monacoEditorInstance.getAction(
      'editor.action.formatDocument',
    );
    await action?.run();
    message.success('HTML 格式化完成');
  } catch (error) {
    console.error(error);
    message.error('HTML 格式化失败');
  }
}

async function executePublish() {
  publishLoading.value = true;
  try {
    const result = await publishTemplateSite();
    lastPublishResult.value = result;
    historyPagination.current = 1;
    await loadPublishHistory(1, historyPagination.pageSize);
    message.success('模板站点发布成功');
  } catch (error) {
    console.error(error);
    message.error('模板站点发布失败');
    throw error;
  } finally {
    publishLoading.value = false;
  }
}

function handlePublish() {
  if (!hasTemplates.value) {
    message.warning('当前模板目录下没有可发布的 HTML 文件');
    return;
  }

  Modal.confirm({
    title: isDirty.value
      ? '先保存再发布当前模板站点？'
      : '确认发布当前模板站点？',
    content: isDirty.value
      ? '发布动作只会复制文件系统中的内容，系统将先保存当前文件，再复制模板目录并生成 ZIP 包。'
      : '系统将原样复制模板目录到发布目录，并生成可下载的 ZIP 包。',
    okText: isDirty.value ? '保存并发布' : '立即发布',
    cancelText: '取消',
    onOk: async () => {
      if (isDirty.value) {
        const saved = await handleSave(false);
        if (!saved) {
          throw new Error('save template failed');
        }
      }
      await executePublish();
    },
  });
}

function handleHistoryTableChange(pagination: {
  current?: number;
  pageSize?: number;
}) {
  void loadPublishHistory(
    pagination.current ?? historyPagination.current,
    pagination.pageSize ?? historyPagination.pageSize,
  );
}

function handleFallbackEditorKeydown(event: KeyboardEvent) {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
    event.preventDefault();
    void handleSave();
  }
}

function handleBeforeUnload(event: BeforeUnloadEvent) {
  if (!isDirty.value) {
    return;
  }
  event.preventDefault();
  event.returnValue = '';
}

async function initializePage() {
  try {
    await Promise.all([loadTree(), loadPublishHistory()]);
    await initMonacoEditor();
  } catch (error) {
    console.error(error);
    message.error('模板管理页面初始化失败');
  }
}

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload);
  void initializePage();
});

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload);
  destroyMonacoEditor();
});

onBeforeRouteLeave(() => {
  if (!isDirty.value) {
    return true;
  }
  return window.confirm('当前模板存在未保存修改，确定离开当前页面吗？');
});
</script>

<template>
  <ColPage
    auto-content-height
    title="模板管理"
    :left-width="22"
    :left-min-width="16"
    :left-max-width="30"
  >
    <template #left="{ expand, isCollapsed }">
      <div v-if="isCollapsed" class="flex h-full items-center justify-center">
        <Button type="primary" @click="expand">展开模板树</Button>
      </div>
      <div
        v-else
        class="flex h-full w-full flex-col rounded-[var(--radius)] border border-border bg-card"
      >
        <div
          class="flex items-center justify-between border-b border-border px-4 py-3"
        >
          <div>
            <div class="text-sm font-medium">模板文件树</div>
            <div class="text-xs text-muted-foreground">
              共 {{ htmlFileCount }} 个 HTML 文件
            </div>
          </div>
          <Button
            size="small"
            :loading="treeLoading"
            @click="handleRefreshTree"
          >
            刷新
          </Button>
        </div>
        <div class="flex-1 overflow-auto p-3">
          <Tree
            v-if="treeData.length > 0"
            v-model:expanded-keys="expandedKeys"
            :selected-keys="selectedKeys"
            :tree-data="treeData"
            :field-names="{ children: 'children', title: 'name', key: 'key' }"
            block-node
            @select="handleSelect"
          >
            <template #title="{ data }">
              <div class="flex items-center gap-2 overflow-hidden">
                <span class="shrink-0">{{ data.directory ? '📁' : '📄' }}</span>
                <span class="truncate">{{ data.name }}</span>
              </div>
            </template>
          </Tree>
          <div
            v-else
            class="flex h-full min-h-[240px] items-center justify-center text-muted-foreground"
          >
            <Empty description="模板目录下暂无 HTML 文件" />
          </div>
        </div>
      </div>
    </template>

    <div class="flex h-full min-h-0 flex-col gap-4">
      <div class="rounded-[var(--radius)] border border-border bg-card p-4">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="min-w-0 flex-1">
            <div class="text-base font-medium">
              {{ currentFile?.name || '请选择左侧 HTML 模板文件' }}
            </div>
            <div class="mt-1 break-all text-sm text-muted-foreground">
              {{
                currentFile?.path ||
                '当前支持递归管理 webapp/html/web 下的 .html 文件'
              }}
            </div>
          </div>
          <div class="flex flex-wrap gap-2">
            <AccessControl :codes="['cms:template:edit']" type="code">
              <Button
                type="primary"
                :disabled="!currentFile"
                :loading="saveLoading"
                @click="handleSave()"
              >
                保存
              </Button>
            </AccessControl>
            <Button
              :disabled="!currentFile"
              :loading="fileLoading"
              @click="handleReload"
            >
              重新加载
            </Button>
            <Button :disabled="!currentFile" @click="handleFormatDocument">
              格式化 HTML
            </Button>
            <Button :disabled="!currentFile" @click="renderPreview">
              刷新预览
            </Button>
            <AccessControl :codes="['cms:template:publish']" type="code">
              <Button :loading="publishLoading" @click="handlePublish">
                发布 ZIP
              </Button>
            </AccessControl>
          </div>
        </div>

        <div
          class="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground"
        >
          <span>文件大小：{{ formatBytes(currentFile?.size) }}</span>
          <span>最后修改：{{ formatDateTime(currentFile?.lastModifiedTime) }}</span>
          <span>资源域：{{ currentFile?.assetBaseUrl || '-' }}</span>
          <span>行数：{{ editorStats.lines }}</span>
          <span>字符数：{{ editorStats.chars }}</span>
          <Tag :color="isDirty ? 'warning' : 'success'">
            {{ isDirty ? '未保存' : '已同步' }}
          </Tag>
        </div>

        <div
          v-if="lastPublishResult"
          class="mt-4 rounded-[var(--radius)] border border-dashed border-border px-4 py-3"
        >
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-medium">最近发布：{{ lastPublishResult.publishName }}</span>
                <Tag :color="statusColor(lastPublishResult.status)">
                  {{ lastPublishResult.status }}
                </Tag>
                <span class="text-sm text-muted-foreground">
                  {{ lastPublishResult.fileCount }} 个文件
                </span>
              </div>
              <div class="mt-1 break-all text-xs text-muted-foreground">
                {{ lastPublishResult.publishDir }}
              </div>
            </div>
            <div class="flex flex-wrap gap-2">
              <Button
                v-if="
                  lastPublishResult.indexUrl ||
                  lastPublishResult.indexRelativeUrl
                "
                size="small"
                type="link"
                @click="
                  openLink(
                    lastPublishResult.indexUrl ||
                      lastPublishResult.indexRelativeUrl,
                  )
                "
              >
                打开首页
              </Button>
              <Button
                v-if="
                  lastPublishResult.zipUrl || lastPublishResult.zipRelativeUrl
                "
                size="small"
                type="link"
                @click="
                  openLink(
                    lastPublishResult.zipUrl ||
                      lastPublishResult.zipRelativeUrl,
                  )
                "
              >
                下载 ZIP
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div class="grid min-h-[560px] gap-4 xl:grid-cols-2">
        <div
          class="flex min-h-[560px] flex-col rounded-[var(--radius)] border border-border bg-card"
        >
          <div
            class="flex items-center justify-between border-b border-border px-4 py-3"
          >
            <span class="font-medium">源码编辑</span>
            <span class="text-xs text-muted-foreground">
              支持 Ctrl/Cmd + S 快捷保存
            </span>
          </div>
          <div class="flex-1 p-3">
            <Skeleton
              v-if="
                fileLoading ||
                (currentFile &&
                  monacoAvailable &&
                  monacoLoading &&
                  !editorReady)
              "
              active
              :paragraph="{ rows: 18 }"
            />
            <div v-else-if="currentFile" class="editor-wrapper">
              <div
                v-if="monacoAvailable"
                ref="editorContainerRef"
                class="monaco-editor-container"
              ></div>
              <textarea
                v-else
                v-model="editorContent"
                class="template-textarea"
                spellcheck="false"
                @keydown="handleFallbackEditorKeydown"
              ></textarea>
            </div>
            <div v-else class="flex h-full items-center justify-center">
              <Empty description="请选择 HTML 模板文件后开始编辑" />
            </div>
          </div>
        </div>

        <div
          class="flex min-h-[560px] flex-col rounded-[var(--radius)] border border-border bg-card"
        >
          <div
            class="flex items-center justify-between border-b border-border px-4 py-3"
          >
            <span class="font-medium">iframe 实时预览</span>
            <span class="text-xs text-muted-foreground">
              资源地址会按配置自动重写到当前资源域
            </span>
          </div>
          <div class="flex-1 overflow-hidden bg-white">
            <Skeleton
              v-if="fileLoading"
              active
              :paragraph="{ rows: 18 }"
              class="p-4"
            />
            <iframe
              v-else-if="currentFile"
              class="h-full w-full border-0"
              :srcdoc="previewContent"
              sandbox="allow-forms allow-modals allow-popups allow-same-origin allow-scripts"
            ></iframe>
            <div v-else class="flex h-full items-center justify-center">
              <Empty description="预览区将在加载模板文件后显示" />
            </div>
          </div>
        </div>
      </div>

      <div class="rounded-[var(--radius)] border border-border bg-card p-4">
        <div class="mb-3 flex items-center justify-between gap-3">
          <div>
            <div class="font-medium">发布记录</div>
            <div class="text-xs text-muted-foreground">
              发布时会原样复制当前模板目录，并生成静态目录与 ZIP 包
            </div>
          </div>
          <Button
            size="small"
            :loading="historyLoading"
            @click="loadPublishHistory()"
          >
            刷新记录
          </Button>
        </div>

        <a-table
          row-key="id"
          size="small"
          :columns="historyColumns"
          :data-source="publishHistory"
          :loading="historyLoading"
          :pagination="historyPaginationConfig"
          :scroll="{ x: 1100 }"
          @change="handleHistoryTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'status'">
              <Tag :color="statusColor(record.status)">
                {{ record.status }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'createTime'">
              {{ formatDateTime(record.createTime) }}
            </template>
            <template v-else-if="column.key === 'action'">
              <div class="flex flex-wrap gap-2">
                <Button
                  v-if="record.indexRelativeUrl"
                  size="small"
                  type="link"
                  @click="openLink(record.indexRelativeUrl)"
                >
                  首页
                </Button>
                <Button
                  v-if="record.zipRelativeUrl"
                  size="small"
                  type="link"
                  @click="openLink(record.zipRelativeUrl)"
                >
                  ZIP
                </Button>
              </div>
            </template>
            <template v-else-if="column.key === 'publishDir'">
              <span class="break-all text-xs">{{ record.publishDir }}</span>
            </template>
          </template>
        </a-table>
      </div>
    </div>
  </ColPage>
</template>

<style lang="scss" scoped>
.editor-wrapper {
  width: 100%;
  height: 100%;
  min-height: 520px;
}

.monaco-editor-container {
  width: 100%;
  height: 100%;
  min-height: 520px;
  overflow: hidden;
  border: 1px solid rgb(226 232 240 / 100%);
  border-radius: 12px;
}

.template-textarea {
  width: 100%;
  height: 100%;
  min-height: 520px;
  padding: 12px;
  font-family: 'JetBrains Mono', Consolas, 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: rgb(15 23 42 / 100%);
  resize: none;
  outline: none;
  background: transparent;
  border: 1px solid rgb(226 232 240 / 100%);
  border-radius: 12px;
}

.template-textarea:focus {
  border-color: rgb(59 130 246 / 100%);
  box-shadow: 0 0 0 2px rgb(59 130 246 / 12%);
}

:deep(.ant-tree-node-content-wrapper) {
  display: flex;
  align-items: center;
  min-height: 32px;
}

:deep(.ant-skeleton) {
  width: 100%;
}
</style>
