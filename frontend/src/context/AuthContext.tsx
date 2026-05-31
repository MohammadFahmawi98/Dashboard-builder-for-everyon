// @ts-nocheck
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User } from '../types';
import { getMe } from '../api/auth';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = sessionStorage.getItem('dashly_token'); // Changed to sessionStorage for better security
    setToken(storedToken);
    setLoading(false); // Moved to ensure loading is set to false after token retrieval
  }, []);

  useEffect(() => {
    if (!token) return;
    getMe()
      .then(setUser)
      .catch(() => { sessionStorage.removeItem('dashly_token'); setToken(null); }) // Changed to sessionStorage
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    function onRefreshed(e: Event) {
      const { token: newToken, user: newUser } = (e as CustomEvent).detail;
      sessionStorage.setItem('dashly_token', newToken); // Changed to sessionStorage
      setToken(newToken);
      setUser(newUser);
    }
    window.addEventListener('dashly:token-refreshed', onRefreshed);
    return () => window.removeEventListener('dashly:token-refreshed', onRefreshed);
  }, []);

  function setAuth(t: string, u: User) {
    sessionStorage.setItem('dashly_token', t); // Changed to sessionStorage
    setToken(t);
    setUser(u);
  }

  function logout() {
    sessionStorage.removeItem('dashly_token'); // Changed to sessionStorage
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, setAuth, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}