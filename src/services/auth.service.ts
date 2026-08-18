import { apiClient } from '@/lib/api-client';
import { RegisterInput } from '@/modules/auth/auth.schema';

export const authClientService = {
  async register(data: RegisterInput) {
    return apiClient('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
