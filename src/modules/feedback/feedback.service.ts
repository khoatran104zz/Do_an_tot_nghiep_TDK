import { feedbackRepository } from './feedback.repository';
import { FeedbackFilter, CreateFeedbackDto, RespondFeedbackDto, RateFeedbackDto } from './feedback.types';

export class FeedbackService {
  async getFeedbacks(filter: FeedbackFilter) {
    return feedbackRepository.findAll(filter);
  }

  async getFeedbackById(id: string) {
    const item = await feedbackRepository.findById(id);
    if (!item) {
      throw new Error('Không tìm thấy thông tin phản ánh');
    }
    return item;
  }

  async createFeedback(data: CreateFeedbackDto) {
    const code = `FB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    return feedbackRepository.create(data, code);
  }

  async respondFeedback(id: string, dto: RespondFeedbackDto) {
    await this.getFeedbackById(id);
    return feedbackRepository.respond(id, dto);
  }

  async rateFeedback(id: string, dto: RateFeedbackDto) {
    const feedback = await this.getFeedbackById(id);
    if (feedback.status !== 'RESOLVED') {
      throw new Error('Chỉ có thể đánh giá phản ánh đã hoàn thành xử lý');
    }
    return feedbackRepository.rate(id, dto);
  }

  async deleteFeedback(id: string) {
    await this.getFeedbackById(id);
    return feedbackRepository.delete(id);
  }
}

export const feedbackService = new FeedbackService();
