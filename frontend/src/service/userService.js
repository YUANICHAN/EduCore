import api from './api';

const userService = {
  /**
   * Get all users with optional filters
   * @param {Object} params - Query parameters (role, status, search, sort_by, sort_order, per_page)
   * @returns {Promise}
   */
  getAll: async (params = {}) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  /**
   * Get user by ID
   * @param {number} id 
   * @returns {Promise}
   */
  getById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  /**
   * Create new user
   * @param {Object} userData 
   * @returns {Promise}
   */
  create: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  /**
   * Update user
   * @param {number} id 
   * @param {Object} userData 
   * @returns {Promise}
   */
  update: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  /**
   * Delete user
   * @param {number} id 
   * @returns {Promise}
   */
  delete: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  /**
   * Lock user account
   * @param {number} id 
   * @returns {Promise}
   */
  lock: async (id) => {
    const response = await api.post(`/users/${id}/lock`);
    return response.data;
  },

  /**
   * Unlock user account
   * @param {number} id 
   * @returns {Promise}
   */
  unlock: async (id) => {
    const response = await api.post(`/users/${id}/unlock`);
    return response.data;
  },

  /**
   * Reset user password (admin)
   * @param {number} id 
   * @param {string} newPassword 
   * @returns {Promise}
   */
  resetPassword: async (id, newPassword) => {
    const response = await api.post(`/users/${id}/reset-password`, {
      password: newPassword,
    });
    return response.data;
  },

  /**
   * Force logout user from all devices
   * @param {number} id 
   * @returns {Promise}
   */
  forceLogout: async (id) => {
    const response = await api.post(`/users/${id}/force-logout`);
    return response.data;
  },

  /**
   * Get user statistics
   * @returns {Promise}
   */
  getStatistics: async () => {
    const response = await api.get('/users/statistics');
    return response.data;
  },
};

export default userService;
