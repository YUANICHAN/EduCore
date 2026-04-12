import api from './api';

const gradingPeriodService = {
  getAll: async (params = {}) => {
    const response = await api.get('/grading-periods', { params });
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/grading-periods', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/grading-periods/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/grading-periods/${id}`);
    return response.data;
  },

  bulkCreate: async (data) => {
    const response = await api.post('/grading-periods/bulk-create', data);
    return response.data;
  },

  open: async (id) => {
    const response = await api.post(`/grading-periods/${id}/open`);
    return response.data;
  },
};

export default gradingPeriodService;
