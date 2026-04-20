import type {
  MediaSearchRequest,
  MediaServer,
  MediaServerTestRequest,
  MediaServerTestResult,
} from './types';

import { requestClient } from '#/api/request';

export function getMediaServerList(params: MediaSearchRequest) {
  return requestClient.post<MediaServer[]>('/admin/media/server/list', params);
}

export function createMediaServer(data: Partial<MediaServer>) {
  return requestClient.post<boolean>('/admin/media/server', data);
}

export function updateMediaServer(id: string, data: Partial<MediaServer>) {
  return requestClient.put<boolean>(`/admin/media/server/${id}`, data);
}

export function deleteMediaServer(id: string) {
  return requestClient.delete<boolean>(`/admin/media/server/${id}`);
}

export function testMediaServer(data: MediaServerTestRequest) {
  return requestClient.post<MediaServerTestResult>(
    '/admin/media/server/test',
    data,
  );
}

export function getMediaServerStreams(
  id: string,
  app?: string,
  stream?: string,
) {
  return requestClient.get<Array<Record<string, any>>>(
    `/admin/media/server/${id}/streams`,
    { params: { app, stream } },
  );
}
