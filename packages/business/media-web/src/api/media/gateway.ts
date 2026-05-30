import type {
  GatewayReloadRequest,
  MediaGateway,
  MediaSearchRequest,
} from './types';

import { useFlexbootRequestClient } from '@flexboot4/web-kit';

export function getMediaGatewayList(params: MediaSearchRequest) {
  return useFlexbootRequestClient().post<MediaGateway[]>(
    '/admin/media/gateway/list',
    params,
  );
}

export function createMediaGateway(data: Partial<MediaGateway>) {
  return useFlexbootRequestClient().post<boolean>('/admin/media/gateway', data);
}

export function updateMediaGateway(id: string, data: Partial<MediaGateway>) {
  return useFlexbootRequestClient().put<boolean>(
    `/admin/media/gateway/${id}`,
    data,
  );
}

export function deleteMediaGateway(id: string) {
  return useFlexbootRequestClient().delete<boolean>(
    `/admin/media/gateway/${id}`,
  );
}

export function reloadMediaGateway(data: GatewayReloadRequest) {
  return useFlexbootRequestClient().post<boolean>(
    '/admin/media/gateway/reload',
    data,
  );
}

export function startMediaGateway(id: string) {
  return useFlexbootRequestClient().post<boolean>(
    `/admin/media/gateway/${id}/start`,
  );
}

export function stopMediaGateway(id: string) {
  return useFlexbootRequestClient().post<boolean>(
    `/admin/media/gateway/${id}/stop`,
  );
}
