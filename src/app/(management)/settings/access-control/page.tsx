'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  ShieldCheck,
  Building2,
  Users,
  KeyRound,
  UserPlus,
  Edit2,
  Trash2,
  History,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Globe,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  useManagers,
  useCreateManager,
  useAssignBuildings,
  useDeactivateManager,
  useAccessControlMatrix,
} from '@/hooks/use-managers';
import { useBuildingContext } from '@/context/BuildingContext';
import { formatDate, formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

export default function AccessControlPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const { buildings } = useBuildingContext();

  const [activeTab, setActiveTab] = useState<'managers' | 'matrix' | 'audit'>('managers');

  // React Query hooks
  const { data: managersResponse, isLoading: isLoadingManagers, refetch: refetchManagers } = useManagers();
  const { data: matrixResponse, isLoading: isLoadingMatrix } = useAccessControlMatrix();

  const createManagerMutation = useCreateManager();
  const assignBuildingsMutation = useAssignBuildings();
  const deactivateManagerMutation = useDeactivateManager();

  // Create Manager Dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [selectedNewBuildings, setSelectedNewBuildings] = useState<string[]>([]);

  // Assign Buildings Dialog state
  const [assigningManager, setAssigningManager] = useState<any | null>(null);
  const [assignedBuildingIds, setAssignedBuildingIds] = useState<string[]>([]);

  const managers = managersResponse?.data || [];
  const accessControl = matrixResponse?.data;

  // Handle create manager submit
  const handleCreateManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newFullName || !newPassword) {
      toast.error('Vui lòng điền đầy đủ các thông tin bắt buộc');
      return;
    }

    createManagerMutation.mutate(
      {
        email: newEmail,
        fullName: newFullName,
        phone: newPhone || undefined,
        password: newPassword,
        buildingIds: selectedNewBuildings,
      },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          setNewEmail('');
          setNewFullName('');
          setNewPhone('');
          setNewPassword('');
          setSelectedNewBuildings([]);
        },
      }
    );
  };

  // Open Assign Buildings dialog
  const openAssignModal = (mgr: any) => {
    setAssigningManager(mgr);
    setAssignedBuildingIds(mgr.assignedBuildings.map((b: any) => b.id));
  };

  // Save Building assignments
  const handleSaveAssignments = () => {
    if (!assigningManager) return;
    assignBuildingsMutation.mutate(
      {
        managerId: assigningManager.id,
        buildingIds: assignedBuildingIds,
      },
      {
        onSuccess: () => {
          setAssigningManager(null);
        },
      }
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Phân quyền & Kiểm soát Truy cập (RBAC)
            </h1>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold border-blue-200">
              Admin Only
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Quản trị danh sách Quản lý tòa nhà, phân công phạm vi quản lý và giám sát ma trận phân quyền hệ thống.
          </p>
        </div>

        {activeTab === 'managers' && (
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-[#0F6B4F] hover:bg-[#0c5942] text-white font-bold shadow-sm shadow-[#0F6B4F]/20 rounded-xl"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Thêm Quản lý Tòa nhà
          </Button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('managers')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'managers'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Building2 className="h-4 w-4" />
          Phân công Quản lý Tòa nhà ({managers.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'matrix'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <KeyRound className="h-4 w-4" />
          Ma trận Phân quyền (Role Matrix)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'audit'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <History className="h-4 w-4" />
          Nhật ký Kiểm toán Phân quyền
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MANAGERS & BUILDING ASSIGNMENT */}
      {/* ========================================================================= */}
      {activeTab === 'managers' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xs">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400">Tổng số Manager</p>
                  <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                    {managers.length}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                  <Users className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xs">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400">Đã gán Tòa nhà</p>
                  <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                    {managers.filter((m) => m.assignedBuildings.length > 0).length}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xs">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400">Chưa gán Tòa nhà</p>
                  <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                    {managers.filter((m) => m.assignedBuildings.length === 0).length}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Managers List Table */}
          <Card className="border-slate-200/80 dark:border-slate-800">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/60">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Danh sách Quản lý Tòa nhà (Managers)
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Mỗi Manager có quyền vận hành độc lập các tòa nhà được phân công.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchManagers()}
                  className="rounded-xl"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Làm mới
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Họ và tên</th>
                      <th className="px-4 py-3">Email & Số điện thoại</th>
                      <th className="px-4 py-3">Tòa nhà được phân công (Scope)</th>
                      <th className="px-4 py-3">Trạng thái</th>
                      <th className="px-4 py-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {isLoadingManagers ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          Đang tải danh sách Manager...
                        </td>
                      </tr>
                    ) : managers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          Chưa có tài khoản Quản lý nào. Nhấn "Thêm Quản lý Tòa nhà" để tạo mới.
                        </td>
                      </tr>
                    ) : (
                      managers.map((mgr) => (
                        <tr key={mgr.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 flex items-center justify-center font-bold text-xs">
                                {mgr.fullName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold">{mgr.fullName}</p>
                                <p className="text-[10px] text-slate-400">Tạo: {formatDate(mgr.createdAt)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                            <p className="font-medium">{mgr.email}</p>
                            <p className="text-[10px] text-slate-400">{mgr.phone || 'Chưa có SĐT'}</p>
                          </td>
                          <td className="px-4 py-3">
                            {mgr.assignedBuildings.length === 0 ? (
                              <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950/40 text-[10px]">
                                Chưa phân công tòa nhà
                              </Badge>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {mgr.assignedBuildings.map((b: any) => (
                                  <Badge
                                    key={b.id}
                                    className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800 text-[10px] flex items-center gap-1"
                                  >
                                    <Building2 className="h-2.5 w-2.5" />
                                    {b.name}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {mgr.isActive ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                                Hoạt động
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full">
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
                                Vô hiệu hóa
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openAssignModal(mgr)}
                              className="rounded-lg text-xs font-semibold h-8"
                            >
                              <Building2 className="h-3.5 w-3.5 mr-1" />
                              Phân công
                            </Button>
                            {mgr.isActive && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (confirm(`Bạn có chắc chắn muốn vô hiệu hóa Manager ${mgr.fullName}?`)) {
                                    deactivateManagerMutation.mutate(mgr.id);
                                  }
                                }}
                                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg text-xs h-8"
                              >
                                Vô hiệu
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: RBAC PERMISSION MATRIX */}
      {/* ========================================================================= */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accessControl?.roles.map((r) => (
              <Card key={r.code} className="border-slate-200/80 dark:border-slate-800">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {r.name}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-bold ${
                        r.scope === 'GLOBAL'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : r.scope === 'BUILDING_SCOPED'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {r.scope}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs mt-1">{r.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Số người dùng:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{r.userCount} tài khoản</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Comparison Table */}
          <Card className="border-slate-200/80 dark:border-slate-800">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <CardTitle className="text-base font-bold">Ma trận quyền hạn chi tiết (Permission Breakdown)</CardTitle>
              <CardDescription className="text-xs">
                So sánh quyền giữa ADMIN (Quản trị toàn hệ thống) và MANAGER (Vận hành tòa nhà phân công).
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Phân hệ / Chức năng</th>
                      <th className="px-4 py-3 text-center">ADMIN</th>
                      <th className="px-4 py-3 text-center">MANAGER</th>
                      <th className="px-4 py-3">Phạm vi áp dụng (Scope Enforcement)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {[
                      { module: 'Tạo / Xóa Tòa nhà (Buildings)', admin: true, manager: false, note: 'Chỉ Admin được tạo hoặc xóa tòa nhà' },
                      { module: 'Cập nhật thông tin Tòa nhà', admin: true, manager: true, note: 'Manager chỉ sửa thông tin vận hành trong tòa nhà được gán' },
                      { module: 'Tạo tài khoản Manager & Phân công', admin: true, manager: false, note: 'Manager không được tự tạo Manager hoặc phân công tòa nhà khác' },
                      { module: 'Quản lý Căn hộ / Block / Tầng', admin: true, manager: true, note: 'Manager chỉ quản lý các tầng và căn hộ thuộc tòa nhà phân công' },
                      { module: 'Quản lý Cư dân & Hợp đồng', admin: true, manager: true, note: 'Manager chỉ quản lý cư dân và hợp đồng thuộc tòa nhà phân công' },
                      { module: 'Lập & Thu Hóa đơn (Invoices)', admin: true, manager: true, note: 'Manager chỉ lập và quản lý hóa đơn trong tòa nhà phân công' },
                      { module: 'Bảo trì sự cố & Phân công kỹ thuật', admin: true, manager: true, note: 'Manager tiếp nhận và điều phối kỹ thuật viên tòa nhà' },
                      { module: 'Tạo nhân viên vận hành (Kỹ thuật/Bảo vệ/Lễ tân)', admin: true, manager: true, note: 'Manager được tạo nhân sự vận hành phục vụ tòa nhà' },
                      { module: 'Truy cập Phân quyền RBAC (/settings/access-control)', admin: true, manager: false, note: 'Chặn hoàn toàn Manager ở cả Middleware và API (403 Forbidden)' },
                      { module: 'Báo cáo toàn hệ thống đa tòa nhà', admin: true, manager: false, note: 'Admin xem tổng thể, Manager chỉ xem báo cáo tòa nhà gán' },
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                          {row.module}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {row.admin ? (
                            <span className="text-emerald-600 font-bold">✅ Có</span>
                          ) : (
                            <span className="text-slate-400 font-bold">❌ Không</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {row.manager ? (
                            <span className="text-emerald-600 font-bold">✅ Có (Scoped)</span>
                          ) : (
                            <span className="text-rose-500 font-bold">❌ Bị cấm</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-[11px]">{row.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: AUDIT LOGS */}
      {/* ========================================================================= */}
      {activeTab === 'audit' && (
        <Card className="border-slate-200/80 dark:border-slate-800">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <CardTitle className="text-base font-bold">Nhật ký Kiểm toán Phân quyền (Security & Assignment Logs)</CardTitle>
            <CardDescription className="text-xs">
              Ghi nhận các thao tác bổ nhiệm, thay đổi quyền hạn và phân công tòa nhà.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Thời gian</th>
                    <th className="px-4 py-3">Người thực hiện</th>
                    <th className="px-4 py-3">Hành động</th>
                    <th className="px-4 py-3">Đối tượng</th>
                    <th className="px-4 py-3">Chi tiết thay đổi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {!accessControl?.auditLogs || accessControl.auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Chưa có lịch sử thay đổi phân quyền gần đây.
                      </td>
                    </tr>
                  ) : (
                    accessControl.auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                          {formatDateTime(log.createdAt)}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                          {log.actorEmail}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="font-mono text-[10px] bg-slate-50 text-slate-700">
                            {log.action}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                          {log.entity}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-[11px] max-w-xs truncate font-mono">
                          {JSON.stringify(log.metadata)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE MANAGER */}
      {/* ========================================================================= */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Thêm mới Quản lý Tòa nhà (Manager)
            </h2>
            <form onSubmit={handleCreateManager} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Email đăng nhập *
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="manager@building.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Mật khẩu khởi tạo *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Số điện thoại liên hệ
                </label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="0912345678"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Phân công Tòa nhà quản lý ngay
                </label>
                <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                  {buildings.map((b) => (
                    <label key={b.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedNewBuildings.includes(b.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedNewBuildings([...selectedNewBuildings, b.id]);
                          } else {
                            setSelectedNewBuildings(selectedNewBuildings.filter((id) => id !== b.id));
                          }
                        }}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                        {b.name} ({b.code})
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-xl"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={createManagerMutation.isPending}
                  className="bg-[#0F6B4F] hover:bg-[#0c5942] text-white font-bold rounded-xl"
                >
                  {createManagerMutation.isPending ? 'Đang tạo...' : 'Tạo Quản lý'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ASSIGN BUILDINGS TO MANAGER */}
      {/* ========================================================================= */}
      {assigningManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Phân công Tòa nhà Quản lý
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Manager: <span className="font-bold text-slate-700 dark:text-slate-200">{assigningManager.fullName}</span> ({assigningManager.email})
              </p>
            </div>

            <div className="space-y-2">
              <label className="font-bold text-xs text-slate-700 dark:text-slate-300 block">
                Chọn các tòa nhà được phép quản trị:
              </label>
              <div className="max-h-56 overflow-y-auto space-y-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                {buildings.map((b) => {
                  const isChecked = assignedBuildingIds.includes(b.id);
                  return (
                    <div
                      key={b.id}
                      onClick={() => {
                        if (isChecked) {
                          setAssignedBuildingIds(assignedBuildingIds.filter((id) => id !== b.id));
                        } else {
                          setAssignedBuildingIds([...assignedBuildingIds, b.id]);
                        }
                      }}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-[#E8F5ED] text-[#0F6B4F] dark:bg-[#0F6B4F]/20 dark:text-emerald-300 font-bold'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-slate-400" />
                        <div>
                          <p className="text-xs font-semibold">{b.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{b.code}</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded border-slate-300 text-[#0F6B4F] focus:ring-[#0F6B4F]"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAssigningManager(null)}
                className="rounded-xl"
              >
                Hủy
              </Button>
              <Button
                type="button"
                onClick={handleSaveAssignments}
                disabled={assignBuildingsMutation.isPending}
                className="bg-[#0F6B4F] hover:bg-[#0c5942] text-white font-bold rounded-xl"
              >
                {assignBuildingsMutation.isPending ? 'Đang lưu...' : 'Lưu phân công'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
