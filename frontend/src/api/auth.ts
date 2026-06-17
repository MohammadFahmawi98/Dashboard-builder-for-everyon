import api from './client';
import type { User } from '../types';

export type { User };

export async function signup(email: string, password: string, name: string) {
  const { data } = await api.post<{ token: string; user: User }>('/auth/signup', { email, password, name });
  return data;
}

export async function login(email: string, password: string) {
  try {
    const { data } = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
    return data;
  } catch (error) {
    throw new Error('Login failed. Please check your credentials and try again.'); 
  }
}

export async function getMe() {
  const { data } = await api.get<{ user: User }>('/auth/me');
  return data.user;
}

export async function refreshToken() {
  const { data } = await api.post<{ token: string; user: User }>('/auth/refresh');
  return data;
}

function isValidToken(token: string): boolean {
  // Implement your token validation logic here
  return !!token; // simple example
}

const token = sessionStorage.getItem('token'); // assuming the token is stored like this
if (!isValidToken(token)) {
  setLoading(false); 
  return;
}