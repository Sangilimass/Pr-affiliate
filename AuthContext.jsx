import React, { createContext, useContext, useReducer, useEffect } from 'react';
import apiService from '../services/api';

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
};

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  LOGOUT: 'LOGOUT',
  LOAD_USER: 'LOAD_USER',
  UPDATE_USER: 'UPDATE_USER',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_LOADING: 'SET_LOADING',
};

// Reducer function
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        loading: false,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      };

    case AUTH_ACTIONS.LOAD_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        loading: false,
      };

    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };

    default:
      return state;
  }
}

// Create context
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = apiService.getStoredUser();
        const token = localStorage.getItem('authToken');
        
        if (storedUser && token) {
          dispatch({
            type: AUTH_ACTIONS.LOAD_USER,
            payload: storedUser,
          });
        } else {
          dispatch({
            type: AUTH_ACTIONS.LOAD_USER,
            payload: null,
          });
        }
      } catch (error) {
        console.error('Error loading user:', error);
        dispatch({
          type: AUTH_ACTIONS.LOAD_USER,
          payload: null,
        });
      }
    };

    loadUser();
  }, []);

  // Login function
  const login = async (email, password) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    
    try {
      const response = await apiService.login(email, password);
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: response,
      });
      return response;
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: error.message,
      });
      throw error;
    }
  };

  // Register function
  const register = async (userData) => {
    dispatch({ type: AUTH_ACTIONS.REGISTER_START });
    
    try {
      const response = await apiService.register(userData);
      dispatch({
        type: AUTH_ACTIONS.REGISTER_SUCCESS,
        payload: response,
      });
      return response;
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAILURE,
        payload: error.message,
      });
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      const updatedUser = await apiService.updateUserProfile(profileData);
      dispatch({
        type: AUTH_ACTIONS.UPDATE_USER,
        payload: updatedUser,
      });
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return updatedUser;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    if (!state.isAuthenticated) return;
    
    try {
      const user = await apiService.getUserProfile();
      dispatch({
        type: AUTH_ACTIONS.UPDATE_USER,
        payload: user,
      });
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(user));
      
      return user;
    } catch (error) {
      console.error('User refresh error:', error);
      // If refresh fails due to invalid token, logout
      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        logout();
      }
      throw error;
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Check if user has specific role or permission
  const hasRole = (role) => {
    return state.user?.role === role;
  };

  const hasPermission = (permission) => {
    return state.user?.permissions?.includes(permission);
  };

  // Auto-refresh token before expiration
  useEffect(() => {
    if (!state.isAuthenticated) return;

    const refreshInterval = setInterval(async () => {
      try {
        await apiService.refreshToken();
      } catch (error) {
        console.error('Token refresh failed:', error);
        logout();
      }
    }, 15 * 60 * 1000); // Refresh every 15 minutes

    return () => clearInterval(refreshInterval);
  }, [state.isAuthenticated]);

  // Context value
  const value = {
    // State
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading,
    error: state.error,
    
    // Actions
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
    clearError,
    hasRole,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

