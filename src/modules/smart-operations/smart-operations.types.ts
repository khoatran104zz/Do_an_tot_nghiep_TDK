export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export type AlertEntityType = 'CONTRACT' | 'INVOICE' | 'TICKET' | 'APARTMENT';

export type AlertType =
  | 'CONTRACT_EXPIRED'
  | 'CONTRACT_EXPIRING_CRITICAL' // <= 7 days
  | 'CONTRACT_EXPIRING_SOON'     // <= 30 days
  | 'INVOICE_OVERDUE_CHRONIC'    // overdue > 15-30 days
  | 'INVOICE_OVERDUE'
  | 'INVOICE_HIGH_DEBT'
  | 'TICKET_SLA_BREACHED'
  | 'TICKET_SLA_APPROACHING'
  | 'TICKET_CRITICAL_PENDING';

export interface SmartAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  entityType: AlertEntityType;
  entityId: string;
  actionUrl: string;
  createdAt: Date;
  resolvedAt?: Date | null;
  metadata?: Record<string, any>;
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
    warning: number;
    info: number;
  };
  insights: ManagementInsightItem[];
  collection: CollectionInsight;
  occupancy: OccupancyInsight;
  tickets: TicketInsight;
}
