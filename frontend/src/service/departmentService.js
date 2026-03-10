import api from './api';

const departmentService = {
  getAll: async (params = {}) => {
    const response = await api.get('/departments', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/departments/${id}`);
    return response.data;
  },

  create: async (data) => {
    let requestData = data;

    // Handle file upload
    if (data.banner_image instanceof File) {
      requestData = new FormData();
      requestData.append('code', data.code || '');
      requestData.append('name', data.name || '');
      requestData.append('description', data.description || '');
      requestData.append('color', data.color || 'blue');
      requestData.append('status', data.status || 'active');
      requestData.append('banner_image', data.banner_image, data.banner_image.name);
    }

    const response = await api.post('/departments', requestData);
    return response.data;
  },

  update: async (id, data) => {
    let requestData = data;

    // Handle file upload
    if (data.banner_image instanceof File) {
      requestData = new FormData();
      requestData.append('_method', 'PUT');
      requestData.append('code', data.code || '');
      requestData.append('name', data.name || '');
      requestData.append('description', data.description || '');
      requestData.append('color', data.color || 'blue');
      requestData.append('status', data.status || 'active');
      requestData.append('banner_image', data.banner_image, data.banner_image.name);
      
      // Use POST with _method for FormData, Laravel will handle it as PUT
      const response = await api.post(`/departments/${id}`, requestData);
      return response.data;
    }

    const response = await api.put(`/departments/${id}`, requestData);
    return response.data;
  },

  delete: async (id, moveToId = null) => {
    const params = moveToId ? { move_to_department_id: moveToId } : {};
    const response = await api.delete(`/departments/${id}`, { params });
    return response.data;
  },
};

export default departmentService;
