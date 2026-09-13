import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import {
  Permission,
  hasPermission,
  isFinancialRole,
  isTechnicalRole,
  isSecurityRole,
  isManagementRole,
} from './permissions';

export interface SessionUser {
  id: string;
  role: Role | string;
  residentId?: string | null;
  apartmentId?: string | null;
  email?: string | null;
  name?: string | null;
}

export interface AuthorizationResult {
  allowed: boolean;
  error?: string;
  statusCode?: number;
}

/**
 * Check if the user has one of the allowed roles
 */
export function requireRole(
  user: SessionUser,
  allowedRoles: Array<Role | string>
): AuthorizationResult {
  if (!allowedRoles.includes(user.role)) {
    return {
      allowed: false,
      statusCode: 403,
      error: 'Bạn không có quyền thực hiện thao tác này',
    };
  }
  return { allowed: true };
}

/**
 * Check if the user has a specific granular permission
 */
export function requirePermission(
  user: SessionUser,
  permission: Permission
): AuthorizationResult {
  if (!hasPermission(user.role, permission)) {
    return {
      allowed: false,
      statusCode: 403,
      error: `Tài khoản (${user.role}) không có quyền thực hiện hành động này (${permission})`,
    };
  }
  return { allowed: true };
}

/**
 * Helper to securely resolve resident profile & apartment ID from database
 * (Never trusts client-supplied query/body parameters)
 */
export async function getVerifiedResidentInfo(
  userId: string,
  prismaClient: any = prisma
): Promise<{ id: string; apartmentId: string | null } | null> {
  const resident = await prismaClient.resident.findUnique({
    where: { userId },
    select: { id: true, apartmentId: true },
  });
  return resident;
}

/**
 * Authorize apartment resource access.
 * Resident can ONLY access their own apartment.
 * Admin/Manager and Staff have legitimate operational read access.
 */
export async function authorizeApartmentAccess(
  user: SessionUser,
  targetApartmentId: string,
  prismaClient: any = prisma
): Promise<AuthorizationResult> {
  if (user.role === Role.RESIDENT || user.role === 'RESIDENT') {
    const resident = await getVerifiedResidentInfo(user.id, prismaClient);

    if (!resident || resident.apartmentId !== targetApartmentId) {
      return {
        allowed: false,
        statusCode: 403,
        error: 'Bạn không có quyền truy cập thông tin căn hộ khác',
      };
    }
  }

  return { allowed: true };
}

/**
 * Authorize invoice resource access.
 * - Resident can ONLY view and pay invoices belonging to their own apartment.
 * - Admin/Manager have full management access.
 * - Operational staff (Technician, Security, Receptionist) are strictly FORBIDDEN from financial records.
 */
export async function authorizeInvoiceAccess(
  user: SessionUser,
  invoiceApartmentId: string,
  prismaClient: any = prisma
): Promise<AuthorizationResult> {
  // 1. Resident check
  if (user.role === Role.RESIDENT || user.role === 'RESIDENT') {
    const resident = await getVerifiedResidentInfo(user.id, prismaClient);

    if (!resident || resident.apartmentId !== invoiceApartmentId) {
      return {
        allowed: false,
        statusCode: 403,
        error: 'Bạn không có quyền truy cập hóa đơn của căn hộ khác',
      };
    }
    return { allowed: true };
  }

  // 2. Staff check: Only Financial roles (ADMIN, MANAGER) can access invoices
  if (!isFinancialRole(user.role)) {
    return {
      allowed: false,
      statusCode: 403,
      error: 'Nhân viên vận hành không có quyền truy cập hóa đơn tài chính',
    };
  }

  return { allowed: true };
}

/**
 * Authorize feedback / maintenance ticket resource access.
 * - Resident can ONLY view tickets created by themselves or for their apartment.
 * - Technical Staff (STAFF_TECHNICIAN) & Admin/Manager have maintenance access.
 * - Other staff (Security, Receptionist) cannot manage technical maintenance tickets.
 */
export async function authorizeFeedbackAccess(
  user: SessionUser,
  feedback: { residentId?: string | null; apartmentId?: string | null },
  prismaClient: any = prisma
): Promise<AuthorizationResult> {
  if (user.role === Role.RESIDENT || user.role === 'RESIDENT') {
    const resident = await getVerifiedResidentInfo(user.id, prismaClient);

    if (
      !resident ||
      (feedback.residentId !== resident.id && feedback.apartmentId !== resident.apartmentId)
    ) {
      return {
        allowed: false,
        statusCode: 403,
        error: 'Bạn không có quyền truy cập phản ánh sự cố của người khác',
      };
    }
    return { allowed: true };
  }

  // Only Technical roles (ADMIN, MANAGER, STAFF_TECHNICIAN) can process feedback tickets
  if (!isTechnicalRole(user.role)) {
    return {
      allowed: false,
      statusCode: 403,
      error: 'Vị trí công việc của bạn không có quyền xử lý sự cố kỹ thuật',
    };
  }

  return { allowed: true };
}

/**
 * Authorize contract resource access.
 * - Resident can ONLY view contracts belonging to their own apartment.
 * - Admin/Manager have full management access.
 * - Operational staff are FORBIDDEN from leasing contracts.
 */
export async function authorizeContractAccess(
  user: SessionUser,
  contractApartmentId: string,
  prismaClient: any = prisma
): Promise<AuthorizationResult> {
  if (user.role === Role.RESIDENT || user.role === 'RESIDENT') {
    const resident = await getVerifiedResidentInfo(user.id, prismaClient);

    if (!resident || resident.apartmentId !== contractApartmentId) {
      return {
        allowed: false,
        statusCode: 403,
        error: 'Bạn không có quyền truy cập hợp đồng của căn hộ khác',
      };
    }
    return { allowed: true };
  }

  if (!isManagementRole(user.role)) {
    return {
      allowed: false,
      statusCode: 403,
      error: 'Nhân viên vận hành không có quyền truy cập hồ sơ hợp đồng pháp lý',
    };
  }

  return { allowed: true };
}

/**
 * Authorize resident profile access.
 * - Resident can ONLY view their own profile or fellow members in same apartment.
 * - Admin/Manager have full management access.
 * - Receptionist has minimal contact access for parcel/delivery services.
 * - Security/Technician are denied full sensitive resident profiles.
 */
export async function authorizeResidentProfileAccess(
  user: SessionUser,
  targetResident: { id: string; apartmentId?: string | null },
  prismaClient: any = prisma
): Promise<AuthorizationResult> {
  if (user.role === Role.RESIDENT || user.role === 'RESIDENT') {
    const ownResident = await getVerifiedResidentInfo(user.id, prismaClient);

    if (!ownResident) {
      return {
        allowed: false,
        statusCode: 403,
        error: 'Tài khoản chưa được kích hoạt hồ sơ cư dân',
      };
    }

    const isSelf = ownResident.id === targetResident.id;
    const isCoResident =
      Boolean(ownResident.apartmentId) && ownResident.apartmentId === targetResident.apartmentId;

    if (!isSelf && !isCoResident) {
      return {
        allowed: false,
        statusCode: 403,
        error: 'Bạn không có quyền truy cập thông tin cư dân khác',
      };
    }
    return { allowed: true };
  }

  // Security and Technician don't manage resident master profiles
  if (user.role === Role.STAFF_SECURITY || user.role === Role.STAFF_TECHNICIAN) {
    return {
      allowed: false,
      statusCode: 403,
      error: 'Vị trí công việc của bạn không có quyền xem hồ sơ cư dân chi tiết',
    };
  }

  return { allowed: true };
}

/**
 * Authorize vehicle & parking card resource access.
 * - Resident can ONLY view/manage vehicles belonging to their own apartment.
 * - Admin/Manager and Security have access.
 * - Other staff (Technician, Receptionist) cannot manage parking operations.
 */
export async function authorizeVehicleAccess(
  user: SessionUser,
  vehicleApartmentId: string,
  prismaClient: any = prisma
): Promise<AuthorizationResult> {
  if (user.role === Role.RESIDENT || user.role === 'RESIDENT') {
    const resident = await getVerifiedResidentInfo(user.id, prismaClient);

    if (!resident || !resident.apartmentId || resident.apartmentId !== vehicleApartmentId) {
      return {
        allowed: false,
        statusCode: 403,
        error: 'Bạn không có quyền truy cập phương tiện của căn hộ khác',
      };
    }
    return { allowed: true };
  }

  if (!isSecurityRole(user.role)) {
    return {
      allowed: false,
      statusCode: 403,
      error: 'Chỉ nhân viên an ninh và BQL mới có quyền quản lý phương tiện & thẻ xe',
    };
  }

  return { allowed: true };
}
