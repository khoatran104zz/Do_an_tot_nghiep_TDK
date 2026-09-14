'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Vote,
  Plus,
  BarChart3,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  Loader2,
  Trash2,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { usePolls, useCreatePoll, useUpdatePoll } from '@/hooks/use-polls';
import { POLL_STATUS_MAP, POLL_TARGET_MAP } from '@/modules/poll/poll.constants';
import { PollTargetScope } from '@prisma/client';

export default function PollsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState(['Đồng ý', 'Không đồng ý']);
  const [startAt, setStartAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [endAt, setEndAt] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 16);
  });
  const [targetScope, setTargetScope] = useState<PollTargetScope>(PollTargetScope.ALL_APARTMENTS);
  const [formError, setFormError] = useState('');

  const { data: response, isLoading, refetch } = usePolls();
  const createMutation = useCreatePoll();
  const updateMutation = useUpdatePoll();

  const polls = response?.data || [];

  const handleAddOption = () => {
    setOptions((prev) => [...prev, '']);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, val: string) => {
    setOptions((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim()) {
      setFormError('Vui lòng nhập tiêu đề khảo sát');
      return;
    }

    const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
    if (cleanOptions.length < 2) {
      setFormError('Khảo sát cần có ít nhất 2 phương án biểu quyết');
      return;
    }

    const set = new Set(cleanOptions.map((o) => o.toLowerCase()));
    if (set.size !== cleanOptions.length) {
      setFormError('Các phương án biểu quyết không được trùng lặp');
      return;
    }

    try {
      await createMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        options: cleanOptions,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        targetScope,
      });

      setIsCreateOpen(false);
      setTitle('');
      setDescription('');
      setOptions(['Đồng ý', 'Không đồng ý']);
    } catch (err: any) {
      setFormError(err?.message || 'Tạo khảo sát thất bại');
    }
  };

  const handleClosePoll = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn đóng cuộc khảo sát này trước thời hạn?')) {
      await updateMutation.mutateAsync({
        id,
        data: { status: 'CLOSED' },
      });
      refetch();
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Khảo sát ý kiến & Biểu quyết cư dân"
        description="Tổ chức lấy ý kiến biểu quyết tòa nhà, hội nghị nhà chung cư với quy tắc 1 căn hộ = 1 phiếu bầu."
      >
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs hover:shadow-md cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>+ Tạo cuộc khảo sát</span>
        </button>
      </PageHeader>

      {/* Polls List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
            <span className="text-xs">Đang tải danh sách khảo sát...</span>
          </div>
        ) : polls.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <Vote className="h-10 w-10 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Chưa có cuộc khảo sát nào
            </h3>
            <p className="text-xs text-slate-400">
              Bấm nút "+ Tạo cuộc khảo sát" ở trên để khởi tạo cuộc biểu quyết mới cho cư dân.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {polls.map((poll: any) => {
              const statusInfo = POLL_STATUS_MAP[poll.status as keyof typeof POLL_STATUS_MAP] || {
                label: poll.status,
                badgeClass: 'bg-slate-100 text-slate-700',
              };
              const targetInfo = POLL_TARGET_MAP[poll.targetScope as keyof typeof POLL_TARGET_MAP] || {
                label: poll.targetScope,
              };
              const isActive = poll.status === 'ACTIVE';

              return (
                <div
                  key={poll.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Top Badges */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {targetInfo.label}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusInfo.badgeClass}`}
                      >
                        {statusInfo.label}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2 mb-1.5">
                      {poll.title}
                    </h3>
                    {poll.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                        {poll.description}
                      </p>
                    )}

                    {/* Options Preview */}
                    <div className="space-y-1.5 my-3">
                      {poll.options?.slice(0, 3).map((opt: any) => (
                        <div
                          key={opt.id}
                          className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between"
                        >
                          <span>{opt.label}</span>
                          <span className="text-[10px] text-slate-400">Phương án {opt.displayOrder}</span>
                        </div>
                      ))}
                      {poll.options?.length > 3 && (
                        <span className="text-[11px] text-slate-400 italic">
                          +{poll.options.length - 3} phương án khác...
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom Stats & Actions */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-3 mt-3 flex items-center justify-between text-xs">
                    <div className="text-slate-500 dark:text-slate-400 flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        Đến: {new Date(poll.endAt).toLocaleDateString('vi-VN')}
                      </span>
                      <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <Vote className="h-3.5 w-3.5" />
                        {poll._count?.votes || 0} phiếu
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isActive && (
                        <button
                          onClick={() => handleClosePoll(poll.id)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                        >
                          Đóng
                        </button>
                      )}
                      <Link
                        href={`/polls/${poll.id}/results`}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold hover:bg-blue-100 transition-colors"
                      >
                        <BarChart3 className="h-3.5 w-3.5" />
                        <span>Kết quả</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <Vote className="h-5 w-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Tạo cuộc khảo sát & biểu quyết mới
                </h2>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
                  {formError}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tiêu đề biểu quyết <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Cư dân có đồng ý thay đổi giờ hoạt động hồ bơi?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mô tả chi tiết
                </label>
                <textarea
                  rows={3}
                  placeholder="Thông tin chi tiết, lý do hoặc quy chế biểu quyết..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              {/* Options */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Các phương án biểu quyết <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="text-blue-600 font-semibold hover:underline"
                  >
                    + Thêm phương án
                  </button>
                </div>

                <div className="space-y-2">
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-5 text-slate-400 font-semibold">{idx + 1}.</span>
                      <input
                        type="text"
                        placeholder={`Phương án ${idx + 1}`}
                        value={opt}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-hidden"
                      />
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Bắt đầu từ
                  </label>
                  <input
                    type="datetime-local"
                    value={startAt}
                    onChange={(e) => setStartAt(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Hạn chót biểu quyết
                  </label>
                  <input
                    type="datetime-local"
                    value={endAt}
                    onChange={(e) => setEndAt(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Target Scope */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Đối tượng cư dân tham gia
                </label>
                <select
                  value={targetScope}
                  onChange={(e) => setTargetScope(e.target.value as PollTargetScope)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="ALL_APARTMENTS">Toàn bộ căn hộ trong tòa nhà</option>
                  <option value="BLOCK">Theo Block / Tháp</option>
                  <option value="FLOOR">Theo Tầng</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1.5"
                >
                  {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Công bố cuộc biểu quyết
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
