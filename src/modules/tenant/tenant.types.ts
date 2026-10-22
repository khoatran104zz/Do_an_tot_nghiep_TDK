export interface TenantItem {
  id: string;
  code: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    buildings: number;
    users: number;
  };
}

export interface CreateTenantDto {
  code: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  status?: string;
  // Optional initial tenant admin credentials
  adminFullName?: string | null;
  adminEmail?: string | null;
  adminPassword?: string | null;
  adminPhone?: string | null;
}

export interface UpdateTenantDto {
  name?: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export interface TenantFilter {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface CreateTenantAdminDto {
  email: string;
  fullName: string;
  password: string;
  phone?: string | null;
}
