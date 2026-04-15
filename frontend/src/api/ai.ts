import api from './api';
import type { Recommendation, ChatResponse } from '../types';

export const aiApi = {
  recommendations: () => api.get<Recommendation[]>('/ai/recommendations'),

  chat: (message: string) => api.post<ChatResponse>('/ai/chat', { message }),
};
