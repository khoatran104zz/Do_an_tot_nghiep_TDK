import { useQuery } from '@tanstack/react-query';
import { smartOperationsClientService } from '@/services/smart-operations.service';

export function useSmartAlerts(params: { severity?: string; entityType?: string; refresh?: boolean } = {}) {
  return useQuery({
    queryKey: ['smart-alerts', params],
    queryFn: () => smartOperationsClientService.getAlerts(params),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000, // Background poll every minute
  });
}

export function useSmartInsights() {
  return useQuery({
    queryKey: ['smart-insights'],
    queryFn: () => smartOperationsClientService.getInsights(),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}
