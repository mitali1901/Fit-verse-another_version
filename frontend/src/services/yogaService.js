import api from './api';

export const yogaService = {
  async getPoses() {
    const response = await api.get('/yoga/poses');
    return response.data.poses;
  },

  async createSession(sessionData) {
    const response = await api.post('/yoga/sessions', sessionData);
    return response.data;
  },

  async getSessions(limit = 20) {
    const response = await api.get(`/yoga/sessions?limit=${limit}`);
    return response.data.sessions;
  },

  async getSummary() {
    const response = await api.get('/yoga/sessions/summary');
    return response.data.summary;
  }
};

