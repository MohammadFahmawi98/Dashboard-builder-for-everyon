// @ts-nocheck
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User } from '../types';
import { getMe } from '../api/auth';
import DOMPurify from 'dompurify';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function isValidToken(token: string | null): boolean {
  // Add logic to validate the token here (this is a placeholder)
  return token !== null && token.length > 0; // Example validation
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = sessionStorage.getItem('dashly_token') || process.env.REACT_APP_DEFAULT_TOKEN; 
    setToken(storedToken);
  }, []);

  useEffect(() => {
    if (!token || !isValidToken(token)) { setLoading(false); return; }
    getMe()
      .then(rawUser => {
        const sanitizedUser = {
          ...rawUser,
          name: DOMPurify.sanitize(rawUser.name),
          email: DOMPurify.sanitize(rawUser.email)
        };
        setUser(sanitizedUser);
      })
      .catch(() => { sessionStorage.removeItem('dashly_token'); setToken(null); })
      .finally(() => setLoading(false));
  }, [token]);

  // Keep context in sync when the interceptor silently refreshes the token
  useEffect(() => {
    function onRefreshed(e: Event) {
      const { token: newToken, user: newUser } = (e as CustomEvent).detail;
      sessionStorage.setItem('dashly_token', newToken);
      setToken(newToken);
      setUser(newUser);
    }
    window.addEventListener('dashly:token-refreshed', onRefreshed);
    return () => window.removeEventListener('dashly:token-refreshed', onRefreshed);
  }, []);

  function setAuth(t: string, u: User) {
    sessionStorage.setItem('dashly_token', t);
    setToken(t);
    setUser(u);
  }

  function logout() {
    sessionStorage.removeItem('dashly_token');
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