import api from './api';

const reportService = {
  /**
   * Get all reports
   * @param {Object} params - Query parameters
   * @returns {Promise}
   */
  getAll: async (params = {}) => {
    const response = await api.get('/reports', { params });
    return response.data;
  },

  /**
   * Get report by ID
   * @param {number} id 
   * @returns {Promise}
   */
  getById: async (id) => {
    const response = await api.get(`/reports/${id}`);
    return response.data;
  },

  /**
   * Create report
   * @param {Object} reportData 
   * @returns {Promise}
   */
  create: async (reportData) => {
    const response = await api.post('/reports', reportData);
    return response.data;
  },

  /**
   * Update report
   * @param {number} id 
   * @param {Object} reportData 
   * @returns {Promise}
   */
  update: async (id, reportData) => {
    const response = await api.put(`/reports/${id}`, reportData);
    return response.data;
  },

  /**
   * Delete report
   * @param {number} id 
   * @returns {Promise}
   */
  delete: async (id) => {
    const response = await api.delete(`/reports/${id}`);
    return response.data;
  },

  /**
   * Get reports by student
   * @param {number} studentId 
   * @returns {Promise}
   */
  getByStudent: async (studentId) => {
    const response = await api.get(`/reports/student/${studentId}`);
    return response.data;
  },

  /**
   * Generate grade report
   * @param {Object} params - { student_id?, class_id?, section_id?, academic_year_id?, grading_period? }
   * @returns {Promise}
   */
  generateGradeReport: async (params) => {
    const response = await api.post('/reports/generate/grade', params);
    return response.data;
  },

  /**
   * Generate attendance report
   * @param {Object} params - { student_id?, class_id?, section_id?, start_date?, end_date? }
   * @returns {Promise}
   */
  generateAttendanceReport: async (params) => {
    const response = await api.post('/reports/generate/attendance', params);
    return response.data;
  },

  /**
   * Generate class report
   * @param {Object} params - { class_id, include_grades?, include_attendance? }
   * @returns {Promise}
   */
  generateClassReport: async (params) => {
    const response = await api.post('/reports/generate/class', params);
    return response.data;
  },

  /**
   * Generate performance report
   * @param {Object} params - { student_id?, section_id?, academic_year_id? }
   * @returns {Promise}
   */
  generatePerformanceReport: async (params) => {
    const response = await api.post('/reports/generate/performance', params);
    return response.data;
  },
};

export default reportService;
