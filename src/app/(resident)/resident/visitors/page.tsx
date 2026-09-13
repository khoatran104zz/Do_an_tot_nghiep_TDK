'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Plus,
  Search,
  Users,
  QrCode,
  Calendar,
  Loader2,
  CheckCircle2,
  Clock,
  LogOut,
  AlertCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VisitorPassCard } from '@/components/visitor/VisitorPassCard';
import { CreateVisitorModal } from '@/components/visitor/CreateVisitorModal';
import { useVisitorPasses, useCancelVisitorPass } from '@/hooks/use-visitors';
import { VisitorStatus } from '@prisma/client';

export default function ResidentVisitorsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  const { data: passesData, isLoading, refetch } = useVisitorPasses({
    status: statusFilter === 'ALL' ? undefined : (statusFilter as VisitorStatus),
    search: searchTerm.trim() || undefined,
  });

  const cancelMutation = useCancelVisitorPass();

  const passes = passesData?.data || [];

  const counts = {
    all: passes.length,
    pending: passes.filter((p: any) => p.status === 'PENDING').length,
    checkedIn: passes.filter((p: any) => p.status === 'CHECKED_IN').length,
    checkedOut: passes.filter((p: any) => p.status === 'CHECKED_OUT').length,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Quản Lý Khách Đến Thăm"
        description="Đăng ký cấp thẻ khách QR Code để người thân, bạn bè thuận tiện làm thủ tục an ninh tại sảnh tòa nhà"
        badge={
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
            Cư Dân Smart Building
          </span>
        }
      >
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md gap-2"
        >
          <Plus className="h-4 w-4" />
          Tạo Thẻ Khách Mới
        </Button>
      </PageHeader>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            statusFilter === 'ALL'
              ? 'bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500'
              : 'bg-card border-border hover:border-emerald-500/50'
          }`}
        >
          <div className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-emerald-500" />
            <span>Tổng lượt thẻ</span>
          </div>
          <div className="text-2xl font-bold text-foreground mt-1">
            {isLoading ? '-' : counts.all}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('PENDING')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            statusFilter === 'PENDING'
              ? 'bg-amber-500/10 border-amber-500 ring-1 ring-amber-500'
              : 'bg-card border-border hover:border-amber-500/50'
          }`}
        >
          <div className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            <span>Chờ đến</span>
          </div>
          <div className="text-2xl font-bold text-amber-500 mt-1">
            {isLoading ? '-' : counts.pending}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('CHECKED_IN')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            statusFilter === 'CHECKED_IN'
              ? 'bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500'
              : 'bg-card border-border hover:border-emerald-500/50'
          }`}
        >
          <div className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span>Đang trong tòa nhà</span>
          </div>
          <div className="text-2xl font-bold text-emerald-500 mt-1">
            {isLoading ? '-' : counts.checkedIn}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('CHECKED_OUT')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            statusFilter === 'CHECKED_OUT'
              ? 'bg-blue-500/10 border-blue-500 ring-1 ring-blue-500'
              : 'bg-card border-border hover:border-blue-500/50'
          }`}
        >
          <div className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
            <LogOut className="h-3.5 w-3.5 text-blue-500" />
            <span>Đã rời đi</span>
          </div>
          <div className="text-2xl font-bold text-blue-500 mt-1">
            {isLoading ? '-' : counts.checkedOut}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card p-3.5 rounded-xl border border-border">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên khách, mã thẻ, SĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-background border-border"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { key: 'ALL', label: 'Tất cả' },
            { key: 'PENDING', label: 'Chờ đến' },
            { key: 'CHECKED_IN', label: 'Đang trong tòa nhà' },
            { key: 'CHECKED_OUT', label: 'Đã về' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                statusFilter === tab.key
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards Display */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <p className="text-sm text-muted-foreground">Đang tải danh sách thẻ khách...</p>
        </div>
      ) : passes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed border-border bg-card/50">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 mb-4">
            <QrCode className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-foreground">
            Chưa có thẻ khách nào
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-5">
            Khi có người thân, bạn bè hoặc người giao hàng đến thăm, hãy đăng ký thẻ khách để sinh mã QR check-in nhanh chóng.
          </p>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          >
            <Plus className="h-4 w-4" />
            Tạo thẻ khách đầu tiên
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {passes.map((pass: any) => (
            <VisitorPassCard
              key={pass.id}
              pass={pass}
              onCancel={(id) => cancelMutation.mutate(id)}
              isCancelling={cancelMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <CreateVisitorModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
