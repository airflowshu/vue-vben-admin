import type { SearchRequest } from '@flexboot4/web-kit';

export interface MediaServer {
  apiSecret?: string;
  baseUrl?: string;
  defaultStreamApp?: string;
  enabled?: boolean;
  hookEnabled?: boolean;
  hookSecret?: string;
  id?: string;
  lastError?: string;
  lastHookTime?: string;
  lastTestTime?: string;
  playDomain?: string;
  publicHost?: string;
  remark?: string;
  rtpIp?: string;
  rtpPortEnd?: number;
  rtpPortStart?: number;
  serverName?: string;
  serverType?: string;
  status?: string;
}

export interface MediaGateway {
  active?: boolean;
  catalogSubscribeCycleSeconds?: number;
  enabled?: boolean;
  gatewayCode?: string;
  gatewayName?: string;
  heartbeatIntervalSeconds?: number;
  id?: string;
  lastError?: string;
  lastStartTime?: string;
  lastStopTime?: string;
  localIp?: string;
  localPort?: number;
  publicIp?: string;
  publicPort?: number;
  registerExpiresSeconds?: number;
  remark?: string;
  rtpIp?: string;
  rtpPortEnd?: number;
  rtpPortStart?: number;
  runtimeStatus?: string;
  serverId?: string;
  sipDomain?: string;
  sipId?: string;
  sipPassword?: string;
  threadPoolSize?: number;
  transport?: string;
}

export interface MediaDevice {
  accessType?: string;
  address?: string;
  civilCode?: string;
  deviceCode?: string;
  deviceName?: string;
  gatewayId?: string;
  id?: string;
  ip?: string;
  lastCatalogTime?: string;
  lastKeepaliveTime?: string;
  lastRegisterTime?: string;
  manufacturer?: string;
  mediaUrl?: string;
  model?: string;
  onlineStatus?: string;
  owner?: string;
  password?: string;
  port?: number;
  registerStatus?: string;
  remark?: string;
  serverId?: string;
  streamMode?: string;
  username?: string;
}

export interface MediaChannel {
  address?: string;
  channelCode?: string;
  channelName?: string;
  channelType?: string;
  civilCode?: string;
  deviceId?: string;
  fixedUrl?: string;
  gatewayId?: string;
  hasRecord?: boolean;
  id?: string;
  lastOfflineTime?: string;
  lastPlayTime?: string;
  latitude?: string;
  longitude?: string;
  manufacturer?: string;
  model?: string;
  owner?: string;
  parentChannelId?: string;
  playStatus?: string;
  ptzType?: string;
  remark?: string;
  serverId?: string;
  status?: string;
  streamApp?: string;
  streamId?: string;
}

export interface MediaStreamSession {
  channelId?: string;
  deviceId?: string;
  dialogId?: string;
  endedTime?: string;
  gatewayId?: string;
  id?: string;
  playProtocol?: string;
  playUrl?: string;
  proxyKey?: string;
  rtpPort?: number;
  serverId?: string;
  sessionType?: string;
  ssrc?: string;
  startedTime?: string;
  status?: string;
  streamApp?: string;
  streamId?: string;
  viewerCount?: number;
}

export interface MediaDeviceDetail {
  channels: MediaChannel[];
  device: MediaDevice;
  sessions: MediaStreamSession[];
}

export interface MediaPlayResponse {
  app: string;
  protocol: string;
  sessionId: string;
  status: string;
  stream: string;
  urls: Record<string, string>;
}

export interface PlaybackRecordItem {
  address: string;
  deviceId: string;
  endTime: string;
  name: string;
  secrecy: string;
  startTime: string;
}

export interface MediaScreenSlot {
  channelId?: string;
  height?: number;
  id?: string;
  optionsJson?: string;
  screenId?: string;
  sessionType?: string;
  slotIndex?: number;
  slotName?: string;
  width?: number;
  x?: number;
  y?: number;
}

export interface MediaScreen {
  enabled?: boolean;
  id?: string;
  isDefault?: boolean;
  layoutJson?: string;
  layoutType?: string;
  remark?: string;
  screenName?: string;
}

export interface MediaScreenDetail {
  screen: MediaScreen;
  slots: MediaScreenSlot[];
}

export interface MediaCascadePlatform {
  enabled?: boolean;
  gatewayId?: string;
  heartbeatIntervalSeconds?: number;
  host?: string;
  id?: string;
  lastError?: string;
  lastKeepaliveTime?: string;
  lastRegisterTime?: string;
  manufacturer?: string;
  onlineStatus?: string;
  platformCode?: string;
  platformName?: string;
  port?: number;
  registerExpiresSeconds?: number;
  remark?: string;
  serverId?: string;
  sipDomain?: string;
  sipId?: string;
  sipPassword?: string;
  transport?: string;
}

export interface MediaCascadeBinding {
  channelId?: string;
  enabled?: boolean;
  gbChannelCode?: string;
  id?: string;
  liveEnabled?: boolean;
  platformId?: string;
  playbackEnabled?: boolean;
}

export interface CascadeBindingView {
  binding: MediaCascadeBinding;
  channel?: MediaChannel;
}

export interface MediaServerTestResult {
  message: string;
  streamCount: number;
  success: boolean;
  testedAt?: string;
  version?: string;
}

export interface MediaServerHookInfo {
  adminParams: string;
  callbackBaseUrl: string;
  onRtpServerTimeout: string;
  onServerKeepalive: string;
  onStreamChanged: string;
  onStreamNoneReader: string;
  serverId: string;
  urls: Record<string, string>;
}

export interface MediaServerTestRequest {
  apiSecret?: string;
  baseUrl?: string;
  serverId?: string;
}

export interface GatewayReloadRequest {
  autoStart?: boolean;
  gatewayId: string;
}

export interface ChannelLiveRequest {
  channelId: string;
  protocol?: string;
}

export interface PlaybackQueryRequest {
  channelId: string;
  endTime: string;
  startTime: string;
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
  enabled?: boolean;
  id?: string;
  isDefault?: boolean;
  layoutJson?: string;
  layoutType: string;
  screenName: string;
  slots: Array<{
    channelId?: string;
    height?: number;
    id?: string;
    optionsJson?: string;
    sessionType?: string;
    slotIndex: number;
    slotName?: string;
    width?: number;
    x?: number;
    y?: number;
  }>;
}

export interface CascadeBindRequest {
  bindings: Array<{
    channelId: string;
    enabled?: boolean;
    gbChannelCode: string;
    id?: string;
    liveEnabled?: boolean;
    playbackEnabled?: boolean;
  }>;
  platformId: string;
}

export type MediaSearchRequest = SearchRequest;
