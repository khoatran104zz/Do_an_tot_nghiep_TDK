import { assetRepository } from './asset.repository';
import {
  AssetFilter,
  CreateAssetDto,
  UpdateAssetDto,
  ScheduleFilter,
  CreateScheduleDto,
  UpdateScheduleDto,
  CompleteScheduleDto,
} from './asset.types';
import { auditLogService } from '@/modules/audit/audit-log.service';

export interface UserContext {
  id: string;
  email?: string | null;
  role?: string | null;
  fullName?: string | null;
}

export class AssetService {
  async getAssets(filter: AssetFilter, user?: UserContext) {
    return assetRepository.findAssets(filter, user?.role || undefined, user?.id);
  }

  async getAssetById(id: string) {
    const asset = await assetRepository.findAssetById(id);
    if (!asset) {
      throw new Error('Không tìm thấy thiết bị/tài sản kỹ thuật');
    }
    return asset;
  }

  async createAsset(dto: CreateAssetDto, user: UserContext) {
    const asset = await assetRepository.createAsset(dto);

    await auditLogService.record({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'CREATE_ASSET',
      entity: 'ASSET',
      entityId: asset.id,
      metadata: {
        code: asset.code,
        name: asset.name,
        category: asset.category,
        location: asset.location,
      },
    });

    return asset;
  }

  async updateAsset(id: string, dto: UpdateAssetDto, user: UserContext) {
    const asset = await assetRepository.updateAsset(id, dto);

    await auditLogService.record({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'UPDATE_ASSET',
      entity: 'ASSET',
      entityId: asset.id,
      metadata: {
        code: asset.code,
        name: asset.name,
        status: asset.status,
      },
    });

    return asset;
  }

  async getSchedules(filter: ScheduleFilter, user?: UserContext) {
    return assetRepository.findSchedules(filter, user?.role || undefined, user?.id);
  }

  async getMaintenanceSchedules(filter: ScheduleFilter, user?: UserContext) {
    return this.getSchedules(filter, user);
  }

  async createSchedule(dto: CreateScheduleDto, user: UserContext) {
    const schedule = await assetRepository.createSchedule(dto);

    await auditLogService.record({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'CREATE_MAINTENANCE_SCHEDULE',
      entity: 'MAINTENANCE_SCHEDULE',
      entityId: schedule.id,
      metadata: {
        code: schedule.code,
        assetId: schedule.assetId,
        title: schedule.title,
        cycle: schedule.cycle,
        nextMaintenance: schedule.nextMaintenance,
      },
    });

    return schedule;
  }

  async completeSchedule(
    scheduleId: string,
    dto: CompleteScheduleDto,
    user: UserContext
  ) {
    const result = await assetRepository.completeSchedule(scheduleId, dto, user.id);

    await auditLogService.record({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'COMPLETE_MAINTENANCE',
      entity: 'MAINTENANCE_SCHEDULE',
      entityId: scheduleId,
      metadata: {
        workOrderCode: result.workOrder.code,
        completedAt: result.workOrder.completedAt,
        cost: result.workOrder.cost,
        findings: result.workOrder.findings,
        nextMaintenance: result.schedule.nextMaintenance,
      },
    });

    return result;
  }

  async getDashboardStats(buildingIds?: string[]) {
    return assetRepository.getAssetDashboardStats(buildingIds);
  }

  async getDashboardMetrics(buildingIds?: string[]) {
    return this.getDashboardStats(buildingIds);
  }
}

export const assetService = new AssetService();
