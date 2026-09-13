import { z } from 'zod';
import {
  AssetCategory,
  AssetStatus,
  MaintenanceCycle,
  MaintenanceStatus,
} from '@prisma/client';

export const createAssetSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(2, 'Tên tài sản/thiết bị tối thiểu 2 ký tự'),
  category: z.nativeEnum(AssetCategory),
  buildingId: z.string().optional().nullable(),
  location: z.string().min(2, 'Vị trí lắp đặt không được để trống'),
  supplier: z.string().optional().nullable(),
  installDate: z.string().optional().nullable(),
  warrantyExpiry: z.string().optional().nullable(),
  status: z.nativeEnum(AssetStatus).default(AssetStatus.OPERATIONAL),
  description: z.string().optional().nullable(),
  documents: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
});

export const updateAssetSchema = createAssetSchema.partial();

export const createScheduleSchema = z.object({
  code: z.string().optional(),
  assetId: z.string().min(1, 'Tài sản không được để trống'),
  title: z.string().min(3, 'Tiêu đề lịch bảo trì tối thiểu 3 ký tự'),
  cycle: z.nativeEnum(MaintenanceCycle).default(MaintenanceCycle.MONTHLY),
  lastMaintenance: z.string().optional().nullable(),
  nextMaintenance: z.string().min(1, 'Ngày bảo trì kế tiếp không được để trống'),
  vendor: z.string().optional().nullable(),
  technicianId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateScheduleSchema = createScheduleSchema.partial().extend({
  status: z.nativeEnum(MaintenanceStatus).optional(),
});

export const completeScheduleSchema = z.object({
  findings: z.string().optional(),
  cost: z.number().min(0).optional().default(0),
  notes: z.string().optional(),
  images: z.array(z.string()).default([]),
});

export const createMaintenanceScheduleSchema = createScheduleSchema;
export const completeMaintenanceSchema = completeScheduleSchema;
