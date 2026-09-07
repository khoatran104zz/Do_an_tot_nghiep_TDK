import { useQuery } from '@tanstack/react-query';
import { dashboardClientService } from '@/services/dashboard.service';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardClientService.getDashboardStats(),
  });
}

export function useManagementDashboard(months: number = 6) {
  return useQuery({
    queryKey: ['management-dashboard', months],
    queryFn: () => dashboardClientService.getManagementDashboard(months),
    staleTime: 30 * 1000, // 30 seconds fresh
    refetchOnWindowFocus: true,
  });
}
