import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(() => localStorage.getItem('sf_token'));
  const [loading, setLoading] = useState(true);

  // On mount, verify stored token
  useEffect(() => {
    const storedToken = localStorage.getItem('sf_token');
    if (storedToken) {
      api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      api.get('/auth/me')
        .then(res => {
          setUser(res.data.user);
          setToken(storedToken);
        })
        .catch(() => {
          // Token invalid/expired - clear everything
          localStorage.removeItem('sf_token');
          delete api.defaults.headers.common['Authorization'];
          setUser(null);
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password, role) => {
    const res = await api.post('/auth/login', { email, password, role });
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('sf_token', newToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(newUser);
    return newUser;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('sf_token');
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  }, []);

  const registerSupplier = useCallback(async (data) => {
    const res = await api.post('/auth/register/supplier', data);
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('sf_token', newToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(newUser);
    return newUser;
  }, []);

  const registerRestaurant = useCallback(async (data) => {
    const res = await api.post('/auth/register/restaurant', data);
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('sf_token', newToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(newUser);
    return newUser;
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, registerSupplier, registerRestaurant }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
