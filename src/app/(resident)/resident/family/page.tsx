'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  QrCode,
  Phone,
  Mail,
  Plus,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  Send,
  Home,
  Check,
  X,
  CreditCard,
  User,
  ArrowRight,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { FormDialog } from '@/components/shared/FormDialog';
import { useResidents } from '@/hooks/use-residents';
import {
  useResidenceRequests,
  useCreateResidenceRequest,
} from '@/hooks/use-household';
import {
  ResidenceRequestType,
  ResidenceRequestStatus,
  ResidentRelationship,
} from '@prisma/client';
import { formatDate, formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

export default function MyFamilyPage() {
  const { data: session } = useSession();

  // Queries
  const {
    data: residentsRes,
    isLoading: isResidentsLoading,
    refetch: refetchResidents,
  } = useResidents();

  const {
    data: requestsRes,
    isLoading: isRequestsLoading,
    refetch: refetchRequests,
  } = useResidenceRequests();

  const createRequestMutation = useCreateResidenceRequest();

  const residents = residentsRes?.data || [];
  const requests = requestsRes?.data || [];

  // Group members into Household hierarchy
  const owner = residents.find((r: any) => r.relationshipToOwner === 'OWNER');
  const familyMembers = residents.filter(
    (r: any) => r.relationshipToOwner === 'FAMILY' && r.id !== owner?.id
  );
  const tenants = residents.filter((r: any) => r.relationshipToOwner === 'TENANT');
  const temporaryResidents = residents.filter(
    (r: any) => r.relationshipToOwner === 'TEMPORARY_RESIDENT'
  );

  const apartment = residents[0]?.apartment;
  const apartmentId = apartment?.id || residents[0]?.apartmentId || '';

  // Modal State for New Residence Request
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [formData, setFormData] = useState<{
    type: ResidenceRequestType;
    fullName: string;
    identityCard: string;
    phone: string;
    relationship: ResidentRelationship;
    startDate: string;
    endDate: string;
    note: string;
    attachmentUrl: string;
  }>({
    type: 'ADD_MEMBER',
    fullName: '',
    identityCard: '',
    phone: '',
    relationship: 'FAMILY',
    startDate: '',
    endDate: '',
    note: '',
    attachmentUrl: '',
  });

  const handleOpenModal = (defaultType: ResidenceRequestType) => {
    setFormData({
      type: defaultType,
      fullName: '',
      identityCard: '',
      phone: '',
      relationship: defaultType === 'TEMPORARY_RESIDENCE' ? 'TEMPORARY_RESIDENT' : 'FAMILY',
      startDate: '',
      endDate: '',
      note: '',
      attachmentUrl: '',
    });
    setIsRequestModalOpen(true);
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apartmentId) {
      toast.error('Không tìm thấy thông tin căn hộ của bạn để gửi yêu cầu');
      return;
    }

    try {
      await createRequestMutation.mutateAsync({
        type: formData.type,
        apartmentId,
        fullName: formData.fullName,
        identityCard: formData.identityCard,
        phone: formData.phone,
        relationship: formData.relationship,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        note: formData.note || null,
        attachmentUrl: formData.attachmentUrl || null,
      });

      setIsRequestModalOpen(false);
      refetchRequests();
    } catch {
      // Handled in mutation hook
    }
  };

  const renderRequestTypeBadge = (type: ResidenceRequestType) => {
    switch (type) {
      case 'TEMPORARY_RESIDENCE':
        return (
          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 gap-1 text-[11px]">
            <span>⏱️</span> Đăng ký tạm trú
          </Badge>
        );
      case 'TEMPORARY_ABSENCE':
        return (
          <Badge className="bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 gap-1 text-[11px]">
            <span>🏖️</span> Đăng ký tạm vắng
          </Badge>
        );
      case 'ADD_MEMBER':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 gap-1 text-[11px]">
            <span>👨‍👩‍👧</span> Thêm thành viên
          </Badge>
        );
      case 'MOVE_IN':
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 gap-1 text-[11px]">
            <span>🚚</span> Đăng ký chuyển vào
          </Badge>
        );
      case 'MOVE_OUT':
        return (
          <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 gap-1 text-[11px]">
            <span>📦</span> Đăng ký chuyển đi
          </Badge>
        );
    }
  };

  const renderStatusBadge = (status: ResidenceRequestStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge className="bg-amber-500 text-white gap-1 text-[10px]">
            <Clock className="h-3 w-3 animate-spin" /> Chờ BQL duyệt
          </Badge>
        );
      case 'APPROVED':
        return (
          <Badge className="bg-emerald-600 text-white gap-1 text-[10px]">
            <Check className="h-3 w-3" /> Đã duyệt
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="destructive" className="gap-1 text-[10px]">
            <X className="h-3 w-3" /> Từ chối
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Quản lý Hộ gia đình"
          description={`Cấu trúc nhân khẩu căn hộ ${
            apartment?.code ? `Căn ${apartment.code} - ${apartment.building}` : ''
          }. Quản lý danh bạ thành viên và đăng ký các thủ tục hành chính cư trú trực tuyến.`}
        />

        {/* Quick Action Button */}
        <Button
          onClick={() => handleOpenModal('ADD_MEMBER')}
          className="bg-[#0F6B4F] hover:bg-[#0c5942] active:bg-[#094634] text-white gap-1.5 font-semibold text-xs shadow-md shadow-[#0F6B4F]/20 shrink-0"
        >
          <UserPlus className="h-4 w-4" /> Đăng ký thủ tục cư trú
        </Button>
      </div>

      {/* Action shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <button
          onClick={() => handleOpenModal('TEMPORARY_RESIDENCE')}
          className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-400 hover:bg-amber-50/20 text-left transition-all group shadow-2xs"
        >
          <span className="text-xl block mb-1">⏱️</span>
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block group-hover:text-amber-600">
            Đăng ký tạm trú
          </span>
          <span className="text-[10px] text-slate-400">Khách ở dài ngày</span>
        </button>

        <button
          onClick={() => handleOpenModal('TEMPORARY_ABSENCE')}
          className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-sky-400 hover:bg-sky-50/20 text-left transition-all group shadow-2xs"
        >
          <span className="text-xl block mb-1">🏖️</span>
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block group-hover:text-sky-600">
            Đăng ký tạm vắng
          </span>
          <span className="text-[10px] text-slate-400">Đi công tác, du lịch</span>
        </button>

        <button
          onClick={() => handleOpenModal('ADD_MEMBER')}
          className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-400 hover:bg-emerald-50/20 text-left transition-all group shadow-2xs"
        >
          <span className="text-xl block mb-1">👨‍👩‍👧</span>
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block group-hover:text-emerald-600">
            Thêm thành viên
          </span>
          <span className="text-[10px] text-slate-400">Thành viên gia đình</span>
        </button>

        <button
          onClick={() => handleOpenModal('MOVE_IN')}
          className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 hover:bg-blue-50/20 text-left transition-all group shadow-2xs"
        >
          <span className="text-xl block mb-1">🚚</span>
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block group-hover:text-blue-600">
            Chuyển vào ở
          </span>
          <span className="text-[10px] text-slate-400">Đăng ký mới vào căn</span>
        </button>

        <button
          onClick={() => handleOpenModal('MOVE_OUT')}
          className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-rose-400 hover:bg-rose-50/20 text-left transition-all group shadow-2xs col-span-2 sm:col-span-1"
        >
          <span className="text-xl block mb-1">📦</span>
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block group-hover:text-rose-600">
            Chuyển đi
          </span>
          <span className="text-[10px] text-slate-400">Báo trả phòng / dọn đi</span>
        </button>
      </div>

      {/* =====================================================================
          SECTION 1: HOUSEHOLD MEMBERS LIST
          ===================================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Nhân khẩu hiện tại ({residents.length} người)
            </h3>
          </div>
          {apartment && (
            <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg">
              Căn hộ: {apartment.code}
            </span>
          )}
        </div>

        {isResidentsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-44 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : residents.length === 0 ? (
          <Card className="p-8 text-center text-slate-400 border-dashed">
            <Users className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm font-semibold">Chưa có thông tin nhân khẩu được cập nhật</p>
            <p className="text-xs mt-1">Vui lòng liên hệ BQL hoặc gửi đơn đăng ký thành viên mới.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 👤 Chủ hộ */}
            {owner && (
              <Card className="relative overflow-hidden border-2 border-[#0F6B4F]/30 bg-[#E8F5ED]/20 dark:bg-emerald-950/10 shadow-xs">
                <div className="h-1.5 w-full bg-[#0F6B4F]" />
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F6B4F] mb-1">
                        <span>👤</span>
                        <span>CHỦ HỘ</span>
                      </div>
                      <CardTitle className="text-base font-bold">{owner.fullName}</CardTitle>
                    </div>
                    <Badge className="bg-[#0F6B4F] text-white text-[10px]">Chủ sở hữu</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="space-y-1 text-slate-500">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5" />
                      <span>{owner.phone || 'Chưa có SĐT'}</span>
                    </div>
                    {owner.identityCard && (
                      <div className="flex items-center gap-2 font-mono">
                        <CreditCard className="h-3.5 w-3.5" />
                        <span>CCCD: {owner.identityCard}</span>
                      </div>
                    )}
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Trạng thái:</span>
                    <span className="text-[11px] text-emerald-600 font-medium">Đang sinh sống</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 👩👦 Thành viên gia đình */}
            {familyMembers.map((m: any) => (
              <Card key={m.id} className="relative overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                <div className="h-1.5 w-full bg-emerald-500/60" />
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1 text-xs font-bold text-slate-500 mb-1">
                        <span>👩‍👧</span>
                        <span>THÀNH VIÊN</span>
                      </div>
                      <CardTitle className="text-base font-bold">{m.fullName}</CardTitle>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      Thân nhân
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="space-y-1 text-slate-500">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5" />
                      <span>{m.phone || 'Chưa có SĐT'}</span>
                    </div>
                    {m.identityCard && (
                      <div className="flex items-center gap-2 font-mono">
                        <CreditCard className="h-3.5 w-3.5" />
                        <span>CCCD: {m.identityCard}</span>
                      </div>
                    )}
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Cư trú:</span>
                    <span className="text-[11px] text-emerald-600 font-medium">{m.status}</span>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* 🏠 Khách thuê */}
            {tenants.map((t: any) => (
              <Card key={t.id} className="relative overflow-hidden border border-purple-200/80 dark:border-purple-900/60 shadow-2xs">
                <div className="h-1.5 w-full bg-purple-500" />
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1 text-xs font-bold text-purple-600 mb-1">
                        <span>🏠</span>
                        <span>KHÁCH THUÊ</span>
                      </div>
                      <CardTitle className="text-base font-bold">{t.fullName}</CardTitle>
                    </div>
                    <Badge variant="outline" className="text-[10px] text-purple-600 border-purple-200">
                      Hợp đồng thuê
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="space-y-1 text-slate-500">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5" />
                      <span>{t.phone || 'Chưa có SĐT'}</span>
                    </div>
                    {t.identityCard && (
                      <div className="flex items-center gap-2 font-mono">
                        <CreditCard className="h-3.5 w-3.5" />
                        <span>CCCD: {t.identityCard}</span>
                      </div>
                    )}
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Cư trú:</span>
                    <span className="text-[11px] text-purple-600 font-medium">{t.status}</span>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* ⏱️ Tạm trú */}
            {temporaryResidents.map((tr: any) => (
              <Card key={tr.id} className="relative overflow-hidden border border-amber-200/80 dark:border-amber-900/60 shadow-2xs">
                <div className="h-1.5 w-full bg-amber-500" />
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-600 mb-1">
                        <span>⏱️</span>
                        <span>TẠM TRÚ</span>
                      </div>
                      <CardTitle className="text-base font-bold">{tr.fullName}</CardTitle>
                    </div>
                    <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">
                      Tạm trú có hạn
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="space-y-1 text-slate-500">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5" />
                      <span>{tr.phone || 'Chưa có SĐT'}</span>
                    </div>
                    {tr.identityCard && (
                      <div className="flex items-center gap-2 font-mono">
                        <CreditCard className="h-3.5 w-3.5" />
                        <span>CCCD: {tr.identityCard}</span>
                      </div>
                    )}
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Trạng thái:</span>
                    <span className="text-[11px] text-amber-600 font-medium">Hợp lệ</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* =====================================================================
          SECTION 2: MY RESIDENCE REQUESTS (LỊCH SỬ THỦ TỤC CƯ TRÚ)
          ===================================================================== */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Yêu cầu cư trú của tôi
            </h3>
          </div>
          <Badge variant="outline" className="text-xs font-mono">
            {requests.length} yêu cầu
          </Badge>
        </div>

        {isRequestsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <Card className="p-8 text-center text-slate-400 border-dashed">
            <FileText className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-xs font-medium">Bạn chưa gửi yêu cầu thủ tục cư trú nào.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Sử dụng các nút bên trên để đăng ký tạm trú, tạm vắng hoặc thêm thành viên mới.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {requests.map((r: any) => (
              <div
                key={r.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                      {r.code}
                    </span>
                    {renderRequestTypeBadge(r.type)}
                    {renderStatusBadge(r.status)}
                    <span className="text-[11px] text-slate-400">
                      • Gửi lúc {formatDateTime(r.createdAt)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 text-xs text-slate-700 dark:text-slate-300">
                    <span>
                      Họ tên: <strong className="text-slate-900 dark:text-slate-100">{r.fullName}</strong>
                    </span>
                    <span className="font-mono text-slate-500">CCCD: {r.identityCard}</span>
                    <span>SĐT: {r.phone}</span>
                  </div>

                  {(r.startDate || r.endDate || r.note) && (
                    <div className="text-[11px] text-slate-500 space-y-0.5 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg">
                      {(r.startDate || r.endDate) && (
                        <div>
                          Thời hạn:{' '}
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {r.startDate ? formatDate(r.startDate) : 'Hiện tại'} ➔{' '}
                            {r.endDate ? formatDate(r.endDate) : 'Không xác định'}
                          </span>
                        </div>
                      )}
                      {r.note && (
                        <div>
                          Ghi chú: <span className="italic">{r.note}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Review feedback if rejected or approved */}
                  {r.status === 'REJECTED' && r.rejectReason && (
                    <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
                      <strong>Lý do từ chối từ BQL:</strong> {r.rejectReason}
                    </div>
                  )}

                  {r.status === 'APPROVED' && (
                    <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Yêu cầu đã được Ban Quản Lý phê duyệt và cập nhật vào hồ sơ căn hộ.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =====================================================================
          MODAL: SUBMIT RESIDENCE REQUEST
          ===================================================================== */}
      <FormDialog
        open={isRequestModalOpen}
        onOpenChange={setIsRequestModalOpen}
        title="Đăng ký Thủ tục Cư trú"
        description="Điền đầy đủ thông tin định danh và thời hạn cư trú để Ban Quản Lý xét duyệt hồ sơ."
        onSubmit={handleSubmitRequest}
        isLoading={createRequestMutation.isPending}
      >
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Loại thủ tục đăng ký <span className="text-rose-500">*</span>
          </label>
          <Select
            value={formData.type}
            onChange={(e) =>
              setFormData({
                ...formData,
                type: e.target.value as ResidenceRequestType,
                relationship:
                  e.target.value === 'TEMPORARY_RESIDENCE'
                    ? 'TEMPORARY_RESIDENT'
                    : formData.relationship,
              })
            }
          >
            <option value="TEMPORARY_RESIDENCE">⏱️ Đăng ký tạm trú</option>
            <option value="TEMPORARY_ABSENCE">🏖️ Đăng ký tạm vắng</option>
            <option value="ADD_MEMBER">👨‍👩‍👧 Thêm thành viên hộ gia đình</option>
            <option value="MOVE_IN">🚚 Đăng ký dọn vào căn hộ</option>
            <option value="MOVE_OUT">📦 Đăng ký chuyển đi</option>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Họ và tên người cư trú <span className="text-rose-500">*</span>
          </label>
          <Input
            placeholder="VD: Nguyễn Văn A"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Số CCCD / Hộ chiếu <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="VD: 001201000123"
              value={formData.identityCard}
              onChange={(e) => setFormData({ ...formData, identityCard: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Số điện thoại <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="0912345678"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Mối quan hệ với chủ hộ <span className="text-rose-500">*</span>
          </label>
          <Select
            value={formData.relationship}
            onChange={(e) =>
              setFormData({ ...formData, relationship: e.target.value as ResidentRelationship })
            }
          >
            <option value="FAMILY">Thành viên gia đình (Vợ/Chồng/Con/Bố/Mẹ)</option>
            <option value="TENANT">Khách thuê lại</option>
            <option value="TEMPORARY_RESIDENT">Nhân khẩu tạm trú dài ngày</option>
            <option value="OWNER">Chủ sở hữu mới</option>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Từ ngày</label>
            <Input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Đến ngày</label>
            <Input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Ghi chú thêm</label>
          <Input
            placeholder="Lý do đăng ký, thông tin giấy tờ bổ sung..."
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Liên kết ảnh giấy tờ đính kèm (nếu có)
          </label>
          <Input
            placeholder="https://drive.google.com/... hoặc link ảnh CCCD"
            value={formData.attachmentUrl}
            onChange={(e) => setFormData({ ...formData, attachmentUrl: e.target.value })}
          />
        </div>
      </FormDialog>
    </div>
  );
}
