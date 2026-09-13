'use client';

import React, { useState } from 'react';
import { Package, Clock, CheckCircle2, QrCode, MapPin, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function ResidentParcelsPage() {
    const [parcels] = useState([
        {
            id: '1',
            trackingCode: 'SPX-VN-8839219',
            carrier: 'Shopee Express',
            receivedAt: 'Hôm nay - 14:15',
            location: 'Kệ A - Vị trí số 14',
            status: 'Chờ nhận tại lễ tân',
            isWaiting: true,
        },
        {
            id: '2',
            trackingCode: 'VTP-HN-0091823',
            carrier: 'Viettel Post',
            receivedAt: 'Hôm qua - 10:20',
            location: 'Đã nhận tại sảnh lễ tân',
            receivedDate: '12/09/2026 18:30',
            status: 'Đã nhận hàng',
            isWaiting: false,
        },
    ]);

    return (
        <div className="space-y-6 pb-12">
            <PageHeader
                title="Bưu kiện của căn hộ (My Parcels)"
                description="Theo dõi bưu phẩm, đơn hàng gửi đến căn hộ đang được lưu giữ tại quầy lễ tân sảnh tòa nhà."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {parcels.map((p) => (
                    <Card key={p.id} className="border-border/80 relative overflow-hidden">
                        <div className={`h-1.5 w-full ${p.isWaiting ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div>
                                    <Badge variant="outline" className="text-xs mb-1 bg-muted/40">
                                        {p.carrier}
                                    </Badge>
                                    <CardTitle className="text-base font-bold font-mono">{p.trackingCode}</CardTitle>
                                    <CardDescription className="text-xs">Tiếp nhận lúc: {p.receivedAt}</CardDescription>
                                </div>
                                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${p.isWaiting ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                                    {p.status}
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2 text-xs">
                            <div className="p-3 bg-muted/30 rounded-xl space-y-1.5 border border-border/50">
                                <div className="flex items-center gap-2 text-foreground font-medium">
                                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                                    <span>Vị trí lưu kho sảnh: <strong className="text-primary">{p.location}</strong></span>
                                </div>
                                {p.isWaiting ? (
                                    <p className="text-muted-foreground pt-1 border-t border-border/40">
                                        Vui lòng xuất trình mã căn hộ <strong className="text-foreground">A.1204</strong> hoặc mã bưu kiện cho lễ tân để nhận hàng.
                                    </p>
                                ) : (
                                    <p className="text-muted-foreground pt-1 border-t border-border/40">
                                        Đã nhận thành công vào lúc: {p.receivedDate}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                        {p.isWaiting && (
                            <CardFooter className="pt-2">
                                <Button className="w-full gap-2 text-xs" onClick={() => toast.success('Mã nhận bưu kiện đã được hiển thị để quét')}>
                                    <QrCode className="h-3.5 w-3.5" /> Mã QR nhận bưu kiện nhanh
                                </Button>
                            </CardFooter>
                        )}
                    </Card>
                ))}
            </div>
        </div>
    );
}
