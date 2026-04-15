import api from './api';
import type { Event } from '../types';

export const eventsApi = {
  list: (params?: { skip?: number; limit?: number; club_id?: string }) =>
    api.get<Event[]>('/events/', { params }),

  get: (id: string) => api.get<Event>(`/events/${id}`),

  create: (data: {
    club_id: string; title: string; description?: string;
    start_time: string; end_time: string; location: string; max_attendees?: number;
  }) => api.post<Event>('/events/', data),

  update: (id: string, data: Partial<Event>) => api.put<Event>(`/events/${id}`, data),

  delete: (id: string) => api.delete(`/events/${id}`),
};
