import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import http, { tokenStore } from '../api/http';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!tokenStore.get());

  const refresh = useCallback(async () => {
    const { data } = await http.get('/user/profile');
    setUser(data);
    return data;
  }, []);

  useEffect(() => {
    if (tokenStore.get()) refresh().catch(() => tokenStore.clear()).finally(() => setLoading(false));
    const onUnauth = () => setUser(null);
    window.addEventListener('cs:unauthorized', onUnauth);
    return () => window.removeEventListener('cs:unauthorized', onUnauth);
  }, [refresh]);

  const login = async (email, password, remember) => {
    const { data } = await http.post('/auth/login', { email, password });
    tokenStore.set(data.token, remember);
    setUser(data.user);
  };

  const register = async (payload) => {
    const { data } = await http.post('/auth/register', payload);
    tokenStore.set(data.token, true);
    setUser(data.user);
  };

  const logout = async () => {
    try { await http.post('/auth/logout'); } catch { /* token may already be invalid */ }
    tokenStore.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}
