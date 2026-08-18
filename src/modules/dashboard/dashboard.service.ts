import { dashboardRepository } from './dashboard.repository';

export class DashboardService {
  async getDashboardStats() {
    return dashboardRepository.getStats();
  }
}

export const dashboardService = new DashboardService();
