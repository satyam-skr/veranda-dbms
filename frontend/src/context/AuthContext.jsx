import { createContext, useContext, useState, useEffect } from 'react';
import { findUserByEmail } from '../api/mockApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (email, password) => {
    const user = findUserByEmail(email);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      return { success: true };
    }
    return { success: false, error: 'Invalid credentials' };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  const hasRole = (role) => {
    return currentUser?.roles?.includes(role);
  };

  const isDomainAdmin = (domain) => {
    return currentUser?.domainAdminOf?.includes(domain) || hasRole('super_admin');
  };

  const value = {
    currentUser,
    login,
    logout,
    hasRole,
    isDomainAdmin,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
