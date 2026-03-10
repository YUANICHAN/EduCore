import api from './api';

const gradeService = {
  /**
   * Get all grades
   * @param {Object} params - Query parameters
   * @returns {Promise}
   */
  getAll: async (params = {}) => {
    const response = await api.get('/grades', { params });
    return response.data;
  },

  /**
   * Get grade by ID
   * @param {number} id 
   * @returns {Promise}
   */
  getById: async (id) => {
    const response = await api.get(`/grades/${id}`);
    return response.data;
  },

  /**
   * Create grade
   * @param {Object} gradeData 
   * @returns {Promise}
   */
  create: async (gradeData) => {
    const response = await api.post('/grades', gradeData);
    return response.data;
  },

  /**
   * Update grade
   * @param {number} id 
   * @param {Object} gradeData 
   * @returns {Promise}
   */
  update: async (id, gradeData) => {
    const response = await api.put(`/grades/${id}`, gradeData);
    return response.data;
  },

  /**
   * Delete grade
   * @param {number} id 
   * @returns {Promise}
   */
  delete: async (id) => {
    const response = await api.delete(`/grades/${id}`);
    return response.data;
  },

  /**
   * Bulk create grades
   * @param {Array} gradesData - Array of grade objects
   * @returns {Promise}
   */
  bulkCreate: async (gradesData) => {
    const response = await api.post('/grades/bulk', { grades: gradesData });
    return response.data;
  },

  /**
   * Get grades by student
   * @param {number} studentId 
   * @returns {Promise}
   */
  getByStudent: async (studentId) => {
    const response = await api.get(`/grades/student/${studentId}`);
    return response.data;
  },

  /**
   * Get grades by class
   * @param {number} classId 
   * @returns {Promise}
   */
  getByClass: async (classId) => {
    const response = await api.get(`/grades/class/${classId}`);
    return response.data;
  },

  /**
   * Lock a grade (Teacher/Admin)
   * @param {number} gradeId 
   * @returns {Promise}
   */
  lock: async (gradeId) => {
    const response = await api.post(`/grades/${gradeId}/lock`);
    return response.data;
  },

  /**
   * Unlock a grade (Admin only)
   * @param {number} gradeId 
   * @returns {Promise}
   */
  unlock: async (gradeId) => {
    const response = await api.post(`/grades/${gradeId}/unlock`);
    return response.data;
  },

  /**
   * Lock all grades for a grading period
   * @param {Object} periodData - { class_id, grading_period, academic_year_id? }
   * @returns {Promise}
   */
  lockByPeriod: async (periodData) => {
    const response = await api.post('/grades/lock-period', periodData);
    return response.data;
  },
};

export default gradeService;
