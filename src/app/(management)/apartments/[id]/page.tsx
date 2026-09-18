'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Building2,
  Layers,
  Hash,
  Home,
  Users,
  Car,
  Receipt,
  Wrench,
  FileText,
  UserCheck,
  Package,
  History,
  ArrowLeft,
  Edit,
  Plus,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Phone,
  Calendar,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { FormDialog } from '@/components/shared/FormDialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/shared/ErrorState';
import {
  useApartment,
  useUpdateApartment,
  useDeleteApartment,
  useApartmentHistory,
  useCreateApartmentHistory,
  useApartmentHierarchy,
} from '@/hooks/use-apartments';
import { ApartmentFormModal } from '@/components/property/PropertyModals';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { ApartmentStatus, ApartmentHistoryEvent } from '@prisma/client';
import { toast } from 'sonner';

type ActiveTab =
  | 'OVERVIEW'
  | 'RESIDENTS'
  | 'INVOICES'
  | 'VEHICLES'
  | 'FEEDBACKS'
  | 'VISITORS_PARCELS'
  | 'HISTORY';

export default function ApartmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const apartmentId = params?.id as string;

  const [activeTab, setActiveTab] = useState<ActiveTab>('OVERVIEW');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isAddHistoryOpen, setIsAddHistoryOpen] = useState(false);
  const [historyForm, setHistoryForm] = useState({
    event: 'STATUS_CHANGE' as ApartmentHistoryEvent,
    title: '',
    description: '',
  });

  const { data: response, isLoading, isError, error, refetch } = useApartment(apartmentId);
  const { data: historyResponse, refetch: refetchHistory } = useApartmentHistory(apartmentId);
  const { data: hierarchyResponse } = useApartmentHierarchy();

  const updateMutation = useUpdateApartment();
  const deleteMutation = useDeleteApartment();
  const createHistoryMutation = useCreateApartmentHistory();

  const apt = response?.data;
  const historyList = historyResponse?.data || [];
  const hierarchy = hierarchyResponse?.data || [];

  if (isLoading) {
    return (
      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid grid-cols-4 gap-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !apt) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        <ErrorState
          title="Không tìm thấy căn hộ"
          message={error?.message || 'Căn hộ yêu cầu không tồn tại hoặc bạn không có quyền truy cập.'}
          onRetry={refetch}
        />
        <Button onClick={() => router.push('/apartments')} className="mt-4" variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại danh sách căn hộ
        </Button>
      </div>
    );
  }

  const handleUpdate = (formData: any) => {
    updateMutation.mutate(
      { id: apt.id, data: formData },
      {
        onSuccess: () => {
          setIsEditOpen(false);
          refetch();
        },
      }
    );
  };

  const handleDelete = () => {
    deleteMutation.mutate(apt.id, {
      onSuccess: () => {
        router.push('/apartments');
      },
    });
  };

  const handleCreateHistory = (e: React.FormEvent) => {
    e.preventDefault();
    createHistoryMutation.mutate(
      {
        apartmentId: apt.id,
        data: historyForm,
      },
      {
        onSuccess: () => {
          setIsAddHistoryOpen(false);
          setHistoryForm({
            event: 'STATUS_CHANGE',
            title: '',
            description: '',
          });
          refetchHistory();
        },
      }
    );
  };

  // Safe relationships
  const residents = apt.residents || [];
  const contracts = apt.contracts || [];
  const invoices = apt.invoices || [];
  const vehicles = apt.vehicles || [];
  const feedbacks = apt.feedbacks || [];
  const visitorPasses = apt.visitorPasses || [];
  const parcels = apt.parcels || [];

  const buildingName = apt.buildingRef?.name || apt.block?.building?.name || 'Tổ hợp SmartCity Landmark';
  const blockName = apt.block?.name || apt.building;
  const floorName = apt.floorRef?.name || `Tầng ${apt.floor}`;

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Smart Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link
          href="/apartments"
          className="hover:text-foreground transition-colors flex items-center gap-1 font-medium text-blue-600"
        >
          <Home className="h-3.5 w-3.5" />
          Cấu trúc chung cư
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
        <span>{buildingName}</span>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
        <span>{blockName}</span>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
        <span>{floorName}</span>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
        <span className="font-semibold text-foreground font-mono">{apt.code}</span>
      </nav>

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-2xl border shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black font-mono tracking-tight text-foreground">
              {apt.code}
            </h1>
            <StatusBadge type="apartment" status={apt.status} />
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5 text-blue-500" />
              {buildingName}
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1">
              <Layers className="h-3.5 w-3.5 text-emerald-500" />
              {blockName}
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1">
              <Hash className="h-3.5 w-3.5 text-indigo-500" />
              {floorName}
            </span>
            <span>&bull;</span>
            <span className="font-medium text-foreground">{apt.area} m²</span>
            <span>&bull;</span>
            <span>{apt.bedrooms} PN / {apt.bathrooms} PT</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAddHistoryOpen(true)}
            className="text-xs gap-1.5"
          >
            <History className="h-3.5 w-3.5" />
            Ghi Lịch Sử
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditOpen(true)}
            className="text-xs gap-1.5"
          >
            <Edit className="h-3.5 w-3.5" />
            Sửa Căn Hộ
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setIsDeleteOpen(true)}
            className="text-xs gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Xóa
          </Button>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
        <Card className="shadow-xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">Cư Dân Cư Trú</p>
              <h3 className="text-xl font-bold mt-0.5 text-foreground">{apt.residentsCount || residents.length}</h3>
              <p className="text-[10px] text-muted-foreground truncate max-w-28">
                {apt.owner?.fullName || 'Chưa có chủ hộ'}
              </p>
            </div>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-lg">
              <Users className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">Phương Tiện</p>
              <h3 className="text-xl font-bold mt-0.5 text-foreground">{vehicles.length}</h3>
              <p className="text-[10px] text-muted-foreground">Đã đăng ký thẻ</p>
            </div>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-lg">
              <Car className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">Công Nợ Phí</p>
              <h3 className="text-sm font-bold mt-1 text-foreground">
                {apt.totalDebt > 0 ? formatCurrency(apt.totalDebt) : '0 đ'}
              </h3>
              <p className="text-[10px] text-muted-foreground">
                {apt.unpaidInvoicesCount || 0} hóa đơn chưa thu
              </p>
            </div>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-lg">
              <Receipt className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">Sự Cố Kỹ Thuật</p>
              <h3 className="text-xl font-bold mt-0.5 text-foreground">{apt.openTicketsCount || 0}</h3>
              <p className="text-[10px] text-muted-foreground">Đang xử lý</p>
            </div>
            <div className="p-2 bg-red-50 dark:bg-red-950/40 text-red-600 rounded-lg">
              <Wrench className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">Hợp Đồng Thuê/Bán</p>
              <h3 className="text-sm font-bold mt-1 text-foreground">
                {contracts.length > 0 ? contracts[0].type : 'Chưa có'}
              </h3>
              <p className="text-[10px] text-muted-foreground">
                {contracts.length > 0 ? contracts[0].status : 'Trống'}
              </p>
            </div>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-lg">
              <FileText className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b flex items-center gap-2 overflow-x-auto text-xs font-medium pb-px scrollbar-none">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`px-3.5 py-2.5 rounded-t-lg border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === 'OVERVIEW'
              ? 'border-blue-600 text-blue-600 font-semibold bg-blue-50/50 dark:bg-blue-950/30'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Home className="h-3.5 w-3.5" />
          Tổng Quan
        </button>

        <button
          onClick={() => setActiveTab('RESIDENTS')}
          className={`px-3.5 py-2.5 rounded-t-lg border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === 'RESIDENTS'
              ? 'border-blue-600 text-blue-600 font-semibold bg-blue-50/50 dark:bg-blue-950/30'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          Cư Dân ({residents.length})
        </button>

        <button
          onClick={() => setActiveTab('INVOICES')}
          className={`px-3.5 py-2.5 rounded-t-lg border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === 'INVOICES'
              ? 'border-blue-600 text-blue-600 font-semibold bg-blue-50/50 dark:bg-blue-950/30'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Receipt className="h-3.5 w-3.5" />
          Hóa Đơn & Nợ ({invoices.length})
        </button>

        <button
          onClick={() => setActiveTab('VEHICLES')}
          className={`px-3.5 py-2.5 rounded-t-lg border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === 'VEHICLES'
              ? 'border-blue-600 text-blue-600 font-semibold bg-blue-50/50 dark:bg-blue-950/30'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Car className="h-3.5 w-3.5" />
          Phương Tiện ({vehicles.length})
        </button>

        <button
          onClick={() => setActiveTab('FEEDBACKS')}
          className={`px-3.5 py-2.5 rounded-t-lg border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === 'FEEDBACKS'
              ? 'border-blue-600 text-blue-600 font-semibold bg-blue-50/50 dark:bg-blue-950/30'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Wrench className="h-3.5 w-3.5" />
          Sự Cố Bảo Trì ({feedbacks.length})
        </button>

        <button
          onClick={() => setActiveTab('VISITORS_PARCELS')}
          className={`px-3.5 py-2.5 rounded-t-lg border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === 'VISITORS_PARCELS'
              ? 'border-blue-600 text-blue-600 font-semibold bg-blue-50/50 dark:bg-blue-950/30'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Package className="h-3.5 w-3.5" />
          Khách & Bưu Kiện ({visitorPasses.length + parcels.length})
        </button>

        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`px-3.5 py-2.5 rounded-t-lg border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === 'HISTORY'
              ? 'border-blue-600 text-blue-600 font-semibold bg-blue-50/50 dark:bg-blue-950/30'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <History className="h-3.5 w-3.5" />
          Lịch Sử Căn Hộ ({historyList.length})
        </button>
      </div>

      {/* Tab Contents */}
      <div className="space-y-4">
        {/* 1. OVERVIEW TAB */}
        {activeTab === 'OVERVIEW' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Home className="h-4 w-4 text-blue-600" />
                  Thông Số Kỹ Thuật Căn Hộ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Mã Căn Hộ:</span>
                  <span className="font-mono font-bold text-foreground">{apt.code}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Tổ Hợp / Dự Án:</span>
                  <span className="font-medium text-foreground">{buildingName}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Khối Tháp (Tower):</span>
                  <span className="font-medium text-foreground">{blockName}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Tầng Lầu:</span>
                  <span className="font-medium text-foreground">{floorName}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Diện Tích Thông Thủy:</span>
                  <span className="font-medium text-foreground">{apt.area} m²</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Phòng Ngủ / Vệ Sinh:</span>
                  <span className="font-medium text-foreground">{apt.bedrooms} PN / {apt.bathrooms} PT</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Trạng Thái:</span>
                  <StatusBadge type="apartment" status={apt.status} />
                </div>
                {apt.note && (
                  <div className="pt-2 border-t text-muted-foreground">
                    <span className="font-medium text-foreground block mb-0.5">Ghi chú đặc điểm:</span>
                    <p className="bg-muted/50 p-2 rounded text-xs">{apt.note}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-emerald-600" />
                  Chủ Hộ & Hợp Đồng Pháp Lý
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                {apt.owner ? (
                  <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/40 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground text-sm">{apt.owner.fullName}</span>
                      <Badge className="bg-emerald-600 text-white text-[10px]">Chủ Hộ</Badge>
                    </div>
                    {apt.owner.phone && (
                      <p className="text-muted-foreground flex items-center gap-1.5">
                        <Phone className="h-3 w-3" /> {apt.owner.phone}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-4 border border-dashed rounded-xl text-center text-muted-foreground">
                    Chưa đăng ký thông tin chủ hộ chính
                  </div>
                )}

                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground">Hợp Đồng Hiện Tại</h4>
                  {contracts.length > 0 ? (
                    <div className="p-3 bg-muted/40 rounded-xl border space-y-1">
                      <div className="flex justify-between">
                        <span className="font-medium font-mono">{contracts[0].code}</span>
                        <Badge variant="outline">{contracts[0].status}</Badge>
                      </div>
                      <div className="flex justify-between text-muted-foreground text-[11px]">
                        <span>Loại: {contracts[0].type === 'RENT' ? 'Hợp đồng thuê' : 'Hợp đồng mua bán'}</span>
                        <span>Giá trị: {formatCurrency(contracts[0].deposit || 0)}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">Chưa có hợp đồng nào được tạo cho căn này.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 2. RESIDENTS TAB */}
        {activeTab === 'RESIDENTS' && (
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Danh Sách Nhân Khẩu / Cư Dân ({residents.length})</CardTitle>
              <Link href="/residents">
                <Button size="sm" variant="outline" className="text-xs gap-1">
                  <Plus className="h-3 w-3" /> Quản lý cư dân
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {residents.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">Chưa có cư dân nào đăng ký ở căn hộ này.</p>
              ) : (
                <div className="divide-y text-xs">
                  {residents.map((res: any) => (
                    <div key={res.id} className="py-3 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground text-sm">{res.fullName}</span>
                          <Badge variant="secondary" className="text-[10px]">
                            {res.relationshipToOwner || 'Cư dân'}
                          </Badge>
                          <Badge
                            variant={res.status === 'RESIDING' ? 'default' : 'outline'}
                            className="text-[10px]"
                          >
                            {res.status === 'RESIDING' ? 'Đang ở' : res.status}
                          </Badge>
                        </div>
                        {res.phone && (
                          <p className="text-muted-foreground flex items-center gap-1 text-[11px]">
                            <Phone className="h-3 w-3" /> {res.phone}
                          </p>
                        )}
                      </div>

                      <Link href="/residents">
                        <Button size="sm" variant="ghost" className="text-xs">
                          Xem hồ sơ
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 3. INVOICES TAB */}
        {activeTab === 'INVOICES' && (
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Lịch Sử Hóa Đơn & Nợ Phí ({invoices.length})</CardTitle>
              <Link href="/invoices">
                <Button size="sm" variant="outline" className="text-xs gap-1">
                  <Plus className="h-3 w-3" /> Tạo Hóa Đơn
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">Không có hóa đơn nào cho căn hộ này.</p>
              ) : (
                <div className="divide-y text-xs">
                  {invoices.map((inv: any) => (
                    <div key={inv.id} className="py-3 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-foreground">{inv.code}</span>
                          <StatusBadge type="invoice" status={inv.status} />
                        </div>
                        <p className="text-muted-foreground text-[11px] mt-0.5">
                          Hạn thanh toán: {formatDate(inv.dueDate)}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-sm text-foreground block">
                          {formatCurrency(inv.totalAmount || 0)}
                        </span>
                        <Link href={`/invoices`} className="text-blue-600 text-[11px] hover:underline">
                          Chi tiết hóa đơn
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 4. VEHICLES TAB */}
        {activeTab === 'VEHICLES' && (
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Phương Tiện & Thẻ Gửi Xe ({vehicles.length})</CardTitle>
              <Link href="/vehicles">
                <Button size="sm" variant="outline" className="text-xs gap-1">
                  <Plus className="h-3 w-3" /> Đăng Ký Xe
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {vehicles.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">Căn hộ chưa đăng ký phương tiện nào.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {vehicles.map((v: any) => (
                    <div key={v.id} className="p-3 bg-muted/40 rounded-xl border flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-background rounded-lg border text-blue-600">
                          <Car className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="font-mono font-bold text-foreground">{v.licensePlate}</span>
                          <p className="text-muted-foreground text-[11px]">
                            {v.type} &bull; {v.model || 'Tiêu chuẩn'}
                          </p>
                        </div>
                      </div>
                      <StatusBadge type="vehicleStatus" status={v.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 5. FEEDBACKS TAB */}
        {activeTab === 'FEEDBACKS' && (
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Sự Cố Kỹ Thuật & Yêu Cầu Bảo Trì ({feedbacks.length})</CardTitle>
              <Link href="/feedbacks">
                <Button size="sm" variant="outline" className="text-xs gap-1">
                  <Plus className="h-3 w-3" /> Báo Sự Cố
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {feedbacks.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">Không có sự cố nào đang báo cáo.</p>
              ) : (
                <div className="divide-y text-xs">
                  {feedbacks.map((f: any) => (
                    <div key={f.id} className="py-3 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-foreground">{f.code}</span>
                          <span className="font-semibold text-foreground">{f.title}</span>
                          <StatusBadge type="ticketStatus" status={f.status} />
                        </div>
                        <p className="text-muted-foreground text-[11px]">
                          Ưu tiên: {f.priority} &bull; Ngày tạo: {formatDate(f.createdAt)}
                        </p>
                      </div>

                      <Link href="/feedbacks">
                        <Button size="sm" variant="ghost" className="text-xs">
                          Xử lý
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 6. VISITORS & PARCELS TAB */}
        {activeTab === 'VISITORS_PARCELS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-blue-600" />
                  Khách Ra Vào ({visitorPasses.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs">
                {visitorPasses.length === 0 ? (
                  <p className="text-muted-foreground py-4 text-center">Chưa có lượt khách nào đăng ký.</p>
                ) : (
                  <div className="divide-y">
                    {visitorPasses.map((pass: any) => (
                      <div key={pass.id} className="py-2.5 flex items-center justify-between">
                        <div>
                          <span className="font-medium text-foreground">{pass.visitorName}</span>
                          <p className="text-muted-foreground text-[11px]">
                            Ngày đến: {formatDate(pass.expectedDate)}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-[10px]">{pass.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4 text-amber-600" />
                  Bưu Kiện Nhận ({parcels.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs">
                {parcels.length === 0 ? (
                  <p className="text-muted-foreground py-4 text-center">Không có bưu kiện nào ghi nhận.</p>
                ) : (
                  <div className="divide-y">
                    {parcels.map((p: any) => (
                      <div key={p.id} className="py-2.5 flex items-center justify-between">
                        <div>
                          <span className="font-mono font-medium text-foreground">{p.trackingNumber || p.pickupCode}</span>
                          <p className="text-muted-foreground text-[11px]">Người nhận: {p.recipientName}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px]">{p.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* 7. HISTORY TAB */}
        {activeTab === 'HISTORY' && (
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <History className="h-4 w-4 text-blue-600" />
                Dòng Thời Gian Lịch Sử & Biến Động ({historyList.length})
              </CardTitle>
              <Button size="sm" onClick={() => setIsAddHistoryOpen(true)} className="text-xs gap-1">
                <Plus className="h-3 w-3" /> Ghi Nhận Sự Kiện
              </Button>
            </CardHeader>
            <CardContent>
              {historyList.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">Chưa có sự kiện nào được ghi nhận.</p>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-muted-foreground/20">
                  {historyList.map((h: any) => (
                    <div key={h.id} className="relative group text-xs">
                      <div className="absolute -left-6 top-0.5 w-3 h-3 rounded-full bg-[#0F6B4F] ring-4 ring-background" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">{h.title}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {h.event}
                          </span>
                        </div>
                        {h.description && (
                          <p className="text-muted-foreground mt-1 text-[11px] leading-relaxed">{h.description}</p>
                        )}
                        <span className="text-[10px] text-muted-foreground mt-1 block">
                          Thời gian: {formatDateTime(h.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Apartment Modal */}
      {isEditOpen && (
        <ApartmentFormModal
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          onSubmit={handleUpdate}
          initialData={apt}
          hierarchy={hierarchy}
          isLoading={updateMutation.isPending}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDelete}
        title="Xác nhận xóa căn hộ"
        description={`Bạn có chắc chắn muốn xóa căn hộ ${apt.code}? Hành động này không thể hoàn tác.`}
        confirmText="Xác nhận xóa"
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />

      {/* Add History Event Modal */}
      <FormDialog
        open={isAddHistoryOpen}
        onOpenChange={setIsAddHistoryOpen}
        title="Ghi Nhận Sự Kiện Lịch Sử Căn Hộ"
        description="Lưu vết biến động căn hộ (đổi chủ, chuyển đến/đi, bảo dưỡng...)"
        onSubmit={handleCreateHistory}
        isLoading={createHistoryMutation.isPending}
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold block mb-1">Loại sự kiện *</label>
            <select
              value={historyForm.event}
              onChange={(e) => setHistoryForm({ ...historyForm, event: e.target.value as any })}
              className="w-full text-xs p-2 border rounded-md bg-background"
            >
              <option value="STATUS_CHANGE">Thay đổi trạng thái căn hộ</option>
              <option value="OWNER_TRANSFER">Chuyển nhượng quyền sở hữu</option>
              <option value="TENANT_MOVE_IN">Khách thuê mới chuyển đến</option>
              <option value="TENANT_MOVE_OUT">Khách thuê kết thúc hợp đồng dọn đi</option>
              <option value="RESIDENT_MOVE_IN">Cư dân mới dọn vào</option>
              <option value="RESIDENT_MOVE_OUT">Cư dân dọn đi</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1">Tiêu đề sự kiện *</label>
            <input
              type="text"
              required
              placeholder="VD: Bàn giao thẻ xe và chìa khóa cho chủ hộ mới"
              value={historyForm.title}
              onChange={(e) => setHistoryForm({ ...historyForm, title: e.target.value })}
              className="w-full text-xs p-2 border rounded-md bg-background"
            />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1">Mô tả chi tiết</label>
            <textarea
              placeholder="Nội dung ghi chú chi tiết sự kiện biến động..."
              value={historyForm.description}
              onChange={(e) => setHistoryForm({ ...historyForm, description: e.target.value })}
              className="w-full text-xs p-2 border rounded-md bg-background min-h-20"
            />
          </div>
        </div>
      </FormDialog>
    </div>
  );
}
