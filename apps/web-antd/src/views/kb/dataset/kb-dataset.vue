<script lang="ts" setup>
import type { KbFileItem } from '#/api/devops/knowledgebase';

import { computed, onMounted, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Dropdown,
  Input,
  Menu,
  MenuItem,
  message,
  Modal,
  Space,
  Table,
  TabPane,
  Tabs,
  Tag,
} from 'ant-design-vue';

import {
  buildKbIndex,
  createKbFolder,
  deleteKbFile,
  listKbFiles,
  renameKbFile,
} from '#/api/devops/knowledgebase';

import KbFolderModal from './kb-folder-modal.vue';
import KbImportWizard from './kb-import-wizard.vue';
import KbLocalUpload from './kb-local-upload.vue';
import KbRenameModal from './kb-rename-modal.vue';
import KbSourceSelectModal from './kb-source-select-modal.vue';

// eslint-disable-next-line no-redeclare
interface BreadcrumbItem {
  title: string;
  path: string;
}

const props = defineProps<{
  kbId: string;
  kbName?: string;
}>();

const emit = defineEmits(['back']);

// 文件分类图标配置
const fileCategories = [
  {
    id: 'image',
    name: '图片',
    icon: 'lucide:image',
    exts: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'],
  },
  {
    id: 'document',
    name: '文档',
    icon: 'lucide:file-text',
    exts: [
      'pdf',
      'doc',
      'docx',
      'xls',
      'xlsx',
      'ppt',
      'pptx',
      'txt',
      'md',
      'csv',
    ],
  },
  {
    id: 'video',
    name: '视频',
    icon: 'lucide:video',
    exts: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'],
  },
  {
    id: 'audio',
    name: '音频',
    icon: 'lucide:music',
    exts: ['mp3', 'wav', 'ogg', 'flac', 'aac'],
  },
  {
    id: 'archive',
    name: '压缩包',
    icon: 'lucide:archive',
    exts: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'],
  },
  { id: 'other', name: '其他', icon: 'lucide:file', exts: [] },
];

// 根据文件扩展名获取图标
function getFileIcon(file: Record<string, any>): string {
  // 文件夹
  if (file.type === 'FOLDER') {
    return 'mdi:folder';
  }

  // 文件 - 根据扩展名判断
  const ext =
    file.sysFile?.fileExt?.toLowerCase() || file.fileExt?.toLowerCase() || '';
  const iconMap: Record<string, string> = {
    // 图片
    jpg: 'lucide:image',
    jpeg: 'lucide:image',
    png: 'lucide:image',
    gif: 'lucide:image',
    webp: 'lucide:image',
    svg: 'lucide:image',
    bmp: 'lucide:image',
    // 文档
    pdf: 'lucide:file-text',
    doc: 'lucide:file-text',
    docx: 'lucide:file-text',
    xls: 'lucide:file-spreadsheet',
    xlsx: 'lucide:file-spreadsheet',
    ppt: 'lucide:file-presentation',
    pptx: 'lucide:file-presentation',
    txt: 'lucide:file-type',
    md: 'lucide:file-minus',
    csv: 'lucide:file-spreadsheet',
    // 视频
    mp4: 'lucide:file-play',
    avi: 'lucide:video',
    mov: 'lucide:video',
    wmv: 'lucide:video',
    flv: 'lucide:video',
    mkv: 'lucide:video',
    // 音频
    mp3: 'lucide:file-music',
    wav: 'lucide:music',
    ogg: 'lucide:music',
    flac: 'lucide:music',
    aac: 'lucide:music',
    // 压缩包
    zip: 'lucide:file-archive',
    rar: 'lucide:archive',
    '7z': 'lucide:archive',
    tar: 'lucide:archive',
    gz: 'lucide:archive',
    bz2: 'lucide:archive',
    // HTML
    html: 'lucide:code',
    htm: 'lucide:file-code-corner',
    // 其他
    json: 'lucide:file-code',
    js: 'lucide:file-code',
    ts: 'lucide:file-code',
    xml: 'lucide:code',
  };
  return iconMap[ext] || 'lucide:file';
}

// 获取文件显示名称
function getFileName(file: Record<string, any>): string {
  // 文件夹取 name 字段
  if (file.type === 'FOLDER') {
    return file.name || '-';
  }
  // 文件取 sysFile.fileName
  return file.sysFile?.fileName || file.name || '-';
}

// 格式化文件大小
function formatFileSizeFromItem(item: Record<string, any>): string {
  // 文件夹显示 "-"
  if (item.type === 'FOLDER') return '-';
  const fileSize = item.sysFile?.fileSize || item.fileSize;
  if (!fileSize) return '-';
  return formatFileSize(fileSize);
}

// 格式化时间
function formatTime(time?: string): string {
  if (!time) return '-';
  return time.replace('T', ' ').slice(0, 19);
}

// 获取状态显示
function getStatusDisplay(item: Record<string, any>): string {
  const status = item.sysFile?.aiStatus || item.aiStatus || '';
  const statusMap: Record<string, string> = {
    UPLOADED: '已上传',
    PARSING: '解析中',
    EMBEDDING: '向量化中',
    INDEXING: '索引中',
    READY: '已就绪',
    FAILED: '失败',
  };
  return statusMap[status] || status;
}

// 格式化文件大小
function formatFileSize(bytes?: number): string {
  if (!bytes || bytes === 0) return '-';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

const activeTab = ref('dataset');
const showImportWizard = ref(false);
const showLocalUpload = ref(false);
const loading = ref(false);

// 当前目录ID，root表示根目录
const currentFolderId = ref<string | undefined>(undefined);
const breadcrumbs = ref<BreadcrumbItem[]>([{ title: '根目录', path: '' }]);

const fileList = ref<KbFileItem[]>([]);

// 行选中数据
const selectedRowKeys = ref<string[]>([]);
const selectedRows = ref<Record<string, any>[]>([]);

const [SourceSelectModal, sourceModalApi] = useVbenModal({
  connectedComponent: KbSourceSelectModal,
});

const [FolderModal, folderModalApi] = useVbenModal({
  connectedComponent: KbFolderModal,
});

// 行选择变化处理
function handleRowSelectionChange(keys: (number | string)[], rows: any[]) {
  selectedRowKeys.value = keys as string[];
  selectedRows.value = rows;
}

const [RenameModal, renameModalApi] = useVbenModal({
  connectedComponent: KbRenameModal,
});

// 加载文件列表
async function loadFileList() {
  if (!props.kbId) return;

  loading.value = true;
  try {
    // requestClient 配置了 responseReturn: 'data'，所以 res 直接是数组
    const res = await listKbFiles(props.kbId, currentFolderId.value);
    fileList.value = res || [];
  } catch (error) {
    console.error('加载文件列表失败:', error);
    message.error('加载文件列表失败');
  } finally {
    loading.value = false;
  }
}

// 初始化加载
onMounted(() => {
  if (props.kbName) {
    breadcrumbs.value.push({ title: props.kbName, path: '' });
  }
  loadFileList();
});

function handleCreateFolder() {
  folderModalApi.setData({ parentId: currentFolderId.value });
  folderModalApi.open();
}

async function handleFolderConfirm(name: string) {
  if (!props.kbId) return;

  try {
    await createKbFolder(props.kbId, {
      parentId: currentFolderId.value,
      name,
    });
    message.success(`文件夹 "${name}" 创建成功`);
    await loadFileList();
  } catch (error) {
    console.error('创建文件夹失败:', error);
    message.error('创建文件夹失败');
  }
}

function handleCreateTextDataset() {
  sourceModalApi.open();
}

function handleSourceConfirm(sourceType: string) {
  if (sourceType === 'local') {
    showLocalUpload.value = true;
  }
}

// 处理文件夹点击
async function handleFolderClick(record: Record<string, any>) {
  if (record.type === 'FOLDER') {
    breadcrumbs.value.push({ title: getFileName(record), path: record.id });
    currentFolderId.value = record.id;
    await loadFileList();
  }
}

// 处理面包屑导航
async function handleBreadcrumbClick(index: number) {
  if (index === breadcrumbs.value.length - 1) return;

  if (index === 0) {
    emit('back');
    return;
  }

  if (index === 1) {
    breadcrumbs.value = breadcrumbs.value.slice(0, 2);
    currentFolderId.value = undefined;
    await loadFileList();
    return;
  }

  const target = breadcrumbs.value[index];
  if (!target) return;
  breadcrumbs.value = breadcrumbs.value.slice(0, index + 1);
  currentFolderId.value = target.path || undefined;
  await loadFileList();
}

const columns = [
  {
    title: '名称',
    dataIndex: 'fileName',
    key: 'fileName',
  },
  {
    title: '类型',
    dataIndex: 'fileType',
    key: 'fileType',
  },
  {
    title: '大小',
    dataIndex: 'fileSize',
    key: 'fileSize',
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    key: 'createTime',
  },
  {
    title: '状态',
    dataIndex: 'aiStatus',
    key: 'aiStatus',
  },
  {
    title: '处理状态',
    dataIndex: 'aiParseStatus',
    key: 'aiParseStatus',
  },
  {
    title: '',
    key: 'action',
    width: 60,
  },
];

async function refreshAfterImport() {
  showImportWizard.value = false;
  showLocalUpload.value = false;
  await loadFileList();
  message.success('导入成功');
}

// 建立索引
async function handleBuildIndex() {
  if (!props.kbId) return;

  // 筛选有效数据：aiParseStatus = 'PENDING' && aiStatus = 'UPLOADED'，且不是文件夹
  const validRows = selectedRows.value.filter(
    (row) =>
      row.type !== 'FOLDER' &&
      row.sysFile?.aiParseStatus === 'PENDING' &&
      row.sysFile?.aiStatus === 'UPLOADED',
  );

  if (validRows.length === 0) {
    message.warning(
      '请选择需要建立索引的文件（状态为"已上传"且"待解析"的文件）',
    );
    return;
  }

  const fileTreeIds = validRows.map((row) => row.id);

  try {
    const count = await buildKbIndex(props.kbId, fileTreeIds);
    message.success(`已成功为 ${count} 个文件建立索引`);
    selectedRowKeys.value = [];
    selectedRows.value = [];
    await loadFileList();
  } catch (error) {
    console.error('建立索引失败:', error);
    message.error('建立索引失败');
  }
}

// 处理重命名
function handleRename(record: Record<string, any>) {
  renameModalApi.setData({
    id: record.id,
    name: record.fileName || record.name,
  });
  renameModalApi.open();
}

async function handleRenameConfirm({ id, name }: { id: string; name: string }) {
  try {
    await renameKbFile(props.kbId, id, name);
    message.success('重命名成功');
    await loadFileList();
  } catch (error) {
    console.error('重命名失败:', error);
    message.error('重命名失败');
  }
}

// 处理删除
function handleDelete(record: Record<string, any>) {
  const name = record.fileName || record.name || '此项目';
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除 "${name}" 吗？${record.type === 'FOLDER' ? '\n（文件夹内的所有内容也将被删除）' : ''}`,
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        await deleteKbFile(props.kbId, record.id);
        message.success('删除成功');
        await loadFileList();
      } catch (error) {
        console.error('删除失败:', error);
        message.error('删除失败');
      }
    },
  });
}

// 搜索功能
const searchKeyword = ref('');

// 过滤后的文件列表 - 使用 computed 确保响应式
const filteredFileList = computed(() => {
  const list = fileList.value || [];
  if (!searchKeyword.value.trim()) {
    return list;
  }
  const keyword = searchKeyword.value.toLowerCase().trim();
  return list.filter(
    (item) =>
      // 文件名 - 文件取 sysFile.fileName，文件夹取 name
      (item.sysFile?.fileName?.toLowerCase().includes(keyword) ?? false) ||
      (item.fileName?.toLowerCase().includes(keyword) ?? false) ||
      (item.name?.toLowerCase().includes(keyword) ?? false) ||
      // 文件类型/扩展名
      (item.sysFile?.fileExt?.toLowerCase().includes(keyword) ?? false) ||
      (item.fileExt?.toLowerCase().includes(keyword) ?? false) ||
      // 状态
      (getStatusDisplay(item).toLowerCase().includes(keyword) ?? false) ||
      // 解析状态
      (item.sysFile?.aiParseStatus?.toLowerCase().includes(keyword) ?? false) ||
      (item.aiParseStatus?.toLowerCase().includes(keyword) ?? false),
  );
});

// 搜索处理
function handleSearch() {
  // Input.Search 的 @search 事件触发，用于响应式更新
}

// 清空搜索
function clearSearch() {
  searchKeyword.value = '';
}

// 高亮显示匹配文本
function highlightText(text: string): string {
  if (!searchKeyword.value.trim() || !text) {
    return text;
  }
  const keyword = searchKeyword.value.trim();
  const regex = new RegExp(`(${keyword})`, 'gi');
  return text.replace(regex, '<span class="search-highlight">$1</span>');
}
</script>

<template>
  <div class="kb-dataset-page">
    <!-- 顶部导航和面包屑 -->
    <div class="page-header">
      <div class="header-left">
        <Breadcrumb separator="/">
          <BreadcrumbItem v-for="(item, index) in breadcrumbs" :key="index">
            <span
              :class="{
                'breadcrumb-link': index < breadcrumbs.length - 1,
                'breadcrumb-current': index === breadcrumbs.length - 1,
              }"
              @click="handleBreadcrumbClick(index)"
            >
              {{ item.title }}
            </span>
          </BreadcrumbItem>
        </Breadcrumb>
      </div>
      <div class="header-center">
        <Tabs v-model:active-key="activeTab" class="center-tabs">
          <TabPane key="dataset" tab="数据集" />
          <TabPane key="search" tab="搜索测试" />
        </Tabs>
      </div>
      <div class="header-right">
        <!-- 预留空间 -->
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="page-content">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <div class="file-count-wrapper">
            <IconifyIcon icon="mdi:format-list-bulleted" class="toolbar-icon" />
            <span class="file-count">文件({{ filteredFileList.length }})</span>
          </div>
        </div>
        <div class="toolbar-right">
          <Space :size="12">
            <Button
              type="primary"
              :disabled="selectedRowKeys.length === 0"
              @click="handleBuildIndex"
            >
              <template #icon>
                <IconifyIcon icon="mdi:database-plus" />
              </template>
              建立索引 ({{ selectedRowKeys.length }})
            </Button>
            <Input.Search
              v-model:value="searchKeyword"
              placeholder="搜索文件名、类型、状态"
              style="width: 240px"
              class="custom-search"
              allow-clear
              @search="handleSearch"
            />

            <Dropdown :trigger="['hover']">
              <Button type="primary" class="new-import-btn">
                <template #icon>
                  <IconifyIcon icon="mdi:folder-plus-outline" />
                </template>
                新建/导入
              </Button>
              <template #overlay>
                <Menu class="new-import-menu">
                  <MenuItem key="folder" @click="handleCreateFolder">
                    <div class="menu-item-content">
                      <IconifyIcon
                        icon="mdi:folder"
                        class="menu-icon folder-icon"
                      />
                      <span>文件夹</span>
                    </div>
                  </MenuItem>
                  <MenuItem key="text" @click="handleCreateTextDataset">
                    <div class="menu-item-content">
                      <IconifyIcon
                        icon="mdi:text-box-outline"
                        class="menu-icon text-icon"
                      />
                      <span>文本数据集</span>
                    </div>
                  </MenuItem>
                  <MenuItem key="image" @click="showImportWizard = true">
                    <div class="menu-item-content">
                      <IconifyIcon
                        icon="mdi:image-outline"
                        class="menu-icon image-icon"
                      />
                      <span>图片数据集</span>
                    </div>
                  </MenuItem>
                  <MenuItem key="blank" @click="showImportWizard = true">
                    <div class="menu-item-content">
                      <IconifyIcon
                        icon="mdi:text-box-plus-outline"
                        class="menu-icon blank-icon"
                      />
                      <span>空白数据集</span>
                    </div>
                  </MenuItem>
                  <div class="menu-divider"></div>
                  <MenuItem key="template" @click="showImportWizard = true">
                    <div class="menu-item-content">
                      <IconifyIcon
                        icon="mdi:layers-outline"
                        class="menu-icon template-icon"
                      />
                      <span>模板导入</span>
                    </div>
                  </MenuItem>
                  <MenuItem key="backup" @click="showImportWizard = true">
                    <div class="menu-item-content">
                      <IconifyIcon
                        icon="mdi:backup-restore"
                        class="menu-icon backup-icon"
                      />
                      <span>备份导入</span>
                    </div>
                  </MenuItem>
                </Menu>
              </template>
            </Dropdown>
          </Space>
        </div>
      </div>

      <!-- 列表表格 -->
      <div class="table-container">
        <Table
          :columns="columns"
          :data-source="filteredFileList"
          :loading="loading"
          :pagination="false"
          row-key="id"
          :row-selection="{
            selectedRowKeys,
            onChange: handleRowSelectionChange,
            getCheckboxProps: (record) => ({
              disabled:
                record.type === 'FOLDER' ||
                record.sysFile?.aiStatus === 'CHUNKED',
            }),
          }"
          class="custom-table"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'fileName'">
              <div
                class="file-name-cell"
                :class="{ 'cursor-pointer': record.type === 'FOLDER' }"
                @click="handleFolderClick(record)"
              >
                <IconifyIcon
                  :icon="getFileIcon(record)"
                  class="file-icon"
                  :class="[
                    record.type === 'FOLDER' ? 'folder-color' : 'file-color',
                  ]"
                />
                <span
                  class="name-text"
                  v-html="highlightText(getFileName(record))"
                ></span>
              </div>
            </template>

            <template v-else-if="column.key === 'fileType'">
              <span v-if="record.type === 'FOLDER'">文件夹</span>
              <span v-else>{{
                record.sysFile?.fileExt || record.fileExt || '-'
              }}</span>
            </template>

            <template v-else-if="column.key === 'fileSize'">
              {{ formatFileSizeFromItem(record) }}
            </template>

            <template v-else-if="column.key === 'createTime'">
              {{ formatTime(record.createTime) }}
            </template>

            <template v-else-if="column.key === 'aiStatus'">
              <Tag
                :color="
                  getStatusDisplay(record) === '已就绪'
                    ? 'success'
                    : getStatusDisplay(record) === '索引中' ||
                        getStatusDisplay(record) === '向量化中'
                      ? 'processing'
                      : 'default'
                "
                class="status-tag"
              >
                <div class="status-inner">
                  <span class="status-dot"></span>
                  {{ getStatusDisplay(record) }}
                </div>
              </Tag>
            </template>

            <template v-else-if="column.key === 'aiParseStatus'">
              <span v-if="record.type === 'FOLDER'">-</span>
              <span v-else>{{
                record.sysFile?.aiParseStatus || record.aiParseStatus || '-'
              }}</span>
            </template>

            <template v-else-if="column.key === 'action'">
              <Dropdown :trigger="['hover']">
                <Button type="text" size="small">
                  <IconifyIcon icon="mdi:dots-horizontal" />
                </Button>
                <template #overlay>
                  <Menu>
                    <MenuItem key="rename" @click="handleRename(record)">
                      <div class="flex items-center gap-2">
                        <IconifyIcon icon="mdi:rename-box-outline" />
                        <span>重命名</span>
                      </div>
                    </MenuItem>
                    <MenuItem key="delete" @click="handleDelete(record)">
                      <div class="flex items-center gap-2 text-red-500">
                        <IconifyIcon icon="mdi:delete-outline" />
                        <span>删除</span>
                      </div>
                    </MenuItem>
                  </Menu>
                </template>
              </Dropdown>
            </template>
          </template>
        </Table>
      </div>
    </div>
    <!-- 导入向导 -->
    <KbImportWizard
      v-if="showImportWizard"
      :kb-id="kbId"
      :parent-id="currentFolderId"
      @close="showImportWizard = false"
      @success="refreshAfterImport"
    />
    <!-- 本地上传弹窗 -->
    <KbLocalUpload
      v-if="showLocalUpload"
      :kb-id="kbId"
      :parent-id="currentFolderId"
      @close="showLocalUpload = false"
      @success="loadFileList"
    />
    <SourceSelectModal @confirm="handleSourceConfirm" />
    <FolderModal @confirm="handleFolderConfirm" />
    <RenameModal @confirm="handleRenameConfirm" />
  </div>
</template>

<style lang="scss" scoped>
.kb-dataset-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 56px;
  border-bottom: 1px solid #f0f0f0;

  .header-left {
    flex: 1;
    .breadcrumb-link {
      cursor: pointer;
      color: #64748b;
      &:hover {
        color: #3b82f6;
      }
    }
    .breadcrumb-current {
      font-weight: 600;
      color: #1e293b;
    }
  }

  .header-center {
    flex: 1;
    display: flex;
    justify-content: center;
    .center-tabs {
      :deep(.ant-tabs-nav) {
        margin-bottom: 0;
        &::before {
          border-bottom: none;
        }
      }
    }
  }

  .header-right {
    flex: 1;
  }
}

.page-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  .toolbar-left {
    .file-count-wrapper {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #1e293b;
      font-weight: 500;
      .toolbar-icon {
        font-size: 18px;
      }
    }
  }

  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }
}

.new-import-btn {
  background-color: #3b82f6;
  border-radius: 8px;
  height: 36px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.new-import-menu {
  padding: 8px;
  border-radius: 12px;
  min-width: 160px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

  .menu-item-content {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 4px 0;

    .menu-icon {
      font-size: 20px;
    }

    .folder-icon {
      color: #f59e0b;
    }
    .text-icon {
      color: #64748b;
    }
    .image-icon {
      color: #64748b;
    }
    .blank-icon {
      color: #64748b;
    }
    .template-icon {
      color: #64748b;
    }
    .backup-icon {
      color: #64748b;
    }
  }

  .menu-divider {
    height: 1px;
    background: #f1f5f9;
    margin: 8px 0;
  }
}

.table-container {
  background: #f8fafc;
  border-radius: 12px;
  padding: 1px;

  :deep(.custom-table) {
    .ant-table {
      background: transparent;
    }
    .ant-table-thead > tr > th {
      background: transparent;
      color: #64748b;
      font-weight: 500;
      border-bottom: 1px solid #f1f5f9;
    }
    .ant-table-tbody > tr > td {
      border-bottom: 1px solid #f1f5f9;
    }
    .ant-table-tbody > tr:last-child > td {
      border-bottom: none;
    }
  }
}

.file-name-cell {
  display: flex;
  align-items: center;
  gap: 12px;

  .file-icon {
    font-size: 20px;
  }
  .folder-color {
    color: #f59e0b;
  }
  .file-color {
    color: #3b82f6;
  }

  .name-text {
    color: #1e293b;
    font-weight: 500;

    :deep(.search-highlight) {
      background-color: #fef08a;
      color: #ca8a04;
      padding: 0 2px;
      border-radius: 2px;
    }
  }
}

.status-tag {
  background: #f0fdf4 !important;
  border: 1px solid #dcfce7 !important;
  color: #16a34a !important;
  border-radius: 20px;
  padding: 2px 12px;

  .status-inner {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 500;
  }

  .status-dot {
    width: 6px;
    height: 6px;
    background: #22c55e;
    border-radius: 50%;
  }

  .status-link-icon {
    font-size: 12px;
    opacity: 0.8;
  }
}

.action-menu {
  min-width: 120px;
  padding: 4px;
  border-radius: 8px;

  :deep(.ant-dropdown-menu-item) {
    border-radius: 4px;
    padding: 6px 8px;
  }
}
</style>
