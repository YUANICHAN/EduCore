import api from './api';

const settingsService = {
  /**
   * Get all settings
   * @returns {Promise}
   */
  getAll: async () => {
    const response = await api.get('/settings');
    return response.data;
  },

  /**
   * Update general settings
   * @param {Object} settingsData 
   * @returns {Promise}
   */
  updateGeneral: async (settingsData) => {
    const response = await api.put('/settings/general', settingsData);
    return response.data;
  },

  /**
   * Update academic settings
   * @param {Object} settingsData 
   * @returns {Promise}
   */
  updateAcademic: async (settingsData) => {
    const response = await api.put('/settings/academic', settingsData);
    return response.data;
  },

  /**
   * Update user role settings
   * @param {Object} settingsData 
   * @returns {Promise}
   */
  updateUserRoles: async (settingsData) => {
    const response = await api.put('/settings/user-roles', settingsData);
    return response.data;
  },

  /**
   * Update enrollment settings
   * @param {Object} settingsData 
   * @returns {Promise}
   */
  updateEnrollment: async (settingsData) => {
    const response = await api.put('/settings/enrollment', settingsData);
    return response.data;
  },

  /**
   * Update grading settings
   * @param {Object} settingsData 
   * @returns {Promise}
   */
  updateGrading: async (settingsData) => {
    const response = await api.put('/settings/grading', settingsData);
    return response.data;
  },

  /**
   * Update system settings
   * @param {Object} settingsData 
   * @returns {Promise}
   */
  updateSystem: async (settingsData) => {
    const response = await api.put('/settings/system', settingsData);
    return response.data;
  },

  /**
   * Upload school logo
   * @param {File} logoFile 
   * @returns {Promise}
   */
  uploadLogo: async (logoFile) => {
    const formData = new FormData();
    formData.append('logo', logoFile);
    const response = await api.post('/settings/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default settingsService;
