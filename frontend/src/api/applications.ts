import api from './api';
import type { Application } from '../types';

export const applicationsApi = {
  submit: (data: { club_id: string; statement: string }) =>
    api.post<Application>('/applications/', data),

  my: () => api.get<Application[]>('/applications/my'),

  forClub: (clubId: string) => api.get<Application[]>(`/applications/club/${clubId}`),

  review: (id: string, data: { status: 'accepted' | 'rejected'; review_note?: string }) =>
    api.put<Application>(`/applications/${id}/review`, data),
};
