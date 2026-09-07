import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export interface SessionUser {
  id: string;
  role: string;
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
 * Admin/Manager/Staff have full management access.
 */
export async function authorizeApartmentAccess(
  user: SessionUser,
  targetApartmentId: string,
  prismaClient: any = prisma
): Promise<AuthorizationResult> {
  if (user.role !== 'RESIDENT') {
    return { allowed: true };
  }

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

/**
 * Authorize invoice resource access.
 * Resident can ONLY view and pay invoices belonging to their own apartment.
 * Admin/Manager/Staff have full management access.
 */
export async function authorizeInvoiceAccess(
  user: SessionUser,
  invoiceApartmentId: string,
  prismaClient: any = prisma
): Promise<AuthorizationResult> {
  if (user.role !== 'RESIDENT') {
    return { allowed: true };
  }

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

/**
 * Authorize feedback / maintenance ticket resource access.
 * Resident can ONLY view tickets created by themselves or associated with their apartment.
 * Admin/Manager/Staff have full management access.
 */
export async function authorizeFeedbackAccess(
  user: SessionUser,
  feedback: { residentId?: string | null; apartmentId?: string | null },
  prismaClient: any = prisma
): Promise<AuthorizationResult> {
  if (user.role !== 'RESIDENT') {
    return { allowed: true };
  }

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

/**
 * Authorize contract resource access.
 * Resident can ONLY view contracts belonging to their own apartment.
 * Admin/Manager/Staff have full management access.
 */
export async function authorizeContractAccess(
  user: SessionUser,
  contractApartmentId: string,
  prismaClient: any = prisma
): Promise<AuthorizationResult> {
  if (user.role !== 'RESIDENT') {
    return { allowed: true };
  }

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

/**
 * Authorize resident profile access.
 * Resident can ONLY view their own profile or fellow members living in the same apartment.
 * Admin/Manager/Staff have full management access.
 */
export async function authorizeResidentProfileAccess(
  user: SessionUser,
  targetResident: { id: string; apartmentId?: string | null },
  prismaClient: any = prisma
): Promise<AuthorizationResult> {
  if (user.role !== 'RESIDENT') {
    return { allowed: true };
  }

  const ownResident = await getVerifiedResidentInfo(user.id, prismaClient);

  if (!ownResident) {
    return {
      allowed: false,
      statusCode: 403,
      error: 'Tài khoản chưa được kích hoạt hồ sơ cư dân',
    };
  }

  // Allowed if viewing own profile OR viewing member in same apartment
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
