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
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useAdminDashboard() {
  return useQuery({
    queryKey: ['admin-platform-dashboard'],
    queryFn: () => dashboardClientService.getAdminDashboard(),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useManagerScopedDashboard(buildingId?: string | null) {
  return useQuery({
    queryKey: ['manager-scoped-dashboard', buildingId],
    queryFn: () => dashboardClientService.getManagerScopedDashboard(buildingId || undefined),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
}
