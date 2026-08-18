import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feeCategoryClientService } from '@/services/fee.service';
import { CreateFeeCategoryDto, UpdateFeeCategoryDto } from '@/modules/fee/fee.types';
import { toast } from 'sonner';

export function useFeeCategories() {
  return useQuery({
    queryKey: ['fees'],
    queryFn: () => feeCategoryClientService.getFeeCategories(),
  });
}

export function useCreateFeeCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFeeCategoryDto) => feeCategoryClientService.createFeeCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees'] });
      toast.success('Thêm danh mục phí thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Thêm danh mục phí thất bại!');
    },
  });
}

export function useUpdateFeeCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFeeCategoryDto }) =>
      feeCategoryClientService.updateFeeCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees'] });
      toast.success('Cập nhật danh mục phí thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Cập nhật thất bại!');
    },
  });
}

export function useDeleteFeeCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => feeCategoryClientService.deleteFeeCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees'] });
      toast.success('Xóa danh mục phí thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Xóa thất bại!');
    },
  });
}
