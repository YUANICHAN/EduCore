import api from './api';

const academicYearService = {
  /**
   * Get all academic years
   * @param {Object} params - Query parameters
   * @returns {Promise}
   */
  getAll: async (params = {}) => {
    const response = await api.get('/academic-years', { params });
    return response.data;
  },

  /**
   * Get current academic year
   * @returns {Promise}
   */
  getCurrent: async () => {
    const response = await api.get('/academic-years/current');
    return response.data;
  },

  /**
   * Get academic year by ID
   * @param {number} id 
   * @returns {Promise}
   */
  getById: async (id) => {
    const response = await api.get(`/academic-years/${id}`);
    return response.data;
  },

  /**
   * Create new academic year
   * @param {Object} data 
   * @returns {Promise}
   */
  create: async (data) => {
    const response = await api.post('/academic-years', data);
    return response.data;
  },

  /**
   * Update academic year
   * @param {number} id 
   * @param {Object} data 
   * @returns {Promise}
   */
  update: async (id, data) => {
    const response = await api.put(`/academic-years/${id}`, data);
    return response.data;
  },

  /**
   * Delete academic year
   * @param {number} id 
   * @returns {Promise}
   */
  delete: async (id) => {
    const response = await api.delete(`/academic-years/${id}`);
    return response.data;
  },
};

export default academicYearService;
