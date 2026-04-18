import api from './api';

const studentService = {
  /**
   * Get all students
   * @param {Object} params - Query parameters
   * @returns {Promise}
   */
  getAll: async (params = {}) => {
    const response = await api.get('/students', { params });
    return response.data;
  },

  /**
   * Get student by ID
   * @param {number} id 
   * @returns {Promise}
   */
  getById: async (id) => {
    const response = await api.get(`/students/${id}`);
    return response.data;
  },

  /**
   * Create new student
   * @param {Object} studentData 
   * @returns {Promise}
   */
  create: async (studentData) => {
    const formData = new FormData();
    Object.entries(studentData).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, value);
      }
    });
    const response = await api.post('/students', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Update student
   * @param {number} id 
   * @param {Object} studentData 
   * @returns {Promise}
   */
  update: async (id, studentData) => {
    const formData = new FormData();
    Object.entries(studentData).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, value);
      }
    });
    formData.append('_method', 'PUT');
    const response = await api.post(`/students/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Delete student
   * @param {number} id 
   * @returns {Promise}
   */
  delete: async (id) => {
    const response = await api.delete(`/students/${id}`);
    return response.data;
  },

  /**
   * Get student's enrollments
   * @param {number} studentId 
   * @returns {Promise}
   */
  getEnrollments: async (studentId) => {
    const response = await api.get(`/students/${studentId}/enrollments`);
    return response.data;
  },

  /**
   * Get student's grades
   * @param {number} studentId 
   * @param {Object} params
   * @returns {Promise}
   */
  getGrades: async (studentId, params = {}) => {
    const response = await api.get(`/students/${studentId}/grades`, { params });
    return response.data;
  },

  /**
   * Get student's attendance records
   * @param {number} studentId 
   * @returns {Promise}
   */
  getAttendance: async (studentId) => {
    const response = await api.get(`/students/${studentId}/attendance`);
    return response.data;
  },

  /**
   * Get student's schedule
   * @param {number} studentId 
   * @returns {Promise}
   */
  getSchedule: async (studentId) => {
    const response = await api.get(`/students/${studentId}/schedule`);
    return response.data;
  },
};

export default studentService;
