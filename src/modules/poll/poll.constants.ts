import { PollStatus, PollTargetScope } from '@prisma/client';

export const POLL_STATUS_MAP: Record<
  PollStatus,
  {
    label: string;
    badgeClass: string;
    description: string;
  }
> = {
  DRAFT: {
    label: 'Bản nháp',
    badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    description: 'Chưa công bố cho cư dân',
  },
  SCHEDULED: {
    label: 'Đã lên lịch',
    badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    description: 'Sẽ tự động mở khi tới thời gian bắt đầu',
  },
  ACTIVE: {
    label: 'Đang mở biểu quyết',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    description: 'Cư dân đang tham gia bỏ phiếu',
  },
  CLOSED: {
    label: 'Đã đóng',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    description: 'Đã kết thúc thời gian lấy ý kiến',
  },
  CANCELLED: {
    label: 'Đã hủy',
    badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    description: 'Đã hủy bỏ khảo sát',
  },
};

export const POLL_TARGET_MAP: Record<
  PollTargetScope,
  {
    label: string;
    description: string;
  }
> = {
  ALL_APARTMENTS: {
    label: 'Toàn bộ cư dân tòa nhà',
    description: 'Tất cả các căn hộ trong chung cư',
  },
  BUILDING: {
    label: 'Theo Tòa nhà',
    description: 'Áp dụng cho cư dân một tòa cụ thể',
  },
  BLOCK: {
    label: 'Theo Block / Tháp',
    description: 'Áp dụng cho các căn hộ thuộc Block được chọn',
  },
  FLOOR: {
    label: 'Theo Tầng',
    description: 'Áp dụng cho các căn hộ trên cùng tầng',
  },
  SELECTED_APARTMENTS: {
    label: 'Chỉ định căn hộ cụ thể',
    description: 'Danh sách các căn hộ được chọn lọc',
  },
};
