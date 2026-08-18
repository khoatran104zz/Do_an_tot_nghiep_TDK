import { apiClient } from '@/lib/api-client';
import { FeedbackFilter, CreateFeedbackDto, RespondFeedbackDto, RateFeedbackDto } from '@/modules/feedback/feedback.types';

export const feedbackClientService = {
  async getFeedbacks(filter: FeedbackFilter = {}) {
    return apiClient('/feedbacks', { params: filter as any });
  },

  async getFeedbackById(id: string) {
    return apiClient(`/feedbacks/${id}`);
  },

  async createFeedback(data: CreateFeedbackDto) {
    return apiClient('/feedbacks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async respondFeedback(id: string, data: RespondFeedbackDto) {
    return apiClient(`/feedbacks/${id}/respond`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async rateFeedback(id: string, data: RateFeedbackDto) {
    return apiClient(`/feedbacks/${id}/rate`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteFeedback(id: string) {
    return apiClient(`/feedbacks/${id}`, {
      method: 'DELETE',
    });
  },
};
