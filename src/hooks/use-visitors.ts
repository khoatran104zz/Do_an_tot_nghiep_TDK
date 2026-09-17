import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { visitorClientService } from '@/services/visitor.service';
import {
  VisitorFilter,
  CreateVisitorPassDto,
  ScanVisitorDto,
} from '@/modules/visitor/visitor.types';
import { toast } from 'sonner';

export function useVisitorPasses(filter: VisitorFilter = {}) {
  return useQuery({
    queryKey: ['visitors', filter],
    queryFn: () => visitorClientService.getVisitorPasses(filter),
  });
}

export function useVisitorStats(buildingId?: string) {
  return useQuery({
    queryKey: ['visitor-stats', buildingId],
    queryFn: () => visitorClientService.getVisitorStats(buildingId),
  });
}

export function useVisitorPass(id?: string) {
  return useQuery({
    queryKey: ['visitor-pass', id],
    queryFn: () => visitorClientService.getVisitorPassById(id!),
    enabled: !!id,
  });
}

export function useCreateVisitorPass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateVisitorPassDto) => visitorClientService.createVisitorPass(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      queryClient.invalidateQueries({ queryKey: ['visitor-stats'] });
      toast.success('Đăng ký khách đến thăm thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Đăng ký khách thất bại!');
    },
  });
}

export function useScanVisitor() {
  return useMutation({
    mutationFn: (data: ScanVisitorDto) => visitorClientService.scanAndValidate(data),
  });
}

export function useCheckInVisitor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => visitorClientService.checkIn(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      queryClient.invalidateQueries({ queryKey: ['visitor-stats'] });
      toast.success('Check-in khách thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Check-in thất bại!');
    },
  });
}

export function useCheckOutVisitor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => visitorClientService.checkOut(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      queryClient.invalidateQueries({ queryKey: ['visitor-stats'] });
      toast.success('Check-out khách thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Check-out thất bại!');
    },
  });
}

export function useCancelVisitorPass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => visitorClientService.cancelVisitorPass(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      queryClient.invalidateQueries({ queryKey: ['visitor-stats'] });
      toast.success('Đã hủy thẻ khách thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Hủy thẻ khách thất bại!');
    },
  });
}
