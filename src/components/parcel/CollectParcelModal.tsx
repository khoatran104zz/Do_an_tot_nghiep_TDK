'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  KeyRound,
  CheckCircle2,
  Package,
  User,
  Building2,
  Loader2,
  Truck,
} from 'lucide-react';
import { useCollectParcel } from '@/hooks/use-parcels';
import { ParcelWithRelations } from '@/modules/parcel/parcel.types';

interface CollectParcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedParcel?: ParcelWithRelations | null;
  onSuccess?: () => void;
}

export const CollectParcelModal: React.FC<CollectParcelModalProps> = ({
  isOpen,
  onClose,
  selectedParcel,
  onSuccess,
}) => {
  const [pickupCode, setPickupCode] = useState('');
  const [collectedByName, setCollectedByName] = useState('');
  const [error, setError] = useState('');

  const collectMutation = useCollectParcel();

  useEffect(() => {
    if (isOpen) {
      setPickupCode(selectedParcel ? selectedParcel.pickupCode : '');
      setCollectedByName(selectedParcel ? selectedParcel.recipientName : '');
      setError('');
    }
  }, [isOpen, selectedParcel]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupCode.trim()) {
      setError('Vui lòng nhập mã nhận hàng 6 chữ số');
      return;
    }

    try {
      await collectMutation.mutateAsync({
        pickupCode: pickupCode.trim(),
        parcelId: selectedParcel?.id,
        collectedByName: collectedByName.trim() || undefined,
      });
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Mã nhận hàng không chính xác');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Xác nhận bàn giao bưu kiện
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Đối soát mã nhận hàng bảo mật của cư dân
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {selectedParcel && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Căn hộ:</span>
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5 text-blue-600" />
                  {selectedParcel.apartment.code}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Người nhận:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedParcel.recipientName}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Đơn vị vận chuyển:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedParcel.carrier}
                </span>
              </div>
              {selectedParcel.location && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Vị trí lưu kho:</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {selectedParcel.location}
                  </span>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Mã nhận hàng bảo mật (6 chữ số) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3 h-5 w-5 text-slate-400" />
              <input
                type="text"
                maxLength={10}
                placeholder="Ví dụ: 839210"
                value={pickupCode}
                onChange={(e) => {
                  setPickupCode(e.target.value.replace(/\s/g, ''));
                  setError('');
                }}
                className="w-full pl-11 pr-4 py-2.5 text-base font-mono tracking-widest font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>
            {error && <p className="text-xs text-rose-500 mt-1.5 font-medium">{error}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Người trực tiếp đến nhận tại sảnh
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tên người nhận (mặc định lấy theo đơn)"
                value={collectedByName}
                onChange={(e) => setCollectedByName(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={collectMutation.isPending}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-[#0F6B4F] hover:bg-[#0c5942] disabled:opacity-50 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {collectMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Xác nhận bàn giao
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
