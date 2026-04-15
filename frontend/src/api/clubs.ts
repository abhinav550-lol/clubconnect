import api from './api';
import type { Club, ClubMember } from '../types';

export const clubsApi = {
  list: (params?: { skip?: number; limit?: number; category?: string; search?: string }) =>
    api.get<Club[]>('/clubs/', { params }),

  get: (id: string) => api.get<Club>(`/clubs/${id}`),

  create: (data: { name: string; description?: string; category: string; tags?: string[] }) =>
    api.post<Club>('/clubs/', data),

  update: (id: string, data: { name?: string; description?: string; category?: string; tags?: string[] }) =>
    api.put<Club>(`/clubs/${id}`, data),

  delete: (id: string) => api.delete(`/clubs/${id}`),

  members: (id: string) => api.get<ClubMember[]>(`/clubs/${id}/members`),
};
