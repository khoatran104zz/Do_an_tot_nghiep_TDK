import { apiClient } from '@/lib/api-client';

export const aiClientService = {
  async chat(message: string) {
    return apiClient<{ response: string }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },

  async classifyIncident(title: string, content: string) {
    return apiClient<{
      category: 'WATER' | 'ELECTRIC' | 'ELEVATOR' | 'SECURITY' | 'CLEANLINESS' | 'OTHER';
      priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL';
      department: string;
      reason: string;
    }>('/ai/classify-incident', {
      method: 'POST',
      body: JSON.stringify({ title, content }),
    });
  },
};
