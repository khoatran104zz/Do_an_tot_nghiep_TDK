'use client';

import React, { useState } from 'react';
import {
  Package,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Plus,
  KeyRound,
  Filter,
  Eye,
  Truck,
  Building2,
  Phone,
  RefreshCw,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { useParcels, useParcelStats } from '@/hooks/use-parcels';
import { PARCEL_STATUS_MAP, POPULAR_CARRIERS } from '@/modules/parcel/parcel.constants';
import { ParcelWithRelations } from '@/modules/parcel/parcel.types';
import { ParcelStatus } from '@prisma/client';
import { ReceiveParcelModal } from '@/components/parcel/ReceiveParcelModal';
import { CollectParcelModal } from '@/components/parcel/CollectParcelModal';
import { ParcelDetailModal } from '@/components/parcel/ParcelDetailModal';
import { useBuildingContext } from '@/context/BuildingContext';

export default function ParcelsPage() {
  const { selectedBuildingId } = useBuildingContext();
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [carrierFilter, setCarrierFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);

  // Modals state
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [isCollectOpen, setIsCollectOpen] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState<ParcelWithRelations | null>(null);
  const [detailParcel, setDetailParcel] = useState<ParcelWithRelations | null>(null);

  // Queries
  const { data: statsData, isLoading: isLoadingStats, refetch: refetchStats } = useParcelStats(
    selectedBuildingId || undefined
  );
  const stats = statsData?.data;

  const { data: parcelsData, isLoading, isFetching, refetch } = useParcels({
    search: search || undefined,
    buildingId: selectedBuildingId || undefined,
    status: statusFilter !== 'ALL' ? (statusFilter as ParcelStatus) : undefined,
    carrier: carrierFilter !== 'ALL' ? carrierFilter : undefined,
    page,
    limit: 15,
  });

  const parcels = parcelsData?.data || [];
  const meta = parcelsData?.meta;

  const handleOpenCollect = (parcel?: ParcelWithRelations) => {
    setSelectedParcel(parcel || null);
    setIsCollectOpen(true);
  };

  const handleRefresh = () => {
    refetch();
    refetchStats();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <PageHeader
        title="Quản lý bưu kiện & bưu phẩm"
        description="Tiếp nhận, kiểm soát lưu kho, tự động thông báo và bàn giao bưu kiện tại sảnh tòa nhà."
      >
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isFetching}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>

          <button
            onClick={() => handleOpenCollect()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors shadow-2xs cursor-pointer"
          >
            <KeyRound className="h-4 w-4" />
            <span>Xác nhận bàn giao</span>
          </button>

          <button
            onClick={() => setIsReceiveOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs hover:shadow-md cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>+ Tiếp nhận bưu kiện</span>
          </button>
        </div>
      </PageHeader>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Chờ cư dân nhận"
          value={stats ? stats.totalPending : '...'}
          icon={Clock}
          iconTextColor="text-amber-500" iconBgColor="bg-amber-50 dark:bg-amber-950/50"
          description="Kiện hàng đang lưu kho tại sảnh"
        />

        <StatCard
          title="Đã nhận hôm nay"
          value={stats ? stats.receivedToday : '...'}
          icon={Package}
          iconTextColor="text-blue-500" iconBgColor="bg-blue-50 dark:bg-blue-950/50"
          description="Bưu phẩm mới tiếp nhận trong ngày"
        />

        <StatCard
          title="Đã bàn giao hôm nay"
          value={stats ? stats.collectedToday : '...'}
          icon={CheckCircle2}
          iconTextColor="text-emerald-500" iconBgColor="bg-emerald-50 dark:bg-emerald-950/50"
          description="Cư dân đã đối soát và lấy hàng"
        />

        <StatCard
          title="Tồn đọng trên 3 ngày"
          value={stats ? stats.overdueCount : '...'}
          icon={AlertTriangle}
          iconTextColor="text-rose-500" iconBgColor="bg-rose-50 dark:bg-rose-950/50"
          description="Cần nhắc nhở cư dân đến nhận"
        />
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm mã vận đơn, tên cư dân, căn hộ..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-hidden"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Status filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span>Trạng thái:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-hidden"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="NOTIFIED">Chờ nhận hàng</option>
            <option value="RECEIVED">Mới tiếp nhận</option>
            <option value="COLLECTED">Đã nhận hàng</option>
            <option value="EXPIRED">Quá hạn lưu kho</option>
            <option value="RETURNED">Đã hoàn shipper</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>

          {/* Carrier filter */}
          <select
            value={carrierFilter}
            onChange={(e) => {
              setCarrierFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-hidden"
          >
            <option value="ALL">Tất cả đơn vị vận chuyển</option>
            {POPULAR_CARRIERS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <th className="px-5 py-3.5">Kiện hàng / Mã vận đơn</th>
                <th className="px-4 py-3.5">Căn hộ & Người nhận</th>
                <th className="px-4 py-3.5">Đơn vị vận chuyển</th>
                <th className="px-4 py-3.5">Vị trí lưu kho</th>
                <th className="px-4 py-3.5">Thời gian tiếp nhận</th>
                <th className="px-4 py-3.5">Mã nhận hàng</th>
                <th className="px-4 py-3.5">Trạng thái</th>
                <th className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
                      <span>Đang tải danh sách bưu kiện...</span>
                    </div>
                  </td>
                </tr>
              ) : parcels.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Package className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                      <span className="font-semibold text-slate-600 dark:text-slate-400 text-sm">
                        Không có bưu kiện nào
                      </span>
                      <span className="text-xs text-slate-400">
                        {search || statusFilter !== 'ALL' || carrierFilter !== 'ALL'
                          ? 'Thử thay đổi bộ lọc tìm kiếm'
                          : 'Bấm nút "+ Tiếp nhận bưu kiện" ở trên để tạo mới'}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                parcels.map((parcel: ParcelWithRelations) => {
                  const statusInfo = PARCEL_STATUS_MAP[parcel.status] || {
                    label: parcel.status,
                    badgeClass: 'bg-slate-100 text-slate-700',
                  };
                  const isPending = parcel.status === 'RECEIVED' || parcel.status === 'NOTIFIED';

                  return (
                    <tr
                      key={parcel.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Tracking / Parcel ID */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 shrink-0">
                            <Package className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="font-mono font-bold text-slate-900 dark:text-slate-100 block">
                              {parcel.trackingNumber || parcel.id.slice(-8).toUpperCase()}
                            </span>
                            {parcel.note && (
                              <span className="text-[11px] text-amber-600 dark:text-amber-400 truncate max-w-[160px] block">
                                {parcel.note}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Apartment & Recipient */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5 text-blue-500" />
                          {parcel.apartment.code}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <span>{parcel.recipientName}</span>
                          {parcel.recipientPhone && <span>• {parcel.recipientPhone}</span>}
                        </div>
                      </td>

                      {/* Carrier */}
                      <td className="px-4 py-3.5">
                        <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <Truck className="h-3.5 w-3.5 text-indigo-500" />
                          {parcel.carrier}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium">
                          {parcel.location || 'Sảnh tiếp tân'}
                        </span>
                      </td>

                      {/* Received Date */}
                      <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 text-[11px]">
                        <div>{new Date(parcel.receivedAt).toLocaleDateString('vi-VN')}</div>
                        <div className="text-slate-400">{new Date(parcel.receivedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>

                      {/* Pickup Code (Receptionist view) */}
                      <td className="px-4 py-3.5">
                        {isPending ? (
                          <span className="font-mono font-extrabold text-blue-600 dark:text-blue-400 tracking-wider bg-blue-50 dark:bg-blue-950/60 px-2 py-1 rounded-lg border border-blue-200 dark:border-blue-900 text-xs">
                            {parcel.pickupCode}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Đã sử dụng</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusInfo.badgeClass}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <button
                              onClick={() => handleOpenCollect(parcel)}
                              className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
                            >
                              Bàn giao
                            </button>
                          )}
                          <button
                            onClick={() => setDetailParcel(parcel)}
                            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                            title="Xem chi tiết kiện hàng"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200/80 dark:border-slate-800 px-5 py-3 bg-slate-50/50 dark:bg-slate-800/40 text-xs text-slate-500">
            <span>
              Hiển thị {parcels.length} trên tổng số {meta.total} bưu kiện
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Trước
              </button>
              <span className="px-2 font-semibold text-slate-800 dark:text-slate-200">
                {page} / {meta.totalPages}
              </span>
              <button
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ReceiveParcelModal
        isOpen={isReceiveOpen}
        onClose={() => setIsReceiveOpen(false)}
        onSuccess={() => {
          refetch();
          refetchStats();
        }}
      />

      <CollectParcelModal
        isOpen={isCollectOpen}
        onClose={() => {
          setIsCollectOpen(false);
          setSelectedParcel(null);
        }}
        selectedParcel={selectedParcel}
        onSuccess={() => {
          refetch();
          refetchStats();
        }}
      />

      <ParcelDetailModal
        isOpen={Boolean(detailParcel)}
        onClose={() => setDetailParcel(null)}
        parcel={detailParcel}
        onCollect={(p) => {
          setDetailParcel(null);
          handleOpenCollect(p);
        }}
      />
    </div>
  );
}
