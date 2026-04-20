import type { SearchRequest } from '#/api/common';

export interface MediaServer {
  id?: string;
  serverName?: string;
  serverType?: string;
  baseUrl?: string;
  apiSecret?: string;
  hookSecret?: string;
  publicHost?: string;
  playDomain?: string;
  rtpIp?: string;
  rtpPortStart?: number;
  rtpPortEnd?: number;
  defaultStreamApp?: string;
  hookEnabled?: boolean;
  enabled?: boolean;
  status?: string;
  lastTestTime?: string;
  lastHookTime?: string;
  lastError?: string;
  remark?: string;
}

export interface MediaGateway {
  id?: string;
  serverId?: string;
  gatewayName?: string;
  gatewayCode?: string;
  sipId?: string;
  sipDomain?: string;
  sipPassword?: string;
  localIp?: string;
  localPort?: number;
  publicIp?: string;
  publicPort?: number;
  transport?: string;
  rtpIp?: string;
  rtpPortStart?: number;
  rtpPortEnd?: number;
  heartbeatIntervalSeconds?: number;
  registerExpiresSeconds?: number;
  catalogSubscribeCycleSeconds?: number;
  threadPoolSize?: number;
  enabled?: boolean;
  active?: boolean;
  runtimeStatus?: string;
  lastStartTime?: string;
  lastStopTime?: string;
  lastError?: string;
  remark?: string;
}

export interface MediaDevice {
  id?: string;
  serverId?: string;
  gatewayId?: string;
  deviceName?: string;
  deviceCode?: string;
  accessType?: string;
  manufacturer?: string;
  model?: string;
  owner?: string;
  civilCode?: string;
  address?: string;
  ip?: string;
  port?: number;
  username?: string;
  password?: string;
  mediaUrl?: string;
  streamMode?: string;
  onlineStatus?: string;
  registerStatus?: string;
  lastRegisterTime?: string;
  lastKeepaliveTime?: string;
  lastCatalogTime?: string;
  remark?: string;
}

export interface MediaChannel {
  id?: string;
  serverId?: string;
  gatewayId?: string;
  deviceId?: string;
  parentChannelId?: string;
  channelName?: string;
  channelCode?: string;
  channelType?: string;
  manufacturer?: string;
  model?: string;
  owner?: string;
  civilCode?: string;
  address?: string;
  ptzType?: string;
  hasRecord?: boolean;
  status?: string;
  playStatus?: string;
  longitude?: string;
  latitude?: string;
  fixedUrl?: string;
  streamApp?: string;
  streamId?: string;
  lastPlayTime?: string;
  lastOfflineTime?: string;
  remark?: string;
}

export interface MediaStreamSession {
  id?: string;
  serverId?: string;
  gatewayId?: string;
  deviceId?: string;
  channelId?: string;
  sessionType?: string;
  streamApp?: string;
  streamId?: string;
  playProtocol?: string;
  playUrl?: string;
  proxyKey?: string;
  ssrc?: string;
  dialogId?: string;
  rtpPort?: number;
  viewerCount?: number;
  startedTime?: string;
  endedTime?: string;
  status?: string;
}

export interface MediaDeviceDetail {
  device: MediaDevice;
  channels: MediaChannel[];
  sessions: MediaStreamSession[];
}

export interface MediaPlayResponse {
  sessionId: string;
  status: string;
  app: string;
  stream: string;
  protocol: string;
  urls: Record<string, string>;
}

export interface PlaybackRecordItem {
  deviceId: string;
  name: string;
  address: string;
  startTime: string;
  endTime: string;
  secrecy: string;
}

export interface MediaScreenSlot {
  id?: string;
  screenId?: string;
  slotIndex?: number;
  slotName?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  channelId?: string;
  sessionType?: string;
  optionsJson?: string;
}

export interface MediaScreen {
  id?: string;
  screenName?: string;
  layoutType?: string;
  layoutJson?: string;
  enabled?: boolean;
  isDefault?: boolean;
  remark?: string;
}

export interface MediaScreenDetail {
  screen: MediaScreen;
  slots: MediaScreenSlot[];
}

export interface MediaCascadePlatform {
  id?: string;
  serverId?: string;
  gatewayId?: string;
  platformName?: string;
  platformCode?: string;
  sipId?: string;
  sipDomain?: string;
  sipPassword?: string;
  host?: string;
  port?: number;
  transport?: string;
  manufacturer?: string;
  enabled?: boolean;
  onlineStatus?: string;
  heartbeatIntervalSeconds?: number;
  registerExpiresSeconds?: number;
  lastRegisterTime?: string;
  lastKeepaliveTime?: string;
  lastError?: string;
  remark?: string;
}

export interface MediaCascadeBinding {
  id?: string;
  platformId?: string;
  channelId?: string;
  gbChannelCode?: string;
  enabled?: boolean;
  liveEnabled?: boolean;
  playbackEnabled?: boolean;
}

export interface CascadeBindingView {
  binding: MediaCascadeBinding;
  channel?: MediaChannel;
}

export interface MediaServerTestResult {
  success: boolean;
  version?: string;
  streamCount: number;
  testedAt?: string;
  message: string;
}

export interface MediaServerTestRequest {
  serverId?: string;
  baseUrl?: string;
  apiSecret?: string;
}

export interface GatewayReloadRequest {
  gatewayId: string;
  autoStart?: boolean;
}

export interface ChannelLiveRequest {
  channelId: string;
  protocol?: string;
}

export interface PlaybackQueryRequest {
  channelId: string;
  startTime: string;
  endTime: string;
}

export interface PlaybackStartRequest extends PlaybackQueryRequest {
  protocol?: string;
}

export interface PtzControlRequest {
  channelId: string;
  command: string;
  speed?: number;
}

export interface ScreenSaveRequest {
  id?: string;
  screenName: string;
  layoutType: string;
  layoutJson?: string;
  enabled?: boolean;
  isDefault?: boolean;
  slots: Array<{
    id?: string;
    slotIndex: number;
    slotName?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    channelId?: string;
    sessionType?: string;
    optionsJson?: string;
  }>;
}

export interface CascadeBindRequest {
  platformId: string;
  bindings: Array<{
    id?: string;
    channelId: string;
    gbChannelCode: string;
    enabled?: boolean;
    liveEnabled?: boolean;
    playbackEnabled?: boolean;
  }>;
}

export type MediaSearchRequest = SearchRequest;
