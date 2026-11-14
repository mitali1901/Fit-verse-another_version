import api from './api';

export const authService = {
  /**
   * Register a new user account.
   * Sends 6-digit verification code to the provided email.
   */
  async register(name, email, password, confirmPassword) {
    const response = await api.post('/auth/register', {
      name,
      email,
      password,
      confirm_password: confirmPassword,
    });
    return response.data;
  },

  /**
   * Verify email address with 6-digit OTP code.
   * Activates account and returns JWT token on success.
   */
  async verifyEmail(email, otp) {
    const response = await api.post('/auth/verify-email', { email, otp });
    if (response.data.token) {
      localStorage.setItem('fitverse_token', response.data.token);
      localStorage.setItem('fitverse_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  /**
   * Request resending a fresh 6-digit verification code.
   * Enforces 60s cooldown.
   */
  async resendOtp(email, purpose = 'email_verification') {
    const response = await api.post('/auth/resend-otp', { email, purpose });
    return response.data;
  },

  /**
   * Sign in with email and password.
   * Rejects unverified accounts with unverified: true.
   */
  async login(email, password, rememberMe = true) {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      if (rememberMe) {
        localStorage.setItem('fitverse_token', response.data.token);
        localStorage.setItem('fitverse_user', JSON.stringify(response.data.user));
      } else {
        sessionStorage.setItem('fitverse_token', response.data.token);
        sessionStorage.setItem('fitverse_user', JSON.stringify(response.data.user));
        localStorage.setItem('fitverse_token', response.data.token);
        localStorage.setItem('fitverse_user', JSON.stringify(response.data.user));
      }
    }
    return response.data;
  },

  /**
   * Request password reset code via SMTP.
   */
  async forgotPassword(email) {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  /**
   * Verify password reset code.
   */
  async verifyResetOtp(email, otp) {
    const response = await api.post('/auth/verify-reset-otp', { email, otp });
    return response.data;
  },

  /**
   * Reset password with verified OTP and strong new password.
   */
  async resetPassword(email, otp, password, confirmPassword) {
    const response = await api.post('/auth/reset-password', {
      email,
      otp,
      password,
      confirm_password: confirmPassword,
    });
    return response.data;
  },

  /**
   * Clear session and stored credentials.
   */
  logout() {
    localStorage.removeItem('fitverse_token');
    localStorage.removeItem('fitverse_user');
    sessionStorage.removeItem('fitverse_token');
    sessionStorage.removeItem('fitverse_user');
  },

  /**
   * Get cached user profile or null.
   */
  getCurrentUser() {
    const stored = localStorage.getItem('fitverse_user') || sessionStorage.getItem('fitverse_user');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  },

  /**
   * Fetch live profile from /api/auth/me using JWT token.
   */
  async fetchMe() {
    try {
      const response = await api.get('/auth/me');
      if (response.data.user) {
        localStorage.setItem('fitverse_user', JSON.stringify(response.data.user));
      }
      return response.data.user;
    } catch {
      return this.getCurrentUser();
    }
  },

  /**
   * Check if a JWT token is currently stored.
   */
  isAuthenticated() {
    return !!(localStorage.getItem('fitverse_token') || sessionStorage.getItem('fitverse_token'));
  }
};
