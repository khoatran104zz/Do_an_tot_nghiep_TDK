'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Boxes,
  Wrench,
  ShieldCheck,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  DollarSign,
  User,
  Layers,
  Building,
  History,
  Plus,
  Edit3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { useAsset, useUpdateAsset } from '@/hooks/use-assets';
import { AssetCategory, AssetStatus, MaintenanceCycle, MaintenanceStatus } from '@prisma/client';
import {
  ASSET_CATEGORY_LABELS,
  ASSET_STATUS_BADGE,
  MAINTENANCE_CYCLE_LABELS,
  MAINTENANCE_STATUS_BADGE,
} from '@/modules/asset/asset.constants';
import { CreateScheduleModal } from '@/components/asset/CreateScheduleModal';
import { CompleteMaintenanceModal } from '@/components/asset/CompleteMaintenanceModal';

interface AssetDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function AssetDetailPage({ params }: AssetDetailPageProps) {
  const { id } = use(params);
  const { data: assetResponse, isLoading, error } = useAsset(id);
  const updateAssetMutation = useUpdateAsset();

  const [activeTab, setActiveTab] = useState('schedules');
  const [isCreateScheduleOpen, setIsCreateScheduleOpen] = useState(false);
  const [completeScheduleData, setCompleteScheduleData] = useState<any | null>(null);

  const asset = assetResponse?.data;

  if (isLoading) {
    return (
      <div className="py-24 text-center text-slate-500">
        <div className="animate-pulse flex flex-col items-center">
          <Wrench className="h-8 w-8 text-blue-500 mb-2 animate-bounce" />
          <p className="text-sm font-medium">Đang tải hồ sơ kỹ thuật thiết bị...</p>
        </div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="py-20 text-center">
        <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Không tìm thấy tài sản thiết bị</h2>
        <p className="text-sm text-slate-500 mt-1">
          Thiết bị có thể đã bị xóa hoặc bạn không có quyền truy cập.
        </p>
        <Link href="/assets">
          <Button variant="outline" className="mt-4 gap-2">
            <ArrowLeft className="h-4 w-4" /> Quay lại danh mục tài sản
          </Button>
        </Link>
      </div>
    );
  }

  const statusBadge = ASSET_STATUS_BADGE[asset.status as AssetStatus] || {
    variant: 'secondary',
    label: asset.status,
  };

  const handleStatusChange = async (newStatus: AssetStatus) => {
    await updateAssetMutation.mutateAsync({
      id: asset.id,
      data: { status: newStatus },
    });
  };

  // Extract all work orders across schedules or direct
  const allWorkOrders: any[] = [];
  asset.maintenanceSchedules?.forEach((sch: any) => {
    sch.workOrders?.forEach((wo: any) => {
      allWorkOrders.push({
        ...wo,
        scheduleTitle: sch.title,
        scheduleCycle: sch.cycle,
      });
    });
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Back button & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/assets">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500 hover:text-slate-900">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {asset.code}
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{asset.name}</h1>
              <Badge variant={statusBadge.variant} dot>
                {statusBadge.label}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Phân loại: {ASSET_CATEGORY_LABELS[asset.category as AssetCategory] || asset.category}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Quick status dropdown */}
          <select
            value={asset.status}
            onChange={(e) => handleStatusChange(e.target.value as AssetStatus)}
            disabled={updateAssetMutation.isPending}
            className="h-9 px-3 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="OPERATIONAL">🟢 Hoạt động tốt</option>
            <option value="MAINTENANCE">🟡 Đang bảo trì</option>
            <option value="BROKEN">🔴 Hỏng hóc</option>
            <option value="RETIRED">⚪ Ngừng sử dụng</option>
          </select>

          <Button
            onClick={() => setIsCreateScheduleOpen(true)}
            className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9"
          >
            <Calendar className="h-3.5 w-3.5" />
            Lập lịch bảo trì PM
          </Button>
        </div>
      </div>

      {/* Specifications & Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Vị trí & Tòa nhà */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <Building className="h-4 w-4 text-blue-600" />
            Vị trí lắp đặt
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">{asset.location}</div>
            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
              <Layers className="h-3.5 w-3.5 text-slate-400" />
              {asset.building?.name || 'Khu phức hợp chung cư'}
            </div>
          </div>
        </div>

        {/* Card 2: Nhà cung cấp & Bảo hành */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Bảo hành & Đối tác
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">
              {asset.supplier || 'Chưa ghi nhận đối tác'}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Hạn bảo hành:{' '}
              {asset.warrantyExpiry
                ? new Date(asset.warrantyExpiry).toLocaleDateString('vi-VN')
                : 'Không có thông tin'}
            </div>
          </div>
        </div>

        {/* Card 3: Vận hành & Lắp đặt */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <Clock className="h-4 w-4 text-purple-600" />
            Thời gian vận hành
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">
              {asset.installDate
                ? new Date(asset.installDate).toLocaleDateString('vi-VN')
                : 'Chưa cập nhật ngày lắp đặt'}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Tạo hồ sơ: {new Date(asset.createdAt).toLocaleDateString('vi-VN')}
            </div>
          </div>
        </div>
      </div>

      {/* Description Box if present */}
      {asset.description && (
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Thông số kỹ thuật & Ghi chú vận hành
          </h3>
          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
            {asset.description}
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm p-4">
        <Tabs
          items={[
            {
              id: 'schedules',
              label: 'Kế hoạch Bảo trì Định kỳ (PM)',
              icon: <Calendar className="h-4 w-4" />,
              count: asset.maintenanceSchedules?.length || 0,
            },
            {
              id: 'work-orders',
              label: 'Phiếu Công việc đã hoàn tất (Work Orders)',
              icon: <CheckCircle2 className="h-4 w-4" />,
              count: allWorkOrders.length,
            },
            {
              id: 'incidents',
              label: 'Sự cố & Yêu cầu đột xuất (Reactive)',
              icon: <AlertTriangle className="h-4 w-4" />,
              count: asset.feedbacks?.length || 0,
            },
          ]}
          activeId={activeTab}
          onChange={setActiveTab}
          variant="underline"
        />

        <div className="mt-4">
          {/* TAB 1: SCHEDULES */}
          {activeTab === 'schedules' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Danh sách kế hoạch kiểm định, bảo trì phòng ngừa tự động theo chu kỳ cho thiết bị này.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsCreateScheduleOpen(true)}
                  className="gap-1.5 text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                >
                  <Plus className="h-3.5 w-3.5" /> Thêm kế hoạch PM
                </Button>
              </div>

              {(!asset.maintenanceSchedules || asset.maintenanceSchedules.length === 0) ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Chưa có lịch bảo trì nào được lập cho thiết bị này.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold uppercase text-slate-500">
                        <th className="py-2.5 px-3">Mã lịch</th>
                        <th className="py-2.5 px-3">Hạng mục kiểm tra</th>
                        <th className="py-2.5 px-3">Chu kỳ</th>
                        <th className="py-2.5 px-3">Kế hoạch kế tiếp</th>
                        <th className="py-2.5 px-3">Kỹ thuật viên phụ trách</th>
                        <th className="py-2.5 px-3">Trạng thái</th>
                        <th className="py-2.5 px-3 text-right">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                      {asset.maintenanceSchedules.map((sch: any) => {
                        const badge = MAINTENANCE_STATUS_BADGE[sch.status as MaintenanceStatus] || {
                          variant: 'info',
                          label: sch.status,
                        };

                        const isOverdue = new Date(sch.nextMaintenance) < new Date() && sch.status !== 'COMPLETED';

                        return (
                          <tr key={sch.id} className="hover:bg-slate-50/80">
                            <td className="py-3 px-3 font-mono font-medium text-slate-900">
                              {sch.code}
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-semibold text-slate-900">{sch.title}</div>
                              {sch.vendor && (
                                <div className="text-[11px] text-slate-500">Thầu: {sch.vendor}</div>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                                {MAINTENANCE_CYCLE_LABELS[sch.cycle as MaintenanceCycle] || sch.cycle}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <div className={`font-semibold ${isOverdue ? 'text-rose-600' : 'text-slate-900'}`}>
                                {new Date(sch.nextMaintenance).toLocaleDateString('vi-VN')}
                              </div>
                              {isOverdue && (
                                <span className="text-[10px] text-rose-600 font-bold uppercase">
                                  Quá hạn bảo trì
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              {sch.technician ? (
                                <div className="flex items-center gap-1.5">
                                  <User className="h-3.5 w-3.5 text-slate-400" />
                                  <span className="font-medium text-slate-800">{sch.technician.name}</span>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">Chưa chỉ định</span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <Badge variant={isOverdue ? 'destructive' : badge.variant} dot>
                                {isOverdue ? 'Quá hạn' : badge.label}
                              </Badge>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <Button
                                size="sm"
                                onClick={() =>
                                  setCompleteScheduleData({
                                    ...sch,
                                    asset: {
                                      name: asset.name,
                                      code: asset.code,
                                      location: asset.location,
                                    },
                                  })
                                }
                                className="h-8 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Hoàn thành bảo trì
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: WORK ORDERS */}
          {activeTab === 'work-orders' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Nhật ký các lần bảo trì đã hoàn tất, bao gồm biên bản nghiệm thu, chi phí phát sinh và kết quả kiểm tra.
              </p>

              {allWorkOrders.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Chưa có phiếu công việc bảo trì nào được lưu trữ.
                </div>
              ) : (
                <div className="space-y-3">
                  {allWorkOrders.map((wo) => (
                    <div
                      key={wo.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                            {wo.code}
                          </span>
                          <span className="text-xs font-semibold text-slate-900">{wo.title}</span>
                        </div>
                        <span className="text-xs text-slate-500">
                          Nghiệm thu: {new Date(wo.completedAt || wo.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>

                      {wo.findings && (
                        <div className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-100">
                          <span className="font-semibold text-slate-900 block mb-0.5">
                            Kết quả & biên bản kiểm tra:
                          </span>
                          {wo.findings}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                        <div>
                          Người thực hiện: <strong className="text-slate-700">{wo.technician?.name || 'Kỹ thuật viên'}</strong>
                        </div>
                        <div>
                          Chi phí vật tư:{' '}
                          <strong className="text-emerald-600">
                            {Number(wo.cost || 0).toLocaleString('vi-VN')} đ
                          </strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: REACTIVE FEEDBACKS */}
          {activeTab === 'incidents' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Các sự cố hỏng hóc hoặc phản ánh đột xuất từ cư dân/nhân viên liên quan trực tiếp đến thiết bị này.
              </p>

              {(!asset.feedbacks || asset.feedbacks.length === 0) ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Không có sự cố đột xuất nào được ghi nhận cho thiết bị này.
                </div>
              ) : (
                <div className="space-y-3">
                  {asset.feedbacks.map((fb: any) => (
                    <div
                      key={fb.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/50 transition-colors space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-blue-600">
                            {fb.code || fb.id.slice(0, 8)}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{fb.title}</span>
                        </div>
                        <Badge variant="outline" className="text-[11px]">
                          {fb.status}
                        </Badge>
                      </div>

                      <p className="text-xs text-slate-600">{fb.content}</p>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                        <span>
                          Người gửi: {fb.resident?.user?.name || fb.resident?.fullName || 'Cư dân'} ({fb.apartment?.apartmentNumber || 'Căn hộ'})
                        </span>
                        <span>{new Date(fb.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal create schedule */}
      <CreateScheduleModal
        open={isCreateScheduleOpen}
        onOpenChange={setIsCreateScheduleOpen}
        preselectedAssetId={asset.id}
        assets={[{ id: asset.id, name: asset.name, code: asset.code }]}
      />

      {/* Modal complete schedule */}
      <CompleteMaintenanceModal
        open={!!completeScheduleData}
        onOpenChange={(open) => !open && setCompleteScheduleData(null)}
        schedule={completeScheduleData}
      />
    </div>
  );
}
