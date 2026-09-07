'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserCheck, CheckCircle2, Star, XCircle, AlertTriangle } from 'lucide-react';
import { useStaffList } from '@/hooks/use-feedbacks';

interface AssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (staffId: string, internalNote?: string) => Promise<void>;
  isLoading: boolean;
}

export function AssignmentDialog({ isOpen, onClose, onSubmit, isLoading }: AssignmentDialogProps) {
  const { data: staffList, isLoading: loadingStaff } = useStaffList();
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [internalNote, setInternalNote] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId) return;
    await onSubmit(selectedStaffId, internalNote.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Phân công kỹ thuật viên</h3>
            <p className="text-xs text-slate-500">Chỉ định nhân sự chịu trách nhiệm xử lý sự cố này</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Chọn kỹ thuật viên / Quản lý phụ trách <span className="text-rose-500">*</span>
            </label>
            {loadingStaff ? (
              <div className="text-xs text-slate-400 py-2">Đang tải danh sách nhân sự...</div>
            ) : (
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                required
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Chọn nhân viên kỹ thuật --</option>
                {staffList?.data?.map((staff: any) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.fullName} ({staff.role === 'ADMIN' ? 'Ban quản trị' : 'Kỹ thuật viên / QL'})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Ghi chú nội bộ cho kỹ thuật viên (Cư dân không thấy)
            </label>
            <textarea
              rows={3}
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              placeholder="Nhắc nhở mang theo dụng cụ, thời gian phù hợp hoặc lưu ý đặc biệt..."
              className="w-full text-sm border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !selectedStaffId}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? 'Đang phân công...' : 'Xác nhận phân công'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ResolutionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (resolutionNote: string) => Promise<void>;
  isLoading: boolean;
}

export function ResolutionDialog({ isOpen, onClose, onSubmit, isLoading }: ResolutionDialogProps) {
  const [resolutionNote, setResolutionNote] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionNote.trim() || resolutionNote.trim().length < 5) return;
    await onSubmit(resolutionNote.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Báo cáo xử lý hoàn tất</h3>
            <p className="text-xs text-slate-500">Cung cấp chi tiết công việc đã thực hiện để gửi cư dân</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nội dung & Kết quả xử lý <span className="text-rose-500">* (tối thiểu 5 ký tự)</span>
            </label>
            <textarea
              rows={4}
              required
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="Mô tả nguyên nhân sự cố, các linh kiện đã thay thế hoặc nghiệm thu kỹ thuật..."
              className="w-full text-sm border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              disabled={isLoading || resolutionNote.trim().length < 5}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isLoading ? 'Đang cập nhật...' : 'Hoàn tất & Gửi cư dân'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface RejectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
  isLoading: boolean;
}

export function RejectDialog({ isOpen, onClose, onSubmit, isLoading }: RejectDialogProps) {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 5) return;
    await onSubmit(reason.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Từ chối tiếp nhận sự cố</h3>
            <p className="text-xs text-slate-500">Lý do từ chối sẽ được thông báo trực tiếp đến cư dân</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Lý do từ chối cụ thể <span className="text-rose-500">* (tối thiểu 5 ký tự)</span>
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ví dụ: Sự cố thuộc trang thiết bị cá nhân của cư dân, thông tin phản ánh không rõ ràng..."
              className="w-full text-sm border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              disabled={isLoading || reason.trim().length < 5}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isLoading ? 'Đang từ chối...' : 'Xác nhận từ chối'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface RatingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment?: string) => Promise<void>;
  isLoading: boolean;
}

export function RatingDialog({ isOpen, onClose, onSubmit, isLoading }: RatingDialogProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(rating, comment.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-center">
        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-500 mx-auto flex items-center justify-center mb-3">
          <Star className="w-6 h-6 fill-amber-400 text-amber-500" />
        </div>
        <h3 className="font-bold text-slate-900 text-lg">Đánh giá chất lượng xử lý</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
          Ý kiến đánh giá của bạn giúp Ban Quản Lý nâng cao chất lượng dịch vụ bảo trì
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="p-1 transition-transform hover:scale-125 focus:outline-none"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 hover:text-amber-200'
                  }`}
                />
              </button>
            ))}
          </div>
          <p className="text-xs font-semibold text-amber-700">
            {rating === 5 && '🌟 Rất hài lòng'}
            {rating === 4 && '👍 Hài lòng'}
            {rating === 3 && '👌 Bình thường'}
            {rating === 2 && '👎 Chưa hài lòng'}
            {rating === 1 && '⚠️ Rất thất vọng'}
          </p>

          <div className="text-left">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Ý kiến góp ý thêm (tùy chọn)
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ thêm cảm nhận của bạn về thái độ kỹ thuật viên hoặc thời gian xử lý..."
              className="w-full text-sm border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Đóng
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isLoading ? 'Đang gửi...' : 'Gửi đánh giá & Nghiệm thu'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
