import { z } from 'zod';

export const createTenantSchema = z.object({
  code: z
    .string()
    .min(2, 'Mã tổ hợp tối thiểu 2 ký tự')
    .max(50, 'Mã tổ hợp tối đa 50 ký tự')
    .regex(/^[A-Z0-9\-_]+$/, 'Mã tổ hợp chỉ gồm chữ hoa, số, dấu gạch nối và gạch dưới'),
  name: z.string().min(3, 'Tên tổ hợp tối thiểu 3 ký tự').max(150, 'Tên tổ hợp tối đa 150 ký tự'),
  address: z.string().max(255).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email('Email không hợp lệ').optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).default('ACTIVE'),
  // Optional initial admin
  adminFullName: z.string().min(2, 'Họ và tên Admin tối thiểu 2 ký tự').optional(),
  adminEmail: z.string().email('Email Admin không hợp lệ').optional(),
  adminPassword: z.string().min(6, 'Mật khẩu Admin tối thiểu 6 ký tự').optional(),
  adminPhone: z.string().optional().nullable(),
});

export const updateTenantSchema = z.object({
  name: z.string().min(3, 'Tên tổ hợp tối thiểu 3 ký tự').max(150).optional(),
  address: z.string().max(255).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email('Email không hợp lệ').optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
});

export const createTenantAdminSchema = z.object({
  fullName: z.string().min(2, 'Họ và tên tối thiểu 2 ký tự'),
  email: z.string().email('Email không đúng định dạng'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  phone: z.string().optional().nullable(),
});
