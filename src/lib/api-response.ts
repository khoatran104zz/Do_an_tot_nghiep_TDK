import { NextResponse } from 'next/server';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errorCode?: string;
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

export function apiError(message: string, errorCode = 'BAD_REQUEST', status = 400) {
  const body: ApiResponse = {
    success: false,
    message,
    errorCode,
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

export function apiServerError(message = 'Lỗi hệ thống nội bộ, vui lòng thử lại sau') {
  return apiError(message, 'INTERNAL_SERVER_ERROR', 500);
}
