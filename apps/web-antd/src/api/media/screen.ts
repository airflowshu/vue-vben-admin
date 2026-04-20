import type {
  MediaScreen,
  MediaScreenDetail,
  MediaSearchRequest,
  ScreenSaveRequest,
} from './types';

import { requestClient } from '#/api/request';

export function getMediaScreenList(params: MediaSearchRequest) {
  return requestClient.post<MediaScreen[]>('/admin/media/screen/list', params);
}

export function createMediaScreen(data: Partial<MediaScreen>) {
  return requestClient.post<boolean>('/admin/media/screen', data);
}

export function updateMediaScreen(id: string, data: Partial<MediaScreen>) {
  return requestClient.put<boolean>(`/admin/media/screen/${id}`, data);
}

export function deleteMediaScreen(id: string) {
  return requestClient.delete<boolean>(`/admin/media/screen/${id}`);
}

export function getMediaScreenDetail(id: string) {
  return requestClient.get<MediaScreenDetail>(
    `/admin/media/screen/${id}/detail`,
  );
}

export function saveMediaScreenLayout(data: ScreenSaveRequest) {
  return requestClient.post<MediaScreenDetail>(
    '/admin/media/screen/save-layout',
    data,
  );
}
