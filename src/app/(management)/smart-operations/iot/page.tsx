'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Thermometer,
  Flame,
  Droplets,
  AlertTriangle,
  Gauge,
  Zap,
  ArrowUpDown,
  RotateCcw,
  Radio,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Play,
  Activity,
  Layers,
} from 'lucide-react';
import { useIoTSensors, useTriggerSimulation } from '@/hooks/use-smart-operations';
import { formatDateTime, cn } from '@/lib/utils';

export default function IoTSensorsPage() {
  const { data: response, isLoading } = useIoTSensors();
  const triggerMutation = useTriggerSimulation();

  const [selectedSensor, setSelectedSensor] = useState<any | null>(null);
  const [simulationLogs, setSimulationLogs] = useState<Array<{ time: string; text: string; type: string }>>([]);

  const sensors = response?.data || [];

  const addLog = (text: string, type: 'danger' | 'warning' | 'info' | 'success') => {
    const time = new Date().toLocaleTimeString('vi-VN');
    setSimulationLogs((prev) => [{ time, text, type }, ...prev.slice(0, 9)]);
  };

  const handleSimulate = async (scenario: 'WATER_LEAKAGE' | 'SMOKE' | 'ELEVATOR' | 'HIGH_TEMP' | 'RESET') => {
    try {
      const res = await triggerMutation.mutateAsync(scenario);
      const data = res?.data;

      if (scenario === 'WATER_LEAKAGE') {
        addLog('Phát hiện rò rỉ nước tại Hộp kỹ thuật Tầng 12 (Sensor: LEAK-F12)', 'danger');
        addLog(`Đã khởi tạo cảnh báo khẩn cấp: ${data?.alert?.title || 'Cảnh báo rò rỉ'}`, 'danger');
        if (data?.ticket) {
          addLog(`Tự động tạo phiếu sửa chữa khẩn cấp [${data.ticket.code}]`, 'warning');
        }
        if (data?.technician) {
          addLog(`Phân công xử lý hiện trường cho: ${data.technician.name}`, 'info');
        }
        addLog('Đã phát tín hiệu cảnh báo thời gian thực toàn hệ thống', 'success');
      } else if (scenario === 'SMOKE') {
        addLog('Phát hiện nồng độ khói 185 ppm tại Tầng 12 Tháp A (Vượt ngưỡng)', 'danger');
        addLog('Đã kích hoạt Smart Alert khẩn cấp PCCC & gửi thông báo Ban Quản Lý', 'danger');
      } else if (scenario === 'ELEVATOR') {
        addLog('Cabin thang máy A01 mất tín hiệu kết nối (Trạng thái: OFFLINE)', 'warning');
        addLog('Khởi tạo phiếu kỹ thuật thang máy & thông báo kỹ thuật viên', 'info');
      } else if (scenario === 'HIGH_TEMP') {
        addLog('Nhiệt độ hành lang Tầng 12 vượt 58°C - Ngưỡng an toàn bị vi phạm', 'warning');
      } else if (scenario === 'RESET') {
        addLog('Toàn bộ 7 nhóm cảm biến đã được khôi phục về trạng thái bình thường (NORMAL)', 'success');
      }
    } catch {
      addLog('Lỗi trong quá trình kích hoạt mô phỏng', 'danger');
    }
  };

  const getSensorIcon = (type: string) => {
    switch (type) {
      case 'TEMPERATURE':
        return <Thermometer className="h-6 w-6 text-amber-500" />;
      case 'SMOKE':
        return <Flame className="h-6 w-6 text-rose-500" />;
      case 'WATER_LEVEL':
        return <Droplets className="h-6 w-6 text-cyan-500" />;
      case 'WATER_LEAKAGE':
        return <AlertTriangle className="h-6 w-6 text-blue-500" />;
      case 'PUMP_PRESSURE':
        return <Gauge className="h-6 w-6 text-indigo-500" />;
      case 'POWER':
        return <Zap className="h-6 w-6 text-emerald-500" />;
      case 'ELEVATOR':
        return <ArrowUpDown className="h-6 w-6 text-purple-500" />;
      default:
        return <Radio className="h-6 w-6 text-slate-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CRITICAL':
        return <Badge className="bg-rose-500 hover:bg-rose-600 text-white animate-pulse">NGUY CẤP</Badge>;
      case 'WARNING':
        return <Badge className="bg-amber-500 hover:bg-amber-600 text-white">CẢNH BÁO</Badge>;
      case 'OFFLINE':
        return <Badge variant="destructive">MẤT KẾT NỐI</Badge>;
      default:
        return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-300">BÌNH THƯỜNG</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Giám sát Cảm biến IoT & Trung tâm Mô phỏng"
        description="Mạng lưới giám sát cảm biến thông minh: nhiệt độ, khói PCCC, mức nước bể ngầm, rò rỉ nước, áp lực bơm và thang máy."
      />

      {/* Simulation Banner */}
      <div className="rounded-2xl border-2 border-dashed border-amber-300 dark:border-amber-700/60 bg-amber-50/50 dark:bg-amber-950/20 p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping" />
              <h3 className="text-sm font-bold text-amber-950 dark:text-amber-200 uppercase tracking-wide">
                ⚡ Chế độ mô phỏng vận hành thông minh (Simulation Mode)
              </h3>
            </div>
            <p className="text-xs text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
              Khu vực diễn tập tự động hóa sự cố phục vụ đồ án và kiểm thử quy trình: Tự động kích hoạt Smart Alert, tạo phiếu sửa chữa khẩn cấp, phân công kỹ thuật viên và đẩy thông báo Realtime.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleSimulate('WATER_LEAKAGE')}
              disabled={triggerMutation.isPending}
              className="cursor-pointer text-xs"
            >
              <Droplets className="h-3.5 w-3.5 mr-1.5" />
              Mô phỏng Rò rỉ nước T12
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSimulate('SMOKE')}
              disabled={triggerMutation.isPending}
              className="cursor-pointer text-xs border-rose-300 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            >
              <Flame className="h-3.5 w-3.5 mr-1.5" />
              Cảnh báo Khói T12
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSimulate('ELEVATOR')}
              disabled={triggerMutation.isPending}
              className="cursor-pointer text-xs border-purple-300 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30"
            >
              <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" />
              Sự cố Thang máy A01
            </Button>

            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleSimulate('RESET')}
              disabled={triggerMutation.isPending}
              className="cursor-pointer text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Khôi phục bình thường
            </Button>
          </div>
        </div>
      </div>

      {/* Sensor Widgets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-2xl" />
          ))
        ) : (
          sensors.map((sensor: any) => {
            const isCritical = sensor.status === 'CRITICAL';
            const isWarning = sensor.status === 'WARNING';
            const isOffline = sensor.status === 'OFFLINE';

            return (
              <Card
                key={sensor.id}
                onClick={() => setSelectedSensor(sensor)}
                className={cn(
                  'relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md hover:border-blue-400 dark:hover:border-blue-600 group',
                  isCritical && 'border-rose-400 bg-rose-50/20 dark:border-rose-800 dark:bg-rose-950/20 ring-1 ring-rose-400',
                  isWarning && 'border-amber-400 bg-amber-50/15 dark:border-amber-800 dark:bg-amber-950/15',
                  isOffline && 'border-slate-300 dark:border-slate-800 opacity-80'
                )}
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 group-hover:scale-105 transition-transform">
                      {getSensorIcon(sensor.type)}
                    </div>
                    {getStatusBadge(sensor.status)}
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                      {sensor.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {sensor.location}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-baseline justify-between">
                    <div>
                      <span className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                        {sensor.currentValue}
                      </span>
                      {sensor.unit !== 'trạng thái' && sensor.unit !== 'ONLINE' && (
                        <span className="text-xs font-semibold text-slate-500 ml-1">
                          {sensor.unit}
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                      <Clock className="h-3 w-3" />
                      {formatDateTime(sensor.lastUpdated)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Simulation Realtime Event Timeline */}
      {simulationLogs.length > 0 && (
        <Card className="border-slate-200/80 dark:border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              Nhật ký diễn biến sự cố mô phỏng thời gian thực (Simulation Event Timeline)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {simulationLogs.map((log, index) => (
              <div
                key={index}
                className={cn(
                  'p-2.5 rounded-xl text-xs flex items-center justify-between border transition-all animate-in fade-in-50',
                  log.type === 'danger' && 'bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200 border-rose-200',
                  log.type === 'warning' && 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 border-amber-200',
                  log.type === 'info' && 'bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-200 border-blue-200',
                  log.type === 'success' && 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 border-emerald-200'
                )}
              >
                <div className="flex items-center gap-2 font-medium">
                  {log.type === 'danger' && <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />}
                  {log.type === 'warning' && <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />}
                  {log.type === 'info' && <Play className="h-3.5 w-3.5 text-blue-600 shrink-0" />}
                  {log.type === 'success' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                  <span>{log.text}</span>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0 ml-2">{log.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Sensor Detail Modal */}
      <Dialog open={!!selectedSensor} onOpenChange={(open) => !open && setSelectedSensor(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              {selectedSensor && getSensorIcon(selectedSensor.type)}
              {selectedSensor?.name}
            </DialogTitle>
            <DialogDescription>
              Mã thiết bị: <strong className="text-slate-700 dark:text-slate-300">{selectedSensor?.code}</strong>
            </DialogDescription>
          </DialogHeader>

          {selectedSensor && (
            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 block">Vị trí lắp đặt:</span>
                  <strong className="text-slate-800 dark:text-slate-200">{selectedSensor.location}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Trạng thái:</span>
                  {getStatusBadge(selectedSensor.status)}
                </div>
                <div>
                  <span className="text-slate-400 block">Giá trị hiện tại:</span>
                  <strong className="text-lg text-slate-900 dark:text-slate-100">
                    {selectedSensor.currentValue} {selectedSensor.unit !== 'trạng thái' ? selectedSensor.unit : ''}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Ngưỡng cảnh báo:</span>
                  <strong className="text-slate-700 dark:text-slate-300">
                    {selectedSensor.thresholdMin ?? 0} - {selectedSensor.thresholdMax ?? 'Không giới hạn'} {selectedSensor.unit}
                  </strong>
                </div>
              </div>

              <div>
                <h5 className="font-bold text-slate-800 dark:text-slate-200 mb-2">Cảnh báo gần đây:</h5>
                {selectedSensor.alerts && selectedSensor.alerts.length > 0 ? (
                  <div className="space-y-1.5">
                    {selectedSensor.alerts.map((a: any) => (
                      <div key={a.id} className="p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 text-xs">
                        <div className="flex items-center justify-between">
                          <strong className="text-rose-600 dark:text-rose-400">{a.title}</strong>
                          <span className="text-[10px] text-slate-400">{formatDateTime(a.createdAt)}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">{a.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">Không có cảnh báo bất thường trong lịch sử gần nhất.</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
