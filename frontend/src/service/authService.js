import api from './api';

const authService = {
  /**
   * Login user
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise}
   */
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.access_token) {
      localStorage.setItem('auth_token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  /**
   * Register new user
   * @param {Object} userData 
   * @returns {Promise}
   */
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.access_token) {
      localStorage.setItem('auth_token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  /**
   * Logout user
   * @returns {Promise}
   */
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
  },

  /**
   * Get current user profile
   * @returns {Promise}
   */
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  /**
   * Update user profile
   * @param {Object} profileData 
   * @returns {Promise}
   */
  updateProfile: async (profileData) => {
    const isFormData = profileData instanceof FormData;

    if (isFormData && !profileData.has('_method')) {
      // Ensure Laravel properly handles multipart updates for file uploads.
      profileData.append('_method', 'PUT');
    }

    const response = isFormData
      ? await api.post('/auth/profile', profileData)
      : await api.put('/auth/profile', profileData);

    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
      window.dispatchEvent(new CustomEvent('auth-user-updated', {
        detail: response.data.user,
      }));
    }
    return response.data;
  },

  /**
   * Update password
   * @param {string} currentPassword 
   * @param {string} newPassword 
   * @param {string} confirmPassword 
   * @returns {Promise}
   */
  updatePassword: async (currentPassword, newPassword, confirmPassword) => {
    const response = await api.put('/auth/password', {
      current_password: currentPassword,
      password: newPassword,
      password_confirmation: confirmPassword,
    });
    return response.data;
  },

  /**
   * Refresh access token
   * @returns {Promise}
   */
  refreshToken: async () => {
    const response = await api.post('/auth/refresh');
    if (response.data.access_token) {
      localStorage.setItem('auth_token', response.data.access_token);
    }
    return response.data;
  },

  /**
   * Get current user from local storage
   * @returns {Object|null}
   */
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('auth_token');
  },

  /**
   * Get auth token
   * @returns {string|null}
   */
  getToken: () => {
    return localStorage.getItem('auth_token');
  },
};

export default authService;
