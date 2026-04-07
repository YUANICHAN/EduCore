import api from './api';

const roomService = {
  getAll: async (params = {}) => {
    const response = await api.get('/rooms', { params });
    return response.data;
  },

  create: async (payload) => {
    const response = await api.post('/rooms', payload);
    return response.data;
  },

  update: async (id, payload) => {
    const response = await api.put(`/rooms/${id}`, payload);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/rooms/${id}`);
    return response.data;
  },
};

export default roomService;
