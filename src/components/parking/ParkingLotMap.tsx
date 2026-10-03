'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Car,
  Bike,
  Zap,
  Accessibility,
  CheckCircle2,
  AlertCircle,
  Clock,
  Compass,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Shield,
  Layers,
  Search,
  Sparkles,
  Info,
  Lock,
  X,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Building,
  Footprints,
  LogOut,
  Camera,
  Sun,
  Truck,
  Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ParkingSlot, ParkingSlotVisualStatus } from './map/ParkingSlot';
import { ParkingZone, ParkingSlotData } from './map/ParkingZone';
import { DrivingLane } from './map/DrivingLane';
import { EVChargingZone } from './map/EVChargingZone';
import { MotorcycleZone } from './map/MotorcycleZone';
import { FacilitiesBox } from './map/FacilitiesBox';
import { ParkingLegend } from './map/ParkingLegend';
import { ParkingFloorSelector } from './map/ParkingFloorSelector';
import { ParkingStatistics } from './map/ParkingStatistics';
import { ParkingDetailPanel } from './map/ParkingDetailPanel';
import { ParkingEntrance, ParkingExit, SecurityBooth } from './map/ParkingWayfinding';
import { ParkingRequestModal } from './ParkingRequestModal';

export interface ParkingLotMapProps {
  areaName?: string;
  areaCode?: string;
  floor?: number;
  slots?: any[];
  zones?: any[];
  allAreas?: any[];
  selectedSlotId?: string | null;
  highlightedSlotId?: string | null;
  onSelectSlot?: (slot: any) => void;
  isManager?: boolean;
  onStatusChange?: (slotId: string, status: any) => void;
  onReleaseSlot?: (slotId: string) => void;
  occupancy?: any;
  onFloorChange?: (floorCode: string) => void;
  className?: string;
}

interface TemplateSlotItem {
  id: string;
  code: string;
  status: ParkingSlotVisualStatus;
  vehicleType?: 'car' | 'motorcycle' | 'ev' | 'accessible';
  isLocked?: boolean;
  hasInfo?: boolean;
  statusLabel?: string;
  zoneCode: string;
  row: 1 | 2;
  isSpecial?: boolean;
  note?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// AREA TEMPLATES (B1, B2, B3, OUTDOOR) - STRICT FIGMA FIDELITY & DISTINCT DESIGNS
// ─────────────────────────────────────────────────────────────────────────────

// 1. FLOOR B1: Main Basement Parking (Dense 20-slot core + 2 Accessible + 3 EV + 6 Moto)
const B1_SLOTS_TEMPLATE: TemplateSlotItem[] = [
  // Zone A - Row 1
  { id: 'P01', code: 'P01', status: 'occupied', statusLabel: 'OCCU', zoneCode: 'ZONE-A', row: 1 },
  { id: 'P02', code: 'P02', status: 'available', statusLabel: 'AVAI', zoneCode: 'ZONE-A', row: 1 },
  { id: 'P03', code: 'P03', status: 'available', statusLabel: 'AVAI', zoneCode: 'ZONE-A', row: 1 },
  { id: 'P04', code: 'P04', status: 'occupied', statusLabel: 'OCCU', zoneCode: 'ZONE-A', row: 1 },
  { id: 'P05', code: 'P05', status: 'reserved', statusLabel: 'RESE', isLocked: true, zoneCode: 'ZONE-A', row: 1 },
  // Accessible Bay A-01
  { id: 'A-01', code: 'A-01', status: 'accessible', statusLabel: 'ACCESS', hasInfo: true, vehicleType: 'accessible', zoneCode: 'ZONE-A', row: 1, isSpecial: true },
  // Zone A - Row 2
  { id: 'P06', code: 'P06', status: 'available', statusLabel: 'AVAI', zoneCode: 'ZONE-A', row: 2 },
  { id: 'P07', code: 'P07', status: 'available', statusLabel: 'AVAI', zoneCode: 'ZONE-A', row: 2 },
  { id: 'P08', code: 'P08', status: 'occupied', statusLabel: 'OCCU', zoneCode: 'ZONE-A', row: 2 },
  { id: 'P09', code: 'P09', status: 'occupied', statusLabel: 'OCCU', zoneCode: 'ZONE-A', row: 2 },
  { id: 'P10', code: 'P10', status: 'reserved', statusLabel: 'RESE', isLocked: true, zoneCode: 'ZONE-A', row: 2 },
  // Zone B - Row 1
  { id: 'P11', code: 'P11', status: 'occupied', statusLabel: 'OCCU', zoneCode: 'ZONE-B', row: 1 },
  { id: 'P12', code: 'P12', status: 'available', statusLabel: 'AVAI', zoneCode: 'ZONE-B', row: 1 },
  { id: 'P13', code: 'P13', status: 'available', statusLabel: 'AVAI', zoneCode: 'ZONE-B', row: 1 },
  { id: 'P14', code: 'P14', status: 'occupied', statusLabel: 'OCCU', zoneCode: 'ZONE-B', row: 1 },
  { id: 'P15', code: 'P15', status: 'unavailable', statusLabel: 'N/A', zoneCode: 'ZONE-B', row: 1 },
  // Accessible Bay A-02
  { id: 'A-02', code: 'A-02', status: 'occupied', statusLabel: 'OCCU', hasInfo: true, vehicleType: 'accessible', zoneCode: 'ZONE-B', row: 1, isSpecial: true },
  // Zone B - Row 2
  { id: 'P16', code: 'P16', status: 'available', statusLabel: 'AVAI', zoneCode: 'ZONE-B', row: 2 },
  { id: 'P17', code: 'P17', status: 'reserved', statusLabel: 'RESE', isLocked: true, zoneCode: 'ZONE-B', row: 2 },
  { id: 'P18', code: 'P18', status: 'occupied', statusLabel: 'OCCU', zoneCode: 'ZONE-B', row: 2 },
  { id: 'P19', code: 'P19', status: 'available', statusLabel: 'AVAI', zoneCode: 'ZONE-B', row: 2 },
  { id: 'P20', code: 'P20', status: 'occupied', statusLabel: 'OCCU', zoneCode: 'ZONE-B', row: 2 },
];

interface QuickSlotItem {
  id: string;
  code: string;
  status: 'available' | 'occupied' | 'reserved';
}

const B1_EV_SLOTS: QuickSlotItem[] = [
  { id: 'EV-01', code: 'EV-01', status: 'available' },
  { id: 'EV-02', code: 'EV-02', status: 'available' },
  { id: 'EV-03', code: 'EV-03', status: 'available' },
];

const B1_MOTO_SLOTS: QuickSlotItem[] = [
  { id: 'M01', code: 'M01', status: 'occupied' },
  { id: 'M02', code: 'M02', status: 'available' },
  { id: 'M03', code: 'M03', status: 'available' },
  { id: 'M04', code: 'M04', status: 'occupied' },
  { id: 'M05', code: 'M05', status: 'available' },
  { id: 'M06', code: 'M06', status: 'occupied' },
];

// 2. FLOOR B2: Expansion & Long-term Parking (10 Resident slots + 1 Accessible + 2 EV + 3 Moto)
const B2_SLOTS_TEMPLATE: TemplateSlotItem[] = [
  // Zone A - Row 1
  { id: 'P21', code: 'P21', status: 'available', statusLabel: 'AVAI', zoneCode: 'ZONE-A', row: 1 },
  { id: 'P22', code: 'P22', status: 'occupied', statusLabel: 'OCCU', zoneCode: 'ZONE-A', row: 1 },
  { id: 'P23', code: 'P23', status: 'available', statusLabel: 'AVAI', zoneCode: 'ZONE-A', row: 1 },
  { id: 'P24', code: 'P24', status: 'reserved', statusLabel: 'RESE', isLocked: true, zoneCode: 'ZONE-A', row: 1 },
  { id: 'P25', code: 'P25', status: 'occupied', statusLabel: 'OCCU', zoneCode: 'ZONE-A', row: 1 },
  // Accessible Bay A-03
  { id: 'A-03', code: 'A-03', status: 'accessible', statusLabel: 'ACCESS', hasInfo: true, vehicleType: 'accessible', zoneCode: 'ZONE-A', row: 1, isSpecial: true },
  // Zone B - Row 2
  { id: 'P26', code: 'P26', status: 'available', statusLabel: 'AVAI', zoneCode: 'ZONE-B', row: 2 },
  { id: 'P27', code: 'P27', status: 'available', statusLabel: 'AVAI', zoneCode: 'ZONE-B', row: 2 },
  { id: 'P28', code: 'P28', status: 'occupied', statusLabel: 'OCCU', zoneCode: 'ZONE-B', row: 2 },
  { id: 'P29', code: 'P29', status: 'available', statusLabel: 'AVAI', zoneCode: 'ZONE-B', row: 2 },
  { id: 'P30', code: 'P30', status: 'occupied', statusLabel: 'OCCU', zoneCode: 'ZONE-B', row: 2 },
];

const B2_EV_SLOTS: QuickSlotItem[] = [
  { id: 'EV-04', code: 'EV-04', status: 'available' },
  { id: 'EV-05', code: 'EV-05', status: 'available' },
];

const B2_MOTO_SLOTS: QuickSlotItem[] = [
  { id: 'M07', code: 'M07', status: 'available' },
  { id: 'M08', code: 'M08', status: 'occupied' },
  { id: 'M09', code: 'M09', status: 'available' },
];

// 3. FLOOR B3: Technical & Overflow Parking (10 Reserve slots + 1 Accessible + 1 EV + 2 Moto)
const B3_SLOTS_TEMPLATE: TemplateSlotItem[] = [
  // Zone A - Row 1
  { id: 'P31', code: 'P31', status: 'available', statusLabel: 'AVAI', zoneCode: 'ZONE-A', row: 1 },
  { id: 'P32', code: 'P32', status: 'available', statusLabel: 'AVAI', zoneCode: 'ZONE-A', row: 1 },
  { id: 'P33', code: 'P33', status: 'occupied', statusLabel: 'OCCU', zoneCode: 'ZONE-A', row: 1 },
  { id: 'P34', code: 'P34', status: 'available', statusLabel: 'AVAI', zoneCode: 'ZONE-A', row: 1 },
  { id: 'P35', code: 'P35', status: 'reserved', statusLabel: 'RESE', isLocked: true, zoneCode: 'ZONE-A', row: 1 },
  // Accessible Bay A-04
  { id: 'A-04', code: 'A-04', status: 'accessible', statusLabel: 'ACCESS', hasInfo: true, vehicleType: 'accessible', zoneCode: 'ZONE-A', row: 1, isSpecial: true },
  // Zone B - Row 2
  { id: 'P36', code: 'P36', status: 'available', statusLabel: 'AVAI', zoneCode: 'ZONE-B', row: 2 },
  { id: 'P37', code: 'P37', status: 'available', statusLabel: 'AVAI', zoneCode: 'ZONE-B', row: 2 },
  { id: 'P38', code: 'P38', status: 'available', statusLabel: 'AVAI', zoneCode: 'ZONE-B', row: 2 },
  { id: 'P39', code: 'P39', status: 'occupied', statusLabel: 'OCCU', zoneCode: 'ZONE-B', row: 2 },
  { id: 'P40', code: 'P40', status: 'available', statusLabel: 'AVAI', zoneCode: 'ZONE-B', row: 2 },
];

const B3_EV_SLOTS: QuickSlotItem[] = [
  { id: 'EV-06', code: 'EV-06', status: 'available' },
];

const B3_MOTO_SLOTS: QuickSlotItem[] = [
  { id: 'M10', code: 'M10', status: 'available' },
  { id: 'M11', code: 'M11', status: 'available' },
];

// 4. OUTDOOR: Ground-level Visitor, Drop-off & Solar EV Hub
const OUTDOOR_SLOTS_TEMPLATE: TemplateSlotItem[] = [
  // Zone V - Visitor Row 1
  { id: 'V01', code: 'V01', status: 'available', statusLabel: 'AVAI', zoneCode: 'ZONE-VISITOR', row: 1 },
  { id: 'V02', code: 'V02', status: 'occupied', statusLabel: 'OCCU', zoneCode: 'ZONE-VISITOR', row: 1 },
  { id: 'V03', code: 'V03', status: 'available', statusLabel: 'AVAI', zoneCode: 'ZONE-VISITOR', row: 1 },
  { id: 'V04', code: 'V04', status: 'available', statusLabel: 'AVAI', zoneCode: 'ZONE-VISITOR', row: 1 },
  // Zone V - Visitor Row 2
  { id: 'V05', code: 'V05', status: 'occupied', statusLabel: 'OCCU', zoneCode: 'ZONE-VISITOR', row: 2 },
  { id: 'V06', code: 'V06', status: 'available', statusLabel: 'AVAI', zoneCode: 'ZONE-VISITOR', row: 2 },
  { id: 'V07', code: 'V07', status: 'reserved', statusLabel: 'RESE', isLocked: true, zoneCode: 'ZONE-VISITOR', row: 2 },
  { id: 'V08', code: 'V08', status: 'available', statusLabel: 'AVAI', zoneCode: 'ZONE-VISITOR', row: 2 },
  // Quick Drop-off & Taxi Bays
  { id: 'DROP-01', code: 'DROP-01', status: 'available', statusLabel: 'AVAI', zoneCode: 'ZONE-DROPOFF', row: 1, isSpecial: true },
  { id: 'DROP-02', code: 'DROP-02', status: 'occupied', statusLabel: 'OCCU', zoneCode: 'ZONE-DROPOFF', row: 1, isSpecial: true },
  // VIP & Delivery Loading
  { id: 'VIP-01', code: 'VIP-01', status: 'reserved', statusLabel: 'RESE', isLocked: true, zoneCode: 'ZONE-SPECIAL', row: 2, isSpecial: true },
  { id: 'DELIV-01', code: 'DELIV-01', status: 'available', statusLabel: 'AVAI', zoneCode: 'ZONE-SPECIAL', row: 2, isSpecial: true },
];

const OUTDOOR_EV_SLOTS: QuickSlotItem[] = [
  { id: 'EV-OUT-01', code: 'EV-OUT-01', status: 'available' },
  { id: 'EV-OUT-02', code: 'EV-OUT-02', status: 'available' },
];

/**
 * Smart ParkingLotMap Component
 * Synchronized with the real database & occupancy charts.
 * Features distinct visual designs and layouts for every parking area:
 * - Tầng hầm B1 (Khu đỗ chính)
 * - Tầng hầm B2 (Khu mở rộng & Dài hạn)
 * - Tầng hầm B3 (Khu kỹ thuật & Dự phòng)
 * - Bãi ngoài trời & Khách vãng lai (OUTDOOR)
 */
export function ParkingLotMap({
  areaName = 'Tầng hầm B1',
  areaCode = 'B1',
  floor = -1,
  slots = [],
  zones = [],
  allAreas = [],
  selectedSlotId: controlledSelectedId,
  highlightedSlotId,
  onSelectSlot,
  isManager = false,
  onStatusChange,
  onReleaseSlot,
  occupancy,
  onFloorChange,
  className,
}: ParkingLotMapProps) {
  // Current active area code (B1, B2, B3, OUTDOOR)
  const [activeFloor, setActiveFloor] = useState<string>(areaCode || 'B1');

  // Currently inspected slot for Detail Panel
  const [internalSelectedSlot, setInternalSelectedSlot] = useState<any | null>(null);

  // Reservation modal state
  const [isReserveModalOpen, setIsReserveModalOpen] = useState<boolean>(false);
  const [slotToReserve, setSlotToReserve] = useState<any | null>(null);

  // Sync floor prop if changes
  useEffect(() => {
    if (areaCode && areaCode !== activeFloor) {
      setActiveFloor(areaCode);
    }
  }, [areaCode]);

  // Handle floor switching
  const handleFloorSelect = (floorStr: string) => {
    setActiveFloor(floorStr);
    setInternalSelectedSlot(null);
    onFloorChange?.(floorStr);
  };

  // Determine which template to render based on active floor
  const currentFloorKey = useMemo(() => {
    const norm = activeFloor.toUpperCase();
    if (norm.includes('OUT') || norm.includes('NGOÀI')) return 'OUTDOOR';
    if (norm.includes('B3')) return 'B3';
    if (norm.includes('B2')) return 'B2';
    return 'B1';
  }, [activeFloor]);

  const currentTemplate = useMemo(() => {
    switch (currentFloorKey) {
      case 'OUTDOOR':
        return OUTDOOR_SLOTS_TEMPLATE;
      case 'B3':
        return B3_SLOTS_TEMPLATE;
      case 'B2':
        return B2_SLOTS_TEMPLATE;
      case 'B1':
      default:
        return B1_SLOTS_TEMPLATE;
    }
  }, [currentFloorKey]);

  const currentEVSlots = useMemo(() => {
    switch (currentFloorKey) {
      case 'OUTDOOR':
        return OUTDOOR_EV_SLOTS;
      case 'B3':
        return B3_EV_SLOTS;
      case 'B2':
        return B2_EV_SLOTS;
      case 'B1':
      default:
        return B1_EV_SLOTS;
    }
  }, [currentFloorKey]);

  const currentMotoSlots = useMemo(() => {
    switch (currentFloorKey) {
      case 'OUTDOOR':
        return [];
      case 'B3':
        return B3_MOTO_SLOTS;
      case 'B2':
        return B2_MOTO_SLOTS;
      case 'B1':
      default:
        return B1_MOTO_SLOTS;
    }
  }, [currentFloorKey]);

interface MergedSlotItem extends ParkingSlotData {
  zoneCode: string;
  row: 1 | 2;
  isSpecial?: boolean;
}

  // Merge database slots into the visual grid
  const mergedSlots = useMemo<MergedSlotItem[]>(() => {
    const dbSlotsMap = new Map<string, any>();
    slots.forEach((s) => {
      if (s.code) {
        dbSlotsMap.set(s.code.toUpperCase(), s);
        const clean = s.code.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        dbSlotsMap.set(clean, s);
      }
      if (s.id) {
        dbSlotsMap.set(s.id, s);
      }
    });

    return currentTemplate.map((tpl): MergedSlotItem => {
      const dbMatch =
        dbSlotsMap.get(tpl.code) ||
        dbSlotsMap.get(tpl.id) ||
        dbSlotsMap.get(`${currentFloorKey}-${tpl.code}`) ||
        dbSlotsMap.get(tpl.code.replace('P', 'A')) ||
        dbSlotsMap.get(tpl.code.replace('P', 'B'));

      if (!dbMatch) {
        const vType: 'car' | 'motorcycle' | 'ev' | 'accessible' = tpl.vehicleType || 'car';
        return {
          id: tpl.id,
          code: tpl.code,
          status: tpl.status,
          vehicleType: vType,
          isLocked: tpl.isLocked,
          hasInfo: tpl.hasInfo,
          statusLabel: tpl.statusLabel,
          zoneCode: tpl.zoneCode,
          row: tpl.row,
          isSpecial: tpl.isSpecial,
          rawSlot: {
            id: tpl.id,
            code: tpl.code,
            status: tpl.status.toUpperCase(),
            type: (tpl.vehicleType?.toUpperCase() || 'CAR') as any,
            floor: currentFloorKey === 'B2' ? -2 : currentFloorKey === 'B3' ? -3 : currentFloorKey === 'OUTDOOR' ? 0 : -1,
            zone: { code: tpl.zoneCode, name: tpl.zoneCode },
            isReservable: tpl.status === 'available',
          },
        };
      }

      let visualStatus: ParkingSlotVisualStatus = 'available';
      const dbStatus = String(dbMatch.status).toUpperCase();
      if (dbStatus === 'OCCUPIED') visualStatus = 'occupied';
      else if (dbStatus === 'RESERVED') visualStatus = 'reserved';
      else if (dbStatus === 'MAINTENANCE') visualStatus = 'maintenance';
      else if (dbStatus === 'BLOCKED') visualStatus = 'unavailable';

      const isEV = dbMatch.type === 'EV' || tpl.vehicleType === 'ev';
      const isMoto = dbMatch.type === 'MOTORBIKE' || tpl.vehicleType === 'motorcycle';
      const isAccess = dbMatch.type === 'ACCESSIBLE' || tpl.vehicleType === 'accessible';
      const finalVType: 'car' | 'motorcycle' | 'ev' | 'accessible' = isAccess
        ? 'accessible'
        : isEV
        ? 'ev'
        : isMoto
        ? 'motorcycle'
        : 'car';

      return {
        id: dbMatch.id,
        code: dbMatch.code || tpl.code,
        status: visualStatus,
        vehicleType: finalVType,
        isLocked: visualStatus === 'reserved',
        hasInfo: isAccess,
        statusLabel:
          visualStatus === 'available'
            ? 'AVAI'
            : visualStatus === 'occupied'
            ? 'OCCU'
            : visualStatus === 'reserved'
            ? 'RESE'
            : visualStatus === 'maintenance'
            ? 'MAIN'
            : 'SLOT',
        zoneCode: tpl.zoneCode,
        row: tpl.row,
        isSpecial: tpl.isSpecial,
        rawSlot: dbMatch,
      };
    });
  }, [currentTemplate, slots, currentFloorKey]);

  // Compute Statistics: Synchronized with the active area in the Occupancy API
  const statistics = useMemo(() => {
    // Check if the occupancy API has metrics for this area
    const areaSummary = occupancy?.areas?.find(
      (a: any) =>
        a.areaCode.toUpperCase() === currentFloorKey ||
        a.areaCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === currentFloorKey
    );

    if (areaSummary?.metrics) {
      const m = areaSummary.metrics;
      const evCount = currentEVSlots.length;
      return {
        total: m.total || mergedSlots.length + currentEVSlots.length + currentMotoSlots.length,
        available: m.available ?? mergedSlots.filter((s) => s.status === 'available').length,
        occupied: m.occupied ?? mergedSlots.filter((s) => s.status === 'occupied').length,
        reserved: m.reserved ?? mergedSlots.filter((s) => s.status === 'reserved').length,
        evCharging: evCount,
      };
    }

    // Direct calculation from merged slots and utilities
    const totalSlots = mergedSlots.length + currentEVSlots.length + currentMotoSlots.length;
    const availableSlots =
      mergedSlots.filter((s) => s.status === 'available').length +
      currentEVSlots.filter((s) => s.status === 'available').length +
      currentMotoSlots.filter((s) => s.status === 'available').length;
    const occupiedSlots =
      mergedSlots.filter((s) => s.status === 'occupied').length +
      currentEVSlots.filter((s) => s.status === 'occupied').length +
      currentMotoSlots.filter((s) => s.status === 'occupied').length;
    const reservedSlots = mergedSlots.filter((s) => s.status === 'reserved').length;
    const evCount = currentEVSlots.length;

    return {
      total: totalSlots,
      available: availableSlots,
      occupied: occupiedSlots,
      reserved: reservedSlots,
      evCharging: evCount,
    };
  }, [occupancy, currentFloorKey, mergedSlots, currentEVSlots, currentMotoSlots]);

  // Selected slot state (default to P07 on initial load for B1, or null)
  const activeSelectedId =
    controlledSelectedId !== undefined
      ? controlledSelectedId
      : internalSelectedSlot?.id || (currentFloorKey === 'B1' ? 'P07' : null);

  const currentInspectedSlot = useMemo(() => {
    if (internalSelectedSlot) return internalSelectedSlot;
    if (!activeSelectedId) return null;
    const match = mergedSlots.find((s) => s.id === activeSelectedId || s.code === activeSelectedId);
    return match?.rawSlot || null;
  }, [internalSelectedSlot, activeSelectedId, mergedSlots]);

  const handleSlotClick = (slotObj: any) => {
    setInternalSelectedSlot(slotObj);
    onSelectSlot?.(slotObj);
  };

  const handleOpenReserve = (slotObj: any) => {
    setSlotToReserve(slotObj);
    setIsReserveModalOpen(true);
  };

  // Filter slots for Row 1 and Row 2 of zones
  const zoneARow1 = useMemo(
    () => mergedSlots.filter((s) => s.zoneCode.includes('A') && s.row === 1 && !s.isSpecial),
    [mergedSlots]
  );
  const zoneASpecial = useMemo(
    () => mergedSlots.find((s) => s.zoneCode.includes('A') && s.isSpecial) || null,
    [mergedSlots]
  );
  const zoneARow2 = useMemo(
    () => mergedSlots.filter((s) => s.zoneCode.includes('A') && s.row === 2),
    [mergedSlots]
  );

  const zoneBRow1 = useMemo(
    () => mergedSlots.filter((s) => s.zoneCode.includes('B') && s.row === 1 && !s.isSpecial),
    [mergedSlots]
  );
  const zoneBSpecial = useMemo(
    () => mergedSlots.find((s) => s.zoneCode.includes('B') && s.isSpecial) || null,
    [mergedSlots]
  );
  const zoneBRow2 = useMemo(
    () => mergedSlots.filter((s) => s.zoneCode.includes('B') && s.row === 2),
    [mergedSlots]
  );

  // For Outdoor Zone V (Visitor)
  const outdoorVisitorRow1 = useMemo(
    () => mergedSlots.filter((s) => s.zoneCode === 'ZONE-VISITOR' && s.row === 1),
    [mergedSlots]
  );
  const outdoorVisitorRow2 = useMemo(
    () => mergedSlots.filter((s) => s.zoneCode === 'ZONE-VISITOR' && s.row === 2),
    [mergedSlots]
  );
  const outdoorSpecialSlots = useMemo(
    () => mergedSlots.filter((s) => s.zoneCode === 'ZONE-DROPOFF' || s.zoneCode === 'ZONE-SPECIAL'),
    [mergedSlots]
  );

  // Available floors list for selector
  const availableFloors = useMemo(() => {
    if (allAreas && allAreas.length > 0) {
      return allAreas.map((a: any) => ({
        code: a.code,
        label: a.code === 'OUTDOOR' ? 'Ngoài trời' : a.code,
      }));
    }
    return [
      { code: 'B1', label: 'B1' },
      { code: 'B2', label: 'B2' },
      { code: 'B3', label: 'B3' },
      { code: 'OUTDOOR', label: 'Ngoài trời' },
    ];
  }, [allAreas]);

  return (
    <div className={cn('space-y-5', className)}>
      {/* ──────────────────────────────────────────────────────────────────
          1. HEADER & AREA SWITCHER
          ────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            <span>Quản Lý Bãi Đỗ Xe</span>
            <span>&gt;</span>
            <span className="text-[#0F6B4F] dark:text-emerald-400 font-bold">Sơ Đồ Bãi Đỗ Xe Thông Minh</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {currentFloorKey === 'OUTDOOR'
              ? 'Sơ Đồ Bãi Đỗ Xe Ngoài Trời'
              : `Sơ Đồ Bãi Đỗ Xe — ${currentFloorKey}`}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {areaName} • Đồng bộ công suất biểu đồ thời gian thực
          </p>
        </div>

        {/* Floor/Area Selector (B1, B2, B3, OUTDOOR) */}
        <div className="shrink-0">
          <ParkingFloorSelector
            floors={availableFloors}
            activeFloor={activeFloor}
            onSelectFloor={handleFloorSelect}
          />
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────
          2. KPI STATISTICS BAR (5 Cards synchronized with chart)
          ────────────────────────────────────────────────────────────────── */}
      <ParkingStatistics
        total={statistics.total}
        available={statistics.available}
        occupied={statistics.occupied}
        reserved={statistics.reserved}
        evCharging={statistics.evCharging}
      />

      {/* ──────────────────────────────────────────────────────────────────
          3. MAIN LAYOUT: Interactive Map Canvas + Right Detail Panel
          ────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Map Canvas */}
        <div className="xl:col-span-8 2xl:col-span-9 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm">
          {/* Top Bar: Live Status & Legend */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#22C55E]"></span>
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Sơ đồ trực tiếp — {areaName}
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                Đồng bộ cảm biến AI & ANPR
              </span>
            </div>

            <ParkingLegend />
          </div>

          {/* ──────────────────────────────────────────────────────────────────
              LAYOUT A: FLOOR B1 (MAIN BASEMENT PARKING)
              ────────────────────────────────────────────────────────────────── */}
          {currentFloorKey === 'B1' && (
            <div className="space-y-4 pt-4">
              {/* Entry & Security */}
              <div className="flex items-center gap-3">
                <ParkingEntrance />
                <SecurityBooth />
              </div>

              {/* Lane A */}
              <DrivingLane label="→ LÀN A →" />

              {/* Zone A */}
              <ParkingZone
                zoneCode="ZONE-A"
                zoneName="KHU A — Ô TÔ & SUẤT ƯU TIÊN"
                row1Slots={zoneARow1}
                specialSlot={zoneASpecial}
                row2Slots={zoneARow2}
                selectedSlotId={activeSelectedId}
                onSelectSlot={handleSlotClick}
                showLaneBelow={true}
              />

              {/* Mid One-way Lane */}
              <DrivingLane isOneWay={true} />

              {/* Zone B */}
              <ParkingZone
                zoneCode="ZONE-B"
                zoneName="KHU B — Ô TÔ TIÊU CHUẨN"
                row1Slots={zoneBRow1}
                specialSlot={zoneBSpecial}
                row2Slots={zoneBRow2}
                selectedSlotId={activeSelectedId}
                onSelectSlot={handleSlotClick}
                showLaneBelow={true}
              />

              {/* Bottom Lane */}
              <DrivingLane isOneWay={true} />

              {/* Bottom Utilities */}
              <div className="pt-2 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                <div className="md:col-span-3">
                  <EVChargingZone
                    slots={currentEVSlots}
                    selectedSlotId={activeSelectedId}
                    onSelectSlot={handleSlotClick}
                  />
                </div>
                <div className="md:col-span-4">
                  <MotorcycleZone
                    slots={currentMotoSlots}
                    selectedSlotId={activeSelectedId}
                    onSelectSlot={handleSlotClick}
                  />
                </div>
                <div className="md:col-span-3">
                  <FacilitiesBox />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <ParkingExit />
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────────
              LAYOUT B: FLOOR B2 (EXPANSION & LONG-TERM PARKING)
              ────────────────────────────────────────────────────────────────── */}
          {currentFloorKey === 'B2' && (
            <div className="space-y-4 pt-4">
              {/* Ramp Entry from B1 */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0F6B4F] text-white text-xs font-mono font-bold tracking-wider">
                  <ArrowDown className="w-3.5 h-3.5" />
                  <span>ĐƯỜNG DỐC TỪ HẦM B1 XUỐNG</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <Shield className="w-3.5 h-3.5 text-[#0F6B4F]" />
                  <span>CHỐT GIÁM SÁT HẦM B2</span>
                </div>
              </div>

              {/* Lane B2 */}
              <DrivingLane label="→ LÀN B2 (LỐI VÀO KHU VỰC CƯ DÂN DÀI HẠN) →" />

              {/* Zone A B2: Resident Assigned Slots */}
              <ParkingZone
                zoneCode="ZONE-A"
                zoneName="KHU A (B2) — SUẤT ĐỖ ĐỊNH DANH CƯ DÂN"
                row1Slots={zoneARow1}
                specialSlot={zoneASpecial}
                row2Slots={[]}
                selectedSlotId={activeSelectedId}
                onSelectSlot={handleSlotClick}
                showLaneBelow={false}
              />

              {/* Mid Lane with service indicators */}
              <div className="w-full py-2.5 flex items-center justify-center gap-3 select-none text-[10px] font-bold tracking-widest uppercase text-slate-500">
                <div className="flex-1 border-b border-dashed border-slate-300 dark:border-slate-700" />
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span>← ← KHU VỰC ĐỖ XE DÀI HẠN & MỞ RỘNG → →</span>
                </div>
                <div className="flex-1 border-b border-dashed border-slate-300 dark:border-slate-700" />
              </div>

              {/* Zone B B2: Long-term standard */}
              <ParkingZone
                zoneCode="ZONE-B"
                zoneName="KHU B (B2) — Ô TÔ GỬI THÁNG & LƯU BÃI"
                row1Slots={zoneBRow2}
                row2Slots={[]}
                selectedSlotId={activeSelectedId}
                onSelectSlot={handleSlotClick}
                showLaneBelow={false}
              />

              {/* Bottom Ramp Lane */}
              <DrivingLane isOneWay={true} label="→ LÀN XE HƯỚNG RA ĐƯỜNG DỐC LÊN B1 →" />

              {/* Bottom Utilities for B2 */}
              <div className="pt-2 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                <div className="md:col-span-3">
                  <EVChargingZone
                    slots={currentEVSlots}
                    selectedSlotId={activeSelectedId}
                    onSelectSlot={handleSlotClick}
                  />
                </div>
                <div className="md:col-span-4">
                  <MotorcycleZone
                    slots={currentMotoSlots}
                    selectedSlotId={activeSelectedId}
                    onSelectSlot={handleSlotClick}
                  />
                </div>
                <div className="md:col-span-3">
                  {/* Custom B2 Facilities */}
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-3 bg-white/80 dark:bg-slate-900/80 shadow-2xs">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 block">
                      TIỆN ÍCH HẦM B2
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                        <Building className="w-3 h-3 text-blue-500" />
                        <span>THANG KỸ THUẬT</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                        <LogOut className="w-3 h-3 text-rose-500" />
                        <span>CỬA CHỐNG CHÁY</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                        <Footprints className="w-3 h-3 text-amber-500" />
                        <span>QUẠT THÔNG GIÓ</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                        <Zap className="w-3 h-3 text-emerald-500" />
                        <span>TRẠM BIẾN ÁP</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <div className="px-3 py-1.5 rounded-xl bg-amber-600 text-white font-mono text-xs font-bold flex items-center gap-1.5 shadow-sm">
                    <ArrowUp className="w-3.5 h-3.5" />
                    <span>LÊN HẦM B1 →</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────────
              LAYOUT C: FLOOR B3 (TECHNICAL & OVERFLOW PARKING)
              ────────────────────────────────────────────────────────────────── */}
          {currentFloorKey === 'B3' && (
            <div className="space-y-4 pt-4">
              {/* Ramp Entry from B2 */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-mono font-bold tracking-wider">
                  <ArrowDown className="w-3.5 h-3.5 text-amber-400" />
                  <span>ĐƯỜNG DỐC TỪ HẦM B2 XUỐNG</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs font-semibold text-amber-800 dark:text-amber-300">
                  <Wrench className="w-3.5 h-3.5" />
                  <span>TRẠM BẢO TRÌ & LƯU XE DỰ PHÒNG</span>
                </div>
              </div>

              {/* Technical Lane */}
              <DrivingLane label="→ LÀN XE KỸ THUẬT & DỰ PHÒNG →" />

              {/* Zone A B3 */}
              <ParkingZone
                zoneCode="ZONE-A"
                zoneName="KHU A (B3) — XE LƯU DỰ PHÒNG & KỸ THUẬT"
                row1Slots={zoneARow1}
                specialSlot={zoneASpecial}
                row2Slots={[]}
                selectedSlotId={activeSelectedId}
                onSelectSlot={handleSlotClick}
                showLaneBelow={false}
              />

              {/* Special Technical Bay in middle */}
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500 text-white">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                      TECH-01 • TRẠM BƠM LỐP TỰ ĐỘNG & BẢO TRÌ KHẨN CẤP
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Miễn phí cho cư dân • Thiết bị đo áp suất lốp & nạp ắc quy di động
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                  SẴN SÀNG HOẠT ĐỘNG
                </span>
              </div>

              {/* Zone B B3 */}
              <ParkingZone
                zoneCode="ZONE-B"
                zoneName="KHU B (B3) — Ô ĐỖ DỰ PHÒNG MÙA CAO ĐIỂM"
                row1Slots={zoneBRow2}
                row2Slots={[]}
                selectedSlotId={activeSelectedId}
                onSelectSlot={handleSlotClick}
                showLaneBelow={false}
              />

              {/* Bottom lane */}
              <DrivingLane isOneWay={true} label="→ LÀN THOÁT HIỂM & ĐƯỜNG DỐC LÊN B2 →" />

              {/* Bottom Utilities for B3 */}
              <div className="pt-2 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                <div className="md:col-span-3">
                  <EVChargingZone
                    slots={currentEVSlots}
                    selectedSlotId={activeSelectedId}
                    onSelectSlot={handleSlotClick}
                  />
                </div>
                <div className="md:col-span-4">
                  <MotorcycleZone
                    slots={currentMotoSlots}
                    selectedSlotId={activeSelectedId}
                    onSelectSlot={handleSlotClick}
                  />
                </div>
                <div className="md:col-span-3">
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-3 bg-white/80 dark:bg-slate-900/80 shadow-2xs">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 block">
                      HỆ THỐNG KỸ THUẬT B3
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                        <Building className="w-3 h-3 text-blue-500" />
                        <span>THANG DỊCH VỤ</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                        <LogOut className="w-3 h-3 text-rose-500" />
                        <span>BƠM CỨU HỎA</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                        <Footprints className="w-3 h-3 text-amber-500" />
                        <span>HỐ THU NƯỚC</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                        <Zap className="w-3 h-3 text-emerald-500" />
                        <span>MÁY PHÁT ĐIỆN</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <div className="px-3 py-1.5 rounded-xl bg-slate-700 text-white font-mono text-xs font-bold flex items-center gap-1.5 shadow-sm">
                    <ArrowUp className="w-3.5 h-3.5" />
                    <span>LÊN HẦM B2 →</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────────
              LAYOUT D: OUTDOOR (GROUND LEVEL VISITOR & DROP-OFF)
              ────────────────────────────────────────────────────────────────── */}
          {currentFloorKey === 'OUTDOOR' && (
            <div className="space-y-4 pt-4">
              {/* Outdoor Main Entrance with ANPR Camera */}
              <div className="flex items-center justify-between flex-wrap gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-transparent border border-emerald-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[#0F6B4F] text-white">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>CỔNG VÀO CHÍNH — CAMERA ANPR NHẬN DIỆN BIỂN SỐ TỰ ĐỘNG</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-mono">
                        AI LIVE
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Tự động mở barie cho cư dân • Phát vé từ điện tử QR cho khách vãng lai
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <SecurityBooth />
                </div>
              </div>

              {/* Outdoor Main Lane */}
              <DrivingLane label="→ LÀN TIẾP ĐÓN KHÁCH VÃNG LAI & TAXI →" />

              {/* Zone V: Visitor Parking with Canopies */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      KHU V — Ô ĐỖ KHÁCH VÃNG LAI (MÁI CHE CÁCH NHIỆT)
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">Tối đa 4 giờ gửi liên tục</span>
                </div>

                {/* Visitor Row 1 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {outdoorVisitorRow1.map((slot) => {
                    const isSelected = activeSelectedId === slot.id;
                    return (
                      <ParkingSlot
                        key={slot.id}
                        id={slot.id}
                        code={slot.code}
                        status={isSelected ? 'selected' : slot.status}
                        vehicleType="car"
                        isSelected={isSelected}
                        isLocked={slot.isLocked}
                        statusLabel={slot.statusLabel}
                        onClick={() => handleSlotClick(slot.rawSlot || slot)}
                      />
                    );
                  })}
                </div>

                {/* Visitor Row 2 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                  {outdoorVisitorRow2.map((slot) => {
                    const isSelected = activeSelectedId === slot.id;
                    return (
                      <ParkingSlot
                        key={slot.id}
                        id={slot.id}
                        code={slot.code}
                        status={isSelected ? 'selected' : slot.status}
                        vehicleType="car"
                        isSelected={isSelected}
                        isLocked={slot.isLocked}
                        statusLabel={slot.statusLabel}
                        onClick={() => handleSlotClick(slot.rawSlot || slot)}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Drop-off & Taxi Lane */}
              <div className="w-full py-2 flex items-center justify-center gap-3 select-none text-[10px] font-bold tracking-widest uppercase text-amber-600 dark:text-amber-400">
                <div className="flex-1 border-b border-dashed border-amber-300 dark:border-amber-700/60" />
                <div className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700">
                  <span>🚕 LÀN DỪNG ĐÓN TRẢ NHANH DƯỚI 15 PHÚT (DROP-OFF ZONE) 🚕</span>
                </div>
                <div className="flex-1 border-b border-dashed border-amber-300 dark:border-amber-700/60" />
              </div>

              {/* Quick Drop-off + VIP + Loading Bays */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 block">
                  LÀN ĐÓN TRẢ TAXI & KHU VỰC DỊCH VỤ / VIP
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {outdoorSpecialSlots.map((slot) => {
                    const isSelected = activeSelectedId === slot.id;
                    return (
                      <ParkingSlot
                        key={slot.id}
                        id={slot.id}
                        code={slot.code}
                        status={isSelected ? 'selected' : slot.status}
                        vehicleType="car"
                        isSelected={isSelected}
                        isLocked={slot.isLocked}
                        statusLabel={slot.statusLabel}
                        onClick={() => handleSlotClick(slot.rawSlot || slot)}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Bottom Lane */}
              <DrivingLane isOneWay={true} label="→ LỐI RA ĐƯỜNG NỘI KHU VÀ ĐẠI LỘ CHÍNH →" />

              {/* Outdoor Utilities: Solar EV + Amenities + Main Exit */}
              <div className="pt-2 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                {/* Solar EV Hub */}
                <div className="md:col-span-5">
                  <div className="rounded-2xl border-2 border-emerald-500/40 p-3 bg-emerald-50/50 dark:bg-emerald-950/20">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F6B4F] dark:text-emerald-300 uppercase tracking-wider mb-2">
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      <span>TRẠM SẠC ĐIỆN NĂNG LƯỢNG MẶT TRỜI 50KW</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {currentEVSlots.map((s) => {
                        const isSelected = activeSelectedId === s.id;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => handleSlotClick(s)}
                            className={cn(
                              'flex-1 flex flex-col items-center justify-center py-2 px-2 rounded-xl border transition-all cursor-pointer',
                              'bg-white dark:bg-slate-900 border-[#22C55E]/50 dark:border-emerald-500/50',
                              isSelected &&
                                'border-2 border-[#0F6B4F] ring-2 ring-[#0F6B4F]/30 bg-[#E8F5ED]'
                            )}
                          >
                            <Zap className="w-3.5 h-3.5 text-[#0F6B4F] dark:text-emerald-400 mb-1" />
                            <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">
                              {s.code}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Outdoor Facilities */}
                <div className="md:col-span-5">
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-3 bg-white/80 dark:bg-slate-900/80 shadow-2xs">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 block">
                      TIỆN ÍCH NGOÀI TRỜI
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                        <Building className="w-3 h-3 text-blue-500" />
                        <span>SẢNH ĐÓN CHÍNH</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                        <Shield className="w-3 h-3 text-emerald-500" />
                        <span>BỐT BẢO VỆ</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                        <Sun className="w-3 h-3 text-amber-500" />
                        <span>CẢNH QUAN XANH</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                        <Car className="w-3 h-3 text-purple-500" />
                        <span>ĐIỂM GỌI TAXI</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Exit Gate */}
                <div className="md:col-span-2 flex justify-end">
                  <div className="px-3 py-2 rounded-xl bg-rose-600 text-white font-mono text-xs font-bold flex items-center gap-1.5 shadow-sm text-center">
                    <LogOut className="w-3.5 h-3.5" />
                    <span>LỐI RA ĐƯỜNG CHÍNH →</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Detail Panel */}
        <div className="xl:col-span-4 2xl:col-span-3 sticky top-4">
          <ParkingDetailPanel
            slot={currentInspectedSlot}
            areaCode={currentFloorKey}
            areaName={areaName}
            stats={statistics}
            onClose={() => setInternalSelectedSlot(null)}
            onReserve={handleOpenReserve}
            isManager={isManager}
            onStatusChange={onStatusChange}
            onReleaseSlot={onReleaseSlot}
          />
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────
          4. RESIDENT PARKING RESERVATION MODAL
          ────────────────────────────────────────────────────────────────── */}
      {isReserveModalOpen && slotToReserve && (
        <ParkingRequestModal
          slot={slotToReserve}
          isOpen={isReserveModalOpen}
          onClose={() => {
            setIsReserveModalOpen(false);
            setSlotToReserve(null);
          }}
          onSuccess={() => {
            setIsReserveModalOpen(false);
            setSlotToReserve(null);
          }}
        />
      )}
    </div>
  );
}

export default ParkingLotMap;
