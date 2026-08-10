import api from './api';

export const chatService = {
  createConversation: (recipientId: string, listingId?: string, rentalRequestId?: string) =>
    api.post('/conversations', { recipientId, listingId, rentalRequestId }),
  getConversations: () => api.get('/conversations'),
  getMessages: (conversationId: string) => api.get(`/conversations/${conversationId}/messages`),
  sendMessage: (conversationId: string, text: string) =>
    api.post(`/conversations/${conversationId}/messages`, { text }),
  markAsRead: (conversationId: string) => api.patch(`/conversations/${conversationId}/read`),
};

export default chatService;
