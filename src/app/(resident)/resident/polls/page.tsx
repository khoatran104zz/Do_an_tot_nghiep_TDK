'use client';

import React, { useState } from 'react';
import {
  Vote,
  Clock,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Loader2,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { usePolls, useVotePoll } from '@/hooks/use-polls';
import { POLL_STATUS_MAP } from '@/modules/poll/poll.constants';
import { toast } from 'sonner';

export default function ResidentPollsPage() {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [confirmingPoll, setConfirmingPoll] = useState<any>(null);

  const { data: response, isLoading } = usePolls();
  const voteMutation = useVotePoll();

  const polls = response?.data || [];

  const handleSelectOption = (pollId: string, optionId: string) => {
    setSelectedOptions((prev) => ({ ...prev, [pollId]: optionId }));
  };

  const handleVoteSubmit = async () => {
    if (!confirmingPoll) return;
    const optionId = selectedOptions[confirmingPoll.id];
    if (!optionId) {
      toast.error('Vui lòng chọn một phương án biểu quyết');
      return;
    }

    try {
      await voteMutation.mutateAsync({
        pollId: confirmingPoll.id,
        data: { optionId },
      });
      setConfirmingPoll(null);
    } catch {
      // Handled by mutation toast
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <PageHeader
        title="Khảo sát ý kiến cư dân"
        description="Các cuộc biểu quyết, lấy ý kiến đóng góp cho cộng đồng cư dân tòa nhà."
      />

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/80 text-xs text-blue-800 dark:text-blue-300">
        <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block mb-0.5">Quy tắc biểu quyết: 1 Căn hộ = 1 Phiếu bầu</span>
          <p className="text-blue-700 dark:text-blue-400">
            Hệ thống tính biểu quyết theo đại diện từng căn hộ. Khi bất kỳ thành viên nào trong căn hộ đã biểu quyết, phiếu bầu của căn hộ sẽ được chốt lại và không thể thay đổi.
          </p>
        </div>
      </div>

      {/* Poll List */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
          <span className="text-xs">Đang tải danh sách khảo sát...</span>
        </div>
      ) : polls.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
          <Vote className="h-10 w-10 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Hiện không có cuộc biểu quyết nào đang mở
          </h3>
          <p className="text-xs text-slate-400">
            Khi Ban Quản Lý mở khảo sát mới, bạn sẽ nhận được thông báo tại đây.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {polls.map((poll: any) => {
            const hasVoted = Boolean(poll.userVote);
            const votedOptionId = poll.userVote?.optionId;
            const currentSelected = selectedOptions[poll.id];
            const isClosed = poll.status === 'CLOSED';

            return (
              <div
                key={poll.id}
                className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all space-y-4"
              >
                {/* Title & Deadline */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      {poll.title}
                    </h3>
                    {poll.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {poll.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-amber-500" />
                      Hạn: {new Date(poll.endAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>

                {/* Options List */}
                <div className="space-y-2.5">
                  {poll.options?.map((opt: any) => {
                    const isSelected = hasVoted
                      ? votedOptionId === opt.id
                      : currentSelected === opt.id;

                    return (
                      <label
                        key={opt.id}
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                          hasVoted
                            ? isSelected
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-300 font-semibold'
                              : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 opacity-60'
                            : isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-600 text-blue-900 dark:text-blue-300 font-semibold shadow-2xs'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name={`poll-${poll.id}`}
                            value={opt.id}
                            disabled={hasVoted || isClosed}
                            checked={isSelected}
                            onChange={() => handleSelectOption(poll.id, opt.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className="text-xs">{opt.label}</span>
                        </div>

                        {hasVoted && isSelected && (
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Căn hộ đã chọn
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>

                {/* Footer Action / Voted State */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {hasVoted ? (
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>Biểu quyết của căn hộ đã được ghi nhận thành công</span>
                    </div>
                  ) : isClosed ? (
                    <span className="text-xs text-slate-400">Cuộc biểu quyết đã kết thúc</span>
                  ) : (
                    <span className="text-xs text-slate-400">
                      Vui lòng chọn phương án và bấm xác nhận
                    </span>
                  )}

                  {!hasVoted && !isClosed && (
                    <button
                      type="button"
                      disabled={!currentSelected}
                      onClick={() => setConfirmingPoll(poll)}
                      className="px-5 py-2 text-xs font-semibold rounded-xl bg-[#0F6B4F] text-white hover:bg-[#0c5942] active:bg-[#094634] disabled:opacity-50 transition-colors shadow-xs hover:shadow-md cursor-pointer"
                    >
                      Xác nhận biểu quyết
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmingPoll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <Vote className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Xác nhận gửi biểu quyết
                </h3>
                <p className="text-xs text-slate-400">Kiểm tra lại lựa chọn của bạn</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300">
              <span className="font-bold block mb-1">Lưu ý quan trọng:</span>
              <p>
                Bạn chỉ có một lượt biểu quyết cho căn hộ này. Sau khi gửi, bạn sẽ không thể chỉnh sửa hoặc bỏ phiếu lại.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmingPoll(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleVoteSubmit}
                disabled={voteMutation.isPending}
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-[#0F6B4F] text-white hover:bg-[#0c5942] active:bg-[#094634] flex items-center gap-1.5 shadow-xs"
              >
                {voteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
