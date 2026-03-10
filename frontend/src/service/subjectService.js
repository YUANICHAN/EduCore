import api from './api';

/**
 * Transform frontend subject data to backend format
 */
const transformToBackend = (data) => {
  const transformed = { ...data };
  // Map frontend fields to backend fields
  if (data.code !== undefined) {
    transformed.subject_code = data.code;
    delete transformed.code;
  }
  if (data.name !== undefined) {
    transformed.subject_name = data.name;
    delete transformed.name;
  }
  return transformed;
};

const subjectService = {
  /**
   * Get all subjects
   * @param {Object} params - Query parameters
   * @returns {Promise}
   */
  getAll: async (params = {}) => {
    const response = await api.get('/subjects', { params });
    return response.data;
  },

  /**
   * Get subject by ID
   * @param {number} id 
   * @returns {Promise}
   */
  getById: async (id) => {
    const response = await api.get(`/subjects/${id}`);
    return response.data;
  },

  /**
   * Create new subject
   * @param {Object} subjectData 
   * @returns {Promise}
   */
  create: async (subjectData) => {
    const response = await api.post('/subjects', transformToBackend(subjectData));
    return response.data;
  },

  /**
   * Update subject
   * @param {number} id 
   * @param {Object} subjectData 
   * @returns {Promise}
   */
  update: async (id, subjectData) => {
    const response = await api.put(`/subjects/${id}`, transformToBackend(subjectData));
    return response.data;
  },

  /**
   * Delete subject
   * @param {number} id 
   * @returns {Promise}
   */
  delete: async (id) => {
    const response = await api.delete(`/subjects/${id}`);
    return response.data;
  },

  /**
   * Get classes for a subject
   * @param {number} subjectId 
   * @returns {Promise}
   */
  getClasses: async (subjectId) => {
    const response = await api.get(`/subjects/${subjectId}/classes`);
    return response.data;
  },
};

export default subjectService;
