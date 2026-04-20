<script lang="ts" setup>
import type { MediaGateway, MediaServer } from '#/api/media/types';

import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Drawer,
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
  createMediaGateway,
  deleteMediaGateway,
  getMediaGatewayList,
  reloadMediaGateway,
  startMediaGateway,
  stopMediaGateway,
  updateMediaGateway,
} from '#/api/media/gateway';
import { getMediaServerList } from '#/api/media/server';

defineOptions({ name: 'MediaGatewayPage' });

const loading = ref(false);
const saving = ref(false);
const open = ref(false);
const rows = ref<MediaGateway[]>([]);
const serverOptions = ref<MediaServer[]>([]);

const formModel = reactive<MediaGateway>({
  enabled: true,
  active: false,
  transport: 'UDP',
  localPort: 5060,
  publicPort: 5060,
  heartbeatIntervalSeconds: 60,
  registerExpiresSeconds: 3600,
  catalogSubscribeCycleSeconds: 300,
  threadPoolSize: 2,
});

const columns = [
  { title: '名称', dataIndex: 'gatewayName' },
  { title: '编码', dataIndex: 'gatewayCode' },
  { title: 'SIP ID', dataIndex: 'sipId' },
  { title: '域', dataIndex: 'sipDomain' },
  { title: '传输', dataIndex: 'transport' },
  { title: '运行状态', dataIndex: 'runtimeStatus' },
  { title: '启用', dataIndex: 'enabled' },
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

async function loadRows() {
  loading.value = true;
  try {
    rows.value = await getMediaGatewayList(createSearch());
  } catch (error) {
    console.error(error);
    message.error('加载视频网关失败');
  } finally {
    loading.value = false;
  }
}

async function loadServers() {
  serverOptions.value = await getMediaServerList(createSearch());
}

function resetForm() {
  Object.assign(formModel, {
    id: undefined,
    serverId: undefined,
    gatewayName: '',
    gatewayCode: '',
    sipId: '',
    sipDomain: '',
    sipPassword: '',
    localIp: '',
    localPort: 5060,
    publicIp: '',
    publicPort: 5060,
    transport: 'UDP',
    rtpIp: '',
    rtpPortStart: 0,
    rtpPortEnd: 0,
    heartbeatIntervalSeconds: 60,
    registerExpiresSeconds: 3600,
    catalogSubscribeCycleSeconds: 300,
    threadPoolSize: 2,
    enabled: true,
    active: false,
    remark: '',
  });
}

function editRow(row?: MediaGateway) {
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
      ? updateMediaGateway(formModel.id, formModel)
      : createMediaGateway(formModel));
    open.value = false;
    message.success('保存成功');
    await loadRows();
  } catch (error) {
    console.error(error);
    message.error('保存失败');
  } finally {
    saving.value = false;
  }
}

async function removeRow(row: MediaGateway) {
  if (!row.id) return;
  try {
    await deleteMediaGateway(row.id);
    message.success('删除成功');
    await loadRows();
  } catch (error) {
    console.error(error);
    message.error('删除失败');
  }
}

async function reloadRow(row: MediaGateway) {
  if (!row.id) return;
  await reloadMediaGateway({ gatewayId: row.id, autoStart: true });
  message.success('重载完成');
  await loadRows();
}

async function startRow(row: MediaGateway) {
  if (!row.id) return;
  await startMediaGateway(row.id);
  message.success('已启动');
  await loadRows();
}

async function stopRow(row: MediaGateway) {
  if (!row.id) return;
  await stopMediaGateway(row.id);
  message.success('已停止');
  await loadRows();
}

onMounted(async () => {
  await Promise.all([loadRows(), loadServers()]);
});
</script>

<template>
  <Page auto-content-height>
    <div class="media-page">
      <div class="media-page__header">
        <div>
          <h3>视频网关</h3>
          <p>管理 GB28181 网关基础参数、运行状态和生命周期操作。</p>
        </div>
        <Space>
          <Button @click="loadRows">刷新</Button>
          <Button type="primary" @click="editRow()">新增网关</Button>
        </Space>
      </div>

      <Table
        :columns="columns"
        :data-source="rows"
        :loading="loading"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'runtimeStatus'">
            <Tag
              :color="
                record.runtimeStatus === 'RUNNING' ? 'success' : 'default'
              "
            >
              {{ record.runtimeStatus || 'STOPPED' }}
            </Tag>
          </template>
          <template v-else-if="column.dataIndex === 'enabled'">
            <Tag :color="record.enabled ? 'blue' : 'default'">
              {{ record.enabled ? '启用' : '禁用' }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button size="small" @click="editRow(record)">编辑</Button>
              <Button size="small" @click="reloadRow(record)">重载</Button>
              <Button size="small" @click="startRow(record)">启动</Button>
              <Button size="small" @click="stopRow(record)">停止</Button>
              <Popconfirm title="确认删除?" @confirm="removeRow(record)">
                <Button size="small" danger>删除</Button>
              </Popconfirm>
            </Space>
          </template>
        </template>
      </Table>

      <Drawer
        v-model:open="open"
        :title="formModel.id ? '编辑视频网关' : '新增视频网关'"
        :loading="saving"
        width="560px"
        @confirm="submitForm"
      >
        <Form layout="horizontal" label-class="drawer-form-label">
          <Form.Item label="所属流媒体服务">
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
          <div class="media-page__inline">
            <Form.Item label="网关名称">
              <Input v-model:value="formModel.gatewayName" />
            </Form.Item>
            <Form.Item label="网关编码">
              <Input v-model:value="formModel.gatewayCode" />
            </Form.Item>
          </div>
          <div class="media-page__inline">
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
          <div class="media-page__inline">
            <Form.Item label="本地 IP">
              <Input v-model:value="formModel.localIp" />
            </Form.Item>
            <Form.Item label="本地端口">
              <Input v-model:value="formModel.localPort" />
            </Form.Item>
          </div>
          <div class="media-page__inline">
            <Form.Item label="公网 IP">
              <Input v-model:value="formModel.publicIp" />
            </Form.Item>
            <Form.Item label="公网端口">
              <Input v-model:value="formModel.publicPort" />
            </Form.Item>
          </div>
          <div class="media-page__inline">
            <Form.Item label="RTP IP">
              <Input v-model:value="formModel.rtpIp" />
            </Form.Item>
            <Form.Item label="传输协议">
              <Select
                v-model:value="formModel.transport"
                :options="[
                  { label: 'UDP', value: 'UDP' },
                  { label: 'TCP', value: 'TCP' },
                ]"
              />
            </Form.Item>
          </div>
          <div class="media-page__inline">
            <Form.Item label="RTP 起始端口">
              <Input v-model:value="formModel.rtpPortStart" />
            </Form.Item>
            <Form.Item label="RTP 结束端口">
              <Input v-model:value="formModel.rtpPortEnd" />
            </Form.Item>
          </div>
          <div class="media-page__inline">
            <Form.Item label="心跳间隔(秒)">
              <Input v-model:value="formModel.heartbeatIntervalSeconds" />
            </Form.Item>
            <Form.Item label="注册有效期(秒)">
              <Input v-model:value="formModel.registerExpiresSeconds" />
            </Form.Item>
          </div>
          <div class="media-page__inline">
            <Form.Item label="目录订阅周期(秒)">
              <Input v-model:value="formModel.catalogSubscribeCycleSeconds" />
            </Form.Item>
            <Form.Item label="线程池大小">
              <Input v-model:value="formModel.threadPoolSize" />
            </Form.Item>
          </div>
          <div class="media-page__inline">
            <Form.Item label="启用">
              <Switch v-model:checked="formModel.enabled" />
            </Form.Item>
            <Form.Item label="活动网关">
              <Switch v-model:checked="formModel.active" />
            </Form.Item>
          </div>
          <Form.Item label="备注">
            <Input.TextArea v-model:value="formModel.remark" :rows="3" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  </Page>
</template>

<style scoped>
.media-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.media-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.media-page__header h3 {
  margin: 0;
  font-size: 20px;
}

.media-page__header p {
  margin: 8px 0 0;
  color: rgb(0 0 0 / 45%);
}

.media-page__inline {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.drawer-form-label :deep(.ant-form-item-label) {
  flex-shrink: 0;
  width: 96px;
}

.drawer-form-label :deep(.ant-form-item-label > label) {
  width: 96px;
}
</style>
