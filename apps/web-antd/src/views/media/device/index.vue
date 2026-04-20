<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type {
  MediaChannel,
  MediaDevice,
  MediaDeviceDetail,
  MediaGateway,
  MediaPlayResponse,
  MediaServer,
  PlaybackRecordItem,
} from '#/api/media/types';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  DatePicker,
  Drawer,
  Empty,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { uploadSingleFileApi } from '#/api/core/file';
import {
  controlChannelPtz,
  createMediaDevice,
  deleteMediaChannel,
  deleteMediaDevice,
  getMediaDeviceDetail,
  getMediaDeviceList,
  queryChannelPlayback,
  saveMediaChannel,
  startChannelLive,
  startChannelPlayback,
  stopChannelLive,
  stopChannelPlayback,
  updateMediaDevice,
} from '#/api/media/device';
import { getMediaGatewayList } from '#/api/media/gateway';
import { getMediaServerList } from '#/api/media/server';

defineOptions({ name: 'MediaDevicePage' });

const loading = ref(false);
const detailLoading = ref(false);
const savingDevice = ref(false);
const savingChannel = ref(false);
const deviceOpen = ref(false);
const channelOpen = ref(false);
const playbackSelectOpen = ref(false);
const selectingPlayback = ref(false);

const rows = ref<MediaDevice[]>([]);
const currentDetail = ref<MediaDeviceDetail | null>(null);
const currentChannel = ref<MediaChannel | null>(null);
const currentLive = ref<MediaPlayResponse | null>(null);
const currentPlayback = ref<MediaPlayResponse | null>(null);
const serverOptions = ref<MediaServer[]>([]);
const gatewayOptions = ref<MediaGateway[]>([]);
const videoRef = ref<HTMLVideoElement | null>(null);
const pendingPlaybackChannel = ref<MediaChannel | null>(null);
const playbackSegmentRows = ref<Array<PlaybackRecordItem & { key: string }>>(
  [],
);
const selectedPlaybackSegmentKey = ref<string>();
const playbackRange = ref<[Dayjs, Dayjs]>([
  dayjs().subtract(1, 'hour'),
  dayjs(),
]);

const deviceForm = reactive<MediaDevice>({
  accessType: 'GB28181',
  streamMode: 'AUTO',
});

const channelForm = reactive<MediaChannel>({
  channelType: 'VIDEO',
  hasRecord: false,
  streamApp: 'rtp',
});

const deviceColumns = [
  { title: '设备名称', dataIndex: 'deviceName' },
  { title: '设备编码', dataIndex: 'deviceCode' },
  { title: '接入方式', dataIndex: 'accessType' },
  { title: '在线状态', dataIndex: 'onlineStatus' },
  { title: '注册状态', dataIndex: 'registerStatus' },
  { title: '操作', key: 'action', width: 200 },
];

const channelColumns = [
  { title: '通道名称', dataIndex: 'channelName' },
  { title: '通道编码', dataIndex: 'channelCode' },
  { title: '通道状态', dataIndex: 'status' },
  { title: '播放状态', dataIndex: 'playStatus' },
  { title: '固定地址', dataIndex: 'fixedUrl' },
  { title: '操作', key: 'action', width: 320 },
];

const playbackSegmentColumns = [
  { title: '录像名称', dataIndex: 'name' },
  { title: '开始时间', dataIndex: 'startTime' },
  { title: '结束时间', dataIndex: 'endTime' },
  { title: '地址', dataIndex: 'address' },
];

const playerUrls = computed<Record<string, string>>(
  () => currentPlayback.value?.urls ?? currentLive.value?.urls ?? {},
);

const previewUrl = computed(() => {
  const urls = playerUrls.value;
  return urls.hls || urls['http-fmp4'] || urls['http-flv'] || '';
});

const activeDeviceId = computed(() => currentDetail.value?.device.id);

const selectedPlaybackSegment = computed(() =>
  playbackSegmentRows.value.find(
    (item) => item.key === selectedPlaybackSegmentKey.value,
  ),
);

const playbackSegmentRowSelection = computed(() => ({
  type: 'radio' as const,
  selectedRowKeys: selectedPlaybackSegmentKey.value
    ? [selectedPlaybackSegmentKey.value]
    : [],
  onChange: (keys: Array<number | string>) => {
    selectedPlaybackSegmentKey.value = keys[0] ? String(keys[0]) : undefined;
  },
}));

function createSearch() {
  return {
    pageNumber: 1,
    pageSize: 200,
    logic: 'AND' as const,
    orders: [{ column: 'createTime', asc: false }],
    items: [],
  };
}

function resetPlayerState() {
  currentChannel.value = null;
  currentLive.value = null;
  currentPlayback.value = null;
}

function resetDeviceForm() {
  Object.assign(deviceForm, {
    id: undefined,
    serverId: undefined,
    gatewayId: undefined,
    deviceName: '',
    deviceCode: '',
    accessType: 'GB28181',
    manufacturer: '',
    model: '',
    owner: '',
    civilCode: '',
    address: '',
    ip: '',
    port: undefined,
    username: '',
    password: '',
    mediaUrl: '',
    streamMode: 'AUTO',
    remark: '',
  });
}

function resetChannelForm() {
  Object.assign(channelForm, {
    id: undefined,
    serverId: currentDetail.value?.device.serverId,
    gatewayId: currentDetail.value?.device.gatewayId,
    deviceId: currentDetail.value?.device.id,
    channelName: '',
    channelCode: '',
    channelType: 'VIDEO',
    ptzType: '',
    fixedUrl: '',
    streamApp: 'rtp',
    streamId: '',
    hasRecord: false,
    remark: '',
  });
}

function openDeviceModal(row?: MediaDevice) {
  resetDeviceForm();
  if (row) {
    Object.assign(deviceForm, row);
  }
  deviceOpen.value = true;
}

function openChannelModal(row?: MediaChannel) {
  resetChannelForm();
  if (row) {
    Object.assign(channelForm, row);
  }
  channelOpen.value = true;
}

function closePlaybackSelector() {
  playbackSelectOpen.value = false;
  pendingPlaybackChannel.value = null;
  playbackSegmentRows.value = [];
  selectedPlaybackSegmentKey.value = undefined;
}

function buildPlaybackSegmentKey(record: PlaybackRecordItem, index: number) {
  return [
    record.deviceId || 'channel',
    record.startTime,
    record.endTime,
    index,
  ].join('-');
}

async function loadMeta() {
  try {
    const [servers, gateways] = await Promise.all([
      getMediaServerList(createSearch()),
      getMediaGatewayList(createSearch()),
    ]);
    serverOptions.value = servers;
    gatewayOptions.value = gateways;
  } catch (error) {
    console.error(error);
    message.error('加载基础配置失败');
  }
}

async function selectDevice(row: MediaDevice) {
  if (!row.id) return;
  detailLoading.value = true;
  resetPlayerState();
  try {
    currentDetail.value = await getMediaDeviceDetail(row.id);
  } catch (error) {
    console.error(error);
    message.error('加载设备详情失败');
  } finally {
    detailLoading.value = false;
  }
}

async function loadRows() {
  loading.value = true;
  try {
    const list = await getMediaDeviceList(createSearch());
    rows.value = list;

    const currentId = currentDetail.value?.device.id;
    const nextDevice = currentId
      ? (list.find((item) => item.id === currentId) ?? list[0])
      : list[0];

    if (nextDevice?.id) {
      await selectDevice(nextDevice);
    } else {
      currentDetail.value = null;
      resetPlayerState();
    }
  } catch (error) {
    console.error(error);
    message.error('加载视频设备失败');
  } finally {
    loading.value = false;
  }
}

async function submitDevice() {
  savingDevice.value = true;
  try {
    await (deviceForm.id
      ? updateMediaDevice(deviceForm.id, deviceForm)
      : createMediaDevice(deviceForm));
    deviceOpen.value = false;
    message.success('设备保存成功');
    await loadRows();
  } catch (error) {
    console.error(error);
    message.error('设备保存失败');
  } finally {
    savingDevice.value = false;
  }
}

async function submitChannel() {
  savingChannel.value = true;
  try {
    await saveMediaChannel(channelForm);
    channelOpen.value = false;
    message.success('通道保存成功');
    if (currentDetail.value?.device.id) {
      await selectDevice(currentDetail.value.device);
    }
  } catch (error) {
    console.error(error);
    message.error('通道保存失败');
  } finally {
    savingChannel.value = false;
  }
}

async function removeDevice(row: MediaDevice) {
  if (!row.id) return;
  try {
    await deleteMediaDevice(row.id);
    message.success('删除成功');
    if (currentDetail.value?.device.id === row.id) {
      currentDetail.value = null;
      resetPlayerState();
    }
    await loadRows();
  } catch (error) {
    console.error(error);
    message.error('删除设备失败');
  }
}

async function removeChannel(row: MediaChannel) {
  if (!row.id) return;
  try {
    await deleteMediaChannel(row.id);
    if (currentChannel.value?.id === row.id) {
      resetPlayerState();
    }
    message.success('删除成功');
    if (currentDetail.value?.device.id) {
      await selectDevice(currentDetail.value.device);
    }
  } catch (error) {
    console.error(error);
    message.error('删除通道失败');
  }
}

async function playLive(row: MediaChannel) {
  if (!row.id) return;
  try {
    currentChannel.value = row;
    currentLive.value = await startChannelLive({
      channelId: row.id,
      protocol: 'hls',
    });
    currentPlayback.value = null;
    message.success('实时流已创建');
  } catch (error) {
    console.error(error);
    message.error('创建实时流失败');
  }
}

async function playBack(row: MediaChannel) {
  if (!row.id) return;
  try {
    const records = await queryChannelPlayback({
      channelId: row.id,
      startTime: playbackRange.value[0].format('YYYY-MM-DD HH:mm:ss'),
      endTime: playbackRange.value[1].format('YYYY-MM-DD HH:mm:ss'),
    });
    if (records.length === 0) {
      message.warning('当前时间范围内未查询到录像片段');
      return;
    }
    pendingPlaybackChannel.value = row;
    playbackSegmentRows.value = records.map((item, index) => ({
      ...item,
      key: buildPlaybackSegmentKey(item, index),
    }));
    selectedPlaybackSegmentKey.value = playbackSegmentRows.value[0]?.key;
    playbackSelectOpen.value = true;
  } catch (error) {
    console.error(error);
    message.error('查询录像片段失败');
  }
}

async function startSelectedPlayback() {
  const row = pendingPlaybackChannel.value;
  const selected = selectedPlaybackSegment.value;
  if (!row?.id || !selected) {
    message.warning('请先选择回放片段');
    return;
  }
  selectingPlayback.value = true;
  try {
    currentChannel.value = row;
    currentPlayback.value = await startChannelPlayback({
      channelId: row.id,
      startTime: selected.startTime,
      endTime: selected.endTime,
      protocol: 'hls',
    });
    currentLive.value = null;
    closePlaybackSelector();
    message.success('回放流已创建');
  } catch (error) {
    console.error(error);
    message.error('创建回放流失败');
  } finally {
    selectingPlayback.value = false;
  }
}

async function stopCurrentLive() {
  if (!currentLive.value?.sessionId) return;
  try {
    await stopChannelLive(currentLive.value.sessionId);
    currentLive.value = null;
    message.success('实时流已停止');
  } catch (error) {
    console.error(error);
    message.error('停止实时流失败');
  }
}

async function stopCurrentPlayback() {
  if (!currentPlayback.value?.sessionId) return;
  try {
    await stopChannelPlayback(currentPlayback.value.sessionId);
    currentPlayback.value = null;
    message.success('回放已停止');
  } catch (error) {
    console.error(error);
    message.error('停止回放失败');
  }
}

async function sendPtz(command: string) {
  if (!currentChannel.value?.id) {
    message.warning('请先选择正在播放的通道');
    return;
  }
  try {
    const ok = await controlChannelPtz({
      channelId: currentChannel.value.id,
      command,
      speed: 100,
    });
    if (!ok) {
      message.warning('当前通道不支持云台控制');
      return;
    }
    message.success(`已发送 PTZ 指令：${command}`);
  } catch (error) {
    console.error(error);
    message.error('发送 PTZ 指令失败');
  }
}

async function captureSnapshot() {
  const video = videoRef.value;
  if (!video || !currentChannel.value?.id) {
    message.warning('当前没有可截图的视频画面');
    return;
  }
  try {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const context = canvas.getContext('2d');
    if (!context) return;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/png'),
    );
    if (!blob) {
      message.warning('截图生成失败');
      return;
    }

    const file = new File(
      [blob],
      `snapshot-${currentChannel.value.channelCode || currentChannel.value.id}.png`,
      { type: 'image/png' },
    );

    await uploadSingleFileApi({
      file,
      bizType: 'media_snapshot',
      bizId: currentChannel.value.id,
    });
    message.success('截图已上传到文件中心');
  } catch (error) {
    console.error(error);
    message.error('截图上传失败');
  }
}

onMounted(async () => {
  await Promise.all([loadMeta(), loadRows()]);
});
</script>

<template>
  <Page auto-content-height>
    <div class="device-page">
      <div class="device-page__header">
        <div>
          <h3>视频设备</h3>
          <p>
            统一管理 GB28181
            与固定地址设备，并在同一工作台完成直播、回放、云台和截图操作。
          </p>
        </div>
        <Space>
          <Button @click="loadRows">刷新</Button>
          <Button type="primary" @click="openDeviceModal()">新增设备</Button>
        </Space>
      </div>

      <div class="device-page__layout">
        <div class="device-page__panel">
          <div class="device-page__panel-header">
            <span>设备列表</span>
          </div>
          <Table
            :columns="deviceColumns"
            :data-source="rows"
            :loading="loading"
            :pagination="false"
            row-key="id"
            size="small"
            :row-class-name="
              (record: MediaDevice) =>
                record.id && record.id === activeDeviceId
                  ? 'device-page__row--active'
                  : ''
            "
            :custom-row="
              (record: MediaDevice) => ({
                onClick: () => selectDevice(record),
              })
            "
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.dataIndex === 'onlineStatus'">
                <Tag
                  :color="
                    record.onlineStatus === 'ONLINE' ? 'success' : 'default'
                  "
                >
                  {{ record.onlineStatus || 'UNKNOWN' }}
                </Tag>
              </template>
              <template v-else-if="column.dataIndex === 'registerStatus'">
                <Tag
                  :color="
                    record.registerStatus === 'REGISTERED'
                      ? 'processing'
                      : 'default'
                  "
                >
                  {{ record.registerStatus || 'UNREGISTERED' }}
                </Tag>
              </template>
              <template v-else-if="column.key === 'action'">
                <Space>
                  <Button size="small" @click.stop="openDeviceModal(record)">
                    编辑
                  </Button>
                  <Popconfirm title="确认删除?" @confirm="removeDevice(record)">
                    <Button size="small" danger @click.stop>删除</Button>
                  </Popconfirm>
                </Space>
              </template>
            </template>
          </Table>
        </div>

        <div class="device-page__panel device-page__panel--detail">
          <div class="device-page__panel-header">
            <span>{{ currentDetail?.device?.deviceName || '设备详情' }}</span>
            <Button
              type="primary"
              size="small"
              :disabled="!currentDetail?.device?.id"
              @click="openChannelModal()"
            >
              新增通道
            </Button>
          </div>

          <template v-if="currentDetail">
            <div class="device-page__detail">
              <div class="device-page__meta">
                <Tag>{{ currentDetail.device.accessType || '-' }}</Tag>
                <Tag>{{ currentDetail.device.deviceCode || '-' }}</Tag>
                <Tag
                  :color="
                    currentDetail.device.onlineStatus === 'ONLINE'
                      ? 'success'
                      : 'default'
                  "
                >
                  {{ currentDetail.device.onlineStatus || 'UNKNOWN' }}
                </Tag>
                <Tag
                  :color="
                    currentDetail.device.registerStatus === 'REGISTERED'
                      ? 'processing'
                      : 'default'
                  "
                >
                  {{ currentDetail.device.registerStatus || 'UNREGISTERED' }}
                </Tag>
              </div>

              <Table
                :columns="channelColumns"
                :data-source="currentDetail.channels"
                :loading="detailLoading"
                :pagination="false"
                row-key="id"
                size="small"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.dataIndex === 'status'">
                    <Tag
                      :color="
                        record.status === 'ONLINE' ? 'success' : 'default'
                      "
                    >
                      {{ record.status || 'OFFLINE' }}
                    </Tag>
                  </template>
                  <template v-else-if="column.dataIndex === 'playStatus'">
                    <Tag
                      :color="
                        record.playStatus === 'ONLINE'
                          ? 'processing'
                          : 'default'
                      "
                    >
                      {{ record.playStatus || 'IDLE' }}
                    </Tag>
                  </template>
                  <template v-else-if="column.key === 'action'">
                    <Space wrap>
                      <Button size="small" @click="openChannelModal(record)">
                        编辑
                      </Button>
                      <Button size="small" @click="playLive(record)">
                        直播
                      </Button>
                      <Button size="small" @click="playBack(record)">
                        回放
                      </Button>
                      <Popconfirm
                        title="确认删除?"
                        @confirm="removeChannel(record)"
                      >
                        <Button size="small" danger>删除</Button>
                      </Popconfirm>
                    </Space>
                  </template>
                </template>
              </Table>

              <div class="device-page__player">
                <div class="device-page__player-toolbar">
                  <div>
                    <strong>当前通道：</strong>
                    {{ currentChannel?.channelName || '-' }}
                  </div>
                  <Space wrap>
                    <DatePicker.RangePicker
                      v-model:value="playbackRange"
                      format="YYYY-MM-DD HH:mm:ss"
                      show-time
                    />
                    <Button :disabled="!currentLive" @click="stopCurrentLive">
                      停止直播
                    </Button>
                    <Button
                      :disabled="!currentPlayback"
                      @click="stopCurrentPlayback"
                    >
                      停止回放
                    </Button>
                    <Button
                      type="primary"
                      :disabled="!previewUrl"
                      @click="captureSnapshot"
                    >
                      截图
                    </Button>
                  </Space>
                </div>

                <div class="device-page__video-wrap">
                  <video
                    v-if="previewUrl"
                    ref="videoRef"
                    :src="previewUrl"
                    autoplay
                    class="device-page__video"
                    controls
                  ></video>
                  <Empty
                    v-else
                    description="发起直播或回放后，会在这里显示播放画面。"
                  />
                </div>

                <div class="device-page__actions">
                  <Button @click="sendPtz('UP')">上</Button>
                  <Button @click="sendPtz('LEFT')">左</Button>
                  <Button @click="sendPtz('RIGHT')">右</Button>
                  <Button @click="sendPtz('DOWN')">下</Button>
                  <Button @click="sendPtz('ZOOM_IN')">放大</Button>
                  <Button @click="sendPtz('ZOOM_OUT')">缩小</Button>
                </div>

                <div
                  v-if="Object.keys(playerUrls).length > 0"
                  class="device-page__urls"
                >
                  <div v-for="(value, key) in playerUrls" :key="key">
                    <strong>{{ key }}：</strong>
                    <a :href="value" rel="noreferrer" target="_blank">{{
                      value
                    }}</a>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <Empty v-else description="请选择左侧设备查看详情" />
        </div>
      </div>

      <Modal
        v-model:open="playbackSelectOpen"
        :confirm-loading="selectingPlayback"
        title="回放片段选择"
        width="920px"
        @cancel="closePlaybackSelector"
        @ok="startSelectedPlayback"
      >
        <Table
          :columns="playbackSegmentColumns"
          :data-source="playbackSegmentRows"
          :pagination="{ pageSize: 8 }"
          :row-selection="playbackSegmentRowSelection"
          row-key="key"
          size="small"
        />
      </Modal>

      <Drawer
        v-model:open="deviceOpen"
        :loading="savingDevice"
        :mask-closable="false"
        :title="deviceForm.id ? '编辑视频设备' : '新增视频设备'"
        width="560px"
      >
        <Form class="drawer-form-label" layout="horizontal">
          <div class="device-page__grid">
            <Form.Item label="所属流媒体">
              <Select
                v-model:value="deviceForm.serverId"
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
                v-model:value="deviceForm.gatewayId"
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

          <div class="device-page__grid">
            <Form.Item label="设备名称">
              <Input v-model:value="deviceForm.deviceName" />
            </Form.Item>
            <Form.Item label="设备编码">
              <Input v-model:value="deviceForm.deviceCode" />
            </Form.Item>
          </div>

          <div class="device-page__grid">
            <Form.Item label="接入方式">
              <Select
                v-model:value="deviceForm.accessType"
                :options="[
                  { label: 'GB28181', value: 'GB28181' },
                  { label: '固定地址', value: 'FIXED_ADDRESS' },
                ]"
              />
            </Form.Item>
            <Form.Item label="流模式">
              <Input v-model:value="deviceForm.streamMode" />
            </Form.Item>
          </div>

          <div class="device-page__grid">
            <Form.Item label="IP">
              <Input v-model:value="deviceForm.ip" />
            </Form.Item>
            <Form.Item label="端口">
              <InputNumber
                v-model:value="deviceForm.port"
                class="w-full"
                :min="0"
              />
            </Form.Item>
          </div>

          <div class="device-page__grid">
            <Form.Item label="用户名">
              <Input v-model:value="deviceForm.username" />
            </Form.Item>
            <Form.Item label="密码">
              <Input.Password v-model:value="deviceForm.password" />
            </Form.Item>
          </div>

          <Form.Item label="固定地址 / 媒体 URL">
            <Input v-model:value="deviceForm.mediaUrl" />
          </Form.Item>

          <Form.Item label="备注">
            <Input.TextArea v-model:value="deviceForm.remark" :rows="3" />
          </Form.Item>
        </Form>

        <template #footer>
          <Space>
            <Button @click="deviceOpen = false">取消</Button>
            <Button
              type="primary"
              :loading="savingDevice"
              @click="submitDevice"
            >
              保存
            </Button>
          </Space>
        </template>
      </Drawer>

      <Drawer
        v-model:open="channelOpen"
        :loading="savingChannel"
        :mask-closable="false"
        :title="channelForm.id ? '编辑视频通道' : '新增视频通道'"
        width="560px"
      >
        <Form class="drawer-form-label" layout="horizontal">
          <div class="device-page__grid">
            <Form.Item label="通道名称">
              <Input v-model:value="channelForm.channelName" />
            </Form.Item>
            <Form.Item label="通道编码">
              <Input v-model:value="channelForm.channelCode" />
            </Form.Item>
          </div>

          <div class="device-page__grid">
            <Form.Item label="通道类型">
              <Select
                v-model:value="channelForm.channelType"
                :options="[
                  { label: '视频', value: 'VIDEO' },
                  { label: '音频', value: 'AUDIO' },
                  { label: '告警', value: 'ALARM' },
                ]"
              />
            </Form.Item>
            <Form.Item label="云台类型">
              <Input v-model:value="channelForm.ptzType" />
            </Form.Item>
          </div>

          <Form.Item label="固定地址">
            <Input v-model:value="channelForm.fixedUrl" />
          </Form.Item>

          <div class="device-page__grid">
            <Form.Item label="Stream App">
              <Input v-model:value="channelForm.streamApp" />
            </Form.Item>
            <Form.Item label="Stream ID">
              <Input v-model:value="channelForm.streamId" />
            </Form.Item>
          </div>

          <Form.Item label="支持录像">
            <Switch v-model:checked="channelForm.hasRecord" />
          </Form.Item>

          <Form.Item label="备注">
            <Input.TextArea v-model:value="channelForm.remark" :rows="3" />
          </Form.Item>
        </Form>

        <template #footer>
          <Space>
            <Button @click="channelOpen = false">取消</Button>
            <Button
              type="primary"
              :loading="savingChannel"
              @click="submitChannel"
            >
              保存
            </Button>
          </Space>
        </template>
      </Drawer>
    </div>
  </Page>
</template>

<style scoped>
.device-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.device-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.device-page__header h3 {
  margin: 0;
  font-size: 20px;
}

.device-page__header p {
  margin: 8px 0 0;
  color: rgb(0 0 0 / 45%);
}

.device-page__layout {
  display: grid;
  grid-template-columns: 38% 1fr;
  gap: 16px;
}

.device-page__panel {
  padding: 16px;
  background: #fff;
  border-radius: 16px;
}

.device-page__panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  font-weight: 600;
}

.device-page__detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.device-page__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.device-page__player {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: #fafafa;
  border-radius: 12px;
}

.device-page__player-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.device-page__video-wrap {
  display: grid;
  place-items: center;
  min-height: 320px;
  overflow: hidden;
  background: #000;
  border-radius: 12px;
}

.device-page__video {
  width: 100%;
  max-height: 480px;
}

.device-page__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.device-page__urls {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  word-break: break-all;
}

.device-page__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.device-page :deep(.device-page__row--active > td) {
  background: rgb(22 119 255 / 8%) !important;
}

.drawer-form-label :deep(.ant-form-item-label) {
  flex-shrink: 0;
  width: 108px;
}

.drawer-form-label :deep(.ant-form-item-label > label) {
  width: 108px;
}

.drawer-form-label :deep(.ant-input-number) {
  width: 100%;
}

@media (width <= 1280px) {
  .device-page__layout {
    grid-template-columns: 1fr;
  }
}
</style>
