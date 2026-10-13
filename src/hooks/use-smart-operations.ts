import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { smartOperationsClientService } from '@/services/smart-operations.service';
import { SmartAlertFilter } from '@/modules/smart-operations/smart-operations.types';
import { toast } from 'sonner';

export function useSmartAlerts(filter: SmartAlertFilter = {}) {
  return useQuery({
    queryKey: ['smart-alerts', filter],
    queryFn: () => smartOperationsClientService.getAlerts(filter),
    refetchInterval: 15000,
  });
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => smartOperationsClientService.acknowledgeAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart-alerts'] });
      toast.success('Đã tiếp nhận cảnh báo');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Không thể tiếp nhận cảnh báo');
    },
  });
}

export function useResolveAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => smartOperationsClientService.resolveAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart-alerts'] });
      toast.success('Đã hoàn tất xử lý cảnh báo');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Không thể giải quyết cảnh báo');
    },
  });
}

export function useSmartInsights() {
  return useQuery({
    queryKey: ['smart-insights'],
    queryFn: async () => {
      const res = await fetch('/api/alerts/insights');
      if (!res.ok) return { data: null };
      return res.json();
    },
    staleTime: 60 * 1000,
  });
}
