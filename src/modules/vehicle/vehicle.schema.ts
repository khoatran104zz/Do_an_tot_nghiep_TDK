import { z } from 'zod';
import { VehicleType, VehicleStatus, ParkingCardStatus } from '@prisma/client';

/**
 * Normalizes a license plate by stripping spaces, dots, dashes, and converting to uppercase.
 * Example: "30A-999.88" -> "30A99988", "29-G1  888.66" -> "29G188866"
 */
export function normalizeLicensePlate(plate: string): string {
  if (!plate) return '';
  return plate.replace(/[\s\.\-_]/g, '').toUpperCase();
}

/**
 * Validates a Vietnamese license plate format.
 * Must be 5 to 15 characters and contain both letters and digits.
 */
const licensePlateValidator = z
  .string()
  .min(5, 'Biển số xe phải có ít nhất 5 ký tự')
  .max(20, 'Biển số xe không được vượt quá 20 ký tự')
  .refine(
    (val) => {
      const normalized = normalizeLicensePlate(val);
      return /[0-9]/.test(normalized) && /[A-Z]/.test(normalized);
    },
    { message: 'Biển số xe không hợp lệ (phải bao gồm cả chữ và số, VD: 30A-999.88, 29-G1 888.66)' }
  );

export const createVehicleSchema = z.object({
  licensePlate: licensePlateValidator,
  type: z.nativeEnum(VehicleType).default(VehicleType.MOTORBIKE),
  brand: z.string().min(1, 'Vui lòng nhập hãng xe (VD: Honda, Toyota, VinFast)').max(50),
  model: z.string().max(50).optional().nullable(),
  color: z.string().max(30).optional().nullable(),
  apartmentId: z.string().optional(), // Can be omitted by resident, will be verified/set from session
  residentId: z.string().optional().nullable(),
  registrationDocumentUrl: z
    .string()
    .url('Đường dẫn ảnh giấy tờ đăng ký không hợp lệ')
    .optional()
    .nullable()
    .or(z.literal('')),
  status: z.nativeEnum(VehicleStatus).optional(),
});

export const updateVehicleSchema = z.object({
  licensePlate: licensePlateValidator.optional(),
  type: z.nativeEnum(VehicleType).optional(),
  brand: z.string().min(1).max(50).optional(),
  model: z.string().max(50).optional().nullable(),
  color: z.string().max(30).optional().nullable(),
  registrationDocumentUrl: z
    .string()
    .url('Đường dẫn ảnh không hợp lệ')
    .optional()
    .nullable()
    .or(z.literal('')),
  apartmentId: z.string().optional(),
  residentId: z.string().optional().nullable(),
});

export const approveVehicleSchema = z.object({
  cardCode: z.string().min(3, 'Mã thẻ từ phải có ít nhất 3 ký tự').max(30).optional(),
  expiresAt: z.string().datetime().optional().nullable(),
});

export const rejectVehicleSchema = z.object({
  reason: z.string().min(3, 'Vui lòng nêu rõ lý do từ chối (tối thiểu 3 ký tự)').max(500),
});

export const createParkingCardSchema = z.object({
  cardCode: z.string().min(3, 'Mã thẻ từ phải có ít nhất 3 ký tự').max(30, 'Mã thẻ tối đa 30 ký tự'),
  expiresAt: z.string().optional().nullable(),
  status: z.nativeEnum(ParkingCardStatus).default(ParkingCardStatus.ACTIVE),
});

export const lockParkingCardSchema = z.object({
  lockReason: z.string().min(3, 'Vui lòng nhập lý do khóa thẻ (tối thiểu 3 ký tự)').max(200),
});
