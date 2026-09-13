import { z } from 'zod';
import { Role, StaffShift, StaffStatus } from '@prisma/client';

const validStaffRoles = [
  Role.STAFF_TECHNICIAN,
  Role.STAFF_SECURITY,
  Role.STAFF_RECEPTIONIST,
  Role.MANAGER,
] as const;

export const createStaffSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu khởi tạo tối thiểu 6 ký tự').optional(),
  fullName: z.string().min(2, 'Họ và tên tối thiểu 2 ký tự'),
  phone: z.string().min(9, 'Số điện thoại không hợp lệ'),
  role: z.nativeEnum(Role).refine((r) => (validStaffRoles as readonly Role[]).includes(r), {
    message: 'Vai trò nhân sự phải là Kỹ thuật, An ninh hoặc Lễ tân',
  }),
  employeeCode: z.string().optional(),
  position: z.string().min(2, 'Chức danh vị trí không được để trống'),
  department: z.string().optional(),
  currentShift: z.nativeEnum(StaffShift).default(StaffShift.MORNING),
  assignedZone: z.string().optional(),
  notes: z.string().optional(),
});

export const updateStaffSchema = z.object({
  fullName: z.string().min(2, 'Họ và tên tối thiểu 2 ký tự').optional(),
  phone: z.string().min(9, 'Số điện thoại không hợp lệ').optional(),
  role: z.nativeEnum(Role).optional(),
  position: z.string().min(2, 'Chức danh vị trí không được để trống').optional(),
  department: z.string().optional(),
  currentShift: z.nativeEnum(StaffShift).optional(),
  assignedZone: z.string().optional(),
  status: z.nativeEnum(StaffStatus).optional(),
  notes: z.string().optional(),
});

export const assignShiftSchema = z.object({
  currentShift: z.nativeEnum(StaffShift),
  assignedZone: z.string().optional(),
  notes: z.string().optional(),
});

export const updateStaffStatusSchema = z.object({
  status: z.nativeEnum(StaffStatus),
  reason: z.string().optional(),
});
