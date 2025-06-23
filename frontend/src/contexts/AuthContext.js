import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          // Verify token is still valid only if not already checking
          if (!user) {
            authAPI.getMe()
              .then(response => {
                setUser(response.data.user);
              })
              .catch(() => {
                // Token invalid, clear storage
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setUser(null);
              })
              .finally(() => {
                setLoading(false);
              });
          } else {
            setLoading(false);
          }
        } catch (error) {
          // Invalid stored user data
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          setLoading(false);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    };

    // Initial check
    checkAuth();

    // Listen for storage changes (logout from other tabs or API interceptor)
    const handleStorageChange = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await authAPI.login(email, password);
      const { token, user: userData } = response.data;
      
      // Save to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Erro no login';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const register = async (userData) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await authAPI.register(userData);
      return { success: true, user: response.data.user };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Erro no registro';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    register,
    isAdmin: user?.role === 'administrador',
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};