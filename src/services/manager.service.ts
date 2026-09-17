import { apiClient } from '@/lib/api-client';

export interface ManagerUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  assignedBuildings: Array<{
    id: string;
    code: string;
    name: string;
  }>;
}

export interface CreateManagerDto {
  email: string;
  fullName: string;
  phone?: string;
  password: string;
  buildingIds?: string[];
}

export interface AccessControlData {
  roles: Array<{
    code: string;
    name: string;
    scope: string;
    description: string;
    userCount: number;
  }>;
  matrix: Record<string, string[]>;
  auditLogs: Array<{
    id: string;
    actorEmail: string;
    action: string;
    entity: string;
    metadata: any;
    createdAt: string;
  }>;
}

export const managerClientService = {
  async getManagers(): Promise<{ data: ManagerUser[] }> {
    return apiClient('/managers');
  },

  async createManager(data: CreateManagerDto): Promise<{ data: ManagerUser }> {
    return apiClient('/managers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getManagerById(id: string): Promise<{ data: ManagerUser }> {
    return apiClient(`/managers/${id}`);
  },

  async updateManager(id: string, data: Partial<CreateManagerDto & { isActive: boolean }>): Promise<{ data: ManagerUser }> {
    return apiClient(`/managers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deactivateManager(id: string): Promise<any> {
    return apiClient(`/managers/${id}`, {
      method: 'DELETE',
    });
  },

  async assignBuildings(id: string, buildingIds: string[]): Promise<any> {
    return apiClient(`/managers/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ buildingIds }),
    });
  },

  async getAccessControlMatrix(): Promise<{ data: AccessControlData }> {
    return apiClient('/access-control/matrix');
  },
};
