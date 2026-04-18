import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  workspace: { id: string; name: string } | null;
  isLoading: boolean;
  error: string | null;

  setUser: (user: User) => void;
  setToken: (token: string) => void;
  setWorkspace: (workspace: { id: string; name: string }) => void;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      workspace: null,
      isLoading: false,
      error: null,

      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setWorkspace: (workspace) => set({ workspace }),
      setAuth: (token, user) => set({ token, user, error: null }),
      logout: () => set({ token: null, user: null, workspace: null, error: null }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'dashly-auth',
      partialize: (state) => ({ token: state.token, user: state.user, workspace: state.workspace }),
    }
  )
);
