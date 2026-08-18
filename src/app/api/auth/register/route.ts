import { NextRequest } from 'next/server';
import { registerSchema } from '@/modules/auth/auth.schema';
import { authService } from '@/modules/auth/auth.service';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = registerSchema.parse(body);
    const user = await authService.register(validated);
    return apiSuccess(user, 'Đăng ký tài khoản cư dân thành công', undefined, 201);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    return apiError(error.message || 'Đăng ký thất bại', 'REGISTER_FAILED', 400);
  }
}
