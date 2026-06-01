import type {
  MediaSearchRequest,
  MediaServer,
  MediaServerHookInfo,
  MediaServerTestRequest,
  MediaServerTestResult,
} from './types';

import { useFlexbootRequestClient } from '@flexboot4/web-kit';

export function getMediaServerList(params: MediaSearchRequest) {
  return useFlexbootRequestClient().post<MediaServer[]>(
    '/admin/media/server/list',
    params,
  );
}

export function createMediaServer(data: Partial<MediaServer>) {
  return useFlexbootRequestClient().post<boolean>('/admin/media/server', data);
}

export function updateMediaServer(id: string, data: Partial<MediaServer>) {
  return useFlexbootRequestClient().put<boolean>(
    `/admin/media/server/${id}`,
    data,
  );
}

export function deleteMediaServer(id: string) {
  return useFlexbootRequestClient().delete<boolean>(
    `/admin/media/server/${id}`,
  );
}

export function testMediaServer(data: MediaServerTestRequest) {
  return useFlexbootRequestClient().post<MediaServerTestResult>(
    '/admin/media/server/test',
    data,
  );
}

export function getMediaServerStreams(
  id: string,
  app?: string,
  stream?: string,
) {
  return useFlexbootRequestClient().get<Array<Record<string, any>>>(
    `/admin/media/server/${id}/streams`,
    { params: { app, stream } },
  );
}

export function getMediaServerHookInfo(id: string) {
  return useFlexbootRequestClient().get<MediaServerHookInfo>(
    `/admin/media/server/${id}/hook-info`,
  );
}

export function syncMediaServerHook(id: string) {
  return useFlexbootRequestClient().post<boolean>(
    `/admin/media/server/${id}/sync-hook`,
  );
}
