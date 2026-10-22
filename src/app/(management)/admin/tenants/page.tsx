'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Users,
  Plus,
  Search,
  Shield,
  Crown,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Loader2,
  KeyRound,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';

interface TenantItem {
  id: string;
  code: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  status: string;
  createdAt: string;
  _count?: {
    buildings: number;
    users: number;
  };
}

export default function PlatformTenantsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isProvisionOpen, setIsProvisionOpen] = useState(false);
  const [selectedTenantForAdmin, setSelectedTenantForAdmin] = useState<TenantItem | null>(null);

  // Form states for new tenant
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    address: '',
    phone: '',
    email: '',
    adminFullName: '',
    adminEmail: '',
    adminPassword: '',
    adminPhone: '',
  });

  // Form states for provisioning admin
  const [adminFormData, setAdminFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
  });

  // Fetch tenants
  const { data: response, isLoading } = useQuery({
    queryKey: ['platform-tenants', searchTerm, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      const res = await fetch(`/api/tenants?${params.toString()}`);
      if (!res.ok) throw new Error('Không thể tải danh sách tổ hợp');
      const json = await res.json();
      return json.data || { items: [] };
    },
  });

  const tenants: TenantItem[] = response?.items || [];

  // Create tenant mutation
  const createTenantMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Tạo tổ hợp thất bại');
      return json.data;
    },
    onSuccess: () => {
      toast.success('Khởi tạo tổ hợp khách hàng thành công!');
      setIsCreateOpen(false);
      setFormData({
        code: '',
        name: '',
        address: '',
        phone: '',
        email: '',
        adminFullName: '',
        adminEmail: '',
        adminPassword: '',
        adminPhone: '',
      });
      queryClient.invalidateQueries({ queryKey: ['platform-tenants'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Lỗi khi tạo tổ hợp');
    },
  });

  // Provision Admin mutation
  const provisionAdminMutation = useMutation({
    mutationFn: async ({ tenantId, payload }: { tenantId: string; payload: typeof adminFormData }) => {
      const res = await fetch(`/api/tenants/${tenantId}/admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Cấp tài khoản thất bại');
      return json.data;
    },
    onSuccess: () => {
      toast.success('Cấp tài khoản Tenant Admin thành công!');
      setIsProvisionOpen(false);
      setSelectedTenantForAdmin(null);
      setAdminFormData({ fullName: '', email: '', password: '', phone: '' });
      queryClient.invalidateQueries({ queryKey: ['platform-tenants'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Lỗi khi cấp tài khoản Tenant Admin');
    },
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
              <Crown className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Quản lý Khách hàng & Tổ hợp Chung cư
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Bảng điều khiển Nền tảng K-Home: Onboarding đối tác, quản lý tổ hợp và cấp tài khoản Tenant Admin.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F6B4F] hover:bg-[#0D5B43] text-white font-medium text-sm transition-all shadow-sm hover:shadow cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Khách Hàng Mới</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Tổng số Khách hàng / Tổ hợp</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {isLoading ? '...' : tenants.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Khách hàng SaaS đang sử dụng K-Home</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Tổng Tòa nhà được phục vụ</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {isLoading ? '...' : tenants.reduce((acc, t) => acc + (t._count?.buildings || 0), 0)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Tòa nhà thuộc các tổ hợp quản trị</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Trạng thái Hoạt động</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            100% Khả dụng
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Hạ tầng phân vùng multi-tenant độc lập</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên tổ hợp, mã tổ hợp hoặc email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#0F6B4F]"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động (ACTIVE)</option>
            <option value="INACTIVE">Ngừng hoạt động</option>
            <option value="SUSPENDED">Tạm ngưng (SUSPENDED)</option>
          </select>
        </div>
      </div>

      {/* Tenants Grid */}
      {isLoading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#0F6B4F]" />
          <span className="text-xs text-slate-400">Đang tải danh sách tổ hợp...</span>
        </div>
      ) : tenants.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Không tìm thấy tổ hợp nào
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Thử thay đổi từ khóa tìm kiếm hoặc nhấn nút "Thêm Khách Hàng Mới" để bắt đầu.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tenants.map((t) => (
            <div
              key={t.id}
              className="flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-[#0F6B4F]/40 transition-all shadow-2xs hover:shadow-md group"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="p-2.5 rounded-xl bg-[#E8F5ED] dark:bg-emerald-950/60 text-[#0F6B4F] dark:text-emerald-400 font-bold shrink-0">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      t.status === 'ACTIVE'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {t.status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm dừng'}
                  </span>
                </div>

                <div className="mt-3">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base group-hover:text-[#0F6B4F] transition-colors leading-snug">
                    {t.name}
                  </h3>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                    Mã tổ hợp: <span className="font-semibold text-slate-600 dark:text-slate-300">{t.code}</span>
                  </div>
                </div>

                {/* Details list */}
                <div className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  {t.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{t.address}</span>
                    </div>
                  )}
                  {t.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{t.phone}</span>
                    </div>
                  )}
                  {t.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{t.email}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="grid grid-cols-2 gap-2 text-center py-1 bg-slate-50 dark:bg-slate-800/60 rounded-xl mb-3">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Tòa nhà</span>
                    <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                      {t._count?.buildings || 0}
                    </p>
                  </div>
                  <div className="border-l border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Nhân sự/Admins</span>
                    <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                      {t._count?.users || 0}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedTenantForAdmin(t);
                      setIsProvisionOpen(true);
                    }}
                    className="flex-1 py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                    <span>Cấp Tenant Admin</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tạo Khách Hàng / Tổ Hợp Mới */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Thêm Khách Hàng / Tổ Hợp Chung Cư Mới
              </h2>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createTenantMutation.mutate(formData);
              }}
              className="mt-4 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mã Tổ Hợp (Unique Code) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: SMART-CITY-CORP, VINHOMES-CENTRAL"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tên Khách Hàng / Tổ Hợp *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Tổ hợp Chung cư SmartCity Landmark"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Địa chỉ tổng thể
                </label>
                <input
                  type="text"
                  placeholder="Số 108 Đường Nguyễn Huệ, Quận 1, TP. HCM"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Hotline liên hệ
                  </label>
                  <input
                    type="text"
                    placeholder="02838221234"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email đại diện
                  </label>
                  <input
                    type="email"
                    placeholder="contact@complex.vn"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200/80 dark:border-emerald-800 space-y-3">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
                  👑 Khởi tạo Tài khoản Tenant Admin ban đầu (Tùy chọn)
                </span>
                <div>
                  <input
                    type="text"
                    placeholder="Họ tên Admin đại diện (VD: Trần Ban Quản Trị)"
                    value={formData.adminFullName}
                    onChange={(e) => setFormData({ ...formData, adminFullName: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 rounded-lg border border-emerald-300 dark:border-emerald-700 mb-2"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="email"
                      placeholder="Email Admin đăng nhập"
                      value={formData.adminEmail}
                      onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 rounded-lg border border-emerald-300 dark:border-emerald-700"
                    />
                    <input
                      type="password"
                      placeholder="Mật khẩu khởi tạo"
                      value={formData.adminPassword}
                      onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 rounded-lg border border-emerald-300 dark:border-emerald-700"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={createTenantMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-[#0F6B4F] text-white text-xs font-semibold hover:bg-[#0D5B43] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {createTenantMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Xác nhận Khởi tạo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cấp Tài Khoản Tenant Admin */}
      {isProvisionOpen && selectedTenantForAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Cấp tài khoản Tenant Admin
              </h2>
              <button
                onClick={() => setIsProvisionOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-2">
              Khởi tạo tài khoản Quản trị viên Khách hàng cho tổ hợp:{' '}
              <strong className="text-slate-800 dark:text-slate-200">{selectedTenantForAdmin.name}</strong>
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                provisionAdminMutation.mutate({
                  tenantId: selectedTenantForAdmin.id,
                  payload: adminFormData,
                });
              }}
              className="mt-4 space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Họ và tên Quản trị viên *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Nguyễn Văn Admin"
                  value={adminFormData.fullName}
                  onChange={(e) => setAdminFormData({ ...adminFormData, fullName: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email đăng nhập *
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin.complex@gmail.com"
                  value={adminFormData.email}
                  onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mật khẩu khởi tạo *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Tối thiểu 6 ký tự"
                  value={adminFormData.password}
                  onChange={(e) => setAdminFormData({ ...adminFormData, password: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Số điện thoại liên hệ
                </label>
                <input
                  type="text"
                  placeholder="0912345678"
                  value={adminFormData.phone}
                  onChange={(e) => setAdminFormData({ ...adminFormData, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsProvisionOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={provisionAdminMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-[#0F6B4F] text-white text-xs font-semibold hover:bg-[#0D5B43] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {provisionAdminMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Cấp Quyền Ngay</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
