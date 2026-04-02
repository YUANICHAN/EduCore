import api from './api';

const teacherService = {
  /**
   * Get all teachers
   * @param {Object} params - Query parameters
   * @returns {Promise}
   */
  getAll: async (params = {}) => {
    const response = await api.get('/teachers', { params });
    return response.data;
  },

  /**
   * Get teacher by ID
   * @param {number} id 
   * @returns {Promise}
   */
  getById: async (id) => {
    const response = await api.get(`/teachers/${id}`);
    return response.data;
  },

  /**
   * Create new teacher
   * @param {Object} teacherData 
   * @returns {Promise}
   */
  create: async (teacherData) => {
    const formData = new FormData();
    Object.entries(teacherData).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, value);
      }
    });
    const response = await api.post('/teachers', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Update teacher
   * @param {number} id 
   * @param {Object} teacherData 
   * @returns {Promise}
   */
  update: async (id, teacherData) => {
    const formData = new FormData();
    Object.entries(teacherData).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, value);
      }
    });
    formData.append('_method', 'PUT');
    const response = await api.post(`/teachers/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Delete teacher
   * @param {number} id 
   * @returns {Promise}
   */
  delete: async (id) => {
    const response = await api.delete(`/teachers/${id}`);
    return response.data;
  },

  /**
   * Get teacher's classes
   * @param {number} teacherId 
   * @param {Object} params
   * @returns {Promise}
   */
  getClasses: async (teacherId, params = {}) => {
    const response = await api.get(`/teachers/${teacherId}/classes`, { params });
    return response.data;
  },

  /**
   * Get teacher's sections
   * @param {number} teacherId 
   * @returns {Promise}
   */
  getSections: async (teacherId) => {
    const response = await api.get(`/teachers/${teacherId}/sections`);
    return response.data;
  },

  /**
   * Get teacher's schedule
   * @param {number} teacherId 
   * @returns {Promise}
   */
  getSchedule: async (teacherId) => {
    const response = await api.get(`/teachers/${teacherId}/schedule`);
    return response.data;
  },

  /**
   * Get teacher's detailed workload information
   * @param {number} teacherId
   * @param {Object} params - { academic_year_id }
   * @returns {Promise}
   */
  getWorkload: async (teacherId, params = {}) => {
    const response = await api.get(`/teachers/${teacherId}/workload`, { params });
    return response.data;
  },

  /**
   * Assign a single class to a teacher
   * @param {number} teacherId
   * @param {number} classId
   * @returns {Promise}
   */
  assignClass: async (teacherId, classId) => {
    const response = await api.post(`/teachers/${teacherId}/assign-class`, { class_id: classId });
    return response.data;
  },

  /**
   * Create a new class and assign to teacher
   * @param {number} teacherId
   * @param {Object} data - { section_id, subject_id, academic_year_id, class_code?, status? }
   * @returns {Promise}
   */
  createAndAssignClass: async (teacherId, data) => {
    const response = await api.post(`/teachers/${teacherId}/create-and-assign`, data);
    return response.data;
  },

  /**
   * Unassign a class from a teacher
   * @param {number} teacherId
   * @param {number} classId
   * @param {Object} options - { cancel_class?: boolean }
   * @returns {Promise}
   */
  unassignClass: async (teacherId, classId, options = {}) => {
    const response = await api.post(`/teachers/${teacherId}/unassign-class`, {
      class_id: classId,
      ...options,
    });
    return response.data;
  },

  /**
   * Permanently delete a class assigned to a teacher (guarded by backend checks)
   * @param {number} teacherId
   * @param {number} classId
   * @returns {Promise}
   */
  deleteClass: async (teacherId, classId) => {
    const response = await api.post(`/teachers/${teacherId}/delete-class`, { class_id: classId });
    return response.data;
  },

  /**
   * Bulk assign multiple classes to a teacher
   * @param {number} teacherId
   * @param {Array<number>} classIds
   * @returns {Promise}
   */
  bulkAssignClasses: async (teacherId, classIds) => {
    const response = await api.post(`/teachers/${teacherId}/bulk-assign`, { class_ids: classIds });
    return response.data;
  },

  /**
   * Check for workload/schedule conflicts before assignment
   * @param {number} teacherId
   * @param {Array<number>} classIds
   * @returns {Promise}
   */
  checkWorkloadConflicts: async (teacherId, classIds) => {
    const response = await api.post(`/teachers/${teacherId}/check-conflicts`, { class_ids: classIds });
    return response.data;
  },

  /**
   * Get unassigned classes (no teacher assigned)
   * @param {Object} params - { academic_year_id, section_id, subject_id, search }
   * @returns {Promise}
   */
  getUnassignedClasses: async (params = {}) => {
    const response = await api.get('/teachers/unassigned-classes', { params });
    return response.data;
  },

  /**
   * Get available classes for assignment (all classes except current teacher's)
   * @param {number} excludeTeacherId - Teacher ID to exclude
   * @param {Object} params
   * @returns {Promise}
   */
  getAvailableClasses: async (excludeTeacherId, params = {}) => {
    const response = await api.get('/teachers/unassigned-classes', {
      params: { ...params, exclude_teacher_id: excludeTeacherId }
    });
    return response.data;
  },

  /**
   * Get workload summary for all teachers
   * @param {Object} params - { academic_year_id }
   * @returns {Promise}
   */
  getWorkloadSummary: async (params = {}) => {
    const response = await api.get('/teachers/workload-summary', { params });
    return response.data;
  },
};

export default teacherService;
