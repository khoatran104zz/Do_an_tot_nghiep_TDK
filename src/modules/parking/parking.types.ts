import {
  SlotVehicleType,
  ParkingSlotStatus,
  ParkingRequestStatus,
  ParkingAssignmentStatus,
  ParkingLogDirection,
  ParkingLogStatus,
  VehicleType,
} from '@prisma/client';

export class ParkingError extends Error {
  code: string;
  statusCode: number;

  constructor(message: string, code = 'PARKING_ERROR', statusCode = 400) {
    super(message);
    this.name = 'ParkingError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

// -------------------------------------------------------------
// FILTERS
// -------------------------------------------------------------
export interface ParkingAreaFilter {
  buildingId?: string;
  search?: string;
  isActive?: boolean;
}

export interface ParkingSlotFilter {
  buildingId?: string;
  areaId?: string;
  zoneId?: string;
  floor?: number;
  type?: SlotVehicleType;
  status?: ParkingSlotStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ParkingRequestFilter {
  buildingId?: string;
  residentId?: string;
  apartmentId?: string;
  vehicleId?: string;
  status?: ParkingRequestStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ParkingAccessLogFilter {
  buildingId?: string;
  licensePlate?: string;
  status?: ParkingLogStatus;
  direction?: ParkingLogDirection;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// -------------------------------------------------------------
// DTOs
// -------------------------------------------------------------
export interface CreateParkingAreaDto {
  buildingId: string;
  code: string;
  name: string;
  floor?: number;
  totalCapacity?: number;
  description?: string | null;
  isActive?: boolean;
}

export interface UpdateParkingAreaDto {
  code?: string;
  name?: string;
  floor?: number;
  totalCapacity?: number;
  description?: string | null;
  isActive?: boolean;
}

export interface CreateParkingZoneDto {
  areaId: string;
  code: string;
  name: string;
  vehicleType?: VehicleType;
  colorHex?: string;
  totalSlots?: number;
}

export interface UpdateParkingZoneDto {
  code?: string;
  name?: string;
  vehicleType?: VehicleType;
  colorHex?: string;
  totalSlots?: number;
}

export interface CreateParkingSlotDto {
  areaId: string;
  zoneId: string;
  code: string;
  type?: SlotVehicleType;
  status?: ParkingSlotStatus;
  floor?: number;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
  isReservable?: boolean;
  isActive?: boolean;
  note?: string | null;
}

export interface UpdateParkingSlotDto {
  zoneId?: string;
  code?: string;
  type?: SlotVehicleType;
  status?: ParkingSlotStatus;
  floor?: number;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
  isReservable?: boolean;
  isActive?: boolean;
  note?: string | null;
}

export interface CreateParkingRequestDto {
  vehicleId: string;
  preferredAreaId?: string | null;
  preferredZoneId?: string | null;
  slotId?: string | null;
  startDate?: string | Date;
  endDate?: string | Date | null;
  notes?: string | null;
}

export interface ReviewParkingRequestDto {
  action: 'APPROVE' | 'REJECT';
  slotId?: string | null;
  rejectionReason?: string | null;
  startDate?: string | Date;
  endDate?: string | Date | null;
  monthlyFee?: number;
}

export interface AssignSlotDto {
  slotId: string;
  vehicleId: string;
  startDate?: string | Date;
  endDate?: string | Date | null;
  monthlyFee?: number;
  notes?: string | null;
}

export interface GateCheckInDto {
  licensePlate: string;
  cardCode?: string | null;
  qrToken?: string | null;
  gateName?: string;
  imageSnapshotUrl?: string | null;
  slotId?: string | null;
  notes?: string | null;
}

export interface GateCheckOutDto {
  licensePlate: string;
  cardCode?: string | null;
  qrToken?: string | null;
  gateName?: string;
  imageSnapshotUrl?: string | null;
  notes?: string | null;
}

// -------------------------------------------------------------
// METRICS & RESPONSES
// -------------------------------------------------------------
export interface OccupancyMetrics {
  total: number;
  available: number;
  occupied: number;
  reserved: number;
  maintenance: number;
  blocked: number;
  occupancyRate: number; // percentage 0 - 100
}

export interface AreaOccupancySummary {
  areaId: string;
  areaCode: string;
  areaName: string;
  floor: number;
  metrics: OccupancyMetrics;
  zones: {
    zoneId: string;
    zoneCode: string;
    zoneName: string;
    vehicleType: VehicleType;
    metrics: OccupancyMetrics;
  }[];
}

export interface GlobalParkingOverview {
  summary: OccupancyMetrics;
  areas: AreaOccupancySummary[];
  byVehicleType: Record<string, number>;
  activePassesCount: number;
  pendingRequestsCount: number;
  todayEntries: number;
  todayExits: number;
}
