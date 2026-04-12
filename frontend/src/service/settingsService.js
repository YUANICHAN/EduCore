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
   * Update settings section using section key
   * @param {string} section
   * @param {Object} settingsData
   * @returns {Promise}
   */
  update: async (section, settingsData) => {
    const payload = settingsData?.[section] ?? settingsData;

    switch (section) {
      case 'general':
        return settingsService.updateGeneral(payload);
      case 'academic':
        return settingsService.updateAcademic(payload);
      case 'users':
        return settingsService.updateUserRoles(payload);
      case 'enrollment':
        return settingsService.updateEnrollment(payload);
      case 'grading':
        return settingsService.updateGrading(payload);
      case 'security':
        return settingsService.updateSystem(payload);
      default:
        throw new Error(`Unsupported settings section: ${section}`);
    }
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
