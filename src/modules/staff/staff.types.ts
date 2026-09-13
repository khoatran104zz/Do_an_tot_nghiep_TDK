import { Role, StaffShift, StaffStatus } from '@prisma/client';

export interface StaffFilter {
  search?: string;
  role?: Role;
  shift?: StaffShift;
  status?: StaffStatus;
  page?: number;
  limit?: number;
}

export interface CreateStaffDto {
  email: string;
  password?: string;
  fullName: string;
  phone: string;
  role: Role; // STAFF_TECHNICIAN | STAFF_SECURITY | STAFF_RECEPTIONIST
  employeeCode?: string;
  position: string;
  department?: string;
  currentShift?: StaffShift;
  assignedZone?: string;
  notes?: string;
}

export interface UpdateStaffDto {
  fullName?: string;
  phone?: string;
  role?: Role;
  position?: string;
  department?: string;
  currentShift?: StaffShift;
  assignedZone?: string;
  status?: StaffStatus;
  notes?: string;
}

export interface AssignShiftDto {
  currentShift: StaffShift;
  assignedZone?: string;
  notes?: string;
}

export interface UpdateStaffStatusDto {
  status: StaffStatus;
  reason?: string;
}

export interface StaffOverviewStats {
  totalStaff: number;
  onShiftNow: number;
  techniciansCount: number;
  securityCount: number;
  receptionistCount: number;
  morningShiftCount: number;
  afternoonShiftCount: number;
  nightShiftCount: number;
}
