'use client';

import React, { useState } from 'react';
import {
  Package,
  Clock,
  CheckCircle2,
  Barcode,
  MapPin,
  Truck,
  Copy,
  Check,
  Building2,
  RefreshCw,
  AlertCircle,
  Inbox,
  FileText,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { useParcels, useParcelStats } from '@/hooks/use-parcels';
import { PARCEL_STATUS_MAP } from '@/modules/parcel/parcel.constants';
import { ParcelWithRelations } from '@/modules/parcel/parcel.types';
import { toast } from 'sonner';

export default function ResidentParcelsPage() {
  const [activeTab, setActiveTab] = useState<'PENDING' | 'HISTORY'>('PENDING');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Queries
  const { data: statsData } = useParcelStats();
  const stats = statsData?.data;

  const { data: parcelsData, isLoading, isFetching, refetch } = useParcels({
    limit: 50,
  });

  const allParcels: ParcelWithRelations[] = parcelsData?.data || [];

  // Split into Pending vs History
  const pendingParcels = allParcels.filter(
    (p) => p.status === 'RECEIVED' || p.status === 'NOTIFIED'
  );
  const historyParcels = allParcels.filter(
    (p) => p.status === 'COLLECTED' || p.status === 'RETURNED' || p.status === 'EXPIRED'
  );

  const displayedParcels = activeTab === 'PENDING' ? pendingParcels : historyParcels;

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Đã sao chép mã nhận hàng: ' + code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <PageHeader
        title="Bưu kiện của căn hộ"
        description="Theo dõi bưu phẩm, đơn hàng gửi đến căn hộ đang được lưu giữ tại quầy lễ tân sảnh tòa nhà."
      >
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </button>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Kiện hàng đang chờ nhận
            </span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {stats ? stats.totalPending : pendingParcels.length}
            </div>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              Vui lòng đến quầy lễ tân đọc mã nhận hàng
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Đã nhận trong tháng này
            </span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {stats ? stats.totalMonthly : historyParcels.length}
            </div>
            <span className="text-[11px] text-slate-400">
              Tổng số bưu kiện đã hoàn tất giao nhận
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`flex items-center gap-2 pb-3 pt-1 px-1 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'PENDING'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Chờ nhận tại lễ tân</span>
            <span className="ml-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
              {pendingParcels.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`flex items-center gap-2 pb-3 pt-1 px-1 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'HISTORY'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Lịch sử đã nhận</span>
            <span className="ml-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {historyParcels.length}
            </span>
          </button>
        </div>
      </div>

      {/* Parcels List */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-500 mx-auto mb-2" />
          <p className="text-xs">Đang tải thông tin kiện hàng...</p>
        </div>
      ) : displayedParcels.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto">
            <Inbox className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {activeTab === 'PENDING'
              ? 'Hiện không có kiện hàng nào chờ nhận'
              : 'Chưa có lịch sử nhận kiện hàng nào'}
          </h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {activeTab === 'PENDING'
              ? 'Khi shipper giao hàng tới sảnh, lễ tân sẽ tiếp nhận và thông báo kèm mã nhận hàng tới bạn ngay lập tức.'
              : 'Các bưu kiện sau khi bạn đối soát mã nhận hàng tại quầy lễ tân sẽ được lưu trữ tại đây.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedParcels.map((parcel) => {
            const statusInfo = PARCEL_STATUS_MAP[parcel.status] || {
              label: parcel.status,
              badgeClass: 'bg-slate-100 text-slate-700',
            };
            const isWaiting = parcel.status === 'RECEIVED' || parcel.status === 'NOTIFIED';

            return (
              <div
                key={parcel.id}
                className="relative rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                {/* Top Carrier Bar */}
                <div className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600">
                        <Truck className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-bold text-sm text-slate-900 dark:text-white block">
                          {parcel.carrier}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {parcel.apartment.code} • {parcel.recipientName}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusInfo.badgeClass}`}
                    >
                      {statusInfo.label}
                    </span>
                  </div>

                  {/* Parcel Details */}
                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Mã vận đơn:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {parcel.trackingNumber || 'Không có'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Thời gian nhận:</span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {new Date(parcel.receivedAt).toLocaleDateString('vi-VN')} {new Date(parcel.receivedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {parcel.location && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Vị trí lưu kho:</span>
                        <span className="font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {parcel.location}
                        </span>
                      </div>
                    )}

                    {parcel.note && (
                      <div className="p-2 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 mt-2">
                        {parcel.note}
                      </div>
                    )}
                  </div>
                </div>

                {/* Pickup Code Box or Collection History */}
                {isWaiting ? (
                  <div className="p-4 m-4 mt-1 rounded-xl bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200/80 dark:border-blue-900/80 text-center">
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-1">
                      MÃ NHẬN HÀNG (PICKUP CODE)
                    </span>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-2xl sm:text-3xl font-mono font-extrabold text-blue-700 dark:text-blue-300 tracking-widest">
                        {parcel.pickupCode}
                      </span>
                      <button
                        onClick={() => handleCopyCode(parcel.pickupCode)}
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
                        title="Sao chép mã nhận hàng"
                      >
                        {copiedCode === parcel.pickupCode ? (
                          <Check className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5">
                      Cung cấp mã này cho lễ tân tại sảnh để nhận kiện hàng
                    </p>
                  </div>
                ) : (
                  <div className="p-3 m-4 mt-1 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold mb-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Đã nhận kiện hàng</span>
                    </div>
                    {parcel.collectedAt && (
                      <div>
                        Thời gian: {new Date(parcel.collectedAt).toLocaleDateString('vi-VN')} lúc{' '}
                        {new Date(parcel.collectedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                    {parcel.collectedByName && (
                      <div>Người lấy hàng: {parcel.collectedByName}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
