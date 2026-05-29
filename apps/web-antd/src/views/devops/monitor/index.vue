<script setup lang="ts">
import type { EchartsUIType } from '@vben/plugins/echarts';

import { onMounted, onUnmounted, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import {
  Alert,
  Card,
  Col,
  Descriptions,
  DescriptionsItem,
  Progress,
  Row,
  Tag,
} from 'ant-design-vue';

import { requestClient } from '#/api/request';

// --- 接口返回数据类型 ---
interface CpuStats {
  usage: number;
  cores: number;
  cgroupVersion?: null | string;
  physicalCores: number;
  quotaCores?: null | number;
  source?: string;
  frequency: string;
  userUsage: string;
}

interface MemStats {
  usage: number;
  cgroupVersion?: null | string;
  limit?: null | string;
  source?: string;
  total: string;
  used: string;
  available: string;
}

interface JvmStats {
  usage: number;
  heapUsed: string;
  heapTotal: string;
  nonHeapUsed: string;
  nonHeapTotal: string;
  source?: string;
  version: string;
  vendor: string;
}

interface DiskStats {
  path: string;
  fsType: string;
  usage: number;
  total: string;
  used: string;
  scope?: 'container-visible' | 'host-visible';
  source?: string;
}

interface ThreadStats {
  active: number;
  peak: number;
  states: {
    blocked: number;
    running: number;
    timedWaiting: number;
    waiting: number;
  };
  source?: string;
}

interface RuntimeInfo {
  cgroupVersion?: null | string;
  containerId?: null | string;
  containerized: boolean;
  hostname: string;
  metricSources: {
    cpu?: string;
    disk?: string;
    jvm?: string;
    memory?: string;
    thread?: string;
  };
  note: string;
  runtimeType:
    | 'containerd'
    | 'docker'
    | 'host'
    | 'kubernetes'
    | 'podman'
    | 'unknown';
  scope: 'CONTAINER' | 'HOST_PROCESS';
}

interface MonitorStatsResponse {
  cpu: CpuStats;
  memory: MemStats;
  jvm: JvmStats;
  disks: DiskStats[];
  runtime: RuntimeInfo;
  threads: ThreadStats;
}

// --- 状态数据 ---
const cpuInfo = ref<CpuStats>({
  usage: 0,
  cores: 0,
  physicalCores: 0,
  source: 'oshi',
  frequency: '-',
  userUsage: '-',
});

const memInfo = ref<MemStats>({
  usage: 0,
  source: 'oshi',
  total: '-',
  used: '-',
  available: '-',
});

const jvmInfo = ref<JvmStats>({
  usage: 0,
  heapUsed: '-',
  heapTotal: '-',
  nonHeapUsed: '-',
  nonHeapTotal: '-',
  source: 'jvm',
  version: '-',
  vendor: '-',
});

function defaultRuntimeInfo(): RuntimeInfo {
  return {
    cgroupVersion: '-',
    containerId: null,
    containerized: false,
    hostname: '-',
    metricSources: {},
    note: '正在读取运行环境信息...',
    runtimeType: 'unknown',
    scope: 'HOST_PROCESS',
  };
}

const runtimeInfo = ref<RuntimeInfo>(defaultRuntimeInfo());

const legacyRuntimeInfo = (): RuntimeInfo => ({
  cgroupVersion: '-',
  containerId: null,
  containerized: false,
  hostname: '-',
  metricSources: {
    cpu: cpuInfo.value.source,
    disk: 'oshi',
    jvm: jvmInfo.value.source,
    memory: memInfo.value.source,
    thread: threadInfo.value.source,
  },
  note: '当前后端暂未返回运行环境元信息，页面按主机进程视角展示已有监控数据。',
  runtimeType: 'unknown',
  scope: 'HOST_PROCESS',
});

const diskInfo = ref<DiskStats[]>([]);
const threadInfo = ref<ThreadStats>({
  active: 0,
  peak: 0,
  states: {
    running: 0,
    waiting: 0,
    blocked: 0,
    timedWaiting: 0,
  },
  source: 'jvm',
});

// --- 加载状态 ---
const loading = ref(true);

// --- Chart Refs ---
const cpuChartRef = ref<EchartsUIType>();
const memChartRef = ref<EchartsUIType>();
const jvmChartRef = ref<EchartsUIType>();

const { renderEcharts: renderCpu } = useEcharts(cpuChartRef);
const { renderEcharts: renderMem } = useEcharts(memChartRef);
const { renderEcharts: renderJvm } = useEcharts(jvmChartRef);
type ChartOption = Parameters<typeof renderCpu>[0];

function getProgressColor(value: number): string {
  if (value >= 80) return '#ef4444';
  if (value >= 60) return '#f97316';
  return '#22c55e';
}

// --- 获取监控数据 ---
async function fetchMonitorStats() {
  try {
    const data = await requestClient.get<MonitorStatsResponse>(
      '/admin/monitor/stats',
    );

    // 更新数据，保留旧后端返回结构下的来源兜底
    const runtime = data.runtime;
    cpuInfo.value = {
      ...data.cpu,
      source: data.cpu.source ?? runtime?.metricSources.cpu ?? 'oshi',
    };
    memInfo.value = {
      ...data.memory,
      source: data.memory.source ?? runtime?.metricSources.memory ?? 'oshi',
    };
    jvmInfo.value = {
      ...data.jvm,
      source: data.jvm.source ?? runtime?.metricSources.jvm ?? 'jvm',
    };
    diskInfo.value = (data.disks ?? []).map((disk) => ({
      ...disk,
      scope:
        disk.scope ??
        (runtime?.containerized ? 'container-visible' : 'host-visible'),
      source: disk.source ?? runtime?.metricSources.disk ?? 'oshi',
    }));
    threadInfo.value = {
      ...data.threads,
      source: data.threads.source ?? runtime?.metricSources.thread ?? 'jvm',
    };
    runtimeInfo.value = runtime ?? legacyRuntimeInfo();

    // 更新图表，首次加载显示动画，后续刷新不显示动画
    const animation = isFirstLoad;
    await renderCpu(getGaugeOption('CPU', data.cpu.usage, animation));
    await renderMem(getGaugeOption('内存', data.memory.usage, animation));
    await renderJvm(getGaugeOption('JVM', data.jvm.usage, animation));

    // 首次加载后标记为false，后续刷新不再动画
    if (isFirstLoad) {
      isFirstLoad = false;
    }
  } catch (error) {
    console.error('获取监控数据失败:', error);
  } finally {
    loading.value = false;
  }
}

// --- 轮询定时器 ---
let pollTimer: null | ReturnType<typeof setInterval> = null;
let isFirstLoad = true; // 首次加载标志

// --- 颜色配置 ---
function getStatusColor(value: number): string {
  if (value >= 80) return '#ef4444'; // 红色 - 危险
  if (value >= 60) return '#f97316'; // 橙色 - 警告
  return '#22c55e'; // 绿色 - 正常
}

function formatSource(value?: null | string): string {
  if (!value) return '-';
  if (value === 'cgroup') return 'cgroup';
  if (value === 'oshi') return 'OSHI';
  if (value === 'mount-namespace') return 'mount namespace';
  if (value === 'jvm') return 'JVM';
  return value;
}

function getRuntimeLabel(runtimeType: RuntimeInfo['runtimeType']): string {
  const labels: Record<RuntimeInfo['runtimeType'], string> = {
    containerd: 'containerd',
    docker: 'Docker',
    host: 'Host',
    kubernetes: 'Kubernetes',
    podman: 'Podman',
    unknown: 'Unknown',
  };
  return labels[runtimeType];
}

function getScopeLabel(scope: RuntimeInfo['scope']): string {
  return scope === 'CONTAINER' ? '容器视角' : '主机进程视角';
}

function shortContainerId(value?: null | string): string {
  if (!value) return '-';
  return value.length > 16
    ? `${value.slice(0, 12)}...${value.slice(-4)}`
    : value;
}

function threadPercent(value: number): number {
  if (!threadInfo.value.active) return 0;
  return Math.round((value / threadInfo.value.active) * 1000) / 10;
}

// --- ECharts 配置 ---
function getGaugeOption(
  title: string,
  value: number,
  animation = true,
): ChartOption {
  const color = getStatusColor(value);
  return {
    tooltip: {
      formatter: '{a} <br/>{b} : {c}%',
    },
    animation,
    animationDuration: animation ? 1000 : 0,
    series: [
      {
        name: title,
        type: 'gauge',
        detail: {
          formatter: '{value}%',
          fontSize: 20,
          offsetCenter: [0, '70%'],
          valueAnimation: animation,
          color,
        },
        title: {
          offsetCenter: [0, '100%'],
          fontSize: 14,
          color: '#999',
        },
        data: [
          {
            value,
            name: title,
          },
        ],
        progress: {
          show: true,
          width: 12,
          itemStyle: {
            color,
          },
        },
        axisLine: {
          lineStyle: {
            width: 12,
            color: [
              [0.6, '#22c55e'],
              [0.8, '#f97316'],
              [1, '#ef4444'],
            ],
          },
        },
        axisTick: {
          show: false,
        },
        splitLine: {
          length: 5,
          lineStyle: {
            width: 1,
            color: '#999',
          },
        },
        axisLabel: {
          show: false,
          distance: 25,
          color: '#999',
          fontSize: 12,
        },
        pointer: {
          show: true,
          length: '60%',
          width: 4,
          itemStyle: {
            color,
          },
        },
        anchor: {
          show: true,
          size: 8,
          itemStyle: {
            color,
            borderWidth: 2,
            borderColor: '#fff',
          },
        },
      },
    ],
  } as ChartOption;
}

// --- 生命周期 ---
onMounted(() => {
  // 首次加载数据
  fetchMonitorStats();

  // 每5秒轮询刷新
  pollTimer = setInterval(fetchMonitorStats, 5000);
});

// 组件卸载时清除定时器
onUnmounted(() => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
});
</script>

<template>
  <Page>
    <div class="p-4">
      <Row :gutter="[16, 16]">
        <Col :span="24">
          <Alert
            :message="
              runtimeInfo.containerized
                ? '当前为容器视角监控'
                : '当前为主机进程视角监控'
            "
            :description="runtimeInfo.note"
            :type="runtimeInfo.containerized ? 'warning' : 'info'"
            show-icon
          />
        </Col>

        <!-- 运行环境 -->
        <Col :span="24">
          <Card title="运行环境" :bordered="false">
            <Descriptions
              v-if="!loading"
              :column="{ lg: 4, md: 2, sm: 1, xs: 1 }"
              size="small"
            >
              <DescriptionsItem label="运行模式">
                <Tag :color="runtimeInfo.containerized ? 'orange' : 'blue'">
                  {{ getRuntimeLabel(runtimeInfo.runtimeType) }}
                </Tag>
              </DescriptionsItem>
              <DescriptionsItem label="监控口径">
                <Tag
                  :color="runtimeInfo.scope === 'CONTAINER' ? 'gold' : 'cyan'"
                >
                  {{ getScopeLabel(runtimeInfo.scope) }}
                </Tag>
              </DescriptionsItem>
              <DescriptionsItem label="主机名">
                {{ runtimeInfo.hostname || '-' }}
              </DescriptionsItem>
              <DescriptionsItem label="容器 ID">
                <span class="font-mono text-xs">
                  {{ shortContainerId(runtimeInfo.containerId) }}
                </span>
              </DescriptionsItem>
              <DescriptionsItem label="cgroup">
                {{ runtimeInfo.cgroupVersion || '-' }}
              </DescriptionsItem>
              <DescriptionsItem label="CPU来源">
                <Tag color="purple">
                  {{ formatSource(runtimeInfo.metricSources.cpu) }}
                </Tag>
              </DescriptionsItem>
              <DescriptionsItem label="内存来源">
                <Tag color="purple">
                  {{ formatSource(runtimeInfo.metricSources.memory) }}
                </Tag>
              </DescriptionsItem>
              <DescriptionsItem label="磁盘来源">
                <Tag color="purple">
                  {{ formatSource(runtimeInfo.metricSources.disk) }}
                </Tag>
              </DescriptionsItem>
            </Descriptions>
            <div
              v-else
              class="flex h-16 items-center justify-center text-gray-400"
            >
              加载中...
            </div>
          </Card>
        </Col>

        <!-- CPU 监控 -->
        <Col :span="24" :lg="8">
          <Card :bordered="false" class="h-full">
            <template #title>
              <div class="flex items-center gap-2">
                <span>CPU监控</span>
                <Tag color="purple">{{ formatSource(cpuInfo.source) }}</Tag>
              </div>
            </template>
            <div class="flex flex-col items-center">
              <EchartsUI ref="cpuChartRef" height="220px" />
              <Descriptions
                v-if="!loading"
                :column="1"
                class="mt-2 w-full"
                size="small"
              >
                <DescriptionsItem label="核心数">
                  <Tag color="blue">{{ cpuInfo.cores }}个</Tag>
                </DescriptionsItem>
                <DescriptionsItem v-if="cpuInfo.quotaCores" label="容器配额">
                  <Tag color="gold">{{ cpuInfo.quotaCores }}核</Tag>
                </DescriptionsItem>
                <DescriptionsItem label="物理核心">
                  <Tag color="green">{{ cpuInfo.physicalCores }}个</Tag>
                </DescriptionsItem>
                <DescriptionsItem v-if="cpuInfo.cgroupVersion" label="cgroup">
                  {{ cpuInfo.cgroupVersion }}
                </DescriptionsItem>
                <DescriptionsItem label="频率">
                  {{ cpuInfo.frequency }}
                </DescriptionsItem>
                <DescriptionsItem label="用户占用">
                  {{ cpuInfo.userUsage }}
                </DescriptionsItem>
              </Descriptions>
            </div>
          </Card>
        </Col>

        <!-- 内存监控 -->
        <Col :span="24" :lg="8">
          <Card :bordered="false" class="h-full">
            <template #title>
              <div class="flex items-center gap-2">
                <span>内存监控</span>
                <Tag color="purple">{{ formatSource(memInfo.source) }}</Tag>
              </div>
            </template>
            <div class="flex flex-col items-center">
              <EchartsUI ref="memChartRef" height="220px" />
              <Descriptions
                v-if="!loading"
                :column="1"
                class="mt-2 w-full"
                size="small"
              >
                <DescriptionsItem label="总内存">
                  <Tag color="blue">{{ memInfo.total }}</Tag>
                </DescriptionsItem>
                <DescriptionsItem v-if="memInfo.limit" label="限制">
                  <Tag
                    :color="memInfo.limit === 'limited' ? 'gold' : 'default'"
                  >
                    {{ memInfo.limit === 'limited' ? '容器限制' : '不限' }}
                  </Tag>
                </DescriptionsItem>
                <DescriptionsItem label="已使用">
                  {{ memInfo.used }}
                </DescriptionsItem>
                <DescriptionsItem label="可用">
                  {{ memInfo.available }}
                </DescriptionsItem>
              </Descriptions>
            </div>
          </Card>
        </Col>

        <!-- JVM 监控 -->
        <Col :span="24" :lg="8">
          <Card title="JVM监控" :bordered="false" class="h-full">
            <div class="flex flex-col items-center">
              <EchartsUI ref="jvmChartRef" height="220px" />
              <Descriptions
                v-if="!loading"
                :column="1"
                class="mt-2 w-full"
                size="small"
              >
                <DescriptionsItem label="堆内存">
                  <Tag color="orange">
                    {{ jvmInfo.heapUsed }} / {{ jvmInfo.heapTotal }}
                  </Tag>
                </DescriptionsItem>
                <DescriptionsItem label="非堆内存">
                  {{ jvmInfo.nonHeapUsed }} / {{ jvmInfo.nonHeapTotal }}
                </DescriptionsItem>
                <DescriptionsItem label="Java版本">
                  {{ jvmInfo.version }}
                </DescriptionsItem>
                <DescriptionsItem label="厂商">
                  {{ jvmInfo.vendor }}
                </DescriptionsItem>
              </Descriptions>
            </div>
          </Card>
        </Col>

        <!-- 磁盘监控 -->
        <Col :span="24" :lg="12">
          <Card
            :title="runtimeInfo.containerized ? '容器可见挂载' : '磁盘监控'"
            :bordered="false"
            class="h-full"
          >
            <div
              v-if="loading"
              class="flex h-40 items-center justify-center text-gray-400"
            >
              加载中...
            </div>
            <div v-else class="flex flex-col gap-6">
              <div v-for="disk in diskInfo" :key="disk.path">
                <div class="mb-1 flex justify-between">
                  <div class="flex items-center gap-2">
                    <span
                      class="font-bold"
                      :class="[getStatusColor(disk.usage)]"
                      >●</span
                    >
                    <span class="font-medium">{{ disk.path }}</span>
                    <Tag color="blue">{{ disk.fsType }}</Tag>
                    <Tag color="purple">{{ formatSource(disk.source) }}</Tag>
                  </div>
                  <span :class="getStatusColor(disk.usage)"
                    >{{ disk.usage }}%</span
                  >
                </div>
                <Progress
                  :percent="disk.usage"
                  :show-info="false"
                  :stroke-color="getProgressColor(disk.usage)"
                />
                <div class="mt-1 flex justify-between text-xs text-gray-500">
                  <span>总空间: {{ disk.total }}</span>
                  <span>已使用: {{ disk.used }}</span>
                </div>
                <div
                  v-if="disk.scope === 'container-visible'"
                  class="mt-1 text-xs text-gray-500"
                >
                  该挂载点来自容器可见文件系统，不代表宿主机全量磁盘。
                </div>
              </div>
            </div>
          </Card>
        </Col>

        <!-- 线程监控 -->
        <Col :span="24" :lg="12">
          <Card title="线程监控" :bordered="false" class="h-full">
            <div
              v-if="loading"
              class="flex h-40 items-center justify-center text-gray-400"
            >
              加载中...
            </div>
            <div v-else class="flex flex-col">
              <div class="mb-8 flex justify-around text-center">
                <div>
                  <div class="mb-1 text-3xl font-bold text-blue-500">
                    {{ threadInfo.active }}
                  </div>
                  <div class="text-gray-500">活动线程</div>
                </div>
                <div>
                  <div class="mb-1 text-3xl font-bold text-green-500">
                    {{ threadInfo.peak }}
                  </div>
                  <div class="text-gray-500">峰值线程</div>
                </div>
              </div>

              <div class="px-4">
                <div class="mb-2 font-medium">线程状态分布</div>
                <div class="flex flex-col gap-3">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-green-500">●</span>
                      <span>运行线程</span>
                    </div>
                    <Progress
                      :percent="threadPercent(threadInfo.states.running)"
                      :show-info="false"
                      class="w-32"
                      stroke-color="#22c55e"
                      size="small"
                    />
                    <span class="w-8 text-right">{{
                      threadInfo.states.running
                    }}</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-orange-500">●</span>
                      <span>等待线程</span>
                    </div>
                    <Progress
                      :percent="threadPercent(threadInfo.states.waiting)"
                      :show-info="false"
                      class="w-32"
                      stroke-color="#f97316"
                      size="small"
                    />
                    <span class="w-8 text-right">{{
                      threadInfo.states.waiting
                    }}</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-red-500">●</span>
                      <span>阻塞线程</span>
                    </div>
                    <Progress
                      :percent="threadPercent(threadInfo.states.blocked)"
                      :show-info="false"
                      class="w-32"
                      stroke-color="#ef4444"
                      size="small"
                    />
                    <span class="w-8 text-right">{{
                      threadInfo.states.blocked
                    }}</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-blue-500">●</span>
                      <span>定时等待</span>
                    </div>
                    <Progress
                      :percent="threadPercent(threadInfo.states.timedWaiting)"
                      :show-info="false"
                      class="w-32"
                      stroke-color="#3b82f6"
                      size="small"
                    />
                    <span class="w-8 text-right">{{
                      threadInfo.states.timedWaiting
                    }}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  </Page>
</template>

<style scoped lang="scss">
:deep(.ant-card-head-title) {
  font-weight: 600;
}
</style>
