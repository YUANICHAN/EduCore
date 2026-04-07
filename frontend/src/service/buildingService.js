import api from './api';

const buildingService = {
  getAll: async (params = {}) => {
    const response = await api.get('/buildings', { params });
    return response.data;
  },

  create: async (payload) => {
    const response = await api.post('/buildings', payload);
    return response.data;
  },

  update: async (id, payload) => {
    const response = await api.put(`/buildings/${id}`, payload);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/buildings/${id}`);
    return response.data;
  },
};

export default buildingService;
