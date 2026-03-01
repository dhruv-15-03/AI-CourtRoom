import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authService, userService } from '../services/api';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        error: null,
      };
    case 'UPDATE_PROFILE':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

const initialState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: false,
  error: null,
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');
    const userProfile = localStorage.getItem('userProfile');

    if (token && userRole) {
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          token,
          user: {
            role: userRole,
            ...(userProfile ? JSON.parse(userProfile) : {}),
          },
        },
      });
    }

    // Listen for force logout events from API interceptor
    const handleForceLogout = () => {
      dispatch({ type: 'LOGOUT' });
    };

    window.addEventListener('forceLogout', handleForceLogout);

    return () => {
      window.removeEventListener('forceLogout', handleForceLogout);
    };
  }, []);

  const login = async (credentials) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      // Login only needs email/password, not role
      const loginPayload = {
        email: (credentials.email || '').toLowerCase(),
        password: credentials.password
      };

      const response = await authService.login(loginPayload);
      const { token, message } = response.data;
      
      // Store auth token temporarily
      localStorage.setItem('authToken', token);
      
      // Fetch user profile to get actual role from backend
      const profileResponse = await userService.getProfile();
      const userProfile = profileResponse.data;
      
      // Map backend role to frontend display role
      const mapBackendRoleToFrontend = (backendRole) => {
        switch (backendRole) {
          case 'ADVOCATE':
          case 'SENIOR_ADVOCATE':
          case 'PUBLIC_PROSECUTOR':
            return 'lawyer';
          case 'JUDGE':
          case 'DISTRICT_JUDGE':
          case 'HIGH_COURT_JUDGE':
          case 'SUPREME_COURT_JUDGE':
            return 'judge';
          case 'CITIZEN':
          default:
            return 'user';
        }
      };
      
      const frontendRole = mapBackendRoleToFrontend(userProfile.role);
      
      // Store user data with mapped role for frontend routing
      localStorage.setItem('userRole', frontendRole);
      const user = { 
        ...userProfile,
        role: frontendRole 
      };
      localStorage.setItem('userProfile', JSON.stringify(user));

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { token, user },
      });

      return { success: true, message };
    } catch (error) {
      // Check if verification is required (403 status)
      if (error.response?.status === 403 && error.response?.data?.requiresVerification) {
        dispatch({
          type: 'LOGIN_FAILURE',
          payload: 'Account verification required',
        });
        return { 
          success: false, 
          requiresVerification: true,
          email: error.response?.data?.email,
          emailVerified: error.response?.data?.emailVerified,
          mobileVerified: error.response?.data?.mobileVerified,
          error: error.response?.data?.message || 'Please verify your account'
        };
      }
      
      const errorMessage = error.response?.data?.message || 'Login failed';
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      // Normalize payload for backend expectations
      const mapRole = (role) => {
        switch ((role || '').toLowerCase()) {
          case 'lawyer':
            return 'ADVOCATE';
          case 'judge':
            return 'JUDGE';
          case 'user':
          default:
            return 'CITIZEN';
        }
      };

      const payload = {
        ...userData,
        role: mapRole(userData.role),
        email: (userData.email || '').toLowerCase(),
        ...(userData.years != null && userData.experience == null
          ? { experience: parseInt(userData.years) }
          : {}),
      };

      const sanitized = JSON.parse(
        JSON.stringify(payload, (key, value) => {
          if (typeof value === 'number' && Number.isNaN(value)) return null;
          return value;
        })
      );

      const response = await authService.register(sanitized);
      const { message, requiresVerification } = response.data;
      
      // New flow: registration requires verification before login
      // Don't auto-login, return success and let the page redirect to verification
      dispatch({ type: 'CLEAR_ERROR' });
      
      return { 
        success: true, 
        message,
        requiresVerification: requiresVerification || true,
        email: (userData.email || '').toLowerCase()
      };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    authService.logout();
    dispatch({ type: 'LOGOUT' });
  };

  const updateProfile = (profileData) => {
    localStorage.setItem('userProfile', JSON.stringify(profileData));
    dispatch({ type: 'UPDATE_PROFILE', payload: profileData });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
