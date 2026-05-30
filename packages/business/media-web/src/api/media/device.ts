import type {
  ChannelLiveRequest,
  MediaChannel,
  MediaDevice,
  MediaDeviceDetail,
  MediaPlayResponse,
  MediaSearchRequest,
  PlaybackQueryRequest,
  PlaybackRecordItem,
  PlaybackStartRequest,
  PtzControlRequest,
} from './types';

import { useFlexbootRequestClient } from '@flexboot4/web-kit';

export function getMediaDeviceList(params: MediaSearchRequest) {
  return useFlexbootRequestClient().post<MediaDevice[]>(
    '/admin/media/device/list',
    params,
  );
}

export function createMediaDevice(data: Partial<MediaDevice>) {
  return useFlexbootRequestClient().post<boolean>('/admin/media/device', data);
}

export function updateMediaDevice(id: string, data: Partial<MediaDevice>) {
  return useFlexbootRequestClient().put<boolean>(
    `/admin/media/device/${id}`,
    data,
  );
}

export function deleteMediaDevice(id: string) {
  return useFlexbootRequestClient().delete<boolean>(
    `/admin/media/device/${id}`,
  );
}

export function getMediaDeviceDetail(id: string) {
  return useFlexbootRequestClient().get<MediaDeviceDetail>(
    `/admin/media/device/${id}/detail`,
  );
}

export function getMediaDeviceChannels(id: string) {
  return useFlexbootRequestClient().get<MediaChannel[]>(
    `/admin/media/device/${id}/channels`,
  );
}

export function getMediaChannelList(params: MediaSearchRequest) {
  return useFlexbootRequestClient().post<MediaChannel[]>(
    '/admin/media/channel/list',
    params,
  );
}

export function saveMediaChannel(data: Partial<MediaChannel>) {
  return useFlexbootRequestClient().post<MediaChannel>(
    '/admin/media/channel',
    data,
  );
}

export function deleteMediaChannel(id: string) {
  return useFlexbootRequestClient().delete<boolean>(
    `/admin/media/channel/${id}`,
  );
}

export function startChannelLive(data: ChannelLiveRequest) {
  return useFlexbootRequestClient().post<MediaPlayResponse>(
    '/admin/media/channel/live',
    data,
  );
}

export function stopChannelLive(sessionId: string) {
  return useFlexbootRequestClient().post<boolean>(
    `/admin/media/channel/live/stop/${sessionId}`,
  );
}

export function queryChannelPlayback(data: PlaybackQueryRequest) {
  return useFlexbootRequestClient().post<PlaybackRecordItem[]>(
    '/admin/media/channel/playback/query',
    data,
  );
}

export function startChannelPlayback(data: PlaybackStartRequest) {
  return useFlexbootRequestClient().post<MediaPlayResponse>(
    '/admin/media/channel/playback/start',
    data,
  );
}

export function stopChannelPlayback(sessionId: string) {
  return useFlexbootRequestClient().post<boolean>(
    `/admin/media/channel/playback/stop/${sessionId}`,
  );
}

export function controlChannelPtz(data: PtzControlRequest) {
  return useFlexbootRequestClient().post<boolean>(
    '/admin/media/channel/ptz',
    data,
  );
}
