import { NextRequest } from 'next/server';
import { smartAlertService } from '@/modules/smart-operations/smart-alert.service';
import { smartInsightService } from '@/modules/smart-operations/smart-insight.service';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-response';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { searchParams } = new URL(req.url);
    const severity = searchParams.get('severity') || undefined;
    const entityType = searchParams.get('entityType') || undefined;
    const refresh = searchParams.get('refresh') === 'true';

    const [allAlerts, top5Today, counts, insights] = await Promise.all([
      smartAlertService.getSmartAlerts(refresh),
      smartAlertService.getTop5Today(),
      smartAlertService.getCounts(),
      smartInsightService.getManagementInsights(),
    ]);

    let filtered = allAlerts;
    if (severity) {
      filtered = filtered.filter((a) => a.severity === severity.toUpperCase());
    }
    if (entityType) {
      filtered = filtered.filter((a) => a.entityType === entityType.toUpperCase());
    }

    return apiSuccess(
      {
        alerts: filtered,
        top5Today,
        counts,
        insights,
      },
      'Lấy danh sách cảnh báo vận hành thông minh thành công'
    );
  } catch (error: any) {
    return apiError(error.message || 'Lỗi kiểm tra cảnh báo', 'ALERTS_ERROR', 500);
  }
}
