import api from './api';

/**
 * Transform frontend section data to backend format
 */
const transformToBackend = (data) => {
  const transformed = { ...data };
  // Map frontend fields to backend fields
  if (data.name !== undefined && !data.section_code) {
    transformed.section_code = data.name;
    delete transformed.name;
  }
  return transformed;
};

const sectionService = {
  /**
   * Get all sections
   * @param {Object} params - Query parameters
   * @returns {Promise}
   */
  getAll: async (params = {}) => {
    const response = await api.get('/sections', { params });
    return response.data;
  },

  /**
   * Get section by ID
   * @param {number} id 
   * @returns {Promise}
   */
  getById: async (id) => {
    const response = await api.get(`/sections/${id}`);
    return response.data;
  },

  /**
   * Create new section
   * @param {Object} sectionData 
   * @returns {Promise}
   */
  create: async (sectionData) => {
    const response = await api.post('/sections', transformToBackend(sectionData));
    return response.data;
  },

  /**
   * Update section
   * @param {number} id 
   * @param {Object} sectionData 
   * @returns {Promise}
   */
  update: async (id, sectionData) => {
    const response = await api.put(`/sections/${id}`, transformToBackend(sectionData));
    return response.data;
  },

  /**
   * Delete section
   * @param {number} id 
   * @returns {Promise}
   */
  delete: async (id) => {
    const response = await api.delete(`/sections/${id}`);
    return response.data;
  },

  /**
   * Get students in section
   * @param {number} sectionId 
   * @returns {Promise}
   */
  getStudents: async (sectionId) => {
    const response = await api.get(`/sections/${sectionId}/students`);
    return response.data;
  },

  /**
   * Get classes in section
   * @param {number} sectionId 
   * @returns {Promise}
   */
  getClasses: async (sectionId) => {
    const response = await api.get(`/sections/${sectionId}/classes`);
    return response.data;
  },
};

export default sectionService;
