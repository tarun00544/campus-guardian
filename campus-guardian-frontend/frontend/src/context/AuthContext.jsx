import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as authService from '../services/authService';
import {
  clearAuth, getStoredUser, getToken, setStoredUser, setToken, isAdmin, isStaff
} from '../utils/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser());
  const [loading, setLoading] = useState(Boolean(getToken()));

  // Confirm the stored session against the backend on first load.
  useEffect(() => {
    let active = true;
    const verify = async () => {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const me = await authService.getMe();
        if (active && me) {
          setUser(me);
          setStoredUser(me);
        }
      } catch {
        if (active) {
          clearAuth();
          setUser(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    verify();
    return () => { active = false; };
  }, []);

  const persist = ({ token, user: nextUser }) => {
    if (token) setToken(token);
    if (nextUser) {
      setStoredUser(nextUser);
      setUser(nextUser);
    }
    return nextUser;
  };

  const login = async (credentials) => persist(await authService.login(credentials));
  const register = async (payload) => persist(await authService.register(payload));

  const logout = () => {
    clearAuth();
    setUser(null);
  };

  const refreshUser = async () => {
    const me = await authService.getMe();
    if (me) {
      setUser(me);
      setStoredUser(me);
    }
    return me;
  };

  const value = useMemo(() => ({
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
    applyUser: (u) => { setUser(u); setStoredUser(u); },
    isAuthenticated: Boolean(user),
    isAdmin: isAdmin(user),
    isStaff: isStaff(user)
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

export default AuthContext;
