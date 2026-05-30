import type {
  MediaScreen,
  MediaScreenDetail,
  MediaSearchRequest,
  ScreenSaveRequest,
} from './types';

import { useFlexbootRequestClient } from '@flexboot4/web-kit';

export function getMediaScreenList(params: MediaSearchRequest) {
  return useFlexbootRequestClient().post<MediaScreen[]>(
    '/admin/media/screen/list',
    params,
  );
}

export function createMediaScreen(data: Partial<MediaScreen>) {
  return useFlexbootRequestClient().post<boolean>('/admin/media/screen', data);
}

export function updateMediaScreen(id: string, data: Partial<MediaScreen>) {
  return useFlexbootRequestClient().put<boolean>(
    `/admin/media/screen/${id}`,
    data,
  );
}

export function deleteMediaScreen(id: string) {
  return useFlexbootRequestClient().delete<boolean>(
    `/admin/media/screen/${id}`,
  );
}

export function getMediaScreenDetail(id: string) {
  return useFlexbootRequestClient().get<MediaScreenDetail>(
    `/admin/media/screen/${id}/detail`,
  );
}

export function saveMediaScreenLayout(data: ScreenSaveRequest) {
  return useFlexbootRequestClient().post<MediaScreenDetail>(
    '/admin/media/screen/save-layout',
    data,
  );
}
