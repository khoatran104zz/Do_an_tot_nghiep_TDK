'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { AreaOccupancySummary } from '@/modules/parking/parking.types';

export interface ParkingAnalyticsChartProps {
  areas: AreaOccupancySummary[];
  byVehicleType: Record<string, number>;
}

const COLORS = ['#0F6B4F', '#22C55E', '#3B82F6', '#F59E0B', '#64748B'];

export function ParkingAnalyticsChart({
  areas = [],
  byVehicleType = {},
}: ParkingAnalyticsChartProps) {
  // Format data for area capacity chart
  const areaData = areas.map((a) => ({
    name: a.areaCode,
    fullName: a.areaName,
    'Đã đỗ': a.metrics.occupied,
    'Đã đặt': a.metrics.reserved,
    'Còn trống': a.metrics.available,
    'Bảo trì': a.metrics.maintenance,
  }));

  // Format data for vehicle type distribution
  const vehicleTypeLabels: Record<string, string> = {
    CAR: 'Ô tô',
    MOTORBIKE: 'Xe máy',
    EV: 'Xe điện (EV)',
    BICYCLE: 'Xe đạp',
    DISABLED: 'Người khuyết tật',
  };

  const vehicleData = Object.entries(byVehicleType).map(([key, value]) => ({
    name: vehicleTypeLabels[key] || key,
    value,
  }));

  // Simulated peak hour traffic curve
  const hourlyTraffic = [
    { hour: '06:00', 'Lượt vào': 45, 'Lượt ra': 12 },
    { hour: '08:00', 'Lượt vào': 180, 'Lượt ra': 230 },
    { hour: '10:00', 'Lượt vào': 60, 'Lượt ra': 50 },
    { hour: '12:00', 'Lượt vào': 85, 'Lượt ra': 90 },
    { hour: '14:00', 'Lượt vào': 55, 'Lượt ra': 60 },
    { hour: '17:00', 'Lượt vào': 260, 'Lượt ra': 110 },
    { hour: '19:00', 'Lượt vào': 190, 'Lượt ra': 70 },
    { hour: '21:00', 'Lượt vào': 90, 'Lượt ra': 40 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Occupancy Breakdown by Area */}
      <Card className="rounded-2xl shadow-sm border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold">
            Phân Bổ Chỗ Đỗ Theo Từng Khu Vực
          </CardTitle>
          <CardDescription className="text-xs">
            So sánh số chỗ Trống, Đã đỗ và Đã đặt tại các tầng hầm và bãi xe
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[280px]">
          {areaData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
              Chưa có dữ liệu khu vực
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={areaData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" textAnchor="middle" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Còn trống" fill="#22C55E" stackId="a" />
                <Bar dataKey="Đã đỗ" fill="#EF4444" stackId="a" />
                <Bar dataKey="Đã đặt" fill="#F59E0B" stackId="a" />
                <Bar dataKey="Bảo trì" fill="#64748B" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* 2. Vehicle Distribution Donut Chart */}
      <Card className="rounded-2xl shadow-sm border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold">
            Cơ Cấu Phương Tiện Đang Sử Dụng Bãi
          </CardTitle>
          <CardDescription className="text-xs">
            Tỷ lệ giữa Ô tô, Xe máy, Xe điện và các phương tiện khác
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[280px] flex items-center justify-center">
          {vehicleData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
              Chưa có phương tiện đăng ký
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={vehicleData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {vehicleData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* 3. Hourly Flow Traffic Chart */}
      <Card className="rounded-2xl shadow-sm border-border lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold">
            Lưu Lượng Phương Tiện Ra/Vào Trong Ngày (Giờ Cao Điểm)
          </CardTitle>
          <CardDescription className="text-xs">
            Theo dõi mật độ ra vào theo các khung giờ nhằm điều phối nhân sự an ninh
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourlyTraffic} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorEntry" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0F6B4F" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#0F6B4F" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorExit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Area
                type="monotone"
                dataKey="Lượt vào"
                stroke="#0F6B4F"
                fillOpacity={1}
                fill="url(#colorEntry)"
              />
              <Area
                type="monotone"
                dataKey="Lượt ra"
                stroke="#3B82F6"
                fillOpacity={1}
                fill="url(#colorExit)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
