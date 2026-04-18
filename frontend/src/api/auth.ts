import api from './client';
import type { User } from '../types';

export type { User };

export async function signup(email: string, password: string, name: string) {
  const { data } = await api.post<{ token: string; user: User }>('/auth/signup', { email, password, name });
  return data;
}

export async function login(email: string, password: string) {
  const { data } = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
  return data;
}

export async function getMe() {
  const { data } = await api.get<{ user: User }>('/auth/me');
  return data.user;
}

export async function refreshToken() {
  const { data } = await api.post<{ token: string; user: User }>('/auth/refresh');
  return data;
}
