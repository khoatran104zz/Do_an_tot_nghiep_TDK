'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { apartmentClientService } from '@/services/apartment.service';

export interface BuildingItem {
  id: string;
  code: string;
  name: string;
  address?: string | null;
}

interface BuildingContextType {
  selectedBuildingId: string | null;
  setSelectedBuildingId: (id: string | null) => void;
  buildings: BuildingItem[];
  activeBuilding: BuildingItem | null;
  isLoading: boolean;
  isAllSelected: boolean;
}

const BuildingContext = createContext<BuildingContextType | undefined>(undefined);

export function BuildingProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const user = session?.user;

  const [selectedBuildingId, setSelectedBuildingIdState] = useState<string | null>(null);

  // Fetch available buildings for current user
  const { data: response, isLoading } = useQuery({
    queryKey: ['user-available-buildings', user?.id, user?.role],
    queryFn: async () => {
      const res = await fetch('/api/buildings');
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    },
    enabled: !!user && user.role !== 'RESIDENT',
  });

  const buildings: BuildingItem[] = Array.isArray(response) ? response : [];

  // Initialize selected building from localStorage or default
  useEffect(() => {
    if (buildings.length > 0) {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('smart_apt_selected_building') : null;

      if (user?.role === 'ADMIN') {
        if (saved && (saved === 'ALL' || buildings.some((b) => b.id === saved))) {
          setSelectedBuildingIdState(saved === 'ALL' ? null : saved);
        } else {
          setSelectedBuildingIdState(null); // Default to ALL for Admin
        }
      } else {
        // MANAGER or other role: NEVER allowed to have ALL or null if buildings exist
        if (saved && saved !== 'ALL' && buildings.some((b) => b.id === saved)) {
          setSelectedBuildingIdState(saved);
        } else {
          const firstAssigned = buildings[0]?.id || null;
          setSelectedBuildingIdState(firstAssigned);
          if (firstAssigned && typeof window !== 'undefined') {
            localStorage.setItem('smart_apt_selected_building', firstAssigned);
          }
        }
      }
    }
  }, [buildings, user?.role]);

  const setSelectedBuildingId = (id: string | null) => {
    if (user?.role !== 'ADMIN' && id === null) {
      // Non-admins cannot select ALL
      return;
    }
    setSelectedBuildingIdState(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('smart_apt_selected_building', id || 'ALL');
    }
  };

  const activeBuilding = buildings.find((b) => b.id === selectedBuildingId) || null;
  const isAllSelected = user?.role === 'ADMIN' && selectedBuildingId === null;

  return (
    <BuildingContext.Provider
      value={{
        selectedBuildingId,
        setSelectedBuildingId,
        buildings,
        activeBuilding,
        isLoading,
        isAllSelected,
      }}
    >
      {children}
    </BuildingContext.Provider>
  );
}

const fallbackContext: BuildingContextType = {
  selectedBuildingId: 'ALL',
  setSelectedBuildingId: () => {},
  buildings: [],
  activeBuilding: null,
  isLoading: false,
  isAllSelected: true,
};

export function useBuildingContext() {
  const context = useContext(BuildingContext);
  return context || fallbackContext;
}
