import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(authService.getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (authService.isAuthenticated()) {
        try {
          const profile = await authService.fetchMe();
          if (profile) {
            setUser(profile);
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
          }
        } catch (e) {
          console.error("Auth init error:", e);
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const login = async (email, password, rememberMe = true) => {
    const res = await authService.login(email, password, rememberMe);
    if (res.user) {
      setUser(res.user);
      setIsAuthenticated(true);
    }
    return res;
  };

  const register = async (name, email, password, confirmPassword) => {
    return await authService.register(name, email, password, confirmPassword);
  };

  const verifyEmail = async (email, otp) => {
    const res = await authService.verifyEmail(email, otp);
    if (res.user) {
      setUser(res.user);
      setIsAuthenticated(true);
    }
    return res;
  };

  const resendOtp = async (email, purpose = 'email_verification') => {
    return await authService.resendOtp(email, purpose);
  };

  const forgotPassword = async (email) => {
    return await authService.forgotPassword(email);
  };

  const verifyResetOtp = async (email, otp) => {
    return await authService.verifyResetOtp(email, otp);
  };

  const resetPassword = async (email, otp, password, confirmPassword) => {
    return await authService.resetPassword(email, otp, password, confirmPassword);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isAuthenticated,
        loading,
        login,
        register,
        verifyEmail,
        resendOtp,
        forgotPassword,
        verifyResetOtp,
        resetPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
