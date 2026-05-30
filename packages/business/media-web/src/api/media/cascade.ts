import type {
  CascadeBindingView,
  CascadeBindRequest,
  MediaCascadePlatform,
  MediaSearchRequest,
} from './types';

import { useFlexbootRequestClient } from '@flexboot4/web-kit';

export function getMediaCascadePlatformList(params: MediaSearchRequest) {
  return useFlexbootRequestClient().post<MediaCascadePlatform[]>(
    '/admin/media/cascade/list',
    params,
  );
}

export function createMediaCascadePlatform(
  data: Partial<MediaCascadePlatform>,
) {
  return useFlexbootRequestClient().post<boolean>('/admin/media/cascade', data);
}

export function updateMediaCascadePlatform(
  id: string,
  data: Partial<MediaCascadePlatform>,
) {
  return useFlexbootRequestClient().put<boolean>(
    `/admin/media/cascade/${id}`,
    data,
  );
}

export function deleteMediaCascadePlatform(id: string) {
  return useFlexbootRequestClient().delete<boolean>(
    `/admin/media/cascade/${id}`,
  );
}

export function getCascadeBindings(id: string) {
  return useFlexbootRequestClient().get<CascadeBindingView[]>(
    `/admin/media/cascade/${id}/bindings`,
  );
}

export function saveCascadeBindings(data: CascadeBindRequest) {
  return useFlexbootRequestClient().post<CascadeBindingView[]>(
    '/admin/media/cascade/bind',
    data,
  );
}

export function registerCascadePlatform(id: string) {
  return useFlexbootRequestClient().post<boolean>(
    `/admin/media/cascade/${id}/register`,
  );
}

export function stopCascadePlatform(id: string) {
  return useFlexbootRequestClient().post<boolean>(
    `/admin/media/cascade/${id}/stop`,
  );
}
