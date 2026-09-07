'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useFeedback, useWorkflowAction, useAddComment } from '@/hooks/use-feedbacks';
import { StatusStepper } from './status-stepper';
import { PriorityBadge } from './priority-badge';
import { SLAIndicator } from './sla-indicator';
import { TicketTimeline } from './ticket-timeline';
import { AssignmentDialog, ResolutionDialog, RejectDialog, RatingDialog } from './dialogs';
import { Button } from '@/components/ui/button';
import { TicketStatus, TicketPriority, TicketCategory } from '@prisma/client';
import {
  ArrowLeft,
  Building,
  User,
  Phone,
  Calendar,
  Wrench,
  ShieldCheck,
  Send,
  Lock,
  MessageSquare,
  Sparkles,
  AlertTriangle,
  Star,
} from 'lucide-react';

interface TicketDetailProps {
  ticketId: string;
  mode: 'MANAGEMENT' | 'RESIDENT';
  backUrl: string;
}

export function TicketDetail({ ticketId, mode, backUrl }: TicketDetailProps) {
  const { data: response, isLoading } = useFeedback(ticketId);
  const workflowMutation = useWorkflowAction();
  const addCommentMutation = useAddComment();

  // Dialog states
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isRatingOpen, setIsRatingOpen] = useState(false);

  // Comment input
  const [commentContent, setCommentContent] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);

  const ticket = response?.data;
  const isManager = mode === 'MANAGEMENT';

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="h-8 w-48 bg-slate-200 animate-pulse rounded-lg" />
        <div className="h-28 bg-slate-100 animate-pulse rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-slate-100 animate-pulse rounded-2xl" />
          <div className="h-96 bg-slate-100 animate-pulse rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="max-w-xl mx-auto p-12 text-center bg-white rounded-2xl border border-slate-200 mt-10">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Không tìm thấy thông tin sự cố</h2>
        <p className="text-sm text-slate-500 mt-1">Sự cố có thể đã bị xóa hoặc bạn không có quyền xem.</p>
        <Link href={backUrl} className="mt-4 inline-block">
          <Button variant="outline">Quay lại danh sách</Button>
        </Link>
      </div>
    );
  }

  // Handlers
  const handleAssign = async (staffId: string, internalNote?: string) => {
    await workflowMutation.mutateAsync({
      id: ticketId,
      action: 'ASSIGN',
      payload: { staffId, internalNote },
    });
  };

  const handleStartProcessing = async () => {
    await workflowMutation.mutateAsync({
      id: ticketId,
      action: 'START_PROCESSING',
    });
  };

  const handleResolve = async (resolutionNote: string) => {
    await workflowMutation.mutateAsync({
      id: ticketId,
      action: 'RESOLVE',
      payload: { resolutionNote },
    });
  };

  const handleReject = async (reason: string) => {
    await workflowMutation.mutateAsync({
      id: ticketId,
      action: 'REJECT',
      payload: { reason },
    });
  };

  const handleClose = async () => {
    await workflowMutation.mutateAsync({
      id: ticketId,
      action: 'CLOSE',
    });
  };

  const handleRate = async (rating: number, comment?: string) => {
    await workflowMutation.mutateAsync({
      id: ticketId,
      action: 'RATE',
      payload: { rating, ratingComment: comment },
    });
  };

  const handlePriorityChange = async (newPriority: TicketPriority) => {
    await workflowMutation.mutateAsync({
      id: ticketId,
      action: 'PRIORITY',
      payload: { priority: newPriority },
    });
  };

  const handleCategoryChange = async (newCategory: TicketCategory) => {
    await workflowMutation.mutateAsync({
      id: ticketId,
      action: 'CATEGORY',
      payload: { category: newCategory },
    });
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    await addCommentMutation.mutateAsync({
      id: ticketId,
      content: commentContent.trim(),
      isInternal: isManager ? isInternalComment : false,
    });
    setCommentContent('');
    setIsInternalComment(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 pb-20">
      {/* Top Bar Navigation & Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link href={backUrl}>
            <button className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-slate-600">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                {ticket.code}
              </span>
              <PriorityBadge priority={ticket.priority} size="sm" />
              <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-medium">
                {ticket.category}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{ticket.title}</h1>
          </div>
        </div>

        {/* SLA Status Indicator */}
        <div className="flex items-center gap-2">
          <SLAIndicator sla={ticket.sla} />
        </div>
      </div>

      {/* Status Stepper Progression */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
          Tiến trình giải quyết sự cố
        </h3>
        <StatusStepper status={ticket.status} rejectReason={ticket.rejectReason} />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Details, Resolutions, Action Bar & Conversation */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Description & Photo Evidence */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Mô tả chi tiết sự cố</h3>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50/60 p-4 rounded-xl border border-slate-100">
              {ticket.content}
            </p>

            {/* Images Attached */}
            {ticket.images && ticket.images.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-600 mb-2">Hình ảnh hiện trường ({ticket.images.length})</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {ticket.images.map((img: string, i: number) => (
                    <a key={i} href={img} target="_blank" rel="noreferrer" className="block group overflow-hidden rounded-xl border border-slate-200">
                      <img
                        src={img}
                        alt={`Ảnh sự cố ${i + 1}`}
                        className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Resolution Card (when available) */}
          {ticket.responseContent && (
            <div className="bg-emerald-50/70 border border-emerald-200 p-5 rounded-2xl shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Phương án xử lý kỹ thuật</span>
              </div>
              <p className="text-sm text-emerald-900 leading-relaxed whitespace-pre-wrap">
                {ticket.responseContent}
              </p>
              {ticket.resolvedAt && (
                <div className="text-xs text-emerald-700 pt-1">
                  Đã hoàn tất lúc:{' '}
                  {new Date(ticket.resolvedAt).toLocaleString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </div>
              )}
            </div>
          )}

          {/* Rating Display */}
          {ticket.rating && (
            <div className="bg-amber-50/80 border border-amber-200 p-5 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
                  <span className="font-bold text-sm text-amber-900">Đánh giá từ Cư dân</span>
                </div>
                <div className="flex items-center text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < ticket.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                    />
                  ))}
                </div>
              </div>
              {ticket.ratingComment && (
                <p className="text-sm text-amber-950 italic">"{ticket.ratingComment}"</p>
              )}
            </div>
          )}

          {/* WORKFLOW ACTION BAR */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Tác vụ điều phối & Xử lý</h3>

            <div className="flex flex-wrap items-center gap-3">
              {/* MANAGEMENT ACTIONS */}
              {isManager && (
                <>
                  {ticket.status === TicketStatus.NEW && (
                    <>
                      <Button
                        onClick={() => setIsAssignOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                      >
                        <Wrench className="w-4 h-4" /> Phân công kỹ thuật viên
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsRejectOpen(true)}
                        className="text-rose-600 border-rose-200 hover:bg-rose-50"
                      >
                        Từ chối yêu cầu
                      </Button>
                    </>
                  )}

                  {ticket.status === TicketStatus.ASSIGNED && (
                    <>
                      <Button
                        onClick={handleStartProcessing}
                        disabled={workflowMutation.isPending}
                        className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
                      >
                        <Wrench className="w-4 h-4" /> Bắt đầu thực hiện
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsAssignOpen(true)}
                        className="text-slate-700"
                      >
                        Đổi nhân sự
                      </Button>
                    </>
                  )}

                  {ticket.status === TicketStatus.PROCESSING && (
                    <Button
                      onClick={() => setIsResolveOpen(true)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                    >
                      <ShieldCheck className="w-4 h-4" /> Báo cáo hoàn tất xử lý
                    </Button>
                  )}

                  {ticket.status === TicketStatus.RESOLVED && (
                    <Button
                      onClick={handleClose}
                      disabled={workflowMutation.isPending}
                      variant="outline"
                      className="border-slate-300 text-slate-700 hover:bg-slate-50"
                    >
                      Nghiệm thu & Đóng ticket
                    </Button>
                  )}

                  {/* Manager change priority / category */}
                  {ticket.status !== TicketStatus.CLOSED && ticket.status !== TicketStatus.REJECTED && (
                    <div className="flex items-center gap-2 ml-auto pt-2 sm:pt-0">
                      <select
                        value={ticket.priority}
                        onChange={(e) => handlePriorityChange(e.target.value as TicketPriority)}
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700"
                      >
                        <option value="LOW">Ưu tiên Thấp (72h)</option>
                        <option value="MEDIUM">Bình thường (48h)</option>
                        <option value="HIGH">Ưu tiên Cao (24h)</option>
                        <option value="URGENT">Khẩn cấp (4h)</option>
                      </select>

                      <select
                        value={ticket.category}
                        onChange={(e) => handleCategoryChange(e.target.value as TicketCategory)}
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700"
                      >
                        <option value="ELECTRIC">Điện sinh hoạt</option>
                        <option value="WATER">Cấp thoát nước</option>
                        <option value="ELEVATOR">Thang máy</option>
                        <option value="SECURITY">An ninh</option>
                        <option value="CLEANLINESS">Vệ sinh</option>
                        <option value="OTHER">Khác</option>
                      </select>
                    </div>
                  )}
                </>
              )}

              {/* RESIDENT ACTIONS */}
              {!isManager && (
                <>
                  {ticket.status === TicketStatus.RESOLVED && (
                    <Button
                      onClick={() => setIsRatingOpen(true)}
                      className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
                    >
                      <Star className="w-4 h-4 fill-white" /> Đánh giá mức độ hài lòng & Nghiệm thu
                    </Button>
                  )}
                  {ticket.status === TicketStatus.CLOSED && (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                      ✅ Sự cố đã được đóng và nghiệm thu thành công.
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* COMMENTS & COLLABORATION CHAT */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-slate-500" />
                Trao đổi & Tin nhắn hỗ trợ ({ticket.comments?.length || 0})
              </h3>
              {isManager && (
                <span className="text-2xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Hỗ trợ ghi chú nội bộ
                </span>
              )}
            </div>

            {/* Comment list */}
            <div className="space-y-3">
              {ticket.comments && ticket.comments.length > 0 ? (
                ticket.comments.map((comment: any) => (
                  <div
                    key={comment.id}
                    className={`p-3.5 rounded-xl border text-sm ${
                      comment.isInternal
                        ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                        : 'bg-slate-50/80 border-slate-200/70 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <span>{comment.author?.fullName || 'Người dùng'}</span>
                        <span className="text-2xs font-medium px-1.5 py-0.2 rounded-sm bg-white/80 border border-slate-200/60 text-slate-600">
                          {comment.author?.role === 'RESIDENT' ? 'Cư dân' : 'BQL / Kỹ thuật'}
                        </span>
                        {comment.isInternal && (
                          <span className="text-2xs font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded-sm flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" /> Nội bộ
                          </span>
                        )}
                      </div>
                      <span className="text-slate-600">
                        {new Date(comment.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} •{' '}
                        {new Date(comment.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-600 py-3 text-center">Chưa có tin nhắn trao đổi nào.</p>
              )}
            </div>

            {/* Add Comment Form */}
            <form onSubmit={handleSendComment} className="pt-2 border-t border-slate-100 space-y-3">
              <textarea
                rows={2}
                required
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder={
                  isInternalComment
                    ? 'Ghi chú nội bộ giữa ban quản lý và kỹ thuật viên (cư dân sẽ không thấy)...'
                    : 'Nhập tin nhắn trao đổi...'
                }
                className="w-full text-sm border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/30"
              />

              <div className="flex items-center justify-between">
                {isManager ? (
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-amber-800">
                    <input
                      type="checkbox"
                      checked={isInternalComment}
                      onChange={(e) => setIsInternalComment(e.target.checked)}
                      className="rounded-sm border-amber-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Đặt làm ghi chú nội bộ (Bảo mật)
                    </span>
                  </label>
                ) : (
                  <div />
                )}

                <Button
                  type="submit"
                  disabled={addCommentMutation.isPending || !commentContent.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 text-xs px-4"
                >
                  <Send className="w-3.5 h-3.5" /> Gửi phản hồi
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Apartment, Resident, Assigned Staff & Timeline */}
        <div className="space-y-6">
          {/* Metadata Card: Apartment & Resident */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">Thông tin căn hộ & Cư dân</h3>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  Căn hộ {ticket.apartment?.code}
                </h4>
                <p className="text-xs text-slate-500">
                  {ticket.apartment?.building} • Tầng {ticket.apartment?.floor}
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-1 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Người gửi:
                </span>
                <span className="font-semibold text-slate-800">{ticket.resident?.fullName}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> Điện thoại:
                </span>
                <span className="font-semibold text-slate-800">{ticket.resident?.phone || 'Chưa có'}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Ngày tạo:
                </span>
                <span className="font-semibold text-slate-800">
                  {new Date(ticket.createdAt).toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Assigned Staff Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">Kỹ thuật viên phụ trách</h3>

            {ticket.assignedStaff ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50/70 border border-blue-100">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                  {ticket.assignedStaff.fullName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-blue-950 text-sm truncate">
                    {ticket.assignedStaff.fullName}
                  </h4>
                  <p className="text-xs text-blue-700 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {ticket.assignedStaff.phone || 'N/A'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                Chưa có nhân sự được phân công.
              </div>
            )}

            {/* Internal Note (Manager Only) */}
            {isManager && ticket.internalNote && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs">
                <div className="flex items-center gap-1 font-bold text-amber-800 mb-1">
                  <Lock className="w-3 h-3" /> Ghi chú nội bộ BQL:
                </div>
                <p className="text-amber-950">{ticket.internalNote}</p>
              </div>
            )}
          </div>

          {/* Activity Timeline */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Nhật ký xử lý (Audit History)
            </h3>
            <TicketTimeline
              history={ticket.statusHistory || []}
              rating={ticket.rating}
              ratingComment={ticket.ratingComment}
            />
          </div>
        </div>
      </div>

      {/* Dialog Modals */}
      <AssignmentDialog
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        onSubmit={handleAssign}
        isLoading={workflowMutation.isPending}
      />
      <ResolutionDialog
        isOpen={isResolveOpen}
        onClose={() => setIsResolveOpen(false)}
        onSubmit={handleResolve}
        isLoading={workflowMutation.isPending}
      />
      <RejectDialog
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        onSubmit={handleReject}
        isLoading={workflowMutation.isPending}
      />
      <RatingDialog
        isOpen={isRatingOpen}
        onClose={() => setIsRatingOpen(false)}
        onSubmit={handleRate}
        isLoading={workflowMutation.isPending}
      />
    </div>
  );
}
