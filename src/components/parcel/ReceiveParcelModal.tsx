'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  Building2,
  User,
  Phone,
  Truck,
  Barcode,
  MapPin,
  FileText,
  Loader2,
  CheckCircle2,
  Camera,
} from 'lucide-react';
import { useReceiveParcel } from '@/hooks/use-parcels';
import { useApartments } from '@/hooks/use-apartments';
import { useBuildingContext } from '@/context/BuildingContext';
import { POPULAR_CARRIERS, PARCEL_LOCATIONS } from '@/modules/parcel/parcel.constants';
import { ReceiveParcelDto } from '@/modules/parcel/parcel.types';

interface ReceiveParcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (parcel: any) => void;
}

export const ReceiveParcelModal: React.FC<ReceiveParcelModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { selectedBuildingId } = useBuildingContext();
  const [formData, setFormData] = useState<ReceiveParcelDto>({
    apartmentId: '',
    recipientId: '',
    recipientName: '',
    recipientPhone: '',
    carrier: 'Shopee Express',
    trackingNumber: '',
    location: 'Kệ A - Tầng 1',
    note: '',
    photoUrl: '',
  });

  const [customCarrier, setCustomCarrier] = useState('');
  const [isCustomCarrier, setIsCustomCarrier] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createdParcel, setCreatedParcel] = useState<any>(null);

  const receiveMutation = useReceiveParcel();
  const { data: aptData, isLoading: isLoadingApts } = useApartments({
    limit: 100,
    buildingId: selectedBuildingId || undefined,
  });
  const apartments = aptData?.data || [];

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setFormData({
        apartmentId: '',
        recipientId: '',
        recipientName: '',
        recipientPhone: '',
        carrier: 'Shopee Express',
        trackingNumber: '',
        location: 'Kệ A - Tầng 1',
        note: '',
        photoUrl: '',
      });
      setIsCustomCarrier(false);
      setCustomCarrier('');
      setErrors({});
      setCreatedParcel(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApartmentChange = (aptId: string) => {
    const selectedApt = apartments.find((a: any) => a.id === aptId);
    setFormData((prev) => ({
      ...prev,
      apartmentId: aptId,
      recipientName: selectedApt?.residents?.[0]?.fullName || prev.recipientName || '',
      recipientPhone: selectedApt?.residents?.[0]?.phone || prev.recipientPhone || '',
      recipientId: selectedApt?.residents?.[0]?.id || '',
    }));
  };

  const selectedApartment = apartments.find((a: any) => a.id === formData.apartmentId);
  const residentsInApt = selectedApartment?.residents || [];

  const handleCarrierSelect = (carrier: string) => {
    if (carrier === 'Khác') {
      setIsCustomCarrier(true);
      setFormData((prev) => ({ ...prev, carrier: customCarrier }));
    } else {
      setIsCustomCarrier(false);
      setFormData((prev) => ({ ...prev, carrier }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.apartmentId) {
      newErrors.apartmentId = 'Vui lòng chọn căn hộ nhận bưu kiện';
    }
    if (!formData.recipientName.trim()) {
      newErrors.recipientName = 'Vui lòng nhập tên người nhận';
    }
    const finalCarrier = isCustomCarrier ? customCarrier.trim() : formData.carrier.trim();
    if (!finalCarrier) {
      newErrors.carrier = 'Vui lòng chọn hoặc nhập đơn vị vận chuyển';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const res = await receiveMutation.mutateAsync({
        ...formData,
        carrier: finalCarrier,
      });
      setCreatedParcel(res.data);
      onSuccess?.(res.data);
    } catch {
      // Error handled by mutation toast
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Tiếp nhận bưu kiện tại sảnh
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ghi nhận bưu phẩm mới và tự động gửi mã nhận hàng cho cư dân
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
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {createdParcel ? (
            <div className="py-6 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Tiếp nhận kiện hàng thành công!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Đã tự động gửi thông báo đến cư dân căn hộ {createdParcel?.apartment?.code}
                </p>
              </div>

              {/* Pickup Code Box */}
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 max-w-sm mx-auto">
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider block mb-1">
                  Mã nhận hàng bảo mật
                </span>
                <span className="text-3xl font-mono font-extrabold text-blue-600 dark:text-blue-400 tracking-widest">
                  {createdParcel?.pickupCode}
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                  Vị trí lưu kho: <strong className="text-slate-800 dark:text-slate-200">{createdParcel?.location || 'Sảnh tiếp tân'}</strong>
                </p>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCreatedParcel(null);
                    setFormData((prev) => ({
                      ...prev,
                      trackingNumber: '',
                      note: '',
                      photoUrl: '',
                    }));
                  }}
                  className="px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 rounded-xl transition-colors cursor-pointer"
                >
                  + Nhận tiếp kiện khác
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Hoàn tất
                </button>
              </div>
            </div>
          ) : (
            <form id="receive-parcel-form" onSubmit={handleSubmit} className="space-y-4">
              {/* Apartment Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Căn hộ nhận hàng <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <select
                    value={formData.apartmentId}
                    onChange={(e) => handleApartmentChange(e.target.value)}
                    disabled={isLoadingApts}
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-hidden"
                  >
                    <option value="">-- Chọn căn hộ --</option>
                    {apartments.map((apt: any) => (
                      <option key={apt.id} value={apt.id}>
                        {apt.code} - {apt.building} (Tầng {apt.floor})
                      </option>
                    ))}
                  </select>
                </div>
                {errors.apartmentId && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.apartmentId}</p>
                )}
              </div>

              {/* Recipient Quick Select (if residents exist in selected apartment) */}
              {residentsInApt.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Cư dân thuộc căn hộ (chọn nhanh):
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {residentsInApt.map((r: any) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            recipientId: r.id,
                            recipientName: r.fullName,
                            recipientPhone: r.phone,
                          }))
                        }
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                          formData.recipientId === r.id
                            ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 font-semibold'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {r.fullName} ({r.phone})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recipient Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tên người nhận trên đơn <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Ví dụ: Nguyễn Văn A"
                      value={formData.recipientName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, recipientName: e.target.value }))}
                      className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-hidden"
                    />
                  </div>
                  {errors.recipientName && (
                    <p className="text-[11px] text-rose-500 mt-1">{errors.recipientName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Số điện thoại người nhận
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="tel"
                      placeholder="Ví dụ: 0912 345 678"
                      value={formData.recipientPhone || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, recipientPhone: e.target.value }))}
                      className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Carrier Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Đơn vị giao nhận (Shipper) <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {POPULAR_CARRIERS.map((c) => {
                    const isSelected = isCustomCarrier ? c === 'Khác' : formData.carrier === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => handleCarrierSelect(c)}
                        className={`text-xs px-2.5 py-1.5 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 font-semibold shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>

                {isCustomCarrier && (
                  <div className="mt-1.5">
                    <input
                      type="text"
                      placeholder="Nhập tên đơn vị giao nhận khác..."
                      value={customCarrier}
                      onChange={(e) => {
                        setCustomCarrier(e.target.value);
                        setFormData((prev) => ({ ...prev, carrier: e.target.value }));
                      }}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-hidden"
                    />
                  </div>
                )}
                {errors.carrier && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.carrier}</p>
                )}
              </div>

              {/* Tracking Number & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mã vận đơn (nếu có)
                  </label>
                  <div className="relative">
                    <Barcode className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="SPX12345678, GHN-..."
                      value={formData.trackingNumber || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, trackingNumber: e.target.value }))}
                      className="w-full pl-9 pr-4 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vị trí lưu kho tại sảnh
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <select
                      value={formData.location || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                      className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-hidden"
                    >
                      {PARCEL_LOCATIONS.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Photo URL / Camera */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Đường dẫn ảnh chụp bưu kiện (tùy chọn)
                </label>
                <div className="relative">
                  <Camera className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="url"
                    placeholder="https://... ảnh kiện hàng thực tế"
                    value={formData.photoUrl || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, photoUrl: e.target.value }))}
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ghi chú kiện hàng
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Ví dụ: Thùng to cồng kềnh, dễ vỡ, giữ lạnh..."
                    value={formData.note || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, note: e.target.value }))}
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        {!createdParcel && (
          <div className="flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800 px-6 py-3.5 bg-slate-50/50 dark:bg-slate-800/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              form="receive-parcel-form"
              disabled={receiveMutation.isPending}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {receiveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Tiếp nhận & Tạo mã nhận hàng
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
