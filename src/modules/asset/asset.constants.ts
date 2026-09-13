import { AssetCategory, AssetStatus, MaintenanceCycle, MaintenanceStatus } from '@prisma/client';

export const ASSET_CATEGORY_LABELS: Record<AssetCategory, string> = {
  ELEVATOR: 'Thang máy',
  WATER_PUMP: 'Trạm bơm nước',
  FIRE_ALARM: 'Báo cháy',
  FIRE_EXTINGUISHER: 'Bình PCCC',
  GENERATOR: 'Máy phát điện',
  CCTV: 'Camera an ninh',
  BARRIER: 'Barrie tự động',
  AIR_CONDITIONER: 'Máy lạnh / HVAC',
  ELECTRICAL_SYSTEM: 'Hệ thống điện',
  OTHER: 'Khác',
};

export const ASSET_STATUS_LABELS: Record<AssetStatus, string> = {
  OPERATIONAL: 'Hoạt động tốt',
  MAINTENANCE: 'Đang bảo trì',
  BROKEN: 'Hỏng hóc',
  RETIRED: 'Ngừng sử dụng',
};

export const ASSET_STATUS_BADGE: Record<AssetStatus, { variant: 'success' | 'warning' | 'destructive' | 'secondary'; label: string }> = {
  OPERATIONAL: { variant: 'success', label: 'Hoạt động tốt' },
  MAINTENANCE: { variant: 'warning', label: 'Đang bảo trì' },
  BROKEN: { variant: 'destructive', label: 'Hỏng hóc' },
  RETIRED: { variant: 'secondary', label: 'Ngừng sử dụng' },
};

export const MAINTENANCE_STATUS_LABELS: Record<MaintenanceStatus, string> = {
  PENDING: 'Đang chờ',
  IN_PROGRESS: 'Đang xử lý',
  COMPLETED: 'Hoàn thành',
  OVERDUE: 'Quá hạn',
};

export const MAINTENANCE_STATUS_BADGE: Record<MaintenanceStatus, { variant: 'info' | 'warning' | 'success' | 'destructive'; label: string }> = {
  PENDING: { variant: 'info', label: 'Đang chờ' },
  IN_PROGRESS: { variant: 'warning', label: 'Đang thực hiện' },
  COMPLETED: { variant: 'success', label: 'Đã hoàn tất' },
  OVERDUE: { variant: 'destructive', label: 'Quá hạn' },
};

export const MAINTENANCE_CYCLE_LABELS: Record<MaintenanceCycle, string> = {
  DAILY: 'Hàng ngày',
  WEEKLY: 'Hàng tuần',
  MONTHLY: 'Hàng tháng',
  QUARTERLY: 'Hàng quý (3 tháng)',
  SEMI_ANNUALLY: 'Bán niên (6 tháng)',
  ANNUALLY: 'Hàng năm',
};
