'use client';

import React from 'react';
import {
  X,
  Package,
  Building2,
  User,
  Phone,
  Truck,
  Barcode,
  MapPin,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { ParcelWithRelations } from '@/modules/parcel/parcel.types';
import { PARCEL_STATUS_MAP } from '@/modules/parcel/parcel.constants';

interface ParcelDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  parcel: ParcelWithRelations | null;
  onCollect?: (parcel: ParcelWithRelations) => void;
}

export const ParcelDetailModal: React.FC<ParcelDetailModalProps> = ({
  isOpen,
  onClose,
  parcel,
  onCollect,
}) => {
  if (!isOpen || !parcel) return null;

  const statusConfig = PARCEL_STATUS_MAP[parcel.status] || {
    label: parcel.status,
    badgeClass: 'bg-slate-100 text-slate-700',
    description: '',
  };

  const isPending = parcel.status === 'RECEIVED' || parcel.status === 'NOTIFIED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Chi tiết kiện hàng
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mã bưu phẩm: {parcel.id.slice(-8).toUpperCase()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Status Banner */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block mb-0.5">Trạng thái</span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusConfig.badgeClass}`}>
                {statusConfig.label}
              </span>
            </div>
            {isPending && (
              <div className="text-right">
                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-0.5">Mã nhận hàng</span>
                <span className="font-mono font-extrabold text-base text-blue-600 dark:text-blue-400 tracking-wider">
                  {parcel.pickupCode}
                </span>
              </div>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block mb-1">Căn hộ</span>
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-blue-500" />
                {parcel.apartment.code} (Tầng {parcel.apartment.floor})
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block mb-1">Đơn vị vận chuyển</span>
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5 text-indigo-500" />
                {parcel.carrier}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block mb-1">Người nhận trên đơn</span>
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-slate-500" />
                {parcel.recipientName}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block mb-1">Số điện thoại</span>
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-slate-500" />
                {parcel.recipientPhone || 'Không có'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block mb-1">Mã vận đơn</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Barcode className="h-3.5 w-3.5 text-slate-500" />
                {parcel.trackingNumber || 'Không có'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block mb-1">Vị trí lưu kho</span>
              <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-blue-500" />
                {parcel.location || 'Sảnh tiếp tân'}
              </span>
            </div>
          </div>

          {/* Note */}
          {parcel.note && (
            <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-xs">
              <span className="font-semibold text-amber-800 dark:text-amber-300 block mb-0.5">Ghi chú kiện hàng:</span>
              <p className="text-amber-700 dark:text-amber-400">{parcel.note}</p>
            </div>
          )}

          {/* Timeline */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-2.5 text-xs">
            <span className="font-semibold text-slate-900 dark:text-white block mb-2">Nhật ký xử lý:</span>
            
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                Tiếp nhận tại sảnh:
              </span>
              <span className="font-medium text-slate-900 dark:text-slate-200">
                {new Date(parcel.receivedAt).toLocaleString('vi-VN')}
                {parcel.receivedBy && ` (${parcel.receivedBy.fullName})`}
              </span>
            </div>

            {parcel.notifiedAt && (
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                  Gửi thông báo cư dân:
                </span>
                <span className="font-medium text-slate-900 dark:text-slate-200">
                  {new Date(parcel.notifiedAt).toLocaleString('vi-VN')}
                </span>
              </div>
            )}

            {parcel.collectedAt && (
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Đã bàn giao cho cư dân:
                </span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400 font-semibold">
                  {new Date(parcel.collectedAt).toLocaleString('vi-VN')}
                  {parcel.collectedByName && ` (${parcel.collectedByName})`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800 px-6 py-3.5 bg-slate-50/50 dark:bg-slate-800/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>
          {isPending && onCollect && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onCollect(parcel);
              }}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Bàn giao kiện này
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
