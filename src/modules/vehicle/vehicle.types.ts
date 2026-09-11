import { VehicleType, VehicleStatus, ParkingCardStatus } from '@prisma/client';

export class VehicleError extends Error {
  code: string;
  statusCode: number;

  constructor(message: string, code: string, statusCode = 400) {
    super(message);
    this.name = 'VehicleError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export interface VehicleFilter {
  search?: string;
  building?: string;
  apartmentId?: string;
  residentId?: string;
  type?: VehicleType;
  status?: VehicleStatus;
  parkingCardStatus?: ParkingCardStatus;
  page?: number;
  limit?: number;
}

export interface CreateVehicleDto {
  licensePlate: string;
  type: VehicleType;
  brand: string;
  model?: string | null;
  color?: string | null;
  apartmentId?: string;
  residentId?: string | null;
  registrationDocumentUrl?: string | null;
  status?: VehicleStatus;
}

export interface UpdateVehicleDto {
  brand?: string;
  model?: string | null;
  color?: string | null;
  registrationDocumentUrl?: string | null;
  licensePlate?: string;
  type?: VehicleType;
  apartmentId?: string;
  residentId?: string | null;
}

export interface ApproveVehicleDto {
  cardCode?: string;
  expiresAt?: string | Date | null;
}

export interface RejectVehicleDto {
  reason?: string;
}

export interface ParkingCardFilter {
  search?: string;
  vehicleId?: string;
  apartmentId?: string;
  status?: ParkingCardStatus;
  page?: number;
  limit?: number;
}

export interface CreateParkingCardDto {
  cardCode: string;
  vehicleId?: string;
  expiresAt?: string | Date | null;
  status?: ParkingCardStatus;
}

export interface UpdateParkingCardDto {
  expiresAt?: string | Date | null;
}

export interface LockParkingCardDto {
  lockReason: string;
}
