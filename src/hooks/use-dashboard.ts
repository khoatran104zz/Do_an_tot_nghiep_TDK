import { useQuery } from '@tanstack/react-query';
import { dashboardClientService } from '@/services/dashboard.service';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardClientService.getDashboardStats(),
  });
}
