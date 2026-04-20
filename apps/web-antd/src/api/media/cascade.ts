import type {
  CascadeBindingView,
  CascadeBindRequest,
  MediaCascadePlatform,
  MediaSearchRequest,
} from './types';

import { requestClient } from '#/api/request';

export function getMediaCascadePlatformList(params: MediaSearchRequest) {
  return requestClient.post<MediaCascadePlatform[]>(
    '/admin/media/cascade/list',
    params,
  );
}

export function createMediaCascadePlatform(
  data: Partial<MediaCascadePlatform>,
) {
  return requestClient.post<boolean>('/admin/media/cascade', data);
}

export function updateMediaCascadePlatform(
  id: string,
  data: Partial<MediaCascadePlatform>,
) {
  return requestClient.put<boolean>(`/admin/media/cascade/${id}`, data);
}

export function deleteMediaCascadePlatform(id: string) {
  return requestClient.delete<boolean>(`/admin/media/cascade/${id}`);
}

export function getCascadeBindings(id: string) {
  return requestClient.get<CascadeBindingView[]>(
    `/admin/media/cascade/${id}/bindings`,
  );
}

export function saveCascadeBindings(data: CascadeBindRequest) {
  return requestClient.post<CascadeBindingView[]>(
    '/admin/media/cascade/bind',
    data,
  );
}

export function registerCascadePlatform(id: string) {
  return requestClient.post<boolean>(`/admin/media/cascade/${id}/register`);
}

export function stopCascadePlatform(id: string) {
  return requestClient.post<boolean>(`/admin/media/cascade/${id}/stop`);
}
