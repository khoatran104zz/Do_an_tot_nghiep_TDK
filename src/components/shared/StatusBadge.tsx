'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  ApartmentStatus,
  ResidentStatus,
  ResidentRelationship,
  ContractType,
  ContractStatus,
  InvoiceStatus,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  Role,
  PaymentMethod,
} from '@prisma/client';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  ShieldAlert,
  Flame,
  Wrench,
  UserCheck,
  Building,
  Home,
  CreditCard,
  Banknote,
  QrCode,
  Car,
  Bike,
  KeyRound,
} from 'lucide-react';

type StatusType =
  | { type: 'apartment'; status: ApartmentStatus | string }
  | { type: 'resident'; status: ResidentStatus | string }
  | { type: 'relationship'; status: ResidentRelationship | string }
  | { type: 'contractType'; status: ContractType | string }
  | { type: 'contractStatus'; status: ContractStatus | string }
  | { type: 'invoice'; status: InvoiceStatus | string }
  | { type: 'ticketStatus'; status: TicketStatus | string }
  | { type: 'ticketPriority'; status: TicketPriority | string }
  | { type: 'ticketCategory'; status: TicketCategory | string }
  | { type: 'role'; status: Role | string }
  | { type: 'paymentMethod'; status: PaymentMethod | string }
  | { type: 'vehicleStatus'; status: string }
  | { type: 'vehicleType'; status: string }
  | { type: 'parkingCardStatus'; status: string };

interface StatusBadgeProps {
  type: StatusType['type'];
  status: string;
  size?: 'sm' | 'default';
  showIcon?: boolean;
  className?: string;
}

export function StatusBadge({
  type,
  status,
  size = 'sm',
  showIcon = true,
  className,
}: StatusBadgeProps) {
  // 1. Apartment Status
  if (type === 'apartment') {
    switch (status) {
      case 'OCCUPIED':
        return (
          <Badge variant="success" size={size} dot className={className}>
            Đang ở
          </Badge>
        );
      case 'UNDER_MAINTENANCE':
        return (
          <Badge variant="warning" size={size} dot className={className}>
            Đang sửa chữa
          </Badge>
        );
      case 'VACANT':
      default:
        return (
          <Badge variant="secondary" size={size} dot className={className}>
            Đang trống
          </Badge>
        );
    }
  }

  // 2. Resident Status
  if (type === 'resident') {
    switch (status) {
      case 'RESIDING':
        return (
          <Badge variant="success" size={size} dot className={className}>
            Đang cư trú
          </Badge>
        );
      case 'TEMPORARY_ABSENT':
        return (
          <Badge variant="warning" size={size} dot className={className}>
            Tạm vắng
          </Badge>
        );
      case 'MOVED_OUT':
      default:
        return (
          <Badge variant="secondary" size={size} dot className={className}>
            Đã chuyển đi
          </Badge>
        );
    }
  }

  // 3. Resident Relationship
  if (type === 'relationship') {
    switch (status) {
      case 'OWNER':
        return (
          <Badge variant="default" size={size} className={className}>
            Chủ hộ
          </Badge>
        );
      case 'FAMILY':
        return (
          <Badge variant="info" size={size} className={className}>
            Thân nhân
          </Badge>
        );
      case 'TENANT':
      default:
        return (
          <Badge variant="outline" size={size} className={className}>
            Khách thuê
          </Badge>
        );
    }
  }

  // 4. Contract Status
  if (type === 'contractStatus') {
    switch (status) {
      case 'ACTIVE':
        return (
          <Badge variant="success" size={size} dot className={className}>
            Đang hiệu lực
          </Badge>
        );
      case 'EXPIRED':
        return (
          <Badge variant="destructive" size={size} dot className={className}>
            Đã hết hạn
          </Badge>
        );
      case 'TERMINATED':
      default:
        return (
          <Badge variant="secondary" size={size} dot className={className}>
            Đã thanh lý
          </Badge>
        );
    }
  }

  // 5. Contract Type
  if (type === 'contractType') {
    return (
      <Badge variant={status === 'SALE' ? 'default' : 'outline'} size={size} className={className}>
        {status === 'SALE' ? 'Mua bán' : 'Thuê căn hộ'}
      </Badge>
    );
  }

  // 6. Invoice Status
  if (type === 'invoice') {
    switch (status) {
      case 'PAID':
        return (
          <Badge variant="success" size={size} dot className={className}>
            Đã thanh toán
          </Badge>
        );
      case 'OVERDUE':
        return (
          <Badge variant="destructive" size={size} dot className={className}>
            Quá hạn
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge variant="secondary" size={size} dot className={className}>
            Đã hủy
          </Badge>
        );
      case 'UNPAID':
      default:
        return (
          <Badge variant="warning" size={size} dot className={className}>
            Chưa thanh toán
          </Badge>
        );
    }
  }

  // 7. Ticket Status
  if (type === 'ticketStatus') {
    switch (status) {
      case 'RESOLVED':
        return (
          <Badge variant="success" size={size} dot className={className}>
            Hoàn thành
          </Badge>
        );
      case 'PROCESSING':
        return (
          <Badge variant="warning" size={size} dot className={className}>
            Đang xử lý
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="secondary" size={size} dot className={className}>
            Từ chối
          </Badge>
        );
      case 'NEW':
      default:
        return (
          <Badge variant="destructive" size={size} dot className={className}>
            Mới tiếp nhận
          </Badge>
        );
    }
  }

  // 8. Ticket Priority
  if (type === 'ticketPriority') {
    switch (status) {
      case 'URGENT':
        return (
          <span className={cn('inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/80 px-2 py-0.5 rounded text-[11px]', className)}>
            {showIcon && <Flame className="h-3 w-3 text-rose-600" />}
            Khẩn cấp
          </span>
        );
      case 'HIGH':
        return (
          <span className={cn('inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/80 px-2 py-0.5 rounded text-[11px]', className)}>
            {showIcon && <AlertCircle className="h-3 w-3 text-amber-600" />}
            Cao
          </span>
        );
      case 'MEDIUM':
        return (
          <span className={cn('inline-flex items-center gap-1 font-medium text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/80 px-2 py-0.5 rounded text-[11px]', className)}>
            Trung bình
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className={cn('inline-flex items-center gap-1 font-medium text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 px-2 py-0.5 rounded text-[11px]', className)}>
            Thấp
          </span>
        );
    }
  }

  // 9. Ticket Category
  if (type === 'ticketCategory') {
    const categoryMap: Record<string, string> = {
      ELECTRIC: 'Điện sinh hoạt',
      WATER: 'Nước & Đường ống',
      ELEVATOR: 'Thang máy',
      SECURITY: 'An ninh trật tự',
      CLEANLINESS: 'Vệ sinh môi trường',
      OTHER: 'Khác',
    };
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium', className)}>
        <Wrench className="h-3.5 w-3.5 text-slate-400" />
        {categoryMap[status] || status}
      </span>
    );
  }

  // 10. Role
  if (type === 'role') {
    switch (status) {
      case 'ADMIN':
        return (
          <Badge variant="default" size={size} dot className={className}>
            Quản trị viên
          </Badge>
        );
      case 'MANAGER':
        return (
          <Badge variant="info" size={size} dot className={className}>
            Ban Quản Lý
          </Badge>
        );
      case 'RESIDENT':
      default:
        return (
          <Badge variant="success" size={size} dot className={className}>
            Cư Dân
          </Badge>
        );
    }
  }

  // 11. Payment Method
  if (type === 'paymentMethod') {
    switch (status) {
      case 'VNPAY':
        return (
          <span className={cn('inline-flex items-center gap-1 font-semibold text-xs text-blue-600', className)}>
            <QrCode className="h-3.5 w-3.5" /> VNPay QR
          </span>
        );
      case 'MOMO':
        return (
          <span className={cn('inline-flex items-center gap-1 font-semibold text-xs text-pink-600', className)}>
            <QrCode className="h-3.5 w-3.5" /> Ví MoMo
          </span>
        );
      case 'BANK_TRANSFER':
        return (
          <span className={cn('inline-flex items-center gap-1 font-medium text-xs text-slate-700 dark:text-slate-300', className)}>
            <CreditCard className="h-3.5 w-3.5 text-slate-400" /> Chuyển khoản
          </span>
        );
      case 'CASH':
      default:
        return (
          <span className={cn('inline-flex items-center gap-1 font-medium text-xs text-slate-700 dark:text-slate-300', className)}>
            <Banknote className="h-3.5 w-3.5 text-emerald-600" /> Tiền mặt
          </span>
        );
    }
  }

  // 12. Vehicle Status
  if (type === 'vehicleStatus') {
    switch (status) {
      case 'ACTIVE':
        return (
          <Badge variant="success" size={size} dot className={className}>
            Đang hoạt động
          </Badge>
        );
      case 'PENDING_APPROVAL':
        return (
          <span
            className={cn(
              'inline-flex items-center gap-1.5 font-bold text-amber-700 bg-amber-100/90 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 px-2.5 py-0.5 rounded-full text-xs shadow-xs animate-pulse',
              className
            )}
          >
            <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            Chờ phê duyệt
          </span>
        );
      case 'REJECTED':
        return (
          <Badge variant="destructive" size={size} dot className={className}>
            Từ chối duyệt
          </Badge>
        );
      case 'INACTIVE':
      default:
        return (
          <Badge variant="secondary" size={size} dot className={className}>
            Ngưng hoạt động
          </Badge>
        );
    }
  }

  // 13. Vehicle Type
  if (type === 'vehicleType') {
    switch (status) {
      case 'CAR':
        return (
          <span
            className={cn(
              'inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/80 px-2 py-0.5 rounded',
              className
            )}
          >
            {showIcon && <Car className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />}
            Ô tô
          </span>
        );
      case 'MOTORBIKE':
        return (
          <span
            className={cn(
              'inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/80 px-2 py-0.5 rounded',
              className
            )}
          >
            {showIcon && <Bike className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />}
            Xe máy
          </span>
        );
      case 'BICYCLE':
        return (
          <span
            className={cn(
              'inline-flex items-center gap-1 text-xs font-medium text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 rounded',
              className
            )}
          >
            {showIcon && <Bike className="h-3.5 w-3.5 text-slate-500" />}
            Xe đạp
          </span>
        );
      case 'ELECTRIC_BIKE':
      default:
        return (
          <span
            className={cn(
              'inline-flex items-center gap-1 text-xs font-semibold text-cyan-700 bg-cyan-50 dark:bg-cyan-950/50 dark:text-cyan-300 border border-cyan-200/80 px-2 py-0.5 rounded',
              className
            )}
          >
            {showIcon && <Bike className="h-3.5 w-3.5 text-cyan-600" />}
            Xe điện
          </span>
        );
    }
  }

  // 14. Parking Card Status
  if (type === 'parkingCardStatus') {
    switch (status) {
      case 'ACTIVE':
        return (
          <Badge variant="success" size={size} dot className={className}>
            Hoạt động
          </Badge>
        );
      case 'LOCKED':
        return (
          <Badge variant="destructive" size={size} dot className={className}>
            Đang khóa
          </Badge>
        );
      case 'EXPIRED':
      default:
        return (
          <Badge variant="warning" size={size} dot className={className}>
            Đã hết hạn
          </Badge>
        );
    }
  }

  return <Badge variant="secondary" size={size}>{status}</Badge>;
}
