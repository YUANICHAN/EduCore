import api from './api';

const enrollmentService = {
  /**
   * Get all enrollments
   * @param {Object} params - Query parameters
   * @returns {Promise}
   */
  getAll: async (params = {}) => {
    const response = await api.get('/enrollments', { params });
    return response.data;
  },

  /**
   * Get enrollment by ID
   * @param {number} id 
   * @returns {Promise}
   */
  getById: async (id) => {
    const response = await api.get(`/enrollments/${id}`);
    return response.data;
  },

  /**
   * Create new enrollment
   * @param {Object} enrollmentData 
   * @returns {Promise}
   */
  create: async (enrollmentData) => {
    const response = await api.post('/enrollments', enrollmentData);
    return response.data;
  },

  /**
   * Update enrollment
   * @param {number} id 
   * @param {Object} enrollmentData 
   * @returns {Promise}
   */
  update: async (id, enrollmentData) => {
    const response = await api.put(`/enrollments/${id}`, enrollmentData);
    return response.data;
  },

  /**
   * Delete enrollment
   * @param {number} id 
   * @returns {Promise}
   */
  delete: async (id) => {
    const response = await api.delete(`/enrollments/${id}`);
    return response.data;
  },

  /**
   * Drop enrollment
   * @param {number} enrollmentId 
   * @returns {Promise}
   */
  drop: async (enrollmentId) => {
    const response = await api.post(`/enrollments/${enrollmentId}/drop`);
    return response.data;
  },

  /**
   * Bulk enroll students in a class
   * @param {Object} data - { class_id, student_ids }
   * @returns {Promise}
   */
  bulkEnroll: async (data) => {
    const response = await api.post('/enrollments/bulk-enroll', data);
    return response.data;
  },

  /**
   * Remove student from class (delete enrollment)
   * @param {number} studentId 
   * @param {number} classId 
   * @returns {Promise}
   */
  remove: async (studentId, classId) => {
    const response = await api.delete('/enrollments/remove', {
      params: { student_id: studentId, class_id: classId }
    });
    return response.data;
  },
};

export default enrollmentService;
