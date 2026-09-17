import {
  AssetCategory,
  AssetStatus,
  MaintenanceCycle,
  MaintenanceStatus,
} from '@prisma/client';

export interface AssetFilter {
  search?: string;
  category?: AssetCategory;
  status?: AssetStatus;
  buildingId?: string;
  buildingIds?: string[];
  technicianId?: string;
  page?: number;
  limit?: number;
}

export interface CreateAssetDto {
  code?: string;
  name: string;
  category: AssetCategory;
  buildingId?: string | null;
  location: string;
  supplier?: string | null;
  installDate?: string | Date | null;
  warrantyExpiry?: string | Date | null;
  status?: AssetStatus;
  description?: string | null;
  documents?: string[];
  images?: string[];
}

export interface UpdateAssetDto extends Partial<CreateAssetDto> {}

export interface ScheduleFilter {
  search?: string;
  assetId?: string;
  technicianId?: string;
  buildingId?: string;
  buildingIds?: string[];
  status?: MaintenanceStatus;
  cycle?: MaintenanceCycle;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface CreateScheduleDto {
  code?: string;
  assetId: string;
  title: string;
  cycle?: MaintenanceCycle;
  lastMaintenance?: string | Date | null;
  nextMaintenance: string | Date;
  vendor?: string | null;
  technicianId?: string | null;
  notes?: string | null;
}

export interface UpdateScheduleDto extends Partial<CreateScheduleDto> {
  status?: MaintenanceStatus;
}

export interface CompleteScheduleDto {
  findings?: string;
  cost?: number;
  notes?: string;
  images?: string[];
}

export interface AssetDashboardStats {
  totalAssets: number;
  operationalCount: number;
  maintenanceCount: number;
  brokenCount: number;
  upcomingMaintenanceCount: number;
  overdueMaintenanceCount: number;
}
