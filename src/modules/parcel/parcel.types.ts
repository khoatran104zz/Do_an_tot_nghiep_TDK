import { ParcelDelivery, ParcelStatus } from '@prisma/client';

export interface ParcelFilter {
  search?: string;
  apartmentId?: string;
  carrier?: string;
  status?: ParcelStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface ParcelStats {
  totalPending: number;
  receivedToday: number;
  collectedToday: number;
  overdueCount: number;
  totalMonthly: number;
}

export interface ReceiveParcelDto {
  apartmentId: string;
  recipientId?: string | null;
  recipientName: string;
  recipientPhone?: string | null;
  carrier: string;
  trackingNumber?: string | null;
  photoUrl?: string | null;
  location?: string | null;
  note?: string | null;
}

export interface CollectParcelDto {
  pickupCode: string;
  parcelId?: string;
  collectedByName?: string;
}

export interface UpdateParcelDto {
  carrier?: string;
  trackingNumber?: string | null;
  photoUrl?: string | null;
  location?: string | null;
  note?: string | null;
  status?: ParcelStatus;
}

export type ParcelWithRelations = ParcelDelivery & {
  apartment: {
    id: string;
    code: string;
    building: string;
    floor: number;
  };
  recipient?: {
    id: string;
    fullName: string;
    phone: string;
  } | null;
  receivedBy?: {
    id: string;
    fullName: string;
  } | null;
  collectedBy?: {
    id: string;
    fullName: string;
  } | null;
};
