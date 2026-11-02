import { apiClient } from '@/lib/api-client';

export const aiClientService = {
  async chat(message: string) {
    const res = await apiClient<{
      success: boolean;
      data: {
        response: string;
        actions?: Array<{ label: string; href?: string; actionType?: string; query?: string }>;
      };
    }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
    return (res as any)?.data || res;
  },

  async classifyIncident(title: string, content: string) {
    const res = await apiClient<{
      success: boolean;
      data: {
        category: 'WATER' | 'ELECTRIC' | 'ELEVATOR' | 'SECURITY' | 'CLEANLINESS' | 'OTHER';
        priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL';
        department: string;
        reason: string;
      };
    }>('/ai/classify-incident', {
      method: 'POST',
      body: JSON.stringify({ title, content }),
    });
    return res;
  },
};
