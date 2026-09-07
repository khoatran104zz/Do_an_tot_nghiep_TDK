import { dashboardRepository } from './dashboard.repository';

export class DashboardService {
  async getDashboardStats() {
    return dashboardRepository.getStats();
  }

  async getManagementDashboard(monthsCount: number = 6) {
    return dashboardRepository.getManagementDashboard(monthsCount);
  }
}

export const dashboardService = new DashboardService();
