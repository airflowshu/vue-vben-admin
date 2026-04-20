<script lang="ts" setup>
import type {
  CascadeBindingView,
  MediaCascadePlatform,
  MediaChannel,
  MediaGateway,
  MediaServer,
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
  Tag,
} from 'ant-design-vue';

import {
  createMediaCascadePlatform,
  deleteMediaCascadePlatform,
  getCascadeBindings,
  getMediaCascadePlatformList,
  registerCascadePlatform,
  saveCascadeBindings,
  stopCascadePlatform,
  updateMediaCascadePlatform,
} from '#/api/media/cascade';
import { getMediaChannelList } from '#/api/media/device';
import { getMediaGatewayList } from '#/api/media/gateway';
import { getMediaServerList } from '#/api/media/server';

defineOptions({ name: 'MediaCascadePage' });

const loading = ref(false);
const saving = ref(false);
const bindSaving = ref(false);
const open = ref(false);
const bindOpen = ref(false);
const rows = ref<MediaCascadePlatform[]>([]);
const bindings = ref<CascadeBindingView[]>([]);
const channels = ref<MediaChannel[]>([]);
const serverOptions = ref<MediaServer[]>([]);
const gatewayOptions = ref<MediaGateway[]>([]);
const currentPlatformId = ref<string>();

const formModel = reactive<MediaCascadePlatform>({
  enabled: true,
  transport: 'UDP',
  port: 5060,
  heartbeatIntervalSeconds: 60,
  registerExpiresSeconds: 3600,
});

const columns = [
  { title: '平台名称', dataIndex: 'platformName' },
  { title: '平台编码', dataIndex: 'platformCode' },
  { title: 'SIP ID', dataIndex: 'sipId' },
  { title: '主机', dataIndex: 'host' },
  { title: '状态', dataIndex: 'onlineStatus' },
  { title: '操作', key: 'action', width: 320 },
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

async function loadMeta() {
  const [serverRows, gatewayRows, channelRows] = await Promise.all([
    getMediaServerList(createSearch()),
    getMediaGatewayList(createSearch()),
    getMediaChannelList(createSearch()),
  ]);
  serverOptions.value = serverRows;
  gatewayOptions.value = gatewayRows;
  channels.value = channelRows;
}

async function loadRows() {
  loading.value = true;
  try {
    rows.value = await getMediaCascadePlatformList(createSearch());
    if (rows.value[0]?.id) {
      await openBindings(rows.value[0]!);
    }
  } catch (error) {
    console.error(error);
    message.error('加载级联平台失败');
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  Object.assign(formModel, {
    id: undefined,
    serverId: undefined,
    gatewayId: undefined,
    platformName: '',
    platformCode: '',
    sipId: '',
    sipDomain: '',
    sipPassword: '',
    host: '',
    port: 5060,
    transport: 'UDP',
    manufacturer: '',
    enabled: true,
    heartbeatIntervalSeconds: 60,
    registerExpiresSeconds: 3600,
    remark: '',
  });
}

function editRow(row?: MediaCascadePlatform) {
  resetForm();
  if (row) {
    Object.assign(formModel, row);
  }
  open.value = true;
}

async function submitForm() {
  saving.value = true;
  try {
    await (formModel.id
      ? updateMediaCascadePlatform(formModel.id, formModel)
      : createMediaCascadePlatform(formModel));
    open.value = false;
    message.success('级联平台已保存');
    await loadRows();
  } catch (error) {
    console.error(error);
    message.error('保存失败');
  } finally {
    saving.value = false;
  }
}

async function removeRow(row: MediaCascadePlatform) {
  if (!row.id) return;
  await deleteMediaCascadePlatform(row.id);
  message.success('删除成功');
  await loadRows();
}

async function doRegister(row: MediaCascadePlatform) {
  if (!row.id) return;
  await registerCascadePlatform(row.id);
  message.success('已触发级联注册');
  await loadRows();
}

async function doStop(row: MediaCascadePlatform) {
  if (!row.id) return;
  await stopCascadePlatform(row.id);
  message.success('已停止级联平台');
  await loadRows();
}

async function openBindings(row: MediaCascadePlatform) {
  if (!row.id) return;
  currentPlatformId.value = row.id;
  bindings.value = await getCascadeBindings(row.id);
  bindOpen.value = true;
}

function bindingFor(channelId?: string) {
  return bindings.value.find((item) => item.binding.channelId === channelId);
}

async function saveBindings() {
  if (!currentPlatformId.value) return;
  bindSaving.value = true;
  try {
    await saveCascadeBindings({
      platformId: currentPlatformId.value,
      bindings: channels.value
        .map((channel) => ({
          id: bindingFor(channel.id)?.binding.id,
          channelId: channel.id || '',
          gbChannelCode:
            bindingFor(channel.id)?.binding.gbChannelCode ||
            channel.channelCode ||
            '',
          enabled: bindingFor(channel.id)?.binding.enabled || false,
          liveEnabled: bindingFor(channel.id)?.binding.liveEnabled || false,
          playbackEnabled:
            bindingFor(channel.id)?.binding.playbackEnabled || false,
        }))
        .filter((item) => item.enabled),
    });
    message.success('绑定已保存');
    bindOpen.value = false;
  } catch (error) {
    console.error(error);
    message.error('保存绑定失败');
  } finally {
    bindSaving.value = false;
  }
}

onMounted(async () => {
  await Promise.all([loadMeta(), loadRows()]);
});
</script>

<template>
  <Page auto-content-height>
    <div class="cascade-page">
      <div class="cascade-page__header">
        <div>
          <h3>国标级联</h3>
          <p>维护上级平台配置、通道映射以及级联注册入口。</p>
        </div>
        <Space>
          <Button @click="loadRows">刷新</Button>
          <Button type="primary" @click="editRow()">新增平台</Button>
        </Space>
      </div>

      <Table
        :columns="columns"
        :data-source="rows"
        :loading="loading"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'onlineStatus'">
            <Tag
              :color="record.onlineStatus === 'ONLINE' ? 'success' : 'default'"
            >
              {{ record.onlineStatus || 'OFFLINE' }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button size="small" @click="editRow(record)">编辑</Button>
              <Button size="small" @click="openBindings(record)">绑定</Button>
              <Button size="small" @click="doRegister(record)">注册</Button>
              <Button size="small" @click="doStop(record)">停止</Button>
              <Popconfirm title="确认删除?" @confirm="removeRow(record)">
                <Button size="small" danger>删除</Button>
              </Popconfirm>
            </Space>
          </template>
        </template>
      </Table>

      <Drawer
        v-model:open="open"
        :title="formModel.id ? '编辑级联平台' : '新增级联平台'"
        :loading="saving"
        width="560px"
        @confirm="submitForm"
      >
        <Form layout="horizontal" label-class="drawer-form-label">
          <div class="cascade-page__grid">
            <Form.Item label="所属流媒体">
              <Select
                v-model:value="formModel.serverId"
                :options="
                  serverOptions.map((item) => ({
                    label: item.serverName,
                    value: item.id,
                  }))
                "
                allow-clear
              />
            </Form.Item>
            <Form.Item label="所属网关">
              <Select
                v-model:value="formModel.gatewayId"
                :options="
                  gatewayOptions.map((item) => ({
                    label: item.gatewayName,
                    value: item.id,
                  }))
                "
                allow-clear
              />
            </Form.Item>
          </div>
          <div class="cascade-page__grid">
            <Form.Item label="平台名称">
              <Input v-model:value="formModel.platformName" />
            </Form.Item>
            <Form.Item label="平台编码">
              <Input v-model:value="formModel.platformCode" />
            </Form.Item>
          </div>
          <div class="cascade-page__grid">
            <Form.Item label="SIP ID">
              <Input v-model:value="formModel.sipId" />
            </Form.Item>
            <Form.Item label="SIP 域">
              <Input v-model:value="formModel.sipDomain" />
            </Form.Item>
          </div>
          <Form.Item label="SIP 密码">
            <Input v-model:value="formModel.sipPassword" />
          </Form.Item>
          <div class="cascade-page__grid">
            <Form.Item label="主机">
              <Input v-model:value="formModel.host" />
            </Form.Item>
            <Form.Item label="端口">
              <Input v-model:value="formModel.port" />
            </Form.Item>
          </div>
          <div class="cascade-page__grid">
            <Form.Item label="传输协议">
              <Select
                v-model:value="formModel.transport"
                :options="[
                  { label: 'UDP', value: 'UDP' },
                  { label: 'TCP', value: 'TCP' },
                ]"
              />
            </Form.Item>
            <Form.Item label="厂商">
              <Input v-model:value="formModel.manufacturer" />
            </Form.Item>
          </div>
          <div class="cascade-page__grid">
            <Form.Item label="心跳间隔">
              <Input v-model:value="formModel.heartbeatIntervalSeconds" />
            </Form.Item>
            <Form.Item label="注册有效期">
              <Input v-model:value="formModel.registerExpiresSeconds" />
            </Form.Item>
          </div>
          <Form.Item label="启用">
            <Switch v-model:checked="formModel.enabled" />
          </Form.Item>
          <Form.Item label="备注">
            <Input.TextArea v-model:value="formModel.remark" :rows="3" />
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer
        v-model:open="bindOpen"
        title="级联绑定"
        :loading="bindSaving"
        width="560px"
        @confirm="saveBindings"
      >
        <template v-if="channels.length > 0">
          <div class="cascade-page__bindings">
            <div
              v-for="channel in channels"
              :key="channel.id"
              class="cascade-page__binding-item"
            >
              <div class="cascade-page__binding-meta">
                <strong>{{ channel.channelName }}</strong>
                <span>{{ channel.channelCode }}</span>
              </div>
              <Switch
                :checked="bindingFor(channel.id)?.binding.enabled || false"
                @update:checked="
                  (checked) => {
                    const value = checked === true;
                    const binding = bindingFor(channel.id);
                    if (binding) {
                      binding.binding.enabled = value;
                      binding.binding.liveEnabled = value;
                      binding.binding.playbackEnabled = value;
                    } else if (value) {
                      bindings.push({
                        binding: {
                          channelId: channel.id,
                          gbChannelCode: channel.channelCode,
                          enabled: true,
                          liveEnabled: true,
                          playbackEnabled: true,
                        },
                        channel,
                      });
                    }
                  }
                "
              />
              <Input
                :value="
                  bindingFor(channel.id)?.binding.gbChannelCode ||
                  channel.channelCode
                "
                @update:value="
                  (value) => {
                    const binding = bindingFor(channel.id);
                    if (binding) {
                      binding.binding.gbChannelCode = value;
                    }
                  }
                "
              />
            </div>
          </div>
        </template>
        <Empty v-else description="暂无可绑定通道" />
      </Drawer>
    </div>
  </Page>
</template>

<style scoped>
.cascade-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cascade-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.cascade-page__header h3 {
  margin: 0;
  font-size: 20px;
}

.cascade-page__header p {
  margin: 8px 0 0;
  color: rgb(0 0 0 / 45%);
}

.cascade-page__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.cascade-page__bindings {
  display: grid;
  gap: 12px;
}

.cascade-page__binding-item {
  display: grid;
  grid-template-columns: 1fr auto 280px;
  gap: 12px;
  align-items: center;
  padding: 12px;
  background: #fafafa;
  border-radius: 12px;
}

.cascade-page__binding-meta {
  display: flex;
  flex-direction: column;
}

.drawer-form-label :deep(.ant-form-item-label) {
  flex-shrink: 0;
  width: 96px;
}

.drawer-form-label :deep(.ant-form-item-label > label) {
  width: 96px;
}
</style>
