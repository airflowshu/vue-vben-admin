<script lang="ts" setup>
import type { MediaServer } from '#/api/media/types';

import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Drawer,
  Form,
  Input,
  message,
  Popconfirm,
  Space,
  Switch,
  Table,
  Tag,
} from 'ant-design-vue';

import {
  createMediaServer,
  deleteMediaServer,
  getMediaServerList,
  getMediaServerStreams,
  testMediaServer,
  updateMediaServer,
} from '#/api/media/server';

defineOptions({ name: 'MediaServerPage' });

const loading = ref(false);
const saving = ref(false);
const open = ref(false);
const streamOpen = ref(false);
const rows = ref<MediaServer[]>([]);
const streamRows = ref<Array<Record<string, any>>>([]);
const formModel = reactive<MediaServer>({
  enabled: true,
  hookEnabled: true,
  serverType: 'ZLMEDIAKIT',
});

const columns = [
  { title: '名称', dataIndex: 'serverName' },
  { title: '地址', dataIndex: 'baseUrl' },
  { title: '播放域名', dataIndex: 'playDomain' },
  { title: '状态', dataIndex: 'status' },
  { title: '默认 App', dataIndex: 'defaultStreamApp' },
  { title: '最近测试', dataIndex: 'lastTestTime' },
  { title: '操作', key: 'action', width: 260 },
];

const streamColumns = [
  { title: 'Schema', dataIndex: 'schema' },
  { title: 'App', dataIndex: 'app' },
  { title: 'Stream', dataIndex: 'stream' },
  { title: 'Reader', dataIndex: 'readerCount' },
  { title: 'Alive', dataIndex: 'aliveSecond' },
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
    rows.value = await getMediaServerList(createSearch());
  } catch (error) {
    console.error(error);
    message.error('加载流媒体服务失败');
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  Object.assign(formModel, {
    id: undefined,
    serverName: '',
    serverType: 'ZLMEDIAKIT',
    baseUrl: '',
    apiSecret: '',
    hookSecret: '',
    publicHost: '',
    playDomain: '',
    rtpIp: '',
    rtpPortStart: 0,
    rtpPortEnd: 0,
    defaultStreamApp: 'rtp',
    enabled: true,
    hookEnabled: true,
    remark: '',
  });
}

function editRow(row?: MediaServer) {
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
      ? updateMediaServer(formModel.id, formModel)
      : createMediaServer(formModel));
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

async function removeRow(row: MediaServer) {
  if (!row.id) return;
  try {
    await deleteMediaServer(row.id);
    message.success('删除成功');
    await loadRows();
  } catch (error) {
    console.error(error);
    message.error('删除失败');
  }
}

async function testRow(row: MediaServer) {
  try {
    const result = await testMediaServer({ serverId: row.id });
    message[result.success ? 'success' : 'warning'](
      `${result.message}${result.version ? ` | version: ${result.version}` : ''}`,
    );
    await loadRows();
  } catch (error) {
    console.error(error);
    message.error('测试失败');
  }
}

async function viewStreams(row: MediaServer) {
  if (!row.id) return;
  try {
    streamRows.value = await getMediaServerStreams(row.id);
    streamOpen.value = true;
  } catch (error) {
    console.error(error);
    message.error('读取流列表失败');
  }
}

onMounted(() => {
  loadRows();
});
</script>

<template>
  <Page auto-content-height>
    <div class="media-page">
      <div class="media-page__header">
        <div>
          <h3>流媒体服务</h3>
          <p>管理 ZLMediaKit 服务配置、连通性测试和当前流状态。</p>
        </div>
        <Space>
          <Button @click="loadRows">刷新</Button>
          <Button type="primary" @click="editRow()">新增流媒体服务</Button>
        </Space>
      </div>

      <Table
        :columns="columns"
        :data-source="rows"
        :loading="loading"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'status'">
            <Tag :color="record.status === 'HEALTHY' ? 'success' : 'default'">
              {{ record.status || 'UNKNOWN' }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button size="small" @click="editRow(record)">编辑</Button>
              <Button size="small" @click="testRow(record)">测试</Button>
              <Button size="small" @click="viewStreams(record)">流列表</Button>
              <Popconfirm title="确认删除?" @confirm="removeRow(record)">
                <Button size="small" danger>删除</Button>
              </Popconfirm>
            </Space>
          </template>
        </template>
      </Table>

      <Drawer
        v-model:open="open"
        :title="formModel.id ? '编辑流媒体服务' : '新增流媒体服务'"
        :loading="saving"
        width="560px"
        @confirm="submitForm"
      >
        <Form layout="horizontal" label-class="drawer-form-label">
          <Form.Item label="服务名称">
            <Input v-model:value="formModel.serverName" />
          </Form.Item>
          <Form.Item label="Base URL">
            <Input v-model:value="formModel.baseUrl" />
          </Form.Item>
          <Form.Item label="API Secret">
            <Input v-model:value="formModel.apiSecret" />
          </Form.Item>
          <Form.Item label="Hook Secret">
            <Input v-model:value="formModel.hookSecret" />
          </Form.Item>
          <Form.Item label="播放域名">
            <Input v-model:value="formModel.playDomain" />
          </Form.Item>
          <Form.Item label="公网主机">
            <Input v-model:value="formModel.publicHost" />
          </Form.Item>
          <Form.Item label="默认 Stream App">
            <Input v-model:value="formModel.defaultStreamApp" />
          </Form.Item>
          <Form.Item label="RTP IP">
            <Input v-model:value="formModel.rtpIp" />
          </Form.Item>
          <div class="media-page__inline">
            <Form.Item label="RTP 起始端口">
              <Input v-model:value="formModel.rtpPortStart" />
            </Form.Item>
            <Form.Item label="RTP 结束端口">
              <Input v-model:value="formModel.rtpPortEnd" />
            </Form.Item>
          </div>
          <div class="media-page__inline">
            <Form.Item label="启用">
              <Switch v-model:checked="formModel.enabled" />
            </Form.Item>
            <Form.Item label="启用 Hook">
              <Switch v-model:checked="formModel.hookEnabled" />
            </Form.Item>
          </div>
          <Form.Item label="备注">
            <Input.TextArea v-model:value="formModel.remark" :rows="3" />
          </Form.Item>
        </Form>
      </Drawer>

      <Modal
        v-model:open="streamOpen"
        title="当前流列表"
        width="960px"
        footer=""
      >
        <Table
          :columns="streamColumns"
          :data-source="streamRows"
          row-key="stream"
        />
      </Modal>
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
