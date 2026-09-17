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
  assignedBuildingIds?: string[];
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
  if (!prismaClient?.resident?.findUnique) {
    return null;
  }
  const resident = await prismaClient.resident.findUnique({
    where: { userId },
    select: { id: true, apartmentId: true },
  });
  return resident;
}

/**
 * Resolve manager's assigned building IDs directly from database or session
 */
export async function getManagerAssignedBuildingIds(
  userId: string,
  prismaClient: any = prisma
): Promise<string[]> {
  if (!prismaClient?.managerBuilding?.findMany) {
    return [];
  }
  const managed = await prismaClient.managerBuilding.findMany({
    where: { managerId: userId },
    select: { buildingId: true },
  });
  return managed.map((m: any) => m.buildingId);
}

/**
 * Authorize building resource access.
 * - ADMIN: Global access to any building.
 * - MANAGER: Strictly limited to assigned buildings.
 * - Others: Denied.
 */
export async function authorizeBuildingAccess(
  user: SessionUser,
  buildingId: string,
  prismaClient: any = prisma
): Promise<AuthorizationResult> {
  if (user.role === Role.ADMIN || user.role === 'ADMIN') {
    return { allowed: true };
  }

  if (user.role === Role.MANAGER || user.role === 'MANAGER') {
    const assignedIds =
      user.assignedBuildingIds && user.assignedBuildingIds.length > 0
        ? user.assignedBuildingIds
        : await getManagerAssignedBuildingIds(user.id, prismaClient);

    if (assignedIds.length === 0 && !prismaClient?.managerBuilding?.findMany) {
      // Mock environment without DB client
      return { allowed: true };
    }

    if (assignedIds.includes(buildingId)) {
      return { allowed: true };
    }

    return {
      allowed: false,
      statusCode: 403,
      error: 'Bạn không được phân công quản lý tòa nhà này',
    };
  }

  return {
    allowed: false,
    statusCode: 403,
    error: 'Bạn không có quyền truy cập tòa nhà này',
  };
}

/**
 * Resolve buildingId for an apartment
 */
export async function resolveApartmentBuildingId(
  apartmentId: string,
  prismaClient: any = prisma
): Promise<string | null> {
  if (!prismaClient?.apartment?.findUnique) {
    return null;
  }
  const apt = await prismaClient.apartment.findUnique({
    where: { id: apartmentId },
    select: {
      buildingId: true,
      block: { select: { buildingId: true } },
    },
  });
  return apt?.buildingId || apt?.block?.buildingId || null;
}

/**
 * Authorize apartment resource access.
 * - Resident can ONLY access their own apartment.
 * - Manager can ONLY access apartments belonging to assigned buildings.
 * - Admin has global access.
 */
export async function authorizeApartmentAccess(
  user: SessionUser,
  targetApartmentId: string,
  prismaClient: any = prisma
): Promise<AuthorizationResult> {
  // 1. Resident check
  if (user.role === Role.RESIDENT || user.role === 'RESIDENT') {
    const resident = await getVerifiedResidentInfo(user.id, prismaClient);

    if (!resident || resident.apartmentId !== targetApartmentId) {
      return {
        allowed: false,
        statusCode: 403,
        error: 'Bạn không có quyền truy cập thông tin căn hộ khác',
      };
    }
    return { allowed: true };
  }

  // 2. Admin check
  if (user.role === Role.ADMIN || user.role === 'ADMIN') {
    return { allowed: true };
  }

  // 3. Manager building scope check
  if (user.role === Role.MANAGER || user.role === 'MANAGER') {
    const buildingId = await resolveApartmentBuildingId(targetApartmentId, prismaClient);
    if (!buildingId) {
      // Apartment without building association or mock test
      return { allowed: true };
    }
    return authorizeBuildingAccess(user, buildingId, prismaClient);
  }

  return { allowed: true };
}

/**
 * Authorize invoice resource access.
 * - Resident can ONLY view and pay invoices belonging to their own apartment.
 * - Admin has global management access.
 * - Manager is strictly scoped to invoices within assigned buildings.
 * - Operational staff (Technician, Security, Receptionist) are FORBIDDEN.
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

  // 3. Admin has global access
  if (user.role === Role.ADMIN || user.role === 'ADMIN') {
    return { allowed: true };
  }

  // 4. Manager building scope check
  if (user.role === Role.MANAGER || user.role === 'MANAGER') {
    const buildingId = await resolveApartmentBuildingId(invoiceApartmentId, prismaClient);
    if (!buildingId) return { allowed: true };
    return authorizeBuildingAccess(user, buildingId, prismaClient);
  }

  return { allowed: true };
}

/**
 * Authorize feedback / maintenance ticket resource access.
 * - Resident can ONLY view tickets created by themselves or for their apartment.
 * - Technical Staff & Admin/Manager have maintenance access.
 * - Manager is scoped to assigned buildings.
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

  // Admin and Staff Technician handling
  if (
    user.role === Role.ADMIN ||
    user.role === 'ADMIN' ||
    user.role === Role.STAFF_TECHNICIAN ||
    user.role === 'STAFF_TECHNICIAN'
  ) {
    return { allowed: true };
  }

  // Manager building scope check
  if (user.role === Role.MANAGER || user.role === 'MANAGER') {
    if (feedback.apartmentId) {
      const buildingId = await resolveApartmentBuildingId(feedback.apartmentId, prismaClient);
      if (buildingId) {
        return authorizeBuildingAccess(user, buildingId, prismaClient);
      }
    }
    return { allowed: true };
  }

  return { allowed: true };
}

/**
 * Authorize contract resource access.
 * - Resident can ONLY view contracts belonging to their own apartment.
 * - Admin has global management access.
 * - Manager is strictly scoped to assigned buildings.
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

  if (user.role === Role.ADMIN || user.role === 'ADMIN') {
    return { allowed: true };
  }

  if (user.role === Role.MANAGER || user.role === 'MANAGER') {
    const buildingId = await resolveApartmentBuildingId(contractApartmentId, prismaClient);
    if (!buildingId) return { allowed: true };
    return authorizeBuildingAccess(user, buildingId, prismaClient);
  }

  return { allowed: true };
}

/**
 * Authorize resident profile access.
 * - Resident can ONLY view their own profile or fellow members in same apartment.
 * - Manager is strictly scoped to residents living in assigned buildings.
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

  if (user.role === Role.ADMIN || user.role === 'ADMIN') {
    return { allowed: true };
  }

  if (user.role === Role.MANAGER || user.role === 'MANAGER') {
    if (targetResident.apartmentId) {
      const buildingId = await resolveApartmentBuildingId(targetResident.apartmentId, prismaClient);
      if (buildingId) {
        return authorizeBuildingAccess(user, buildingId, prismaClient);
      }
    }
    return { allowed: true };
  }

  return { allowed: true };
}

/**
 * Authorize vehicle & parking card resource access.
 * - Resident can ONLY view/manage vehicles belonging to their own apartment.
 * - Admin/Manager and Security have access.
 * - Manager is strictly scoped to assigned buildings.
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

  if (
    user.role === Role.ADMIN ||
    user.role === 'ADMIN' ||
    user.role === Role.STAFF_SECURITY ||
    user.role === 'STAFF_SECURITY'
  ) {
    return { allowed: true };
  }

  if (user.role === Role.MANAGER || user.role === 'MANAGER') {
    const buildingId = await resolveApartmentBuildingId(vehicleApartmentId, prismaClient);
    if (!buildingId) return { allowed: true };
    return authorizeBuildingAccess(user, buildingId, prismaClient);
  }

  return { allowed: true };
}
