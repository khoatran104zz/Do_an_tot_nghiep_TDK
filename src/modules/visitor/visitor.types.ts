import { VisitorStatus } from '@prisma/client';

export interface VisitorPassFilter {
  search?: string;
  apartmentId?: string;
  buildingId?: string;
  buildingIds?: string[];
  status?: VisitorStatus;
  date?: string | Date;
  page?: number;
  limit?: number;
}

export type VisitorFilter = VisitorPassFilter;

export interface CreateVisitorPassDto {
  visitorName: string;
  visitorPhone?: string | null;
  visitDate: string; // YYYY-MM-DD
  expectedTime: string; // e.g. "19:00 - 22:00"
  licensePlate?: string | null;
  note?: string | null;
  apartmentId?: string; // Optional if derived from logged-in resident
}

export interface ScanVisitorPassDto {
  code?: string;
  passCodeOrQr?: string; // Pass code (VP-2026-XXXX) or QR string
}

export type ScanVisitorDto = ScanVisitorPassDto;

export interface ScanValidationResult {
  isValid: boolean;
  message: string;
  canCheckIn: boolean;
  canCheckOut: boolean;
  pass: any | null;
}

export type ScanVisitorResult = ScanValidationResult;
export type VisitorPassWithRelations = any;

export interface VisitorDashboardStats {
  activeVisitors: number; // Checked in and currently inside building
  todayTotal: number; // Total scheduled/visited today
  pendingToday: number; // Expected today but not yet arrived
  checkedOutToday: number;
}

export interface UserContext {
  id: string;
  email?: string | null;
  role?: string | null;
  fullName?: string | null;
}
