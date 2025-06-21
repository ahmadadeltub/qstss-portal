import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { authService } from '../services/authService';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  department?: string;
  phoneNumber?: string;
  subjects?: string[];
  lastLogin?: string;
  createdAt?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profileData: any) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  clearError: () => void;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: true,
    error: null
  });

  // Clear error helper
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Initialize authentication state
  const initAuth = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Check if we have a valid token
      if (!authService.isAuthenticated()) {
        setState({
          user: null,
          isAuthenticated: false,
          loading: false,
          error: null
        });
        return;
      }

      // Try to get user profile
      const userData = await authService.getProfile();
      setState({
        user: userData.teacher,
        isAuthenticated: true,
        loading: false,
        error: null
      });
      
    } catch (error: any) {
      console.warn('Auth initialization failed:', error.message);
      
      // Clear invalid auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      setState({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null // Don't show error on init failure
      });
    }
  }, []);

  // Refresh authentication state
  const refreshAuth = useCallback(async () => {
    await initAuth();
  }, [initAuth]);

  // Login function with enhanced error handling and retry mechanism
  const login = useCallback(async (email: string, password: string) => {
    const maxRetries = 3;
    let lastError: any = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔐 AuthContext: Login attempt ${attempt}/${maxRetries} for`, email);
        setState(prev => ({ ...prev, loading: true, error: null }));
        
        const response = await authService.login(email, password);
        console.log('✅ AuthContext: Login successful', response);
        
        setState({
          user: response.teacher,
          isAuthenticated: true,
          loading: false,
          error: null
        });
        
        return; // Success, exit retry loop
        
      } catch (error: any) {
        lastError = error;
        console.error(`❌ AuthContext: Login attempt ${attempt} failed:`, error);
        
        // If it's a credential error, don't retry
        if (error.message?.includes('Invalid email or password') || 
            error.message?.includes('credentials') ||
            error.status === 401) {
          setState(prev => ({ 
            ...prev, 
            loading: false, 
            error: 'Invalid email or password. Please check your credentials.' 
          }));
          throw error;
        }
        
        // For network errors, wait and retry (except on last attempt)
        if (attempt < maxRetries) {
          console.log(`⏳ Retrying login in ${attempt * 1000}ms...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        }
      }
    }
    
    // All attempts failed - handle network error
    console.error('❌ All login attempts failed');
    setState(prev => ({ 
      ...prev, 
      loading: false, 
      error: 'Unable to connect to server. Please check your internet connection and try again.' 
    }));
    throw lastError;
  }, []);

  // Register function
  const register = useCallback(async (userData: any) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await authService.register(userData);
      
      setState({
        user: response.teacher,
        isAuthenticated: true,
        loading: false,
        error: null
      });
      
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Registration failed'
      }));
      throw error;
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      await authService.logout();
      
      setState({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null
      });
      
    } catch (error: any) {
      // Even if logout fails on server, clear local state
      setState({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null
      });
    }
  }, []);

  // Update profile function
  const updateProfile = useCallback(async (profileData: any) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await authService.updateProfile(profileData);
      
      setState(prev => ({
        ...prev,
        user: response.teacher,
        loading: false,
        error: null
      }));
      
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Profile update failed'
      }));
      throw error;
    }
  }, []);

  // Change password function
  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      await authService.changePassword(currentPassword, newPassword);
      
      setState(prev => ({ ...prev, loading: false, error: null }));
      
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Password change failed'
      }));
      throw error;
    }
  }, []);

  // Initialize auth on mount
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Handle auth token changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' && !e.newValue) {
        // Token was removed, log out
        setState({
          user: null,
          isAuthenticated: false,
          loading: false,
          error: null
        });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Context value
  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    clearError,
    refreshAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
