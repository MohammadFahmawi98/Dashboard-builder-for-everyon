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
  const [token, setToken] = useState<string | null>(localStorage.getItem('dashly_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    getMe()
      .then(setUser)
      .catch(() => { localStorage.removeItem('dashly_token'); setToken(null); })
      .finally(() => setLoading(false));
  }, [token]);

  // Keep context in sync when the interceptor silently refreshes the token
  useEffect(() => {
    function onRefreshed(e: Event) {
      const { token: newToken, user: newUser } = (e as CustomEvent).detail;
      setToken(newToken);
      setUser(newUser);
    }
    window.addEventListener('dashly:token-refreshed', onRefreshed);
    return () => window.removeEventListener('dashly:token-refreshed', onRefreshed);
  }, []);

  function setAuth(t: string, u: User) {
    localStorage.setItem('dashly_token', t);
    setToken(t);
    setUser(u);
  }

  function logout() {
    localStorage.removeItem('dashly_token');
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
