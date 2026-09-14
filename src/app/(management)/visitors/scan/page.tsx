'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  QrCode,
  Camera,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  User,
  Home,
  Clock,
  Car,
  ShieldCheck,
  LogIn,
  LogOut,
  RefreshCw,
  Loader2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VISITOR_STATUS_MAP } from '@/modules/visitor/visitor.constants';
import { useScanVisitor, useCheckInVisitor, useCheckOutVisitor } from '@/hooks/use-visitors';
import { ScanVisitorResult } from '@/modules/visitor/visitor.types';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';

export default function VisitorScanPage() {
  const [inputCode, setInputCode] = useState<string>('');
  const [scanResult, setScanResult] = useState<ScanVisitorResult | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const scanMutation = useScanVisitor();
  const checkInMutation = useCheckInVisitor();
  const checkOutMutation = useCheckOutVisitor();

  // Handle Manual or QR string submit
  const handleValidateCode = async (codeToTest?: string) => {
    const code = (codeToTest || inputCode).trim();
    if (!code) {
      toast.error('Vui lòng nhập mã thẻ hoặc quét mã QR');
      return;
    }

    try {
      const res = await scanMutation.mutateAsync({ code });
      const resultData: ScanVisitorResult = res.data;
      setScanResult(resultData);
      if (resultData.isValid) {
        toast.success(`Xác thực thành công: ${resultData.pass?.passCode}`);
      } else {
        toast.error(resultData.message || 'Mã thẻ không hợp lệ!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi tra cứu mã thẻ');
    }
  };

  // Check in action
  const handleCheckIn = async () => {
    if (!scanResult?.pass?.id) return;
    try {
      await checkInMutation.mutateAsync(scanResult.pass.id);
      // Re-scan to refresh details
      await handleValidateCode(scanResult.pass.passCode);
    } catch (err) {
      // Handled by toast
    }
  };

  // Check out action
  const handleCheckOut = async () => {
    if (!scanResult?.pass?.id) return;
    try {
      await checkOutMutation.mutateAsync(scanResult.pass.id);
      // Re-scan to refresh details
      await handleValidateCode(scanResult.pass.passCode);
    } catch (err) {
      // Handled by toast
    }
  };

  // Camera Management
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        setCameraError('Trình duyệt không hỗ trợ truy cập camera');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
      toast.info('Đã bật camera quét mã');
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('Không thể mở camera. Vui lòng cấp quyền camera hoặc dùng chế độ nhập mã thẻ.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const pass = scanResult?.pass;
  const statusInfo = pass?.status ? VISITOR_STATUS_MAP[pass.status as keyof typeof VISITOR_STATUS_MAP] : null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Quét Mã QR & Check-in Khách"
        description="Dành cho Nhân viên An ninh / Bảo vệ trực sảnh & cổng kiểm soát ra vào"
        badge={
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
            An Ninh Vận Hành
          </span>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Scanner & Input (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-border shadow-md overflow-hidden">
            <CardHeader className="p-4 pb-3 bg-muted/40 border-b border-border flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Camera className="h-4 w-4 text-emerald-500" />
                <span>Máy Quét Mã QR</span>
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={cameraActive ? stopCamera : startCamera}
                className="h-8 text-xs gap-1.5"
              >
                <Camera className="h-3.5 w-3.5" />
                {cameraActive ? 'Tắt Camera' : 'Bật Camera'}
              </Button>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              {/* Camera Viewport */}
              <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-950 flex flex-col items-center justify-center border border-border">
                {cameraActive ? (
                  <>
                    <video
                      ref={videoRef}
                      className="h-full w-full object-cover"
                      playsInline
                    />
                    {/* Laser scanning line animation */}
                    <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-44 rounded-xl border-2 border-emerald-500/80 pointer-events-none flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                      <div className="w-full h-0.5 bg-emerald-400 animate-pulse" />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/20 text-muted-foreground mb-3">
                      <QrCode className="h-8 w-8" />
                    </div>
                    <p className="text-xs font-medium">Camera hiện đang tắt</p>
                    <p className="text-[11px] text-muted-foreground mt-1 max-w-xs">
                      Bấm &quot;Bật Camera&quot; để quét trực tiếp từ điện thoại của khách hoặc nhập mã thẻ thủ công bên dưới.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={startCamera}
                      className="mt-3 text-xs gap-1.5"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      Mở Camera
                    </Button>
                  </div>
                )}
              </div>

              {cameraError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-500 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{cameraError}</span>
                </div>
              )}

              {/* Manual Input Form */}
              <div className="space-y-2 pt-2 border-t border-border">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Search className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Nhập mã thẻ hoặc mã Token QR</span>
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="VD: VP-2026-0001"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleValidateCode();
                    }}
                    className="font-mono uppercase text-sm"
                  />
                  <Button
                    onClick={() => handleValidateCode()}
                    disabled={scanMutation.isPending || !inputCode.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                  >
                    {scanMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Xác thực'
                    )}
                  </Button>
                </div>
              </div>

              {/* Quick Preset Buttons for rapid testing */}
              <div className="pt-2">
                <span className="text-[11px] text-muted-foreground font-medium block mb-1.5">
                  Mã mẫu kiểm tra nhanh:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {['VP-2026-0001', 'VP-2026-0002', 'VP-2026-0003'].map((code) => (
                    <button
                      key={code}
                      onClick={() => {
                        setInputCode(code);
                        handleValidateCode(code);
                      }}
                      className="text-xs font-mono px-2 py-1 rounded bg-muted hover:bg-emerald-500/10 hover:text-emerald-500 border border-border transition-colors"
                    >
                      {code}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Scan Validation Result & Actions (7 cols) */}
        <div className="lg:col-span-7">
          {scanResult ? (
            <div className="space-y-4">
              {/* Validation Banner */}
              {scanResult.isValid ? (
                <div className="p-5 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-500">
                      <CheckCircle2 className="h-7 w-7" />
                    </div>
                    <div>
                      <div className="text-xs uppercase font-bold tracking-wider">
                        KẾT QUẢ KIỂM TRA
                      </div>
                      <div className="text-xl font-black tracking-tight">
                        ✓ HỢP LỆ
                      </div>
                    </div>
                  </div>

                  {statusInfo && (
                    <span
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border ${statusInfo.badgeClass}`}
                    >
                      {statusInfo.label}
                    </span>
                  )}
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-rose-500/10 border-2 border-rose-500/40 text-rose-600 dark:text-rose-400 flex items-center gap-3 shadow-lg">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/20 text-rose-500 shrink-0">
                    <XCircle className="h-7 w-7" />
                  </div>
                  <div>
                    <div className="text-xs uppercase font-bold tracking-wider">
                      KẾT QUẢ KIỂM TRA
                    </div>
                    <div className="text-xl font-black tracking-tight">
                      ✕ KHÔNG HỢP LỆ
                    </div>
                    <p className="text-xs mt-1 text-muted-foreground">
                      {scanResult.message}
                    </p>
                  </div>
                </div>
              )}

              {/* Pass Details Card */}
              {pass && (
                <Card className="border-border shadow-xl">
                  <CardHeader className="p-5 pb-3 border-b border-border bg-muted/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-mono text-muted-foreground">
                          {pass.passCode}
                        </span>
                        <CardTitle className="text-lg font-bold text-foreground">
                          Thông Tin Khách Đến Thăm
                        </CardTitle>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Tạo lúc: {format(new Date(pass.createdAt), 'HH:mm dd/MM/yyyy')}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 space-y-6">
                    {/* Visitor & Apartment Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-muted/30 border border-border/60">
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1.5">
                          <User className="h-4 w-4 text-emerald-500" />
                          <span className="font-semibold">Khách đến thăm</span>
                        </div>
                        <div className="text-base font-bold text-foreground">
                          {pass.visitorName}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          SĐT: {pass.visitorPhone || 'Chưa cập nhật'}
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-muted/30 border border-border/60">
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1.5">
                          <Home className="h-4 w-4 text-blue-500" />
                          <span className="font-semibold">Căn hộ & Cư dân bảo lãnh</span>
                        </div>
                        <div className="text-base font-bold text-foreground">
                          Căn {pass.apartment?.unitNumber || 'N/A'}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Chủ hộ/Bảo lãnh: {pass.resident?.fullName || 'Cư dân'}
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-muted/30 border border-border/60">
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1.5">
                          <Clock className="h-4 w-4 text-amber-500" />
                          <span className="font-semibold">Thời gian dự kiến</span>
                        </div>
                        <div className="text-base font-bold text-foreground">
                          {pass.expectedTime}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Ngày: {format(new Date(pass.visitDate), 'dd/MM/yyyy', { locale: vi })}
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-muted/30 border border-border/60">
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1.5">
                          <Car className="h-4 w-4 text-indigo-500" />
                          <span className="font-semibold">Phương tiện & Biển số</span>
                        </div>
                        <div className="text-base font-bold font-mono text-foreground">
                          {pass.licensePlate || 'Đi bộ / Taxi'}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {pass.licensePlate ? 'Yêu cầu hướng dẫn đỗ xe' : 'Không giữ xe'}
                        </div>
                      </div>
                    </div>

                    {/* Note if any */}
                    {pass.note && (
                      <div className="p-3 rounded-xl bg-muted/20 border border-border/50 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">Ghi chú từ cư dân: </span>
                        {pass.note}
                      </div>
                    )}

                    {/* Check In / Out Timestamps if applicable */}
                    {(pass.checkInAt || pass.checkOutAt) && (
                      <div className="p-4 rounded-xl bg-muted/40 border border-border flex flex-wrap items-center justify-between gap-4 text-xs">
                        {pass.checkInAt && (
                          <div>
                            <span className="text-muted-foreground block">Thời gian vào tòa nhà:</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              {format(new Date(pass.checkInAt), 'HH:mm:ss - dd/MM/yyyy')}
                            </span>
                          </div>
                        )}
                        {pass.checkOutAt && (
                          <div>
                            <span className="text-muted-foreground block">Thời gian rời tòa nhà:</span>
                            <span className="font-bold text-blue-600 dark:text-blue-400">
                              {format(new Date(pass.checkOutAt), 'HH:mm:ss - dd/MM/yyyy')}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Security Action Buttons */}
                    <div className="pt-2 border-t border-border flex flex-wrap gap-4 items-center justify-end">
                      {scanResult.canCheckIn && (
                        <Button
                          size="lg"
                          disabled={checkInMutation.isPending}
                          onClick={handleCheckIn}
                          className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 px-8 py-6 text-base rounded-xl shadow-lg"
                        >
                          {checkInMutation.isPending ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin" />
                              <span>Đang xử lý...</span>
                            </>
                          ) : (
                            <>
                              <LogIn className="h-5 w-5" />
                              <span>[CHECK IN] CHO KHÁCH VÀO</span>
                            </>
                          )}
                        </Button>
                      )}

                      {scanResult.canCheckOut && (
                        <Button
                          size="lg"
                          disabled={checkOutMutation.isPending}
                          onClick={handleCheckOut}
                          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 px-8 py-6 text-base rounded-xl shadow-lg"
                        >
                          {checkOutMutation.isPending ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin" />
                              <span>Đang xử lý...</span>
                            </>
                          ) : (
                            <>
                              <LogOut className="h-5 w-5" />
                              <span>[CHECK OUT] KHÁCH RỜI ĐI</span>
                            </>
                          )}
                        </Button>
                      )}

                      {pass.status === 'CHECKED_OUT' && (
                        <div className="w-full p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center text-xs font-semibold text-blue-600 dark:text-blue-400">
                          Khách đã hoàn tất chuyến thăm và đã rời khỏi tòa nhà.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border bg-card/40">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 mb-4">
                <QrCode className="h-8 w-8" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                Sẵn sàng quét mã QR Thẻ khách
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1.5">
                Hướng camera vào mã QR trên điện thoại của khách, hoặc nhập mã thẻ (VD: VP-2026-0001) để hiển thị thông tin và thực hiện Check-in / Check-out.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
