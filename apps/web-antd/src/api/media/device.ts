import type { MediaSearchRequest } from './types';
import type {
  ChannelLiveRequest,
  MediaChannel,
  MediaDevice,
  MediaDeviceDetail,
  MediaPlayResponse,
  PlaybackQueryRequest,
  PlaybackRecordItem,
  PlaybackStartRequest,
  PtzControlRequest,
} from './types';

import { requestClient } from '#/api/request';

export function getMediaDeviceList(params: MediaSearchRequest) {
  return requestClient.post<MediaDevice[]>('/admin/media/device/list', params);
}

export function createMediaDevice(data: Partial<MediaDevice>) {
  return requestClient.post<boolean>('/admin/media/device', data);
}

export function updateMediaDevice(id: string, data: Partial<MediaDevice>) {
  return requestClient.put<boolean>(`/admin/media/device/${id}`, data);
}

export function deleteMediaDevice(id: string) {
  return requestClient.delete<boolean>(`/admin/media/device/${id}`);
}

export function getMediaDeviceDetail(id: string) {
  return requestClient.get<MediaDeviceDetail>(`/admin/media/device/${id}/detail`);
}

export function getMediaDeviceChannels(id: string) {
  return requestClient.get<MediaChannel[]>(`/admin/media/device/${id}/channels`);
}

export function getMediaChannelList(params: MediaSearchRequest) {
  return requestClient.post<MediaChannel[]>('/admin/media/channel/list', params);
}

export function saveMediaChannel(data: Partial<MediaChannel>) {
  return requestClient.post<MediaChannel>('/admin/media/channel', data);
}

export function deleteMediaChannel(id: string) {
  return requestClient.delete<boolean>(`/admin/media/channel/${id}`);
}

export function startChannelLive(data: ChannelLiveRequest) {
  return requestClient.post<MediaPlayResponse>('/admin/media/channel/live', data);
}

export function stopChannelLive(sessionId: string) {
  return requestClient.post<boolean>(`/admin/media/channel/live/stop/${sessionId}`);
}

export function queryChannelPlayback(data: PlaybackQueryRequest) {
  return requestClient.post<PlaybackRecordItem[]>(
    '/admin/media/channel/playback/query',
    data,
  );
}

export function startChannelPlayback(data: PlaybackStartRequest) {
  return requestClient.post<MediaPlayResponse>(
    '/admin/media/channel/playback/start',
    data,
  );
}

export function stopChannelPlayback(sessionId: string) {
  return requestClient.post<boolean>(
    `/admin/media/channel/playback/stop/${sessionId}`,
  );
}

export function controlChannelPtz(data: PtzControlRequest) {
  return requestClient.post<boolean>('/admin/media/channel/ptz', data);
}
