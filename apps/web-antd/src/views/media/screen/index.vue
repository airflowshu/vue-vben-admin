<script lang="ts" setup>
import type {
  MediaChannel,
  MediaScreen,
  MediaScreenDetail,
} from '#/api/media/types';

import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Drawer,
  Empty,
  Form,
  Input,
  message,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
} from 'ant-design-vue';

import { getMediaChannelList } from '#/api/media/device';
import {
  deleteMediaScreen,
  getMediaScreenDetail,
  getMediaScreenList,
  saveMediaScreenLayout,
} from '#/api/media/screen';

defineOptions({ name: 'MediaScreenPage' });

const loading = ref(false);
const saving = ref(false);
const open = ref(false);
const rows = ref<MediaScreen[]>([]);
const channels = ref<MediaChannel[]>([]);
const currentDetail = ref<MediaScreenDetail | null>(null);

const formModel = reactive<MediaScreenDetail>({
  screen: {
    screenName: '',
    layoutType: 'FOUR',
    enabled: true,
    isDefault: false,
  },
  slots: [],
});

const columns = [
  { title: '方案名称', dataIndex: 'screenName' },
  { title: '布局', dataIndex: 'layoutType' },
  { title: '默认', dataIndex: 'isDefault' },
  { title: '启用', dataIndex: 'enabled' },
  { title: '操作', key: 'action', width: 180 },
];

function createSearch() {
  return {
    pageNumber: 1,
    pageSize: 200,
    logic: 'AND' as const,
    orders: [{ column: 'createTime', asc: false }],
    items: [],
  };
}

function buildSlotsByLayout(layoutType: string) {
  const size = layoutType === 'ONE' ? 1 : layoutType === 'FOUR' ? 4 : 9;
  return Array.from({ length: size }).map((_, index) => ({
    slotIndex: index,
    slotName: `窗口 ${index + 1}`,
    x: 0,
    y: 0,
    width: 1,
    height: 1,
    sessionType: 'LIVE',
    channelId: undefined,
    optionsJson: '',
  }));
}

async function loadData() {
  loading.value = true;
  try {
    const [screenRows, channelRows] = await Promise.all([
      getMediaScreenList(createSearch()),
      getMediaChannelList(createSearch()),
    ]);
    rows.value = screenRows;
    channels.value = channelRows;
    if (screenRows[0]?.id) {
      await selectScreen(screenRows[0]);
    }
  } catch (error) {
    console.error(error);
    message.error('加载分屏方案失败');
  } finally {
    loading.value = false;
  }
}

async function selectScreen(row: MediaScreen) {
  if (!row.id) return;
  currentDetail.value = await getMediaScreenDetail(row.id);
}

function openForm(row?: MediaScreenDetail) {
  if (row) {
    formModel.screen = { ...row.screen };
    formModel.slots = row.slots.map((item) => ({ ...item }));
  } else {
    formModel.screen = {
      screenName: '',
      layoutType: 'FOUR',
      enabled: true,
      isDefault: false,
    };
    formModel.slots = buildSlotsByLayout('FOUR');
  }
  open.value = true;
}

function onLayoutChange(layoutType: string) {
  formModel.screen.layoutType = layoutType;
  formModel.slots = buildSlotsByLayout(layoutType);
}

async function submitForm() {
  saving.value = true;
  try {
    await saveMediaScreenLayout({
      id: formModel.screen.id,
      screenName: formModel.screen.screenName || '',
      layoutType: formModel.screen.layoutType || 'FOUR',
      layoutJson: formModel.screen.layoutJson,
      enabled: formModel.screen.enabled,
      isDefault: formModel.screen.isDefault,
      slots: formModel.slots.map((slot) => ({
        id: slot.id,
        slotIndex: slot.slotIndex || 0,
        slotName: slot.slotName,
        x: slot.x,
        y: slot.y,
        width: slot.width,
        height: slot.height,
        channelId: slot.channelId,
        sessionType: slot.sessionType,
        optionsJson: slot.optionsJson,
      })),
    });
    open.value = false;
    message.success('分屏方案已保存');
    await loadData();
  } catch (error) {
    console.error(error);
    message.error('保存失败');
  } finally {
    saving.value = false;
  }
}

async function removeScreen(row: MediaScreen) {
  if (!row.id) return;
  await deleteMediaScreen(row.id);
  message.success('删除成功');
  if (currentDetail.value?.screen.id === row.id) {
    currentDetail.value = null;
  }
  await loadData();
}

onMounted(() => {
  loadData();
});
</script>

<template>
  <Page auto-content-height>
    <div class="screen-page">
      <div class="screen-page__header">
        <div>
          <h3>分屏展示</h3>
          <p>保存单屏、四分屏、九分屏或自定义布局，并为每个窗口绑定通道。</p>
        </div>
        <Space>
          <Button @click="loadData">刷新</Button>
          <Button type="primary" @click="openForm()">新增方案</Button>
        </Space>
      </div>

      <div class="screen-page__layout">
        <div class="screen-page__panel">
          <Table
            :columns="columns"
            :data-source="rows"
            :loading="loading"
            row-key="id"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.dataIndex === 'isDefault'">
                {{ record.isDefault ? '是' : '否' }}
              </template>
              <template v-else-if="column.dataIndex === 'enabled'">
                {{ record.enabled ? '启用' : '禁用' }}
              </template>
              <template v-else-if="column.key === 'action'">
                <Space>
                  <Button size="small" @click="selectScreen(record)">
                    查看
                  </Button>
                  <Button
                    size="small"
                    @click="
                      openForm(
                        currentDetail && currentDetail.screen.id === record.id
                          ? currentDetail
                          : { screen: record, slots: [] },
                      )
                    "
                  >
                    编辑
                  </Button>
                  <Popconfirm title="确认删除?" @confirm="removeScreen(record)">
                    <Button size="small" danger>删除</Button>
                  </Popconfirm>
                </Space>
              </template>
            </template>
          </Table>
        </div>

        <div class="screen-page__panel">
          <template v-if="currentDetail">
            <div class="screen-page__preview">
              <div
                v-for="slot in currentDetail.slots"
                :key="slot.id || slot.slotIndex"
                class="screen-page__slot"
              >
                <div class="screen-page__slot-index">
                  窗口 {{ (slot.slotIndex || 0) + 1 }}
                </div>
                <div>
                  {{
                    channels.find((item) => item.id === slot.channelId)
                      ?.channelName || '未绑定通道'
                  }}
                </div>
              </div>
            </div>
          </template>
          <Empty v-else description="请选择分屏方案查看预览" />
        </div>
      </div>

      <Drawer
        v-model:open="open"
        :title="formModel.screen.id ? '编辑分屏方案' : '新增分屏方案'"
        :loading="saving"
        width="640px"
        @confirm="submitForm"
      >
        <Form layout="horizontal" label-class="drawer-form-label">
          <div class="screen-page__grid">
            <Form.Item label="方案名称">
              <Input v-model:value="formModel.screen.screenName" />
            </Form.Item>
            <Form.Item label="布局类型">
              <Select
                v-model:value="formModel.screen.layoutType"
                :options="[
                  { label: '单屏', value: 'ONE' },
                  { label: '四分屏', value: 'FOUR' },
                  { label: '九分屏', value: 'NINE' },
                ]"
                @change="(value) => onLayoutChange(String(value || 'FOUR'))"
              />
            </Form.Item>
          </div>
          <div class="screen-page__grid">
            <Form.Item label="启用">
              <Switch v-model:checked="formModel.screen.enabled" />
            </Form.Item>
            <Form.Item label="默认方案">
              <Switch v-model:checked="formModel.screen.isDefault" />
            </Form.Item>
          </div>
          <Form.Item label="布局 JSON">
            <Input.TextArea
              v-model:value="formModel.screen.layoutJson"
              :rows="3"
            />
          </Form.Item>
          <div class="screen-page__slots">
            <div
              v-for="slot in formModel.slots"
              :key="slot.slotIndex"
              class="screen-page__slot-form"
            >
              <strong>窗口 {{ (slot.slotIndex || 0) + 1 }}</strong>
              <Select
                v-model:value="slot.channelId"
                :options="
                  channels.map((item) => ({
                    label: `${item.channelName} (${item.channelCode})`,
                    value: item.id,
                  }))
                "
                allow-clear
                show-search
              />
            </div>
          </div>
        </Form>
      </Drawer>
    </div>
  </Page>
</template>

<style scoped>
.screen-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.screen-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.screen-page__header h3 {
  margin: 0;
  font-size: 20px;
}

.screen-page__header p {
  margin: 8px 0 0;
  color: rgb(0 0 0 / 45%);
}

.screen-page__layout {
  display: grid;
  grid-template-columns: 42% 1fr;
  gap: 16px;
}

.screen-page__panel {
  min-height: 420px;
  padding: 16px;
  background: #fff;
  border-radius: 16px;
}

.screen-page__preview {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.screen-page__slot {
  min-height: 120px;
  padding: 16px;
  color: #fff;
  background: linear-gradient(135deg, #0f172a, #1e293b);
  border-radius: 12px;
}

.screen-page__slot-index {
  margin-bottom: 8px;
  font-size: 12px;
  opacity: 0.75;
}

.screen-page__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.screen-page__slots {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.screen-page__slot-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: #fafafa;
  border-radius: 12px;
}

@media (width <= 1280px) {
  .screen-page__layout {
    grid-template-columns: 1fr;
  }
}

.drawer-form-label :deep(.ant-form-item-label) {
  flex-shrink: 0;
  width: 96px;
}

.drawer-form-label :deep(.ant-form-item-label > label) {
  width: 96px;
}
</style>
