import { NextResponse } from 'next/server';

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errorCode?: string;
  error?: ApiErrorDetail;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export function apiSuccess<T>(data: T, message?: string, meta?: ApiResponse['meta'], status = 200) {
  const body: ApiResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
    ...(meta && { meta }),
  };
  return NextResponse.json(body, { status });
}

export function sanitizeErrorMessage(message: string, status = 500): string {
  const isProduction = process.env.NODE_ENV === 'production';
  const containsSensitiveKeywords =
    /PrismaClient|foreign key|syntax error|ECONNREFUSED|PostgreSQL|pg_|Stack trace/i.test(message);

  if ((isProduction && status === 500) || containsSensitiveKeywords) {
    return 'Đã xảy ra lỗi hệ thống. Vui lòng liên hệ quản trị viên.';
  }
  return message;
}

export function apiError(
  message: string,
  errorCode = 'BAD_REQUEST',
  status = 400,
  details?: any
) {
  const sanitizedMessage = sanitizeErrorMessage(message, status);

  const body: ApiResponse = {
    success: false,
    message: sanitizedMessage,
    errorCode,
    error: {
      code: errorCode,
      message: sanitizedMessage,
      ...(details !== undefined && { details }),
    },
  };
  return NextResponse.json(body, { status });
}


export function apiUnauthorized(message = 'Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn') {
  return apiError(message, 'UNAUTHORIZED', 401);
}

export function apiForbidden(message = 'Bạn không có quyền thực hiện thao tác này') {
  return apiError(message, 'FORBIDDEN', 403);
}

export function apiNotFound(message = 'Không tìm thấy tài nguyên yêu cầu') {
  return apiError(message, 'NOT_FOUND', 404);
}

export function apiServerError(message = 'Lỗi hệ thống nội bộ, vui lòng thử lại sau', details?: any) {
  return apiError(message, 'INTERNAL_SERVER_ERROR', 500, details);
}
