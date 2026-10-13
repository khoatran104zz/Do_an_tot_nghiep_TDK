'use client';

import React from 'react';
import Link from 'next/link';
import {
  Home,
  Building2,
  Layers,
  Hash,
  Users,
  Receipt,
  Wrench,
  Edit,
  Trash2,
  ExternalLink,
  Phone,
  CheckCircle2,
  AlertTriangle,
  History,
  Plus,
  BedDouble,
  Bath,
  Maximize2,
  FileText,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatCurrency, formatDateTime } from '@/lib/utils';

interface ApartmentDetailCardProps {
  apartment: any;
  buildingName?: string;
  blockName?: string;
  floorName?: string;
  parentPath?: any;
  onEdit?: () => void;
  onDelete?: () => void;
  onAddHistory?: () => void;
  onNavigateBuilding?: () => void;
  onNavigateBlock?: () => void;
  onNavigateFloor?: () => void;
  canManage?: boolean;
}

export function ApartmentDetailCard({
  apartment,
  buildingName,
  blockName,
  floorName,
  parentPath,
  onEdit,
  onDelete,
  onAddHistory,
  onNavigateBuilding,
  onNavigateBlock,
  onNavigateFloor,
  canManage = true,
}: ApartmentDetailCardProps) {
  const effectiveBuilding = buildingName || parentPath?.buildingName || apartment.building || 'Tòa nhà';
  const effectiveBlock = blockName || parentPath?.blockName || 'Khối tháp';
  const effectiveFloor = floorName || parentPath?.floorName || `Tầng ${apartment.floor || 1}`;

  const residents = apartment.residents || [];
  const owner = residents.find((r: any) => r.relationshipToOwner === 'OWNER');
  const family = residents.filter((r: any) => r.relationshipToOwner === 'FAMILY' && r.id !== owner?.id);
  const tenants = residents.filter((r: any) => r.relationshipToOwner === 'TENANT');
  const temporary = residents.filter((r: any) => r.relationshipToOwner === 'TEMPORARY_RESIDENT');

  // Debts and tickets
  const unpaidInvoices = (apartment.invoices || []).filter(
    (inv: any) => inv.status === 'UNPAID' || inv.status === 'OVERDUE'
  );
  const totalDebt = unpaidInvoices.reduce((sum: number, inv: any) => sum + (Number(inv.totalAmount) || 0), 0);
  const openFeedbacks = (apartment.feedbacks || []).filter(
    (f: any) => f.status === 'NEW' || f.status === 'ASSIGNED' || f.status === 'PROCESSING' || f.status === 'OPEN' || f.status === 'IN_PROGRESS'
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="space-y-1.5">
          {/* Breadcrumb path */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
            <span
              onClick={onNavigateBuilding}
              className="hover:text-[#0F6B4F] cursor-pointer flex items-center gap-1 font-medium transition-colors"
            >
              <Building2 className="h-3.5 w-3.5 text-slate-400" />
              {effectiveBuilding}
            </span>
            <span>/</span>
            <span
              onClick={onNavigateBlock}
              className="hover:text-[#0F6B4F] cursor-pointer flex items-center gap-1 font-medium transition-colors"
            >
              <Layers className="h-3.5 w-3.5 text-slate-400" />
              {effectiveBlock}
            </span>
            <span>/</span>
            <span
              onClick={onNavigateFloor}
              className="hover:text-[#0F6B4F] cursor-pointer flex items-center gap-1 font-medium transition-colors"
            >
              <Hash className="h-3.5 w-3.5 text-slate-400" />
              {effectiveFloor}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#E8F5ED] dark:bg-[#0F6B4F]/20 text-[#0F6B4F] dark:text-emerald-300">
              <Home className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono">
                  Căn hộ {apartment.code}
                </h2>
                <StatusBadge type="apartment" status={apartment.status} />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {effectiveBuilding} • {effectiveBlock} • {effectiveFloor}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/apartments/${apartment.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-[#0F6B4F] hover:border-[#0F6B4F]/40 shadow-2xs transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5 text-[#0F6B4F]" />
            Trang 360°
          </Link>

          {canManage && onAddHistory && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAddHistory}
              className="text-xs gap-1.5 h-8 font-semibold"
            >
              <History className="h-3.5 w-3.5 text-blue-600" /> Ghi nhận sự kiện
            </Button>
          )}

          {canManage && onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="text-xs gap-1.5 h-8 font-semibold"
            >
              <Edit className="h-3.5 w-3.5" /> Sửa
            </Button>
          )}

          {canManage && onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="text-xs gap-1.5 h-8 font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            >
              <Trash2 className="h-3.5 w-3.5" /> Xóa
            </Button>
          )}
        </div>
      </div>

      {/* Specifications & Health Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <Card className="p-4 rounded-2xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
            <Maximize2 className="h-4 w-4 text-[#0F6B4F]" />
            <span>Diện tích sàn</span>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono">
            {apartment.area} <span className="text-xs font-normal text-slate-500">m²</span>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
            <BedDouble className="h-4 w-4 text-blue-600" />
            <span>Cơ cấu phòng</span>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100">
            {apartment.bedrooms} <span className="text-xs font-normal text-slate-500">PN</span> • {apartment.bathrooms} <span className="text-xs font-normal text-slate-500">PT</span>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
            <Receipt className="h-4 w-4 text-rose-600" />
            <span>Công nợ dịch vụ</span>
          </div>
          <div className="text-sm font-bold truncate">
            {totalDebt > 0 ? (
              <span className="text-rose-600 font-mono font-black">{formatCurrency(totalDebt)}</span>
            ) : (
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Hoàn tất
              </span>
            )}
          </div>
        </Card>

        <Card className="p-4 rounded-2xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
            <Wrench className="h-4 w-4 text-amber-600" />
            <span>Sự cố kỹ thuật</span>
          </div>
          <div className="text-sm font-bold">
            {openFeedbacks.length > 0 ? (
              <span className="text-amber-600 font-bold">{openFeedbacks.length} phản ánh mở</span>
            ) : (
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Ổn định
              </span>
            )}
          </div>
        </Card>
      </div>

      {/* Household & Resident Structure */}
      <Card className="rounded-2xl border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
        <CardHeader className="p-4 sm:p-5 bg-slate-50/60 dark:bg-slate-950/40 border-b border-slate-200/90 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[#0F6B4F]" />
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Hộ gia đình & Nhân khẩu đăng ký
              </CardTitle>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              {residents.length} người cư trú
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 space-y-4">
          {residents.length === 0 ? (
            <div className="py-8 text-center text-slate-400 border border-dashed rounded-xl border-slate-200 dark:border-slate-800">
              <Users className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
              <p className="text-xs font-semibold">Chưa có thông tin nhân khẩu đăng ký</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Căn hộ hiện chưa có dữ liệu cư dân hoặc chủ sở hữu.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {/* Chủ sở hữu */}
              {owner ? (
                <div className="p-3.5 rounded-xl border-2 border-[#0F6B4F]/20 bg-[#E8F5ED]/40 dark:bg-[#0F6B4F]/10 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0F6B4F] dark:text-emerald-300 flex items-center gap-1.5">
                      <span>👤</span> Chủ sở hữu (Chủ hộ)
                    </span>
                    <Badge className="bg-[#0F6B4F] text-white text-[10px] font-semibold">
                      CHỦ HỘ
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-black text-slate-900 dark:text-slate-100 text-sm">
                      {owner.fullName}
                    </span>
                    <span className="text-[11px] text-emerald-600 font-semibold">
                      {owner.status === 'RESIDING' ? 'Đang cư trú' : owner.status === 'TEMPORARY_ABSENT' ? 'Tạm vắng' : 'Đã dọn đi'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3 text-slate-400" />
                      {owner.phone || 'Chưa có SĐT'}
                    </span>
                    {owner.identityCard && (
                      <span className="font-mono text-slate-400">CCCD: {owner.identityCard}</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Chưa xác lập chủ sở hữu chính thức cho căn hộ này.</span>
                </div>
              )}

              {/* Thành viên gia đình */}
              {family.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <span>👩‍👦</span> Thành viên gia đình ({family.length})
                  </span>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                    {family.map((m: any, idx: number) => (
                      <div key={m.id} className="p-2.5 flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              {idx % 2 === 0 ? '👩' : '👦'} {m.fullName}
                            </span>
                            <Badge variant="secondary" className="text-[10px]">
                              Thành viên
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-slate-400 text-[11px] mt-0.5">
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {m.phone || '—'}
                            </span>
                            {m.identityCard && <span className="font-mono">CCCD: {m.identityCard}</span>}
                          </div>
                        </div>
                        <span className="text-[11px] font-medium text-emerald-600">
                          {m.status === 'RESIDING' ? 'Đang cư trú' : m.status === 'TEMPORARY_ABSENT' ? 'Tạm vắng' : 'Đã dọn đi'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Khách thuê */}
              {tenants.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <span>🏠</span> Khách thuê căn hộ ({tenants.length})
                  </span>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                    {tenants.map((t: any) => (
                      <div key={t.id} className="p-2.5 flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              🏠 {t.fullName}
                            </span>
                            <Badge variant="outline" className="text-[10px] text-purple-600 border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
                              Khách thuê
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-slate-400 text-[11px] mt-0.5">
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {t.phone || '—'}
                            </span>
                            {t.identityCard && <span className="font-mono">CCCD: {t.identityCard}</span>}
                          </div>
                        </div>
                        <span className="text-[11px] font-medium text-purple-600">
                          {t.status === 'RESIDING' ? 'Đang thuê' : 'Hết hạn thuê'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tạm trú */}
              {temporary.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <span>⏱️</span> Nhân khẩu tạm trú ({temporary.length})
                  </span>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                    {temporary.map((tr: any) => (
                      <div key={tr.id} className="p-2.5 flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              ⏱️ {tr.fullName}
                            </span>
                            <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
                              Tạm trú
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-slate-400 text-[11px] mt-0.5">
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {tr.phone || '—'}
                            </span>
                          </div>
                        </div>
                        <span className="text-[11px] font-medium text-amber-600">
                          {tr.status === 'RESIDING' ? 'Còn hạn' : 'Hết hạn'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Note / Remarks */}
      {apartment.note && (
        <Card className="p-4 rounded-2xl border-slate-200/90 dark:border-slate-800 bg-[#E8F5ED]/30 dark:bg-[#0F6B4F]/10">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F6B4F] dark:text-emerald-300 mb-1">
            <FileText className="h-3.5 w-3.5" />
            <span>Ghi chú căn hộ</span>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            {apartment.note}
          </p>
        </Card>
      )}
    </div>
  );
}
