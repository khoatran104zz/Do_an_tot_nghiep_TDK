'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Car,
  Bike,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Home,
  User,
  Calendar,
  ShieldCheck,
  FileText,
  ExternalLink,
  Edit,
  Info,
  Lock,
} from 'lucide-react';

import { StatusBadge } from '@/components/shared/StatusBadge';
import { FormDialog } from '@/components/shared/FormDialog';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/shared/ErrorState';
import { formatDate, formatDateTime } from '@/lib/utils';
import { useVehicle, useUpdateVehicle } from '@/hooks/use-vehicles';
import { toast } from 'sonner';

export default function ResidentVehicleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const { data: response, isLoading, isError, error, refetch } = useVehicle(id);
  const vehicle = response?.data;

  const updateMutation = useUpdateVehicle();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    color: '',
    registrationDocumentUrl: '',
  });

  const handleOpenEdit = () => {
    if (!vehicle) return;
    setFormData({
      brand: vehicle.brand,
      model: vehicle.model || '',
      color: vehicle.color || '',
      registrationDocumentUrl: vehicle.registrationDocumentUrl || '',
    });
    setIsEditOpen(true);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(
      {
        id,
        data: {
          brand: formData.brand.trim(),
          model: formData.model.trim() || null,
          color: formData.color.trim() || null,
          registrationDocumentUrl: formData.registrationDocumentUrl.trim() || null,
        },
      },
      {
        onSuccess: () => {
          setIsEditOpen(false);
          refetch();
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 p-4">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !vehicle) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <ErrorState
          title="Không tìm thấy phương tiện"
          message={(error as any)?.message || 'Bạn không có quyền xem phương tiện này hoặc xe không tồn tại.'}
          onRetry={() => refetch()}
        />
        <div className="mt-4 text-center">
          <Link href="/resident/vehicles">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Quay lại danh sách xe
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isCar = vehicle.type === 'CAR';
  const isPending = vehicle.status === 'PENDING_APPROVAL';
  const isApproved = vehicle.status === 'ACTIVE';
  const isRejected = vehicle.status === 'REJECTED';
  const activeCard = vehicle.parkingCards?.find((c: any) => c.status === 'ACTIVE');

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 px-4 sm:px-0">
      {/* Back button & Action */}
      <div className="flex items-center justify-between">
        <Link href="/resident/vehicles">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs rounded-xl">
            <ArrowLeft className="h-4 w-4" /> Danh sách xe của tôi
          </Button>
        </Link>

        {isPending && (
          <Button
            onClick={handleOpenEdit}
            variant="outline"
            size="sm"
            className="text-xs gap-1.5 rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <Edit className="h-3.5 w-3.5" /> Chỉnh sửa hồ sơ
          </Button>
        )}
      </div>

      {/* Hero Badge Header */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${
              isCar
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
            }`}
          >
            {isCar ? <Car className="h-7 w-7" /> : <Bike className="h-7 w-7" />}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-lg sm:text-xl text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-0.5 rounded-lg tracking-wider shadow-2xs">
                {vehicle.licensePlate}
              </span>
              <StatusBadge type="vehicleStatus" status={vehicle.status} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              {vehicle.brand} {vehicle.model ? `• ${vehicle.model}` : ''} • {vehicle.color || 'Màu tiêu chuẩn'}
            </p>
          </div>
        </div>

        <div className="text-right text-xs text-slate-400 sm:border-l sm:border-slate-100 sm:dark:border-slate-800 sm:pl-4">
          <span className="block text-[11px]">Ngày đăng ký</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {formatDate(vehicle.createdAt)}
          </span>
        </div>
      </div>

      {/* Approval Status Timeline Card */}
      <Card className="border-slate-200/80 dark:border-slate-800 shadow-2xs rounded-2xl">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Clock className="h-4.5 w-4.5 text-blue-600" />
            Tiến độ Phê duyệt Hồ sơ Xe
          </CardTitle>
          <CardDescription className="text-xs">
            Quy trình kiểm soát tính pháp lý và cấp thẻ từ RFID bởi Ban Quản Lý
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5">
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {/* Step 1: Submitted */}
            <div className="relative">
              <span className="absolute -left-6 top-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-slate-900" />
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  1. Gửi hồ sơ đăng ký xe (Submitted)
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Đã ghi nhận thông tin vào hệ thống ngày {formatDateTime(vehicle.createdAt)}
                </p>
              </div>
            </div>

            {/* Step 2: Under review */}
            <div className="relative">
              <span
                className={`absolute -left-6 top-0.5 h-3 w-3 rounded-full ${
                  isPending ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                } ring-4 ring-white dark:ring-slate-900`}
              />
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  2. Ban Quản Lý thụ lý & đối soát cà vẹt (Under review)
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {isPending
                    ? 'Cán bộ quản trị đang kiểm tra hình ảnh giấy tờ và hạn mức đỗ xe của căn hộ.'
                    : 'Đã hoàn tất bước kiểm tra đối soát.'}
                </p>
              </div>
            </div>

            {/* Step 3: Result */}
            {isRejected ? (
              <div className="relative">
                <span className="absolute -left-6 top-0.5 h-3 w-3 rounded-full bg-rose-500 ring-4 ring-white dark:ring-slate-900" />
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 space-y-1">
                  <p className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                    <XCircle className="h-4 w-4" /> 3. Hồ sơ bị từ chối phê duyệt (Rejected)
                  </p>
                  <p className="text-xs text-rose-600 dark:text-rose-300">
                    <span className="font-semibold">Lý do từ chối:</span>{' '}
                    {vehicle.rejectionReason || 'Giấy tờ mờ hoặc không trùng khớp với số căn hộ.'}
                  </p>
                  <p className="text-[11px] text-rose-500 mt-1">
                    Vui lòng chụp lại ảnh cà vẹt rõ nét hoặc liên hệ hotline BQL để được hỗ trợ.
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative">
                <span
                  className={`absolute -left-6 top-0.5 h-3 w-3 rounded-full ${
                    isApproved ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                  } ring-4 ring-white dark:ring-slate-900`}
                />
                <div>
                  <p
                    className={`text-xs font-bold ${
                      isApproved ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    3. Phê duyệt & Kích hoạt thẻ xe (Approved)
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {isApproved
                      ? 'Phương tiện đã được cấp quyền ra vào hầm và kích hoạt thẻ từ RFID.'
                      : 'Đang chờ hoàn tất bước đối soát.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Grid: RFID Card & Document */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* RFID Card Section */}
        <Card className="border-slate-200/80 dark:border-slate-800 shadow-2xs rounded-2xl">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <KeyRound className="h-4.5 w-4.5 text-indigo-600" />
                Thẻ Gửi Xe RFID
              </CardTitle>
              {activeCard && (
                <StatusBadge type="parkingCardStatus" status={activeCard.status} size="sm" />
              )}
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            {activeCard ? (
              <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 via-blue-500/5 to-transparent border border-indigo-200/80 dark:border-indigo-900/60 space-y-3">
                <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 tracking-wider uppercase block">
                  MÃ THẺ TỪ RA VÀO HẦM
                </span>
                <div className="font-mono font-black text-2xl text-indigo-950 dark:text-indigo-100 tracking-wider">
                  {activeCard.cardCode}
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-indigo-200/60 dark:border-indigo-900/40 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Ngày cấp thẻ:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {formatDate(activeCard.issuedAt)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Hạn sử dụng:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {activeCard.expiresAt ? formatDate(activeCard.expiresAt) : 'Vô thời hạn'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-2">
                <KeyRound className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Chưa được gán thẻ RFID
                </p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  Sau khi hồ sơ được phê duyệt, cư dân vui lòng đến quầy Ban Quản Lý nhận thẻ vật lý.
                </p>
              </div>
            )}

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-slate-400" /> Lưu ý phân quyền:
              </p>
              <p className="text-[11px]">
                Cư dân không thể tự ý thay đổi trạng thái thẻ hoặc trạng thái phê duyệt. Để báo mất thẻ hoặc hủy gửi xe, vui lòng liên hệ BQL.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Registration Document (Cà vẹt xe) */}
        <Card className="border-slate-200/80 dark:border-slate-800 shadow-2xs rounded-2xl">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-blue-600" />
                Ảnh Cà Vẹt / Giấy Đăng Ký
              </CardTitle>
              {vehicle.registrationDocumentUrl && (
                <a
                  href={vehicle.registrationDocumentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  Xem ảnh gốc <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-5">
            {vehicle.registrationDocumentUrl ? (
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-2">
                <img
                  src={vehicle.registrationDocumentUrl}
                  alt={`Cà vẹt xe ${vehicle.licensePlate}`}
                  className="rounded-lg object-contain w-full max-h-56 mx-auto"
                />
              </div>
            ) : (
              <div className="text-center py-8 space-y-2 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <FileText className="h-8 w-8 text-slate-400 mx-auto" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Chưa đính kèm hình ảnh cà vẹt xe
                </p>
                {isPending && (
                  <Button size="sm" variant="outline" onClick={handleOpenEdit} className="text-xs mt-1">
                    Bổ sung ảnh giấy tờ
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog for Pending Vehicle */}
      <FormDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        title={`Chỉnh sửa: ${vehicle.licensePlate}`}
        description="Cập nhật thông số hoặc bổ sung hình ảnh cà vẹt trước khi Ban Quản Lý phê duyệt."
        icon={Edit}
        onSubmit={handleUpdateSubmit}
        isLoading={updateMutation.isPending}
        submitText="Lưu thay đổi"
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Hãng sản xuất <span className="text-rose-500">*</span>
              </label>
              <Input
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Dòng xe / Model
              </label>
              <Input
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Màu sơn xe
            </label>
            <Input
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Ảnh chụp Cà vẹt / Giấy đăng ký xe (Link URL)
            </label>
            <Input
              type="url"
              placeholder="https://example.com/cavet-xe.jpg"
              value={formData.registrationDocumentUrl}
              onChange={(e) => setFormData({ ...formData, registrationDocumentUrl: e.target.value })}
            />
          </div>
        </div>
      </FormDialog>
    </div>
  );
}
