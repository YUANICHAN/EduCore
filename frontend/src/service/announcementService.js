import api from './api';

const announcementService = {
  /**
   * Get all announcements
   * @param {Object} params - Query parameters
   * @returns {Promise}
   */
  getAll: async (params = {}) => {
    const response = await api.get('/announcements', { params });
    return response.data;
  },

  /**
   * Get announcement by ID
   * @param {number} id 
   * @returns {Promise}
   */
  getById: async (id) => {
    const response = await api.get(`/announcements/${id}`);
    return response.data;
  },

  /**
   * Create announcement
   * @param {Object} announcementData 
   * @returns {Promise}
   */
  create: async (announcementData) => {
    const response = await api.post('/announcements', announcementData);
    return response.data;
  },

  /**
   * Update announcement
   * @param {number} id 
   * @param {Object} announcementData 
   * @returns {Promise}
   */
  update: async (id, announcementData) => {
    const response = await api.put(`/announcements/${id}`, announcementData);
    return response.data;
  },

  /**
   * Delete announcement
   * @param {number} id 
   * @returns {Promise}
   */
  delete: async (id) => {
    const response = await api.delete(`/announcements/${id}`);
    return response.data;
  },

  /**
   * Get announcements by section
   * @param {number} sectionId 
   * @returns {Promise}
   */
  getBySection: async (sectionId) => {
    const response = await api.get(`/announcements/section/${sectionId}`);
    return response.data;
  },

  /**
   * Get announcements by class
   * @param {number} classId 
   * @returns {Promise}
   */
  getByClass: async (classId) => {
    const response = await api.get(`/announcements/class/${classId}`);
    return response.data;
  },
};

export default announcementService;
