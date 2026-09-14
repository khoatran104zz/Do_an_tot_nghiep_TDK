import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pollClientService } from '@/services/poll.service';
import {
  PollFilter,
  CreatePollDto,
  UpdatePollDto,
  VotePollDto,
} from '@/modules/poll/poll.types';
import { toast } from 'sonner';

export function usePolls(filter: PollFilter = {}) {
  return useQuery({
    queryKey: ['polls', filter],
    queryFn: () => pollClientService.getPolls(filter),
  });
}

export function usePoll(id?: string) {
  return useQuery({
    queryKey: ['poll', id],
    queryFn: () => pollClientService.getPollById(id!),
    enabled: Boolean(id),
  });
}

export function usePollResults(id?: string) {
  return useQuery({
    queryKey: ['poll-results', id],
    queryFn: () => pollClientService.getResults(id!),
    enabled: Boolean(id),
    refetchInterval: 10000,
  });
}

export function useCreatePoll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePollDto) => pollClientService.createPoll(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls'] });
      toast.success('Tạo và công bố khảo sát thành công');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Tạo khảo sát thất bại');
    },
  });
}

export function useUpdatePoll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePollDto }) =>
      pollClientService.updatePoll(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls'] });
      toast.success('Cập nhật khảo sát thành công');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Cập nhật khảo sát thất bại');
    },
  });
}

export function useVotePoll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pollId, data }: { pollId: string; data: VotePollDto }) =>
      pollClientService.vote(pollId, data),
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['polls'] });
      queryClient.invalidateQueries({ queryKey: ['poll', variables.pollId] });
      queryClient.invalidateQueries({ queryKey: ['poll-results', variables.pollId] });
      toast.success('Biểu quyết của căn hộ đã được ghi nhận');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Biểu quyết thất bại');
    },
  });
}
