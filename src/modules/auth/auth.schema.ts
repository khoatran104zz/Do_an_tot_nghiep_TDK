import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email không đúng định dạng'),
  password: z.string().min(6, 'Mật khẩu phải từ 6 ký tự'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Họ và tên tối thiểu 2 ký tự'),
  email: z.string().email('Email không đúng định dạng'),
  phone: z.string().min(10, 'Số điện thoại tối thiểu 10 số'),
  identityCard: z.string().min(9, 'Số CCCD/CMND không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  apartmentCode: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
