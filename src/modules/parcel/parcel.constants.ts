import { ParcelStatus } from '@prisma/client';

export const POPULAR_CARRIERS = [
  'Shopee Express',
  'Giao Hàng Nhanh',
  'Giao Hàng Tiết Kiệm',
  'Viettel Post',
  'J&T Express',
  'GrabExpress',
  'Ahamove',
  'Bưu Điện VNPost',
  'Khác',
] as const;

export const PARCEL_LOCATIONS = [
  'Kệ A - Tầng 1',
  'Kệ A - Tầng 2',
  'Kệ B - Tầng 1',
  'Kệ B - Tầng 2',
  'Kệ C - Hàng dễ vỡ',
  'Tủ bảo quản mát',
  'Khu vực kiện cồng kềnh',
] as const;

export const PARCEL_STATUS_MAP: Record<
  ParcelStatus,
  {
    label: string;
    badgeClass: string;
    description: string;
  }
> = {
  RECEIVED: {
    label: 'Mới tiếp nhận',
    badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    description: 'Kiện hàng đã tới sảnh, đang chuẩn bị thông báo',
  },
  NOTIFIED: {
    label: 'Chờ nhận hàng',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    description: 'Đã gửi mã nhận hàng cho cư dân, đang chờ đến lấy',
  },
  COLLECTED: {
    label: 'Đã nhận hàng',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    description: 'Bưu kiện đã được bàn giao thành công',
  },
  RETURNED: {
    label: 'Đã hoàn shipper',
    badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    description: 'Đã trả lại đơn vị vận chuyển theo yêu cầu',
  },
  EXPIRED: {
    label: 'Quá hạn lưu kho',
    badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    description: 'Lưu kho quá hạn chưa có người đến nhận',
  },
  CANCELLED: {
    label: 'Đã hủy',
    badgeClass: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700',
    description: 'Kiện hàng bị hủy do sai sót thông tin',
  },
};
