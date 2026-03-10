import api from './api';

/**
 * Transform frontend program data to backend format
 */
const transformToBackend = (data) => {
  const transformed = { ...data };

  // Map frontend fields to backend fields
  if (data.code !== undefined) {
    transformed.program_code = data.code;
    delete transformed.code;
  }

  if (data.name !== undefined) {
    transformed.program_name = data.name;
    delete transformed.name;
  }

  return transformed;
};

const buildProgramPayload = (data, isUpdate = false) => {
  const transformed = transformToBackend(data);

  if (transformed.program_image instanceof File) {
    const formData = new FormData();

    if (isUpdate) {
      formData.append('_method', 'PUT');
    }

    Object.entries(transformed).forEach(([key, value]) => {
      if (value === null || value === undefined || key === 'program_image') {
        return;
      }
      formData.append(key, value);
    });

    formData.append('program_image', transformed.program_image, transformed.program_image.name);
    return formData;
  }

  return transformed;
};

const programService = {
  /**
   * Get all programs
   * @param {Object} params - Query parameters
   * @returns {Promise}
   */
  getAll: async (params = {}) => {
    const response = await api.get('/programs', { params });
    return response.data;
  },

  /**
   * Get program by ID
   * @param {number} id
   * @returns {Promise}
   */
  getById: async (id) => {
    const response = await api.get(`/programs/${id}`);
    return response.data;
  },

  /**
   * Create new program
   * @param {Object} programData
   * @returns {Promise}
   */
  create: async (programData) => {
    const payload = buildProgramPayload(programData, false);
    const response = await api.post('/programs', payload);
    return response.data;
  },

  /**
   * Update program
   * @param {number} id
   * @param {Object} programData
   * @returns {Promise}
   */
  update: async (id, programData) => {
    const payload = buildProgramPayload(programData, true);

    if (payload instanceof FormData) {
      const response = await api.post(`/programs/${id}`, payload);
      return response.data;
    }

    const response = await api.put(`/programs/${id}`, payload);
    return response.data;
  },

  /**
   * Delete program
   * @param {number} id
   * @returns {Promise}
   */
  delete: async (id) => {
    const response = await api.delete(`/programs/${id}`);
    return response.data;
  },
};

export default programService;
