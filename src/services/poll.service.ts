import { apiClient } from '@/lib/api-client';
import {
  PollFilter,
  CreatePollDto,
  UpdatePollDto,
  VotePollDto,
} from '@/modules/poll/poll.types';

export const pollClientService = {
  async getPolls(filter: PollFilter = {}) {
    return apiClient('/polls', { params: filter as any });
  },

  async getPollById(id: string) {
    return apiClient(`/polls/${id}`);
  },

  async createPoll(data: CreatePollDto) {
    return apiClient('/polls', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updatePoll(id: string, data: UpdatePollDto) {
    return apiClient(`/polls/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async vote(pollId: string, data: VotePollDto) {
    return apiClient(`/polls/${pollId}/vote`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getResults(pollId: string) {
    return apiClient(`/polls/${pollId}/results`);
  },
};
