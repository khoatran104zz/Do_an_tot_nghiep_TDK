'use client';

import React from 'react';
import { ParkingSlot, ParkingSlotVisualStatus } from './ParkingSlot';
import { DrivingLane } from './DrivingLane';
import { cn } from '@/lib/utils';

export interface ParkingSlotData {
  id: string;
  code: string;
  status: ParkingSlotVisualStatus;
  vehicleType?: 'car' | 'motorcycle' | 'ev' | 'accessible';
  isLocked?: boolean;
  hasInfo?: boolean;
  statusLabel?: string;
  rawSlot?: any;
}

export interface ParkingZoneProps {
  zoneCode: string;
  zoneName: string;
  row1Slots: ParkingSlotData[];
  row2Slots: ParkingSlotData[];
  specialSlot?: ParkingSlotData | null;
  selectedSlotId?: string | null;
  onSelectSlot: (slot: any) => void;
  showLaneBelow?: boolean;
  className?: string;
}

/**
 * ParkingZone Component
 * Renders Zone A / Zone B parking blocks with exact slot layout matching Figma design:
 * - Zone header
 * - 5-slot grid for Row 1
 * - Special bay (e.g. A-01 Accessible) if present
 * - 5-slot grid for Row 2
 * - Optional one-way traffic lane underneath
 */
export function ParkingZone({
  zoneCode,
  zoneName,
  row1Slots,
  row2Slots,
  specialSlot,
  selectedSlotId,
  onSelectSlot,
  showLaneBelow = true,
  className,
}: ParkingZoneProps) {
  return (
    <div className={cn('space-y-2.5', className)}>
      {/* Zone Label */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {zoneName || zoneCode}
        </span>
      </div>

      {/* Row 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
        {row1Slots.map((slot) => {
          const isSelected = selectedSlotId === slot.id;
          return (
            <ParkingSlot
              key={slot.id}
              id={slot.id}
              code={slot.code}
              status={isSelected ? 'selected' : slot.status}
              vehicleType={slot.vehicleType}
              isSelected={isSelected}
              isLocked={slot.isLocked}
              hasInfo={slot.hasInfo}
              statusLabel={slot.statusLabel}
              onClick={() => onSelectSlot(slot.rawSlot || slot)}
            />
          );
        })}
      </div>

      {/* Special offset slot if present (like A-01 in Zone A) */}
      {specialSlot && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 py-0.5">
          <ParkingSlot
            key={specialSlot.id}
            id={specialSlot.id}
            code={specialSlot.code}
            status={
              selectedSlotId === specialSlot.id ? 'selected' : specialSlot.status
            }
            vehicleType={specialSlot.vehicleType}
            isSelected={selectedSlotId === specialSlot.id}
            isLocked={specialSlot.isLocked}
            hasInfo={specialSlot.hasInfo}
            statusLabel={specialSlot.statusLabel}
            onClick={() => onSelectSlot(specialSlot.rawSlot || specialSlot)}
          />
        </div>
      )}

      {/* Row 2 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
        {row2Slots.map((slot) => {
          const isSelected = selectedSlotId === slot.id;
          return (
            <ParkingSlot
              key={slot.id}
              id={slot.id}
              code={slot.code}
              status={isSelected ? 'selected' : slot.status}
              vehicleType={slot.vehicleType}
              isSelected={isSelected}
              isLocked={slot.isLocked}
              hasInfo={slot.hasInfo}
              statusLabel={slot.statusLabel}
              onClick={() => onSelectSlot(slot.rawSlot || slot)}
            />
          );
        })}
      </div>

      {/* Traffic lane underneath */}
      {showLaneBelow && <DrivingLane isOneWay={true} />}
    </div>
  );
}

export default ParkingZone;
