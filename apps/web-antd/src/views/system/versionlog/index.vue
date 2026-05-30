<script setup lang="ts">
import type { TablePaginationConfig } from 'ant-design-vue';

import type { SearchRequest } from '#/api/common';
import type { SysVersionLog } from '#/api/system/versionlog';

import { computed, h, onMounted, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  DeploymentUnitOutlined,
  EditOutlined,
  FireOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  RocketOutlined,
  SearchOutlined,
  WarningOutlined,
} from '@ant-design/icons-vue';
import {
  Button,
  Drawer,
  Empty,
  Input,
  message,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Timeline,
  TimelineItem,
  Typography,
} from 'ant-design-vue';

import {
  deleteVersionLog,
  getVersionLogList,
  getVersionLogPage,
} from '#/api/system/versionlog';

import LogDrawer from './log-drawer.vue';

const SelectOption = Select.Option;

const { Text } = Typography;

// 抽屉控制
const isDrawerVisible = ref(false);
const [VersionLogDrawer, logDrawerApi] = useVbenDrawer({
  connectedComponent: LogDrawer,
});

// 查询参数
const searchText = ref('');
const filterType = ref<string | undefined>(undefined);

const tableData = ref<SysVersionLog[]>([]);
const timelineLogs = ref<SysVersionLog[]>([]);
const loading = ref(false);
const pagination = ref<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`,
});

// 表格列定义
const columns: any = [
  {
    title: '版本号',
    dataIndex: 'versionNo',
    key: 'versionNo',
    width: 120,
  },
  {
    title: '发布日期',
    dataIndex: 'releaseDate',
    key: 'releaseDate',
    width: 180,
  },
  {
    title: '类型',
    dataIndex: 'typeStr',
    key: 'type',
    width: 120,
  },
  {
    title: '标题',
    dataIndex: 'title',
    key: 'title',
    ellipsis: true,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 80,
  },
  {
    title: '操作',
    key: 'action',
    width: 140,
    fixed: 'right',
  },
];

// 过滤后的数据（用于时间线展示）
const displayLogs = computed(() => {
  const getTimeValue = (value?: string) => {
    return value ? new Date(value).getTime() : 0;
  };
  return [...timelineLogs.value].toSorted(
    (a, b) => getTimeValue(b.releaseDate) - getTimeValue(a.releaseDate),
  );
});

const latestLog = computed(() => displayLogs.value[0]);

const summaryStats = computed(() => {
  const logs = timelineLogs.value;
  return [
    {
      label: '已发布版本',
      suffix: '个',
      value: logs.length,
    },
    {
      label: '重大更新',
      suffix: '次',
      value: logs.filter((item) => item.type === 'major').length,
    },
    {
      label: '功能优化',
      suffix: '次',
      value: logs.filter((item) => item.type === 'minor').length,
    },
    {
      label: '问题修复',
      suffix: '次',
      value: logs.filter((item) => item.type === 'patch').length,
    },
  ];
});

// 获取类型对应的颜色
const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    major: 'red',
    minor: 'orange',
    patch: 'green',
  };
  return colors[type] || 'default';
};

// 获取类型对应的标签文本
const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    major: '重大更新',
    minor: '功能优化',
    patch: '问题修复',
  };
  return labels[type] || '其他';
};

// 获取类型对应的图标
const getTypeIcon = (type: string) => {
  const icons: Record<string, any> = {
    major: WarningOutlined,
    minor: InfoCircleOutlined,
    patch: CheckCircleOutlined,
  };
  return icons[type] || InfoCircleOutlined;
};

const formatTime = (time?: string) => {
  if (!time) return '-';
  return time.replace('T', ' ').slice(0, 19);
};

const normalizeList = (items?: string[]) => {
  if (!items) return [];
  return items.map((item) => item.trim()).filter(Boolean);
};

// 打开抽屉
const openDrawer = () => {
  isDrawerVisible.value = true;
};

// 打开新增弹窗
const openAddModal = () => {
  logDrawerApi.setData({}).open();
};

// 打开编辑弹窗
const openEditModal = (record: SysVersionLog) => {
  logDrawerApi.setData({ record }).open();
};

const handleSuccess = () => {
  fetchTableData();
  fetchTimelineLogs();
};

// 删除确认
const handleDelete = async (id: string) => {
  try {
    await deleteVersionLog(id);
    message.success('版本删除成功');
    await fetchTableData();
    await fetchTimelineLogs();
  } catch (error) {
    console.error(error);
  }
};

const fetchTableData = async () => {
  loading.value = true;
  try {
    const params: SearchRequest = {
      pageNumber: pagination.value.current || 1,
      pageSize: pagination.value.pageSize || 10,
      logic: 'AND',
      orders: [{ column: 'releaseDate', asc: false }],
    };

    if (searchText.value) {
      params.keyword = searchText.value;
      params.searchFields = ['versionNo', 'title'];
    }

    const items: SearchRequest['items'] = [];
    if (filterType.value) {
      items.push({ field: 'type', op: 'eq', val: filterType.value });
    }
    if (items.length > 0) {
      params.items = items;
    }

    const resp = await getVersionLogPage(params);
    tableData.value = resp.records || [];
    pagination.value = {
      ...pagination.value,
      total: resp.totalRow || 0,
      current: resp.pageNumber || pagination.value.current,
      pageSize: resp.pageSize || pagination.value.pageSize,
    };
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const fetchTimelineLogs = async () => {
  try {
    const params: SearchRequest = {
      pageNumber: 1,
      pageSize: 200,
      logic: 'AND',
      items: [
        {
          field: 'status',
          op: 'eq',
          val: 1,
        },
      ],
      orders: [{ column: 'releaseDate', asc: false }],
    };
    const resp = await getVersionLogList(params);
    timelineLogs.value = resp || [];
  } catch (error) {
    console.error(error);
  }
};

const handleTableChange = (page: TablePaginationConfig) => {
  pagination.value = {
    ...pagination.value,
    current: page.current || 1,
    pageSize: page.pageSize || 10,
  };
  fetchTableData();
};

const handleSearch = () => {
  pagination.value = {
    ...pagination.value,
    current: 1,
  };
  fetchTableData();
};

onMounted(() => {
  fetchTableData();
  fetchTimelineLogs();
});
</script>

<template>
  <div class="version-log-page">
    <div class="version-log-shell">
      <section class="page-hero">
        <div class="hero-main">
          <div class="hero-icon">
            <DeploymentUnitOutlined />
          </div>
          <div class="hero-copy">
            <p class="eyebrow">Release Notes</p>
            <h1>系统版本日志</h1>
            <p>
              汇总系统版本迭代、功能优化与问题修复，方便团队快速回看发布节奏。
            </p>
          </div>
        </div>
        <div class="hero-actions">
          <Button type="primary" @click="openDrawer">
            <template #icon>
              <EditOutlined />
            </template>
            管理版本日志
          </Button>
        </div>
      </section>

      <section class="summary-grid">
        <div
          v-for="stat in summaryStats"
          :key="stat.label"
          class="summary-card"
        >
          <span class="summary-label">{{ stat.label }}</span>
          <strong>
            {{ stat.value }}
            <span>{{ stat.suffix }}</span>
          </strong>
        </div>
      </section>

      <section v-if="latestLog" class="latest-panel">
        <div class="latest-meta">
          <Tag color="blue">最新发布</Tag>
          <span>{{ formatTime(latestLog.releaseDate) }}</span>
        </div>
        <div class="latest-content">
          <div>
            <div class="latest-version">{{ latestLog.versionNo }}</div>
            <h2>{{ latestLog.title }}</h2>
            <p>{{ latestLog.description || '暂无版本描述' }}</p>
          </div>
          <Tag :color="getTypeColor(latestLog.type || '')" class="latest-type">
            <component :is="getTypeIcon(latestLog.type || '')" />
            {{ latestLog.typeStr || getTypeLabel(latestLog.type || '') }}
          </Tag>
        </div>
      </section>

      <section class="timeline-section">
        <div class="section-heading">
          <div>
            <h2>发布记录</h2>
            <p>按发布日期倒序展示已发布版本</p>
          </div>
        </div>

        <Empty v-if="displayLogs.length === 0" description="暂无版本日志" />

        <Timeline v-else mode="left" class="release-timeline">
          <TimelineItem
            v-for="(log, index) in displayLogs"
            :key="log.id"
            :dot="
              index === 0
                ? h('div', { class: 'custom-dot new-dot' }, [
                    h(FireOutlined, { class: 'dot-icon' }),
                  ])
                : undefined
            "
          >
            <article class="version-card">
              <header class="card-header">
                <div class="version-info">
                  <span class="version-number">{{ log.versionNo }}</span>
                  <Tag :color="getTypeColor(log.type || '')">
                    {{ log.typeStr || getTypeLabel(log.type || '') }}
                  </Tag>
                  <Tag v-if="index === 0" color="blue">最新</Tag>
                </div>
                <div class="version-date">
                  <ClockCircleOutlined />
                  {{ formatTime(log.releaseDate) }}
                </div>
              </header>

              <div class="card-body">
                <h3>{{ log.title }}</h3>
                <p class="card-desc">{{ log.description || '暂无版本描述' }}</p>

                <div class="change-grid">
                  <div
                    v-if="normalizeList(log.features).length > 0"
                    class="change-block"
                  >
                    <h4><RocketOutlined /> 新增功能</h4>
                    <ul>
                      <li
                        v-for="(feature, idx) in normalizeList(log.features)"
                        :key="idx"
                      >
                        {{ feature }}
                      </li>
                    </ul>
                  </div>

                  <div
                    v-if="normalizeList(log.fixes).length > 0"
                    class="change-block fix"
                  >
                    <h4><CheckCircleOutlined /> 问题修复</h4>
                    <ul>
                      <li
                        v-for="(fix, idx) in normalizeList(log.fixes)"
                        :key="idx"
                      >
                        {{ fix }}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </article>
          </TimelineItem>
        </Timeline>
      </section>
    </div>

    <!-- 管理抽屉 -->
    <Drawer
      v-model:open="isDrawerVisible"
      title="版本日志管理"
      placement="right"
      :width="900"
      class="version-drawer"
    >
      <!-- 工具栏 -->
      <div class="drawer-toolbar">
        <div class="toolbar-filters">
          <Input
            v-model:value="searchText"
            placeholder="搜索版本号或标题"
            class="search-input"
            allow-clear
            @press-enter="handleSearch"
            @change="handleSearch"
          >
            <template #prefix>
              <SearchOutlined />
            </template>
          </Input>
          <Select
            v-model:value="filterType"
            placeholder="筛选类型"
            class="type-select"
            allow-clear
            @change="handleSearch"
          >
            <SelectOption value="major">
              <Tag color="red">重大更新</Tag>
            </SelectOption>
            <SelectOption value="minor">
              <Tag color="orange">功能优化</Tag>
            </SelectOption>
            <SelectOption value="patch">
              <Tag color="green">问题修复</Tag>
            </SelectOption>
          </Select>
        </div>
        <Button type="primary" @click="openAddModal">
          <template #icon>
            <PlusOutlined />
          </template>
          新增版本
        </Button>
      </div>

      <!-- 数据表格 -->
      <Table
        :columns="columns"
        :data-source="tableData"
        :pagination="pagination"
        :loading="loading"
        :scroll="{ x: 800 }"
        row-key="id"
        class="version-table"
        @change="handleTableChange"
      >
        <!-- 类型列 -->
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'type'">
            <Tag :color="getTypeColor(record.type || '')" class="type-tag">
              <component :is="getTypeIcon(record.type || '')" />
              {{ record.typeStr || getTypeLabel(record.type || '') }}
            </Tag>
          </template>

          <template v-if="column.key === 'releaseDate'">
            <Text>{{ formatTime(record.releaseDate) }}</Text>
          </template>

          <!-- 标题列 -->
          <template v-if="column.key === 'title'">
            <Text>{{ record.title }}</Text>
          </template>

          <!-- 状态列 -->
          <template v-if="column.key === 'status'">
            <Tag v-if="record.status === 1" color="green">已发布</Tag>
            <Tag v-else color="default">草稿</Tag>
          </template>

          <!-- 操作列 -->
          <template v-if="column.key === 'action'">
            <Space class="action-buttons">
              <Button
                type="link"
                size="small"
                @click="openEditModal(record as SysVersionLog)"
                class="action-btn edit"
              >
                <template #icon>
                  <EditOutlined />
                </template>
                编辑
              </Button>
              <Popconfirm
                title="确定要删除此版本吗？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="handleDelete(record.id)"
              >
                <Button
                  type="link"
                  size="small"
                  danger
                  class="action-btn delete"
                >
                  <template #icon>
                    <DeleteOutlined />
                  </template>
                  删除
                </Button>
              </Popconfirm>
            </Space>
          </template>
        </template>
      </Table>

      <VersionLogDrawer @success="handleSuccess" />
    </Drawer>
  </div>
</template>

<style scoped lang="scss">
.version-log-page {
  --version-accent: hsl(var(--accent, 210 40% 96%));
  --version-bg: hsl(var(--background, 210 20% 98%));
  --version-bg-deep: hsl(var(--background-deep, 210 20% 96%));
  --version-border: hsl(var(--border, 214 32% 91%));
  --version-card: hsl(var(--card, 0 0% 100%));
  --version-foreground: hsl(var(--foreground, 222 47% 11%));
  --version-muted: hsl(var(--muted-foreground, 215 16% 47%));
  --version-popover: hsl(var(--popover, 0 0% 100%));
  --version-primary: hsl(var(--primary, 212 100% 50%));
  --version-primary-soft: hsl(var(--primary, 212 100% 50%) / 10%);
  --version-success: hsl(var(--success, 142 71% 45%));

  min-height: 100vh;
  padding: 24px;
  overflow: visible;
  background: var(--version-bg-deep);
  background-image:
    linear-gradient(
      180deg,
      hsl(var(--card, 0 0% 100%) / 72%) 0%,
      transparent 220px
    ),
    linear-gradient(
      90deg,
      hsl(var(--primary, 212 100% 50%) / 5%) 1px,
      transparent 1px
    ),
    linear-gradient(
      180deg,
      hsl(var(--primary, 212 100% 50%) / 5%) 1px,
      transparent 1px
    );
  background-size:
    auto,
    48px 48px,
    48px 48px;
}

:global(.version-drawer) {
  --version-accent: hsl(var(--accent, 210 40% 96%));
  --version-border: hsl(var(--border, 214 32% 91%));
  --version-foreground: hsl(var(--foreground, 222 47% 11%));
  --version-popover: hsl(var(--popover, 0 0% 100%));
  --version-primary: hsl(var(--primary, 212 100% 50%));
}

.version-log-shell {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 1160px;
  margin: 0 auto;
}

.page-hero,
.latest-panel,
.summary-card {
  background: var(--version-card);
  border: 1px solid var(--version-border);
  border-radius: 8px;
  box-shadow: 0 1px 2px rgb(15 23 42 / 4%);
}

.page-hero {
  display: flex;
  gap: 24px;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  overflow: hidden;
  background:
    linear-gradient(135deg, var(--version-primary-soft) 0%, transparent 42%),
    var(--version-card);
}

.hero-main {
  display: flex;
  gap: 16px;
  align-items: center;
  min-width: 0;
}

.hero-icon {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  font-size: 26px;
  color: var(--version-primary);
  background: var(--version-primary-soft);
  border: 1px solid hsl(var(--primary, 212 100% 50%) / 16%);
  border-radius: 8px;
}

.hero-copy {
  min-width: 0;

  .eyebrow {
    margin: 0 0 4px;
    font-size: 12px;
    font-weight: 600;
    color: var(--version-primary);
    text-transform: uppercase;
  }

  h1 {
    margin: 0;
    font-size: 28px;
    font-weight: 700;
    line-height: 1.25;
    color: var(--version-foreground);
  }

  p:last-child {
    max-width: 640px;
    margin: 8px 0 0;
    font-size: 14px;
    line-height: 1.7;
    color: var(--version-muted);
  }
}

.hero-actions {
  flex: 0 0 auto;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.summary-card {
  position: relative;
  padding: 16px 18px;
  overflow: hidden;

  &::after {
    position: absolute;
    right: 16px;
    bottom: 14px;
    width: 36px;
    height: 4px;
    pointer-events: none;
    content: '';
    background: hsl(var(--primary, 212 100% 50%) / 14%);
    border-radius: 999px;
  }
}

.summary-label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  color: var(--version-muted);
}

.summary-card strong {
  font-size: 26px;
  font-weight: 700;
  line-height: 1;
  color: var(--version-foreground);

  span {
    margin-left: 4px;
    font-size: 13px;
    font-weight: 500;
    color: var(--version-muted);
  }
}

.latest-panel {
  padding: 20px 24px;
  border-left: 4px solid var(--version-primary);
}

.latest-meta {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 14px;
  font-size: 13px;
  color: var(--version-muted);
}

.latest-content {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  justify-content: space-between;
}

.latest-version {
  margin-bottom: 6px;
  font-family: 'SF Mono', 'Fira Code', Consolas, monospace;
  font-size: 13px;
  font-weight: 700;
  color: var(--version-primary);
}

.latest-content h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--version-foreground);
}

.latest-content p {
  margin: 8px 0 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--version-muted);
}

.latest-type,
.type-tag {
  display: inline-flex;
  gap: 4px;
  align-items: center;
}

.timeline-section {
  max-width: none;
  padding: 6px 2px 8px;
}

.section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;

  h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: var(--version-foreground);
  }

  p {
    margin: 6px 0 0;
    font-size: 13px;
    color: var(--version-muted);
  }
}

.release-timeline {
  :deep(.ant-timeline-item-tail) {
    background: none;
    border-inline-start-color: #dbe4f0;
    border-left-color: #dbe4f0;
    border-image: none;
  }

  :deep(.ant-timeline-item-head) {
    width: 12px;
    height: 12px;
    background: var(--version-card);
    border-color: var(--version-primary);
    box-shadow: none;
  }
}

.custom-dot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: #fff;
  background: var(--version-primary);
  border: 3px solid hsl(var(--primary, 212 100% 50%) / 18%);
  border-radius: 50%;
  box-shadow: none;
  animation: none;

  .dot-icon {
    font-size: 12px;
  }
}

.version-card {
  overflow: hidden;
  background: var(--version-card);
  border: 1px solid var(--version-border);
  border-radius: 8px;
  box-shadow: none;
  backdrop-filter: none;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    border-color: hsl(var(--primary, 212 100% 50%) / 35%);
    box-shadow: 0 8px 24px rgb(15 23 42 / 8%);
    transform: none;
  }
}

.card-header {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  background: hsl(var(--accent, 210 40% 96%) / 55%);
  border-bottom: 1px solid var(--version-border);
}

.version-info {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.version-number {
  font-family: 'SF Mono', 'Fira Code', Consolas, monospace;
  font-size: 18px;
  font-weight: 700;
  color: var(--version-primary);
  background: none;
  -webkit-text-fill-color: var(--version-primary);
}

.version-date {
  display: inline-flex;
  flex: 0 0 auto;
  gap: 6px;
  align-items: center;
  font-size: 13px;
  color: var(--version-muted);
}

.card-body {
  padding: 18px;

  h3 {
    margin: 0 0 8px;
    font-size: 17px;
    font-weight: 700;
    color: var(--version-foreground);
  }
}

.card-desc {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--version-muted);
}

.change-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 16px;
}

.change-block {
  padding: 14px;
  background: hsl(var(--primary, 212 100% 50%) / 6%);
  border: 1px solid hsl(var(--primary, 212 100% 50%) / 12%);
  border-radius: 8px;

  &.fix {
    background: hsl(var(--success, 142 71% 45%) / 7%);
    border-color: hsl(var(--success, 142 71% 45%) / 14%);
  }

  h4 {
    display: flex;
    gap: 6px;
    align-items: center;
    margin: 0 0 10px;
    font-size: 14px;
    font-weight: 700;
    color: var(--version-primary);
  }

  &.fix h4 {
    color: var(--version-success);
  }

  ul {
    padding: 0;
    margin: 0;
    list-style: none;
  }

  li {
    position: relative;
    padding-left: 16px;
    margin-top: 8px;
    font-size: 13px;
    line-height: 1.7;
    color: var(--version-foreground);

    &::before {
      position: absolute;
      top: 0;
      left: 0;
      color: var(--version-primary);
      content: '•';
    }
  }

  &.fix li::before {
    color: var(--version-success);
  }
}

.drawer-toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 14px;
  margin-bottom: 16px;
  background: hsl(var(--popover, 0 0% 100%));
  border: 1px solid hsl(var(--border, 214 32% 91%));
  border-radius: 8px;
}

.toolbar-filters {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  gap: 12px;
  min-width: 0;
}

.search-input {
  flex: 1 1 260px;
  min-width: 220px;
}

.type-select {
  width: 140px;
}

.version-table {
  :deep(.ant-table) {
    overflow: hidden;
    background: hsl(var(--popover, 0 0% 100%));
    border: 1px solid hsl(var(--border, 214 32% 91%));
    border-radius: 8px;
  }

  :deep(.ant-table-thead > tr > th) {
    font-weight: 600;
    color: hsl(var(--foreground, 222 47% 11%));
    background: hsl(var(--accent, 210 40% 96%) / 65%);
  }

  :deep(.ant-table-tbody > tr > td) {
    background: hsl(var(--popover, 0 0% 100%));
    border-bottom-color: hsl(var(--border, 214 32% 91%));
  }
}

.action-btn {
  &.edit {
    color: hsl(var(--primary, 212 100% 50%));

    &:hover {
      color: #4096ff;
    }
  }
}

:global(.version-drawer .drawer-toolbar) {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 14px;
  margin-bottom: 16px;
  background: hsl(var(--popover, 0 0% 100%));
  border: 1px solid hsl(var(--border, 214 32% 91%));
  border-radius: 8px;
}

:global(.version-drawer .toolbar-filters) {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  gap: 12px;
  min-width: 0;
}

:global(.version-drawer .search-input) {
  flex: 1 1 260px;
  min-width: 220px;
}

:global(.version-drawer .type-select) {
  width: 140px;
}

:global(.version-drawer .version-table .ant-table) {
  overflow: hidden;
  background: hsl(var(--popover, 0 0% 100%));
  border: 1px solid hsl(var(--border, 214 32% 91%));
  border-radius: 8px;
}

:global(.version-drawer .version-table .ant-table-thead > tr > th) {
  font-weight: 600;
  color: hsl(var(--foreground, 222 47% 11%));
  background: hsl(var(--accent, 210 40% 96%) / 65%);
}

:global(.version-drawer .version-table .ant-table-tbody > tr > td) {
  background: hsl(var(--popover, 0 0% 100%));
  border-bottom-color: hsl(var(--border, 214 32% 91%));
}

:global(.version-drawer .action-btn.edit) {
  color: hsl(var(--primary, 212 100% 50%));
}

@media (max-width: 900px) {
  .summary-grid,
  .change-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .version-log-page {
    padding: 12px;
  }

  .page-hero,
  .latest-content {
    flex-direction: column;
    align-items: stretch;
  }

  .hero-main {
    align-items: flex-start;
  }

  .summary-grid,
  .change-grid {
    grid-template-columns: 1fr;
  }

  .drawer-toolbar,
  .toolbar-filters {
    flex-direction: column;
    align-items: stretch;
  }

  .search-input,
  .type-select {
    width: 100%;
  }
}
</style>
