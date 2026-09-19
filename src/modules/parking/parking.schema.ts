import { z } from 'zod';
import {
  SlotVehicleType,
  ParkingSlotStatus,
  ParkingRequestStatus,
  ParkingAssignmentStatus,
  VehicleType,
} from '@prisma/client';

export const createParkingAreaSchema = z.object({
  buildingId: z.string().min(1, 'Mã tòa nhà là bắt buộc'),
  code: z.string().min(1, 'Mã khu vực là bắt buộc').max(20).toUpperCase(),
  name: z.string().min(1, 'Tên khu vực là bắt buộc').max(100),
  floor: z.number().int().default(-1),
  totalCapacity: z.number().int().min(0).default(0),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const updateParkingAreaSchema = z.object({
  code: z.string().min(1).max(20).toUpperCase().optional(),
  name: z.string().min(1).max(100).optional(),
  floor: z.number().int().optional(),
  totalCapacity: z.number().int().min(0).optional(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const createParkingZoneSchema = z.object({
  areaId: z.string().min(1, 'Khu vực bãi đỗ là bắt buộc'),
  code: z.string().min(1, 'Mã phân khu là bắt buộc').max(20).toUpperCase(),
  name: z.string().min(1, 'Tên phân khu là bắt buộc').max(100),
  vehicleType: z.nativeEnum(VehicleType).default(VehicleType.CAR),
  colorHex: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Mã màu không hợp lệ').optional().default('#0F6B4F'),
  totalSlots: z.number().int().min(0).default(0),
});

export const updateParkingZoneSchema = z.object({
  code: z.string().min(1).max(20).toUpperCase().optional(),
  name: z.string().min(1).max(100).optional(),
  vehicleType: z.nativeEnum(VehicleType).optional(),
  colorHex: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
  totalSlots: z.number().int().min(0).optional(),
});

export const createParkingSlotSchema = z.object({
  areaId: z.string().min(1, 'Khu vực bãi đỗ là bắt buộc'),
  zoneId: z.string().min(1, 'Phân khu là bắt buộc'),
  code: z.string().min(1, 'Mã vị trí đỗ là bắt buộc').max(20).toUpperCase(),
  type: z.nativeEnum(SlotVehicleType).default(SlotVehicleType.CAR),
  status: z.nativeEnum(ParkingSlotStatus).default(ParkingSlotStatus.AVAILABLE),
  floor: z.number().int().default(-1),
  positionX: z.number().default(0),
  positionY: z.number().default(0),
  width: z.number().min(0.5).max(10).default(1),
  height: z.number().min(0.5).max(10).default(1),
  isReservable: z.boolean().default(true),
  isActive: z.boolean().default(true),
  note: z.string().optional().nullable(),
});

export const updateParkingSlotSchema = z.object({
  zoneId: z.string().optional(),
  code: z.string().min(1).max(20).toUpperCase().optional(),
  type: z.nativeEnum(SlotVehicleType).optional(),
  status: z.nativeEnum(ParkingSlotStatus).optional(),
  floor: z.number().int().optional(),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
  width: z.number().min(0.5).max(10).optional(),
  height: z.number().min(0.5).max(10).optional(),
  isReservable: z.boolean().optional(),
  isActive: z.boolean().optional(),
  note: z.string().optional().nullable(),
});

export const createParkingRequestSchema = z.object({
  vehicleId: z.string().min(1, 'Phương tiện là bắt buộc'),
  preferredAreaId: z.string().optional().nullable(),
  preferredZoneId: z.string().optional().nullable(),
  slotId: z.string().optional().nullable(),
  startDate: z.string().or(z.date()).optional(),
  endDate: z.string().or(z.date()).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const reviewParkingRequestSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  slotId: z.string().optional().nullable(),
  rejectionReason: z.string().max(500).optional().nullable(),
  startDate: z.string().or(z.date()).optional(),
  endDate: z.string().or(z.date()).optional().nullable(),
  monthlyFee: z.number().min(0).optional(),
}).refine(
  (data) => {
    if (data.action === 'REJECT') {
      return !!data.rejectionReason && data.rejectionReason.trim().length > 0;
    }
    return true;
  },
  {
    message: 'Vui lòng nhập lý do từ chối yêu cầu đăng ký chỗ đỗ',
    path: ['rejectionReason'],
  }
);

export const assignSlotSchema = z.object({
  slotId: z.string().min(1, 'Chỗ đỗ là bắt buộc'),
  vehicleId: z.string().min(1, 'Phương tiện là bắt buộc'),
  startDate: z.string().or(z.date()).optional(),
  endDate: z.string().or(z.date()).optional().nullable(),
  monthlyFee: z.number().min(0).optional(),
  notes: z.string().max(500).optional().nullable(),
});

export const gateCheckInSchema = z.object({
  licensePlate: z.string().min(1, 'Biển số xe là bắt buộc'),
  cardCode: z.string().optional().nullable(),
  qrToken: z.string().optional().nullable(),
  gateName: z.string().default('Cổng VÀO 01 (Hầm B1)'),
  imageSnapshotUrl: z.string().optional().nullable(),
  slotId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const gateCheckOutSchema = z.object({
  licensePlate: z.string().min(1, 'Biển số xe là bắt buộc'),
  cardCode: z.string().optional().nullable(),
  qrToken: z.string().optional().nullable(),
  gateName: z.string().default('Cổng RA 01 (Hầm B1)'),
  imageSnapshotUrl: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});
