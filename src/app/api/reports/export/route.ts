import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { reportService } from '@/modules/report/report.service';
import { reportExportService } from '@/modules/report/report-export.service';
import { z } from 'zod';

const exportSchema = z.object({
  format: z.enum(['csv', 'xlsx', 'pdf']),
  filter: z.object({
    type: z.string(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    building: z.string().optional(),
    floor: z.number().optional(),
    status: z.string().optional(),
    category: z.string().optional(),
    search: z.string().optional(),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const allowedRoles = ['ADMIN', 'MANAGER'];
    if (!allowedRoles.includes(session.user.role as string)) {
      return NextResponse.json(
        { success: false, error: 'Chỉ Ban Quản Lý mới có quyền xuất báo cáo' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validated = exportSchema.parse(body);

    const reportData = await reportService.getReportData({
      type: validated.filter.type as any,
      startDate: validated.filter.startDate,
      endDate: validated.filter.endDate,
      building: validated.filter.building,
      floor: validated.filter.floor,
      status: validated.filter.status,
      category: validated.filter.category,
      search: validated.filter.search,
      page: 1,
      limit: 1000, // Export large batch
    });

    let result;
    if (validated.format === 'csv') {
      result = reportExportService.exportToCSV(reportData);
    } else if (validated.format === 'xlsx') {
      result = reportExportService.exportToExcel(reportData);
    } else {
      result = reportExportService.exportToPDF(reportData);
    }

    // Log export audit
    await reportExportService.logExport(validated.filter.type, validated.format, {
      id: session.user.id,
      email: session.user.email || undefined,
      role: session.user.role as string,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ success: false, error: error.errors[0]?.message || 'Dữ liệu không hợp lệ' }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
