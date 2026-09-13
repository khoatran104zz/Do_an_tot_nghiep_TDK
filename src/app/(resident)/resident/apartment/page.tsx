'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { Home, Layers, CheckCircle2, Shield, Wrench, KeyRound, Sparkles, MapPin, Maximize2, User } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function MyApartmentPage() {
    const { data: session } = useSession();
    const user = session?.user;

    return (
        <div className="space-y-6 pb-12">
            <PageHeader
                title="Căn hộ của tôi (My Apartment)"
                description="Thông tin chi tiết căn hộ, hợp đồng sở hữu/thuê và danh mục thiết bị bàn giao."
            />

            {/* Top Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-blue-500 uppercase tracking-wider">Căn hộ</span>
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                                Đang cư trú
                            </Badge>
                        </div>
                        <CardTitle className="text-2xl font-bold mt-1">Căn hộ A.1204</CardTitle>
                        <CardDescription className="flex items-center gap-1.5 text-xs">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                            Tầng 12 - Tháp Landmark A
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm pt-2">
                        <div className="flex justify-between py-1 border-b border-muted">
                            <span className="text-muted-foreground">Diện tích thông thủy:</span>
                            <span className="font-medium">85.5 m²</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-muted">
                            <span className="text-muted-foreground">Phòng ngủ / Vệ sinh:</span>
                            <span className="font-medium">2 PN / 2 WC</span>
                        </div>
                        <div className="flex justify-between py-1">
                            <span className="text-muted-foreground">Hướng ban công:</span>
                            <span className="font-medium">Đông Nam (View Công viên)</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">Hợp đồng & Pháp lý</span>
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                Hợp lệ
                            </Badge>
                        </div>
                        <CardTitle className="text-2xl font-bold mt-1">HĐ-CH-2024-88</CardTitle>
                        <CardDescription className="text-xs">Hợp đồng mua bán căn hộ thương mại</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm pt-2">
                        <div className="flex justify-between py-1 border-b border-muted">
                            <span className="text-muted-foreground">Chủ sở hữu:</span>
                            <span className="font-medium">{user?.name || 'Nguyễn Cư Dân'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-muted">
                            <span className="text-muted-foreground">Ngày bàn giao:</span>
                            <span className="font-medium">15/01/2024</span>
                        </div>
                        <div className="flex justify-between py-1">
                            <span className="text-muted-foreground">Thời hạn bảo hành:</span>
                            <span className="font-medium text-emerald-600">Đến 15/01/2029 (5 năm)</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-purple-500 uppercase tracking-wider">Tiện ích gán theo căn</span>
                            <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20">
                                Đã kích hoạt
                            </Badge>
                        </div>
                        <CardTitle className="text-2xl font-bold mt-1">02 Thẻ Cư Dân</CardTitle>
                        <CardDescription className="text-xs">Quyền truy cập sảnh, thang máy & hồ bơi</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm pt-2">
                        <div className="flex justify-between py-1 border-b border-muted">
                            <span className="text-muted-foreground">Chỗ đỗ ô tô định danh:</span>
                            <span className="font-medium text-purple-600">Vị trí B1-A14</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-muted">
                            <span className="text-muted-foreground">Số xe máy đăng ký:</span>
                            <span className="font-medium">2 xe</span>
                        </div>
                        <div className="flex justify-between py-1">
                            <span className="text-muted-foreground">Định mức điện nước:</span>
                            <span className="font-medium">Định mức hộ gia đình</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Equipment Inventory */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Danh mục thiết bị gắn liền căn hộ</CardTitle>
                            <CardDescription>Thiết bị cơ điện, phòng cháy và smart home được bàn giao theo căn</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" className="gap-2">
                            <Wrench className="h-4 w-4" /> Yêu cầu kiểm tra kỹ thuật
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { name: 'Khóa cửa thông minh vân tay', brand: 'Hafele EL9000', status: 'Hoạt động tốt', date: 'Bảo hành 2027' },
                            { name: 'Hệ thống chuông hình Intercom', brand: 'Commax Smart Video', status: 'Hoạt động tốt', date: 'Đang kết nối lễ tân' },
                            { name: 'Điều hòa âm trần Multi', brand: 'Daikin Inverter 24000BTU', status: 'Hoạt động tốt', date: 'Bảo dưỡng định kỳ' },
                            { name: 'Đầu báo khói & vòi Sprinkler', brand: 'Hochiki Chuẩn PCCC', status: 'Kiểm định an toàn', date: 'Test gần nhất: T8/2026' },
                        ].map((item, i) => (
                            <div key={i} className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-2">
                                <p className="font-semibold text-sm">{item.name}</p>
                                <p className="text-xs text-muted-foreground">{item.brand}</p>
                                <div className="flex items-center justify-between text-xs pt-2 border-t border-border/40">
                                    <span className="text-emerald-600 flex items-center gap-1">
                                        <CheckCircle2 className="h-3.5 w-3.5" /> {item.status}
                                    </span>
                                    <span className="text-muted-foreground">{item.date}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
