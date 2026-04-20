import type {
  GatewayReloadRequest,
  MediaGateway,
  MediaSearchRequest,
} from './types';

import { requestClient } from '#/api/request';

export function getMediaGatewayList(params: MediaSearchRequest) {
  return requestClient.post<MediaGateway[]>(
    '/admin/media/gateway/list',
    params,
  );
}

export function createMediaGateway(data: Partial<MediaGateway>) {
  return requestClient.post<boolean>('/admin/media/gateway', data);
}

export function updateMediaGateway(id: string, data: Partial<MediaGateway>) {
  return requestClient.put<boolean>(`/admin/media/gateway/${id}`, data);
}

export function deleteMediaGateway(id: string) {
  return requestClient.delete<boolean>(`/admin/media/gateway/${id}`);
}

export function reloadMediaGateway(data: GatewayReloadRequest) {
  return requestClient.post<boolean>('/admin/media/gateway/reload', data);
}

export function startMediaGateway(id: string) {
  return requestClient.post<boolean>(`/admin/media/gateway/${id}/start`);
}

export function stopMediaGateway(id: string) {
  return requestClient.post<boolean>(`/admin/media/gateway/${id}/stop`);
}
