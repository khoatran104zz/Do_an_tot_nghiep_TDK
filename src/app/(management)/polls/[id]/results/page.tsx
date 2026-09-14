'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Vote,
  ArrowLeft,
  Users,
  CheckCircle2,
  Calendar,
  BarChart3,
  Loader2,
  Percent,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { usePollResults } from '@/hooks/use-polls';
import { POLL_STATUS_MAP } from '@/modules/poll/poll.constants';

export default function PollResultsPage() {
  const params = useParams();
  const pollId = params?.id as string;

  const { data: response, isLoading } = usePollResults(pollId);
  const results = response?.data;

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
        <span className="text-xs">Đang tổng hợp kết quả biểu quyết...</span>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="p-12 text-center">
        <p className="text-sm text-slate-500 mb-4">Không tìm thấy thông tin khảo sát</p>
        <Link href="/polls" className="text-xs text-blue-600 hover:underline">
          ← Quay lại danh sách
        </Link>
      </div>
    );
  }

  const statusInfo = POLL_STATUS_MAP[results.status as keyof typeof POLL_STATUS_MAP] || {
    label: results.status,
    badgeClass: 'bg-slate-100 text-slate-700',
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-2">
        <Link
          href="/polls"
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PageHeader
          title="Kết quả biểu quyết cư dân"
          description={`Chi tiết kết quả khảo sát: ${results.title}`}
        />
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Số căn hộ đủ điều kiện</span>
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                {results.eligibleApartments} căn hộ
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
              <Vote className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Tổng số phiếu đã bầu</span>
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                {results.totalVotes} phiếu
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600">
              <Percent className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Tỷ lệ tham gia biểu quyết</span>
              <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                {results.participationRate}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Progress Bars */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-600" />
            Tỷ lệ bình chọn theo từng phương án
          </h3>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusInfo.badgeClass}`}>
            {statusInfo.label}
          </span>
        </div>

        <div className="space-y-5">
          {results.options.map((opt: any, index: number) => {
            const colors = [
              'bg-blue-600',
              'bg-emerald-600',
              'bg-amber-500',
              'bg-purple-600',
              'bg-rose-500',
            ];
            const barColor = colors[index % colors.length];

            return (
              <div key={opt.id} className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-800 dark:text-slate-200">
                    {opt.displayOrder}. {opt.label}
                  </span>
                  <div className="flex items-center gap-3 text-slate-500">
                    <span>{opt.votesCount} phiếu</span>
                    <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                      {opt.percentage}%
                    </span>
                  </div>
                </div>

                {/* Bar */}
                <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${opt.percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex items-center justify-between text-xs text-slate-400">
          <span>Hạn biểu quyết: {new Date(results.endAt).toLocaleString('vi-VN')}</span>
          <span>Ràng buộc: 1 Căn hộ = 1 Phiếu duy nhất</span>
        </div>
      </div>
    </div>
  );
}
