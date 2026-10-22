import { tenantRepository } from './tenant.repository';
import { CreateTenantDto, UpdateTenantDto, TenantFilter, CreateTenantAdminDto } from './tenant.types';
import { prisma } from '@/lib/prisma';
import { auditLogService } from '@/modules/audit/audit-log.service';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

export interface ActorContext {
  id?: string | null;
  email?: string | null;
  role?: string | null;
}

export class TenantService {
  async getTenants(filter: TenantFilter = {}) {
    return tenantRepository.findAll(filter);
  }

  async getTenantById(id: string) {
    const tenant = await tenantRepository.findById(id);
    if (!tenant) {
      throw new Error('Không tìm thấy thông tin tổ hợp / khách hàng yêu cầu');
    }
    return tenant;
  }

  async createTenant(data: CreateTenantDto, actor?: ActorContext) {
    const existingCode = await tenantRepository.findByCode(data.code);
    if (existingCode) {
      throw new Error(`Mã tổ hợp "${data.code}" đã tồn tại trên nền tảng`);
    }

    let initialAdmin: any = null;

    const tenant = await prisma.$transaction(async (tx) => {
      const createdTenant = await tx.tenant.create({
        data: {
          code: data.code.trim().toUpperCase(),
          name: data.name.trim(),
          address: data.address?.trim() || null,
          phone: data.phone?.trim() || null,
          email: data.email?.toLowerCase().trim() || null,
          status: data.status || 'ACTIVE',
        },
      });

      // If initial admin credentials are provided, create tenant admin
      if (data.adminEmail && data.adminFullName && data.adminPassword) {
        const existingUser = await tx.user.findUnique({
          where: { email: data.adminEmail.toLowerCase().trim() },
        });
        if (existingUser) {
          throw new Error(`Email "${data.adminEmail}" đã được đăng ký trong hệ thống`);
        }

        const passwordHash = await bcrypt.hash(data.adminPassword, 10);
        initialAdmin = await tx.user.create({
          data: {
            email: data.adminEmail.toLowerCase().trim(),
            passwordHash,
            fullName: data.adminFullName.trim(),
            phone: data.adminPhone || null,
            role: Role.TENANT_ADMIN,
            tenantId: createdTenant.id,
            isActive: true,
          },
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorId: actor?.id || null,
          actorEmail: actor?.email || null,
          actorRole: actor?.role || null,
          action: 'TENANT_CREATED',
          entity: 'TENANT',
          entityId: createdTenant.id,
          metadata: {
            code: createdTenant.code,
            name: createdTenant.name,
            hasInitialAdmin: !!initialAdmin,
          },
        },
      });

      return createdTenant;
    });

    return {
      ...tenant,
      initialAdmin,
    };
  }

  async updateTenant(id: string, data: UpdateTenantDto, actor?: ActorContext) {
    await this.getTenantById(id);
    const updated = await tenantRepository.update(id, data);

    await auditLogService.record({
      actorId: actor?.id || null,
      actorEmail: actor?.email || null,
      actorRole: actor?.role || null,
      action: 'TENANT_UPDATED',
      entity: 'TENANT',
      entityId: id,
      metadata: { code: updated.code, name: updated.name, status: updated.status },
    });

    return updated;
  }

  async deleteTenant(id: string, actor?: ActorContext) {
    const tenant = await this.getTenantById(id);
    if ((tenant._count?.buildings || 0) > 0 || (tenant._count?.users || 0) > 0) {
      throw new Error('Không thể xóa tổ hợp khi vẫn còn tòa nhà hoặc tài khoản trực thuộc!');
    }

    const deleted = await tenantRepository.delete(id);

    await auditLogService.record({
      actorId: actor?.id || null,
      actorEmail: actor?.email || null,
      actorRole: actor?.role || null,
      action: 'TENANT_DELETED',
      entity: 'TENANT',
      entityId: id,
      metadata: { code: deleted.code, name: deleted.name },
    });

    return deleted;
  }

  async createTenantAdmin(tenantId: string, data: CreateTenantAdminDto, actor?: ActorContext) {
    const tenant = await this.getTenantById(tenantId);

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    });
    if (existingUser) {
      throw new Error(`Email "${data.email}" đã tồn tại trong hệ thống`);
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const admin = await prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        passwordHash,
        fullName: data.fullName.trim(),
        phone: data.phone || null,
        role: Role.TENANT_ADMIN,
        tenantId: tenant.id,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        tenantId: true,
        createdAt: true,
      },
    });

    await auditLogService.record({
      actorId: actor?.id || null,
      actorEmail: actor?.email || null,
      actorRole: actor?.role || null,
      action: 'TENANT_ADMIN_CREATED',
      entity: 'USER',
      entityId: admin.id,
      metadata: {
        tenantId: tenant.id,
        tenantCode: tenant.code,
        adminEmail: admin.email,
      },
    });

    return admin;
  }
}

export const tenantService = new TenantService();
