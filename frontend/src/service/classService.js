import api from './api';

const inFlightGetAllRequests = new Map();

const buildStableParamsKey = (params = {}) => {
  const entries = Object.entries(params).sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify(entries);
};

const classService = {
  /**
   * Get all classes
   * @param {Object} params - Query parameters
   * @returns {Promise}
   */
  getAll: async (params = {}) => {
    const key = buildStableParamsKey(params);
    if (inFlightGetAllRequests.has(key)) {
      return inFlightGetAllRequests.get(key);
    }

    const requestPromise = api
      .get('/classes', { params })
      .then((response) => response.data)
      .finally(() => {
        inFlightGetAllRequests.delete(key);
      });

    inFlightGetAllRequests.set(key, requestPromise);
    return requestPromise;
  },

  /**
   * Get class by ID
   * @param {number} id 
   * @returns {Promise}
   */
  getById: async (id) => {
    const response = await api.get(`/classes/${id}`);
    return response.data;
  },

  /**
   * Create new class
   * @param {Object} classData 
   * @returns {Promise}
   */
  create: async (classData) => {
    const response = await api.post('/classes', classData);
    return response.data;
  },

  /**
   * Update class
   * @param {number} id 
   * @param {Object} classData 
   * @returns {Promise}
   */
  update: async (id, classData) => {
    const response = await api.put(`/classes/${id}`, classData);
    return response.data;
  },

  /**
   * Delete class
   * @param {number} id 
   * @returns {Promise}
   */
  delete: async (id) => {
    const response = await api.delete(`/classes/${id}`);
    return response.data;
  },

  /**
   * Get students in class
   * @param {number} classId 
   * @param {Object} params
   * @returns {Promise}
   */
  getStudents: async (classId, params = {}) => {
    const response = await api.get(`/classes/${classId}/students`, { params });
    return response.data;
  },

  /**
   * Export enrolled students list for a class as Excel file
   * @param {number} classId
   * @returns {Promise}
   */
  exportStudentsExcel: async (classId) => {
    const response = await api.get(`/classes/${classId}/students/export-excel`, {
      responseType: 'blob',
    });
    return response;
  },

  /**
   * Get class schedule
   * @param {number} classId 
   * @returns {Promise}
   */
  getSchedule: async (classId) => {
    const response = await api.get(`/classes/${classId}/schedule`);
    return response.data;
  },

  /**
   * Get class attendance records
   * @param {number} classId 
   * @returns {Promise}
   */
  getAttendance: async (classId) => {
    const response = await api.get(`/classes/${classId}/attendance`);
    return response.data;
  },

  /**
   * Get class grades
   * @param {number} classId 
   * @returns {Promise}
   */
  getGrades: async (classId) => {
    const response = await api.get(`/classes/${classId}/grades`);
    return response.data;
  },

  /**
   * Get grading scheme for a class
   * @param {number} classId
   * @returns {Promise}
   */
  getGradingScheme: async (classId) => {
    const response = await api.get(`/classes/${classId}/grading-scheme`);
    return response.data;
  },

  /**
   * Update grading scheme for a class
   * @param {number} classId
   * @param {{quizzes:number, exams:number, projects:number, attendance:number}} payload
   * @returns {Promise}
   */
  updateGradingScheme: async (classId, payload) => {
    const response = await api.put(`/classes/${classId}/grading-scheme`, payload);
    return response.data;
  },

  /**
   * Check for teacher schedule conflicts
   * @param {Object} params - { teacher_id, day_of_week, start_time, end_time, exclude_class_id? }
   * @returns {Promise}
   */
  checkTeacherConflicts: async (params) => {
    const response = await api.post('/classes/check-teacher-conflicts', params);
    return response.data;
  },

  /**
   * Check for section schedule conflicts
   * @param {Object} params - { section_id, day_of_week, start_time, end_time, exclude_class_id? }
   * @returns {Promise}
   */
  checkSectionConflicts: async (params) => {
    const response = await api.post('/classes/check-section-conflicts', params);
    return response.data;
  },

  /**
   * Check for room schedule conflicts
   * @param {Object} params - { room, day_of_week, start_time, end_time, exclude_class_id? }
   * @returns {Promise}
   */
  checkRoomConflicts: async (params) => {
    const response = await api.post('/classes/check-room-conflicts', params);
    return response.data;
  },

  /**
   * Get teacher availability for scheduling
   * @param {number} teacherId 
   * @returns {Promise}
   */
  getTeacherAvailability: async (teacherId) => {
    const response = await api.get(`/teachers/${teacherId}/availability`);
    return response.data;
  },

  getSchedules(classId, params = {}) {
    return api.get(`/classes/${classId}/schedules`, { params });
  },

  createSchedule(classId, payload) {
    return api.post(`/classes/${classId}/schedules`, payload);
  },

  updateSchedule(scheduleId, payload) {
    return api.put(`/schedules/${scheduleId}`, payload);
  },

  deleteSchedule(scheduleId) {
    return api.delete(`/schedules/${scheduleId}`);
  },
};

export default classService;
