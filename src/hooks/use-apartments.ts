import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apartmentClientService } from '@/services/apartment.service';
import {
  ApartmentFilter,
  CreateApartmentDto,
  UpdateApartmentDto,
  CreateApartmentHistoryDto,
  CreateBuildingDto,
  UpdateBuildingDto,
  CreateBlockDto,
  UpdateBlockDto,
  CreateFloorDto,
  UpdateFloorDto,
} from '@/modules/apartment/apartment.types';
import { toast } from 'sonner';

// ==========================================
// APARTMENT HOOKS
// ==========================================

export function useApartments(filter: ApartmentFilter = {}) {
  return useQuery({
    queryKey: ['apartments', filter],
    queryFn: () => apartmentClientService.getApartments(filter),
  });
}

export function useApartment(id: string) {
  return useQuery({
    queryKey: ['apartment', id],
    queryFn: () => apartmentClientService.getApartmentById(id),
    enabled: !!id,
  });
}

export function useApartmentHierarchy(buildingId?: string) {
  return useQuery({
    queryKey: ['apartment-hierarchy', buildingId],
    queryFn: () => apartmentClientService.getHierarchy(buildingId),
  });
}

export function useApartmentHistory(apartmentId: string) {
  return useQuery({
    queryKey: ['apartment-history', apartmentId],
    queryFn: () => apartmentClientService.getHistory(apartmentId),
    enabled: !!apartmentId,
  });
}

export function useCreateApartmentHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      apartmentId,
      data,
    }: {
      apartmentId: string;
      data: CreateApartmentHistoryDto;
    }) => apartmentClientService.createHistory(apartmentId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['apartment-history', variables.apartmentId] });
      queryClient.invalidateQueries({ queryKey: ['apartments'] });
      queryClient.invalidateQueries({ queryKey: ['apartment', variables.apartmentId] });
      toast.success('Ghi nhận sự kiện lịch sử căn hộ thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Ghi nhận lịch sử thất bại!');
    },
  });
}

export function useCreateApartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateApartmentDto) => apartmentClientService.createApartment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apartments'] });
      queryClient.invalidateQueries({ queryKey: ['apartment-hierarchy'] });
      queryClient.invalidateQueries({ queryKey: ['floors'] });
      queryClient.invalidateQueries({ queryKey: ['blocks'] });
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      toast.success('Thêm căn hộ mới thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Thêm căn hộ thất bại!');
    },
  });
}

export function useUpdateApartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateApartmentDto }) =>
      apartmentClientService.updateApartment(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['apartments'] });
      queryClient.invalidateQueries({ queryKey: ['apartment', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['apartment-history', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['apartment-hierarchy'] });
      toast.success('Cập nhật thông tin căn hộ thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Cập nhật thất bại!');
    },
  });
}

export function useDeleteApartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apartmentClientService.deleteApartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apartments'] });
      queryClient.invalidateQueries({ queryKey: ['apartment-hierarchy'] });
      queryClient.invalidateQueries({ queryKey: ['floors'] });
      queryClient.invalidateQueries({ queryKey: ['blocks'] });
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      toast.success('Xóa căn hộ thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Xóa căn hộ thất bại!');
    },
  });
}

export function useBootstrapHierarchy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apartmentClientService.bootstrapHierarchy(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apartment-hierarchy'] });
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      queryClient.invalidateQueries({ queryKey: ['blocks'] });
      queryClient.invalidateQueries({ queryKey: ['floors'] });
      queryClient.invalidateQueries({ queryKey: ['apartments'] });
      toast.success('Đồng bộ cấu trúc phân cấp thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Đồng bộ cấu trúc thất bại!');
    },
  });
}

// ==========================================
// BUILDING HOOKS
// ==========================================

export function useBuildings() {
  return useQuery({
    queryKey: ['buildings'],
    queryFn: () => apartmentClientService.getBuildings(false),
  });
}

export function useBuilding(id: string) {
  return useQuery({
    queryKey: ['building', id],
    queryFn: () => apartmentClientService.getBuildingById(id),
    enabled: !!id,
  });
}

export function useCreateBuilding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBuildingDto) => apartmentClientService.createBuilding(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      queryClient.invalidateQueries({ queryKey: ['apartment-hierarchy'] });
      toast.success('Thêm tòa nhà mới thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Thêm tòa nhà thất bại!');
    },
  });
}

export function useUpdateBuilding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBuildingDto }) =>
      apartmentClientService.updateBuilding(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      queryClient.invalidateQueries({ queryKey: ['building', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['apartment-hierarchy'] });
      toast.success('Cập nhật tòa nhà thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Cập nhật tòa nhà thất bại!');
    },
  });
}

export function useDeleteBuilding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apartmentClientService.deleteBuilding(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      queryClient.invalidateQueries({ queryKey: ['apartment-hierarchy'] });
      toast.success('Xóa tòa nhà thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Xóa tòa nhà thất bại!');
    },
  });
}

// ==========================================
// BLOCK HOOKS
// ==========================================

export function useBlocks(buildingId?: string) {
  return useQuery({
    queryKey: ['blocks', buildingId],
    queryFn: () => apartmentClientService.getBlocks(buildingId),
  });
}

export function useBlock(id: string) {
  return useQuery({
    queryKey: ['block', id],
    queryFn: () => apartmentClientService.getBlockById(id),
    enabled: !!id,
  });
}

export function useCreateBlock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBlockDto) => apartmentClientService.createBlock(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocks'] });
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      queryClient.invalidateQueries({ queryKey: ['apartment-hierarchy'] });
      toast.success('Thêm khối tháp thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Thêm khối tháp thất bại!');
    },
  });
}

export function useUpdateBlock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBlockDto }) =>
      apartmentClientService.updateBlock(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['blocks'] });
      queryClient.invalidateQueries({ queryKey: ['block', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      queryClient.invalidateQueries({ queryKey: ['apartment-hierarchy'] });
      toast.success('Cập nhật khối tháp thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Cập nhật khối tháp thất bại!');
    },
  });
}

export function useDeleteBlock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apartmentClientService.deleteBlock(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocks'] });
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      queryClient.invalidateQueries({ queryKey: ['apartment-hierarchy'] });
      toast.success('Xóa khối tháp thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Xóa khối tháp thất bại!');
    },
  });
}

// ==========================================
// FLOOR HOOKS
// ==========================================

export function useFloors(blockId?: string) {
  return useQuery({
    queryKey: ['floors', blockId],
    queryFn: () => apartmentClientService.getFloors(blockId),
  });
}

export function useFloor(id: string) {
  return useQuery({
    queryKey: ['floor', id],
    queryFn: () => apartmentClientService.getFloorById(id),
    enabled: !!id,
  });
}

export function useCreateFloor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFloorDto) => apartmentClientService.createFloor(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floors'] });
      queryClient.invalidateQueries({ queryKey: ['blocks'] });
      queryClient.invalidateQueries({ queryKey: ['apartment-hierarchy'] });
      toast.success('Thêm tầng lầu thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Thêm tầng lầu thất bại!');
    },
  });
}

export function useUpdateFloor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFloorDto }) =>
      apartmentClientService.updateFloor(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['floors'] });
      queryClient.invalidateQueries({ queryKey: ['floor', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['blocks'] });
      queryClient.invalidateQueries({ queryKey: ['apartment-hierarchy'] });
      toast.success('Cập nhật tầng lầu thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Cập nhật tầng lầu thất bại!');
    },
  });
}

export function useDeleteFloor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apartmentClientService.deleteFloor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floors'] });
      queryClient.invalidateQueries({ queryKey: ['blocks'] });
      queryClient.invalidateQueries({ queryKey: ['apartment-hierarchy'] });
      toast.success('Xóa tầng lầu thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Xóa tầng lầu thất bại!');
    },
  });
}

