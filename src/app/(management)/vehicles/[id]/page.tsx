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
  Phone,
  Mail,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  FileText,
  ExternalLink,
  Edit,
  Trash2,
  PowerOff,
  Lock,
  Unlock,
  History,
  Info,
} from 'lucide-react';

import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { FormDialog } from '@/components/shared/FormDialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/shared/ErrorState';
import { formatDate, formatDateTime } from '@/lib/utils';
import {
  useVehicle,
  useUpdateVehicle,
  useDeleteVehicle,
  useApproveVehicle,
  useRejectVehicle,
  useDeactivateVehicle,
  useIssueParkingCard,
} from '@/hooks/use-vehicles';
import { useLockParkingCard, useUnlockParkingCard } from '@/hooks/use-parking-cards';
import { useApartments } from '@/hooks/use-apartments';
import { useResidents } from '@/hooks/use-residents';
import { VehicleType } from '@prisma/client';
import { toast } from 'sonner';

export default function VehicleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || 'MANAGER';
  const canManage = userRole === 'ADMIN' || userRole === 'MANAGER';

  // Query vehicle detail
  const { data: response, isLoading, isError, error, refetch } = useVehicle(id);
  const vehicle = response?.data;

  // Mutations
  const updateMutation = useUpdateVehicle();
  const deleteMutation = useDeleteVehicle();
  const approveMutation = useApproveVehicle();
  const rejectMutation = useRejectVehicle();
  const deactivateMutation = useDeactivateVehicle();
  const issueCardMutation = useIssueParkingCard();
  const lockCardMutation = useLockParkingCard();
  const unlockCardMutation = useUnlockParkingCard();

  // Dialog States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [approveCardCode, setApproveCardCode] = useState('');
  const [approveExpiresAt, setApproveExpiresAt] = useState('');

  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Card Action States
  const [isIssueCardOpen, setIsIssueCardOpen] = useState(false);
  const [cardCodeInput, setCardCodeInput] = useState('');
  const [cardExpiresAtInput, setCardExpiresAtInput] = useState('');

  const [lockingCardId, setLockingCardId] = useState<string | null>(null);
  const [lockReasonInput, setLockReasonInput] = useState('');

  const [unlockingCardId, setUnlockingCardId] = useState<string | null>(null);

  // Edit Form State
  const [formData, setFormData] = useState({
    licensePlate: '',
    type: 'MOTORBIKE' as VehicleType,
    brand: '',
    model: '',
    color: '',
    apartmentId: '',
    residentId: '',
    registrationDocumentUrl: '',
  });

  const { data: apartmentsRes } = useApartments({ limit: 150 });
  const apartments = apartmentsRes?.data || [];

  const { data: residentsRes } = useResidents({
    apartmentId: formData.apartmentId || vehicle?.apartmentId || undefined,
    limit: 50,
  });
  const apartmentResidents = residentsRes?.data || [];

  const handleOpenEdit = () => {
    if (!vehicle) return;
    setFormData({
      licensePlate: vehicle.licensePlate,
      type: vehicle.type,
      brand: vehicle.brand,
      model: vehicle.model || '',
      color: vehicle.color || '',
      apartmentId: vehicle.apartmentId,
      residentId: vehicle.residentId || '',
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
          licensePlate: formData.licensePlate.trim().toUpperCase(),
          type: formData.type,
          brand: formData.brand,
          model: formData.model || null,
          color: formData.color || null,
          apartmentId: formData.apartmentId,
          residentId: formData.residentId || null,
          registrationDocumentUrl: formData.registrationDocumentUrl || null,
        },
      },
      {
        onSuccess: () => {
          setIsEditOpen(false);
        },
      }
    );
  };

  const handleApproveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    approveMutation.mutate(
      {
        id,
        data: {
          cardCode: approveCardCode.trim() ? approveCardCode.trim().toUpperCase() : undefined,
          expiresAt: approveExpiresAt || undefined,
        },
      },
      {
        onSuccess: () => {
          setIsApproveOpen(false);
          setApproveCardCode('');
          setApproveExpiresAt('');
        },
      }
    );
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối phê duyệt');
      return;
    }
    rejectMutation.mutate(
      {
        id,
        data: { reason: rejectReason.trim() },
      },
      {
        onSuccess: () => {
          setIsRejectOpen(false);
          setRejectReason('');
        },
      }
    );
  };

  const handleDeactivateConfirm = () => {
    deactivateMutation.mutate(id, {
      onSuccess: () => {
        setIsDeactivateOpen(false);
      },
    });
  };

  const handleDeleteConfirm = () => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        setIsDeleteOpen(false);
        router.push('/vehicles');
      },
    });
  };

  const handleIssueCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardCodeInput.trim()) {
      toast.error('Vui lòng nhập mã thẻ RFID');
      return;
    }
    issueCardMutation.mutate(
      {
        vehicleId: id,
        data: {
          cardCode: cardCodeInput.trim().toUpperCase(),
          expiresAt: cardExpiresAtInput || undefined,
        },
      },
      {
        onSuccess: () => {
          setIsIssueCardOpen(false);
          setCardCodeInput('');
          setCardExpiresAtInput('');
        },
      }
    );
  };

  const handleLockCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lockingCardId) return;
    if (!lockReasonInput.trim()) {
      toast.error('Vui lòng nhập lý do khóa thẻ xe');
      return;
    }
    lockCardMutation.mutate(
      {
        id: lockingCardId,
        data: { lockReason: lockReasonInput.trim() },
      },
      {
        onSuccess: () => {
          setLockingCardId(null);
          setLockReasonInput('');
        },
      }
    );
  };

  const handleUnlockCardConfirm = () => {
    if (!unlockingCardId) return;
    unlockCardMutation.mutate(unlockingCardId, {
      onSuccess: () => {
        setUnlockingCardId(null);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !vehicle) {
    return (
      <ErrorState
        title="Không tìm thấy thông tin phương tiện"
        message={(error as any)?.message || 'Phương tiện không tồn tại hoặc bạn không có quyền truy cập.'}
        onRetry={() => refetch()}
      />
    );
  }

  const isPending = vehicle.status === 'PENDING_APPROVAL';
  const isActive = vehicle.status === 'ACTIVE';
  const activeCard = vehicle.parkingCards?.find((c: any) => c.status === 'ACTIVE');
  const allCards = vehicle.parkingCards || [];
  const timeline = vehicle.timeline || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/vehicles">
            <Button variant="outline" size="sm" className="gap-1 text-xs">
              <ArrowLeft className="h-4 w-4" /> Danh sách xe
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-mono font-black text-lg sm:text-xl text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-1 rounded-lg tracking-wider shadow-2xs">
              {vehicle.licensePlate}
            </span>
            <StatusBadge type="vehicleStatus" status={vehicle.status} />
          </div>
        </div>

        {/* RBAC-dependent Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {canManage && isPending && (
            <>
              <Button
                onClick={() => {
                  setApproveCardCode('');
                  setApproveExpiresAt('');
                  setIsApproveOpen(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 gap-1.5 font-semibold"
              >
                <CheckCircle2 className="h-4 w-4" /> Phê duyệt xe
              </Button>
              <Button
                onClick={() => {
                  setRejectReason('');
                  setIsRejectOpen(true);
                }}
                variant="outline"
                className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40 text-xs h-9 gap-1.5"
              >
                <XCircle className="h-4 w-4" /> Từ chối duyệt
              </Button>
            </>
          )}

          {canManage && isActive && (
            <>
              <Button
                onClick={() => {
                  setCardCodeInput('');
                  setCardExpiresAtInput('');
                  setIsIssueCardOpen(true);
                }}
                variant="outline"
                className="text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-xs h-9 gap-1.5"
              >
                <KeyRound className="h-4 w-4" /> Cấp thẻ RFID
              </Button>
              <Button
                onClick={() => setIsDeactivateOpen(true)}
                variant="outline"
                className="text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs h-9 gap-1.5"
              >
                <PowerOff className="h-4 w-4" /> Ngưng hoạt động
              </Button>
            </>
          )}

          {canManage && (
            <Button
              onClick={handleOpenEdit}
              variant="outline"
              className="text-xs h-9 gap-1.5"
            >
              <Edit className="h-4 w-4" /> Sửa thông tin
            </Button>
          )}

          {userRole === 'ADMIN' && (
            <Button
              onClick={() => setIsDeleteOpen(true)}
              variant="ghost"
              className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs h-9"
              aria-label="Xóa hồ sơ xe"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Details, Document, Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Vehicle Details */}
          <Card className="border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Car className="h-4.5 w-4.5 text-blue-600" />
                Thông số Kỹ thuật & Định danh
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Biển số đăng ký</span>
                  <div className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                    {vehicle.licensePlate}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Loại phương tiện</span>
                  <div>
                    <StatusBadge type="vehicleType" status={vehicle.type} />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Hãng sản xuất</span>
                  <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                    {vehicle.brand}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Dòng xe / Model</span>
                  <div className="text-sm text-slate-800 dark:text-slate-200">
                    {vehicle.model || 'Không xác định'}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Màu sơn xe</span>
                  <div className="text-sm text-slate-800 dark:text-slate-200">
                    {vehicle.color || 'Không ghi nhận'}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Ngày nộp hồ sơ</span>
                  <div className="text-sm text-slate-700 dark:text-slate-300">
                    {formatDate(vehicle.createdAt)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Registration Document */}
          <Card className="border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <FileText className="h-4.5 w-4.5 text-blue-600" />
                  Cà vẹt & Giấy tờ Đăng ký xe
                </CardTitle>
                {vehicle.registrationDocumentUrl && (
                  <a
                    href={vehicle.registrationDocumentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    Mở ảnh gốc <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-5">
              {vehicle.registrationDocumentUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-2 max-w-lg">
                  <img
                    src={vehicle.registrationDocumentUrl}
                    alt={`Giấy tờ xe ${vehicle.licensePlate}`}
                    className="rounded-lg object-contain w-full max-h-72"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                  <span className="block text-[11px] text-slate-400 text-center mt-2">
                    Hình ảnh tài liệu lưu trữ điện tử phục vụ đối soát
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center space-y-2">
                  <FileText className="h-8 w-8 text-slate-400" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Chưa đính kèm ảnh chụp Cà vẹt / Giấy tờ xe
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-xs">
                    Người quản trị hoặc cư dân có thể cập nhật đường dẫn ảnh qua chức năng Sửa thông tin.
                  </p>
                  {canManage && (
                    <Button size="sm" variant="outline" onClick={handleOpenEdit} className="text-xs mt-2">
                      Cập nhật tài liệu
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 3: Timeline & Audit History */}
          <Card className="border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <History className="h-4.5 w-4.5 text-blue-600" />
                Lịch sử Thao tác & Vận hành (Audit Timeline)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              {timeline.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  Chưa ghi nhận sự kiện thao tác nào trong hệ thống.
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                  {timeline.map((event: any) => {
                    let dotColor = 'bg-blue-600';
                    let actionText = event.action;

                    if (event.action === 'CREATE_VEHICLE') {
                      dotColor = 'bg-blue-500';
                      actionText = 'Đăng ký phương tiện';
                    } else if (event.action === 'APPROVE_VEHICLE') {
                      dotColor = 'bg-emerald-500';
                      actionText = 'Ban Quản Lý phê duyệt phương tiện';
                    } else if (event.action === 'REJECT_VEHICLE') {
                      dotColor = 'bg-rose-500';
                      actionText = 'Từ chối phê duyệt hồ sơ xe';
                    } else if (event.action === 'DEACTIVATE_VEHICLE') {
                      dotColor = 'bg-amber-500';
                      actionText = 'Ngưng hoạt động phương tiện';
                    } else if (event.action === 'ISSUE_PARKING_CARD') {
                      dotColor = 'bg-indigo-500';
                      actionText = 'Cấp phát thẻ từ RFID';
                    } else if (event.action === 'LOCK_PARKING_CARD') {
                      dotColor = 'bg-rose-500';
                      actionText = 'Khóa thẻ xe RFID';
                    } else if (event.action === 'UNLOCK_PARKING_CARD') {
                      dotColor = 'bg-emerald-500';
                      actionText = 'Mở khóa thẻ xe RFID';
                    }

                    return (
                      <div key={event.id} className="relative group">
                        <span
                          className={`absolute -left-6 top-1 h-2.5 w-2.5 rounded-full ${dotColor} ring-4 ring-white dark:ring-slate-900`}
                        />
                        <div className="space-y-0.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                              {actionText}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {formatDateTime(event.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Thực hiện bởi: <span className="font-medium text-slate-700 dark:text-slate-300">{event.actorEmail || 'Hệ thống'}</span> ({event.actorRole || 'AUTO'})
                          </p>
                          {event.metadata && typeof event.metadata === 'object' && (
                            <div className="mt-1 p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                              {Object.entries(event.metadata).map(([k, v]) => (
                                <div key={k}>
                                  <span className="text-slate-400">{k}:</span> {String(v)}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Column: Parking Card, Apartment, Owner */}
        <div className="space-y-6">
          {/* Section 1: RFID Parking Card */}
          <Card className="border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <KeyRound className="h-4.5 w-4.5 text-indigo-600" />
                  Thẻ Gửi Xe RFID
                </CardTitle>
                {activeCard && (
                  <StatusBadge type="parkingCardStatus" status={activeCard.status} />
                )}
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {activeCard ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 via-blue-500/5 to-transparent border border-indigo-200/80 dark:border-indigo-900/60">
                    <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 tracking-wider uppercase block">
                      MÃ THẺ TỪ THÔNG MINH
                    </span>
                    <div className="font-mono font-black text-xl text-indigo-950 dark:text-indigo-100 mt-1 tracking-wider">
                      {activeCard.cardCode}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-indigo-200/60 dark:border-indigo-900/40 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Ngày cấp</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {formatDate(activeCard.issuedAt)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Hạn sử dụng</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {activeCard.expiresAt ? formatDate(activeCard.expiresAt) : 'Vô thời hạn'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions for Active Card */}
                  {canManage && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setLockingCardId(activeCard.id);
                          setLockReasonInput('');
                        }}
                        className="w-full text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs gap-1.5"
                      >
                        <Lock className="h-3.5 w-3.5" /> Khóa thẻ này
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 space-y-2">
                  <KeyRound className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Phương tiện chưa có thẻ RFID hoạt động
                  </p>
                  {canManage && isActive && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setCardCodeInput('');
                        setCardExpiresAtInput('');
                        setIsIssueCardOpen(true);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5 mt-2"
                    >
                      <KeyRound className="h-3.5 w-3.5" /> Cấp thẻ gửi xe ngay
                    </Button>
                  )}
                </div>
              )}

              {/* Card History (Locked or previous cards) */}
              {allCards.length > 1 && (
                <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Lịch sử các thẻ cũ
                  </span>
                  <div className="space-y-2">
                    {allCards
                      .filter((c: any) => c.id !== activeCard?.id)
                      .map((card: any) => (
                        <div
                          key={card.id}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs"
                        >
                          <div>
                            <span className="font-mono font-bold block">{card.cardCode}</span>
                            {card.lockReason && (
                              <span className="text-[10px] text-rose-500 block">
                                Lý do khóa: {card.lockReason}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusBadge type="parkingCardStatus" status={card.status} />
                            {canManage && card.status === 'LOCKED' && (
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                onClick={() => setUnlockingCardId(card.id)}
                                className="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                title="Mở khóa thẻ"
                                aria-label="Mở khóa thẻ"
                              >
                                <Unlock className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 2: Apartment Info */}
          <Card className="border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Home className="h-4.5 w-4.5 text-blue-600" />
                Căn hộ Gắn kết
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              {vehicle.apartment ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Mã căn hộ:</span>
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded text-sm">
                      {vehicle.apartment.code}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Tòa nhà:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {vehicle.apartment.building}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Tầng:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Tầng {vehicle.apartment.floor}
                    </span>
                  </div>
                  <div className="pt-2">
                    <Link href={`/apartments?search=${vehicle.apartment.code}`}>
                      <Button variant="outline" size="sm" className="w-full text-xs gap-1">
                        Xem hồ sơ căn hộ <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </>
              ) : (
                <p className="text-xs text-slate-400 italic">Chưa gắn vào căn hộ</p>
              )}
            </CardContent>
          </Card>

          {/* Section 3: Resident Owner */}
          <Card className="border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <User className="h-4.5 w-4.5 text-blue-600" />
                Chủ Phương tiện
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              {vehicle.resident ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Họ và tên:</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                      {vehicle.resident.fullName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Số điện thoại:</span>
                    <a
                      href={`tel:${vehicle.resident.phone}`}
                      className="text-blue-600 hover:underline font-mono"
                    >
                      {vehicle.resident.phone}
                    </a>
                  </div>
                  {vehicle.resident.email && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Email:</span>
                      <a
                        href={`mailto:${vehicle.resident.email}`}
                        className="text-slate-700 dark:text-slate-300 hover:underline truncate max-w-[150px]"
                      >
                        {vehicle.resident.email}
                      </a>
                    </div>
                  )}
                  <div className="pt-2">
                    <Link href={`/residents?search=${vehicle.resident.phone}`}>
                      <Button variant="outline" size="sm" className="w-full text-xs gap-1">
                        Xem hồ sơ cư dân <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </>
              ) : (
                <div className="text-xs text-slate-400 italic">
                  Đăng ký đứng tên chung của căn hộ, chưa gán cá nhân cụ thể.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Approve Dialog */}
      <FormDialog
        open={isApproveOpen}
        onOpenChange={setIsApproveOpen}
        title={`Phê duyệt xe: ${vehicle.licensePlate}`}
        description="Xác nhận hồ sơ hợp lệ, kích hoạt trạng thái phương tiện và tùy chọn cấp phát thẻ từ RFID ngay."
        icon={CheckCircle2}
        onSubmit={handleApproveSubmit}
        isLoading={approveMutation.isPending}
        submitText="Xác nhận Phê duyệt"
      >
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-1 text-xs text-emerald-800 dark:text-emerald-200">
          <p className="font-semibold">
            Phương tiện: {vehicle.brand} {vehicle.model} - Biển số {vehicle.licensePlate}
          </p>
          <p>
            Căn hộ: {vehicle.apartment?.code} ({vehicle.apartment?.building}) | Chủ xe:{' '}
            {vehicle.resident?.fullName || 'Đại diện căn hộ'}
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Mã thẻ gửi xe RFID (Tùy chọn cấp ngay)
            </label>
            <Input
              placeholder="VD: RFID-09823"
              value={approveCardCode}
              onChange={(e) => setApproveCardCode(e.target.value.toUpperCase())}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Hạn dùng của thẻ (Tùy chọn)
            </label>
            <Input
              type="date"
              value={approveExpiresAt}
              onChange={(e) => setApproveExpiresAt(e.target.value)}
            />
          </div>
        </div>
      </FormDialog>

      {/* Reject Dialog */}
      <FormDialog
        open={isRejectOpen}
        onOpenChange={setIsRejectOpen}
        title={`Từ chối duyệt xe: ${vehicle.licensePlate}`}
        description="Nhập lý do từ chối đăng ký phương tiện để lưu vết và thông báo cho cư dân."
        icon={XCircle}
        onSubmit={handleRejectSubmit}
        isLoading={rejectMutation.isPending}
        submitText="Xác nhận Từ chối"
      >
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Lý do từ chối <span className="text-rose-500">*</span>
          </label>
          <Input
            placeholder="VD: Giấy tờ mờ; Biển số không trùng khớp ảnh chụp..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            required
            autoFocus
          />
        </div>
      </FormDialog>

      {/* Issue Card Dialog */}
      <FormDialog
        open={isIssueCardOpen}
        onOpenChange={setIsIssueCardOpen}
        title={`Cấp thẻ gửi xe RFID: ${vehicle.licensePlate}`}
        description="Nhập mã thẻ từ RFID để liên kết với phương tiện và mở barie ra vào."
        icon={KeyRound}
        onSubmit={handleIssueCardSubmit}
        isLoading={issueCardMutation.isPending}
        submitText="Kích hoạt Thẻ RFID"
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Mã thẻ RFID <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="VD: RFID-CARD-001"
              value={cardCodeInput}
              onChange={(e) => setCardCodeInput(e.target.value.toUpperCase())}
              required
              autoFocus
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Hạn dùng của thẻ (Tùy chọn)
            </label>
            <Input
              type="date"
              value={cardExpiresAtInput}
              onChange={(e) => setCardExpiresAtInput(e.target.value)}
            />
          </div>
        </div>
      </FormDialog>

      {/* Lock Card Dialog (Mandatory Reason) */}
      <FormDialog
        open={Boolean(lockingCardId)}
        onOpenChange={(open) => !open && setLockingCardId(null)}
        title="Khóa thẻ gửi xe RFID"
        description="Thẻ bị khóa sẽ không thể quẹt qua cổng barie hầm giữ xe."
        icon={Lock}
        onSubmit={handleLockCardSubmit}
        isLoading={lockCardMutation.isPending}
        submitText="Xác nhận Khóa thẻ"
      >
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Lý do khóa thẻ <span className="text-rose-500">*</span>
          </label>
          <Input
            placeholder="VD: Cư dân báo mất thẻ; Nợ phí giữ xe quá 3 tháng..."
            value={lockReasonInput}
            onChange={(e) => setLockReasonInput(e.target.value)}
            required
            autoFocus
          />
        </div>
      </FormDialog>

      {/* Unlock Card Confirm Dialog */}
      <ConfirmDialog
        open={Boolean(unlockingCardId)}
        onOpenChange={(open) => !open && setUnlockingCardId(null)}
        title="Mở khóa thẻ gửi xe RFID?"
        description="Thẻ sẽ được kích hoạt lại trạng thái hoạt động bình thường để quẹt ra vào hầm xe."
        isLoading={unlockCardMutation.isPending}
        onConfirm={handleUnlockCardConfirm}
      />

      {/* Deactivate Vehicle Confirm Dialog */}
      <ConfirmDialog
        open={isDeactivateOpen}
        onOpenChange={setIsDeactivateOpen}
        title="Ngưng hoạt động phương tiện này?"
        description="Tất cả các thẻ RFID liên kết với xe sẽ tự động bị khóa quyền ra vào."
        isLoading={deactivateMutation.isPending}
        onConfirm={handleDeactivateConfirm}
      />

      {/* Delete Vehicle Confirm Dialog */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Xác nhận xóa vĩnh viễn hồ sơ xe?"
        description="Phương tiện và lịch sử các thẻ RFID sẽ bị xóa hoàn toàn khỏi cơ sở dữ liệu."
        isLoading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
      />

      {/* Edit Vehicle Dialog */}
      <FormDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        title={`Chỉnh sửa: ${vehicle.licensePlate}`}
        description="Cập nhật thông tin phương tiện, chủ sở hữu và tài liệu liên quan."
        icon={Car}
        onSubmit={handleUpdateSubmit}
        isLoading={updateMutation.isPending}
        submitText="Lưu thay đổi"
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Biển số xe <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="VD: 51F-123.45"
              value={formData.licensePlate}
              onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Loại phương tiện <span className="text-rose-500">*</span>
            </label>
            <Select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as VehicleType })}
            >
              <option value="MOTORBIKE">Xe máy</option>
              <option value="CAR">Ô tô</option>
              <option value="ELECTRIC_BIKE">Xe điện</option>
              <option value="BICYCLE">Xe đạp</option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Hãng sản xuất <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="VD: Honda, Toyota"
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
              placeholder="VD: SH 150i, Camry"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Màu sơn xe
            </label>
            <Input
              placeholder="VD: Trắng ngọc trai"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Gán vào Căn hộ <span className="text-rose-500">*</span>
            </label>
            <Select
              value={formData.apartmentId}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  apartmentId: e.target.value,
                  residentId: '',
                });
              }}
              required
            >
              <option value="">Chọn căn hộ...</option>
              {apartments.map((apt: any) => (
                <option key={apt.id} value={apt.id}>
                  {apt.code} ({apt.building} - Tầng {apt.floor})
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Chủ phương tiện
          </label>
          <Select
            value={formData.residentId}
            onChange={(e) => setFormData({ ...formData, residentId: e.target.value })}
          >
            <option value="">Đại diện chung hộ gia đình / Chưa chỉ định</option>
            {apartmentResidents.map((res: any) => (
              <option key={res.id} value={res.id}>
                {res.fullName} ({res.phone})
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Link ảnh chụp Cà vẹt / Giấy đăng ký xe
          </label>
          <Input
            type="url"
            placeholder="https://storage.example.com/cavet-xe.jpg"
            value={formData.registrationDocumentUrl}
            onChange={(e) => setFormData({ ...formData, registrationDocumentUrl: e.target.value })}
          />
        </div>
      </FormDialog>
    </div>
  );
}
