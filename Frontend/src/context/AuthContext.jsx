import { createContext, useCallback, useContext, useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { initDatabase, dbSelectOne, dbRun } from '../db/database';

const TOKEN_KEY = 'pip_auth_token';
const USER_KEY  = 'pip_auth_user';

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  dbReady: false,
  login: async () => {},
  logout: () => {},
  updateUser: async () => {},
});

function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function setStoredAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => getStoredUser());
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    initDatabase().then(() => setDbReady(true));
  }, []);

  const isAuthenticated = !!getStoredToken() && !!user;

  const login = useCallback(async (email, password) => {
    await initDatabase();
    
    // Check if user exists in local database or authenticate as organization admin
    const found = await dbSelectOne(`SELECT * FROM users WHERE email = ?`, [email]);
    if (found && found.password !== password) {
      throw new Error('Invalid email or password.');
    }

    const userId = found ? found.id : 'user-101';
    const orgId = 'org-1001';
    const role = found ? found.role : 'company_admin';
    const token = `token-${userId}:${orgId}:${role}`;
    
    const safeUser = {
      id: userId,
      email: email,
      name: found ? found.name : email.split('@')[0],
      organizationId: orgId,
      organization_id: orgId,
      organizationName: found ? found.organizationName : 'PIP Organization',
      phone: found ? found.phone : '',
      role: role,
      mustResetPassword: false,
    };

    setStoredAuth(token, safeUser);
    setUser(safeUser);
    navigate('/dashboard', { replace: true });
  }, [navigate]);

  const logout = useCallback(() => {
    clearStoredAuth();
    setUser(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  const updateUser = useCallback(async (updatedUser) => {
    setUser(updatedUser);
    const token = getStoredToken();
    if (token) setStoredAuth(token, updatedUser);

    if (updatedUser?.id) {
      await dbRun(
        `UPDATE users SET name = ?, phone = ? WHERE id = ?`,
        [updatedUser.name, updatedUser.phone, updatedUser.id]
      ).catch(() => {});
    }
  }, []);

  const value = useMemo(() => ({
    user,
    isAuthenticated,
    dbReady,
    login,
    logout,
    updateUser,
  }), [user, isAuthenticated, dbReady, login, logout, updateUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
