import api from './api';

const scheduleService = {
  /**
   * Get all schedules
   * @param {Object} params - Query parameters
   * @returns {Promise}
   */
  getAll: async (params = {}) => {
    const response = await api.get('/schedules', { params });
    return response.data;
  },

  /**
   * Get schedule by ID
   * @param {number} id 
   * @returns {Promise}
   */
  getById: async (id) => {
    const response = await api.get(`/schedules/${id}`);
    return response.data;
  },

  /**
   * Create schedule
   * @param {Object} scheduleData 
   * @returns {Promise}
   */
  create: async (scheduleData) => {
    const response = await api.post('/schedules', scheduleData);
    return response.data;
  },

  /**
   * Update schedule
   * @param {number} id 
   * @param {Object} scheduleData 
   * @returns {Promise}
   */
  update: async (id, scheduleData) => {
    const response = await api.put(`/schedules/${id}`, scheduleData);
    return response.data;
  },

  /**
   * Delete schedule
   * @param {number} id 
   * @returns {Promise}
   */
  delete: async (id) => {
    const response = await api.delete(`/schedules/${id}`);
    return response.data;
  },

  /**
   * Get schedules by section
   * @param {number} sectionId 
   * @returns {Promise}
   */
  getBySection: async (sectionId) => {
    const response = await api.get(`/schedules/section/${sectionId}`);
    return response.data;
  },

  /**
   * Get schedules by teacher
   * @param {number} teacherId 
   * @returns {Promise}
   */
  getByTeacher: async (teacherId) => {
    const response = await api.get(`/schedules/teacher/${teacherId}`);
    return response.data;
  },
};

export default scheduleService;
