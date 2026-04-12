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
   * Backward-compatible bulk save for attendance page.
   * Accepts either:
   * 1) array of { student_id, class_id, date, status, remarks }
   * 2) object { class_id, date, students: [{ student_id, status, remarks, time_in?, time_out? }] }
   */
  bulkSave: async (payload) => {
    let recordData = payload;

    if (Array.isArray(payload)) {
      if (payload.length === 0) {
        return { success: true, message: 'No attendance rows to save', data: [] };
      }

      const first = payload[0] || {};
      recordData = {
        class_id: first.class_id,
        date: first.date,
        students: payload.map((row) => ({
          student_id: row.student_id,
          status: row.status,
          remarks: row.remarks || '',
          time_in: row.time_in || null,
          time_out: row.time_out || null,
        })),
      };
    }

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
