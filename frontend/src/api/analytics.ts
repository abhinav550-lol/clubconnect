import api from './api';
import type { OverviewStats, ClubStats, StudentStats } from '../types';

export const analyticsApi = {
  overview: () => api.get<OverviewStats>('/analytics/overview'),

  club: (clubId: string) => api.get<ClubStats>(`/analytics/club/${clubId}`),

  my: () => api.get<StudentStats>('/analytics/my'),
};
