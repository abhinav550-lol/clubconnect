import api from './api';
import type { User, TokenResponse } from '../types';

export const authApi = {
  register: (data: { email: string; full_name: string; password: string; role?: string; interests?: string[] }) =>
    api.post<User>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<TokenResponse>('/auth/login', data),

  getMe: () => api.get<User>('/auth/me'),

  updateProfile: (data: { full_name?: string; interests?: string[] }) =>
    api.put<User>('/auth/me', data),
};
