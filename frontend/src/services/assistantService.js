import api from './api';

export const assistantService = {
  async sendMessage(message, context = {}, history = []) {
    const response = await api.post('/assistant/chat', {
      message,
      context,
      history,
    });
    return response.data;
  }
};

