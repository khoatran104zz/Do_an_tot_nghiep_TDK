import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { reportService } from '@/modules/report/report.service';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const allowedRoles = ['ADMIN', 'MANAGER'];
    if (!allowedRoles.includes(session.user.role as string)) {
      return NextResponse.json(
        { success: false, error: 'Chỉ Ban Quản Lý mới có quyền truy cập báo cáo' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') as any;
    if (!type) {
      return NextResponse.json({ success: false, error: 'Vui lòng chọn loại báo cáo' }, { status: 400 });
    }

    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const building = searchParams.get('building') || undefined;
    const floorStr = searchParams.get('floor');
    const floor = floorStr ? parseInt(floorStr, 10) : undefined;
    const status = searchParams.get('status') || undefined;
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const data = await reportService.getReportData({
      type,
      startDate,
      endDate,
      building,
      floor,
      status,
      category,
      search,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
