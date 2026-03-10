import api from './api';

const dashboardService = {
  /**
   * Get admin dashboard statistics
   * @param {number} academicYearId - Optional academic year filter
   * @returns {Promise}
   */
  getAdminDashboard: async (academicYearId = null) => {
    const params = academicYearId ? { academic_year_id: academicYearId } : {};
    const response = await api.get('/dashboard/admin', { params });
    return response.data;
  },

  /**
   * Get teacher dashboard statistics
   * @returns {Promise}
   */
  getTeacherDashboard: async () => {
    const response = await api.get('/dashboard/teacher');
    return response.data;
  },

  /**
   * Get student dashboard statistics
   * @returns {Promise}
   */
  getStudentDashboard: async () => {
    const response = await api.get('/dashboard/student');
    return response.data;
  },
};

export default dashboardService;
