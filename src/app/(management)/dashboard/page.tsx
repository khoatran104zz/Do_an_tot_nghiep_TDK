'use client';

import React from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Building2, Users, Receipt, MessageSquareWarning, ArrowUpRight, TrendingUp } from 'lucide-react';
import { useDashboardStats } from '@/hooks/use-dashboard';
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
} from 'recharts';
import { formatCurrency } from '@/lib/utils';

export default function DashboardPage() {
  const { data: response, isLoading } = useDashboardStats();
  const stats = response?.data;

  const overview = stats?.overview || {
    totalApartments: 0,
    occupiedApartments: 0,
    occupancyRate: 0,
    totalResidents: 0,
    activeContracts: 0,
    collectionRate: 0,
    pendingTickets: 0,
  };

  const revenueTrend = stats?.charts?.revenueTrend || [];
  const apartmentStatusChart = stats?.charts?.apartmentStatusChart || [];
  const ticketCategoryChart = stats?.charts?.ticketCategoryChart || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tổng quan Vận hành Tòa nhà"
        description="Báo cáo thống kê căn hộ, tỷ lệ lấp đầy, doanh thu phí dịch vụ và tiến độ xử lý sự cố."
      />

      {/* 4 Primary Key Performance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tổng Căn hộ & Lấp đầy"
          value={`${overview.occupiedApartments}/${overview.totalApartments}`}
          description={`Tỷ lệ lấp đầy đạt ${overview.occupancyRate}%`}
          icon={Building2}
          trend={{ value: 5.2, isPositive: true }}
          iconBgColor="bg-blue-50"
          iconTextColor="text-blue-600"
        />
        <StatCard
          title="Tổng Cư dân đang ở"
          value={`${overview.totalResidents} Cư dân`}
          description={`${overview.activeContracts} Hợp đồng còn hiệu lực`}
          icon={Users}
          trend={{ value: 3.1, isPositive: true }}
          iconBgColor="bg-emerald-50"
          iconTextColor="text-emerald-600"
        />
        <StatCard
          title="Tỷ lệ Thu phí đúng hạn"
          value={`${overview.collectionRate}%`}
          description="Doanh thu phí quản lý & gửi xe"
          icon={Receipt}
          trend={{ value: 2.4, isPositive: true }}
          iconBgColor="bg-indigo-50"
          iconTextColor="text-indigo-600"
        />
        <StatCard
          title="Sự cố chờ xử lý"
          value={`${overview.pendingTickets} Yêu cầu`}
          description="Đang được kỹ thuật hỗ trợ"
          icon={MessageSquareWarning}
          iconBgColor="bg-amber-50"
          iconTextColor="text-amber-600"
        />
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Trend Bar Chart */}
        <Card className="lg:col-span-2 border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-bold text-slate-800">
                Biểu đồ Doanh thu & Phí dịch vụ (6 tháng gần nhất)
              </CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                So sánh doanh thu dự kiến và số tiền đã thực thu
              </p>
            </div>
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueTrend} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => `${val / 1000000}M`}
                  />
                  <Tooltip
                    formatter={(value: any) => [formatCurrency(Number(value)), '']}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', borderColor: '#e2e8f0' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="revenue" name="Doanh thu phát hành" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="collected" name="Thực thu" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Apartment Status Distribution Pie Chart */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-slate-800">
              Trạng thái Căn hộ Tòa nhà
            </CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">Phân bổ căn hộ theo trạng thái ở</p>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-60 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={apartmentStatusChart}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {apartmentStatusChart.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => [`${val} Căn hộ`, '']} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Incident Categories & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incident Categories Breakdown */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800">
              Thống kê Phản ánh sự cố theo Phân loại
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={ticketCategoryChart} margin={{ left: 20, right: 20 }}>
                  <XAxis type="number" stroke="#64748b" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="value" name="Số lượng phản ánh" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Operational Highlights */}
        <Card className="border-slate-200 bg-linear-to-br from-blue-50/50 to-indigo-50/30">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800">
              Thông tin Vận hành nổi bật
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs text-slate-700">
            <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 text-sm">Hợp đồng hết hạn tháng này</p>
                <p className="text-slate-500">2 Hợp đồng thuê sắp đến hạn gia hạn</p>
              </div>
              <span className="font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md text-xs">
                Cần xử lý
              </span>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 text-sm">Thời gian xử lý sự cố trung bình</p>
                <p className="text-slate-500">Hoàn thành hỗ trợ trong 3.5 giờ</p>
              </div>
              <span className="font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md text-xs">
                Tốt
              </span>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 text-sm">Đánh giá độ hài lòng cư dân</p>
                <p className="text-slate-500">Đạt 4.8 / 5.0 điểm trung bình</p>
              </div>
              <span className="font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md text-xs">
                4.8 ★
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
