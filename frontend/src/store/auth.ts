import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { encrypt } from '../utils/encryption'; // Import the encryption method

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
    (set) => {
      const token = process.env.REACT_APP_AUTH_TOKEN;
      const encryptedToken = encrypt(token); // Use a secure encryption method before storing
      return {
        user: null,
        token: encryptedToken, // Store the encrypted token
        workspace: null,
        isLoading: false,
        error: null,

        setUser: (user) => set({ user }),
        setToken: (token) => set({ token }),
        setWorkspace: (workspace) => set({ workspace }),
        setAuth: (token, user) => set({ token: encrypt(token), user, error: null }), // Encrypt token on auth
        logout: () => set({ token: null, user: null, workspace: null, error: null }),
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),
      }
    },
    {
      name: 'dashly-auth',
      partialize: (state) => ({ token: state.token, user: state.user, workspace: state.workspace }),
    }
  )
);