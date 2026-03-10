import api from './api';

const attendanceService = {
  /**
   * Get all attendance records
   * @param {Object} params - Query parameters
   * @returns {Promise}
   */
  getAll: async (params = {}) => {
    const response = await api.get('/attendance', { params });
    return response.data;
  },

  /**
   * Get attendance by ID
   * @param {number} id 
   * @returns {Promise}
   */
  getById: async (id) => {
    const response = await api.get(`/attendance/${id}`);
    return response.data;
  },

  /**
   * Create attendance record
   * @param {Object} attendanceData 
   * @returns {Promise}
   */
  create: async (attendanceData) => {
    const response = await api.post('/attendance', attendanceData);
    return response.data;
  },

  /**
   * Update attendance record
   * @param {number} id 
   * @param {Object} attendanceData 
   * @returns {Promise}
   */
  update: async (id, attendanceData) => {
    const response = await api.put(`/attendance/${id}`, attendanceData);
    return response.data;
  },

  /**
   * Delete attendance record
   * @param {number} id 
   * @returns {Promise}
   */
  delete: async (id) => {
    const response = await api.delete(`/attendance/${id}`);
    return response.data;
  },

  /**
   * Record attendance for multiple students
   * @param {Object} recordData - { class_id, date, records: [{ student_id, status, remarks }] }
   * @returns {Promise}
   */
  record: async (recordData) => {
    const response = await api.post('/attendance/record', recordData);
    return response.data;
  },

  /**
   * Get attendance by class and date
   * @param {number} classId 
   * @param {string} date - Format: YYYY-MM-DD
   * @returns {Promise}
   */
  getByClassAndDate: async (classId, date) => {
    const response = await api.get(`/attendance/class/${classId}/date/${date}`);
    return response.data;
  },
};

export default attendanceService;
