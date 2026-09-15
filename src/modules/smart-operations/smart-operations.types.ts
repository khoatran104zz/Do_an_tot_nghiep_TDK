export type AlertSeverity = 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';

export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';

export type AlertSource = 'IOT' | 'SLA' | 'INVOICE' | 'CONTRACT' | 'MAINTENANCE';

export type AlertEntityType = 'CONTRACT' | 'INVOICE' | 'TICKET' | 'APARTMENT' | 'MAINTENANCE' | 'ASSET' | 'SENSOR';

export type AlertType =
  | 'CONTRACT_EXPIRED'
  | 'CONTRACT_EXPIRING_CRITICAL' // <= 7 days
  | 'CONTRACT_EXPIRING_SOON'     // <= 30 days
  | 'INVOICE_OVERDUE_CHRONIC'    // overdue > 15-30 days
  | 'INVOICE_OVERDUE'
  | 'INVOICE_HIGH_DEBT'
  | 'TICKET_SLA_BREACHED'
  | 'TICKET_SLA_APPROACHING'
  | 'TICKET_CRITICAL_PENDING'
  | 'MAINTENANCE_OVERDUE'
  | 'MAINTENANCE_DUE_SOON'
  | 'WATER_LEAKAGE'
  | 'SMOKE_DETECTED'
  | 'ELEVATOR_OFFLINE'
  | 'HIGH_TEMPERATURE';

export interface SmartAlert {
  id: string;
  type: AlertType | string;
  severity: AlertSeverity;
  source?: AlertSource;
  status?: AlertStatus;
  title: string;
  description: string;
  location?: string | null;
  entityType?: AlertEntityType | string | null;
  entityId?: string | null;
  actionUrl: string;
  createdAt: Date;
  acknowledgedAt?: Date | null;
  acknowledgedBy?: string | null;
  resolvedAt?: Date | null;
  resolvedBy?: string | null;
  metadata?: Record<string, any>;
}

export interface SmartAlertFilter {
  severity?: AlertSeverity;
  source?: AlertSource;
  status?: AlertStatus;
  location?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CollectionInsight {
  collectionRate: number;        // Percentage of paid vs issued
  currentPaidCount: number;
  currentTotalCount: number;
  currentPaidAmount: number;
  currentBilledAmount: number;
  prevCollectionRate: number;
  rateChange: number;            // Percentage points diff (+/-)
  isImproved: boolean;
  statusLabel: string;
}

export interface OccupancyInsight {
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  maintenanceUnits: number;
  occupancyRate: number;
  vacancyRate: number;
  maintenanceRate: number;
  monthlyTrend: Array<{
    month: string;
    occupancyRate: number;
    occupiedCount: number;
  }>;
}

export interface TicketInsight {
  totalTickets: number;
  resolvedTickets: number;
  activeTickets: number;
  criticalTickets: number;
  resolutionRate: number;
  criticalRate: number;
  averageResolutionHours: number; // e.g. 18.4
  averageRating: number;          // e.g. 4.6
  ratingCount: number;
  slaBreachedCount: number;
  slaOnTrackRate: number;
}

export interface ManagementInsightItem {
  id: string;
  type: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  entityType?: AlertEntityType;
  entityId?: string;
  actionUrl?: string;
  metric?: string;
}

export interface SmartOperationsSummary {
  alerts: SmartAlert[];
  top5Today: SmartAlert[];
  counts: {
    total: number;
    critical: number;
    high: number;
    warning: number;
    info: number;
  };
  insights: ManagementInsightItem[];
  collection: CollectionInsight;
  occupancy: OccupancyInsight;
  tickets: TicketInsight;
}
