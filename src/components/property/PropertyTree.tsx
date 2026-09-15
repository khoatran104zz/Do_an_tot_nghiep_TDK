'use client';

import React, { useState, useMemo } from 'react';
import {
  Building2,
  Layers,
  Hash,
  Home,
  ChevronRight,
  ChevronDown,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Wrench,
  Receipt,
  Users,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type SelectedNodeType = 'BUILDING' | 'BLOCK' | 'FLOOR' | 'APARTMENT';

export interface SelectedNode {
  type: SelectedNodeType;
  id: string;
  data: any;
  parentPath?: {
    buildingName?: string;
    buildingId?: string;
    blockName?: string;
    blockId?: string;
    floorName?: string;
    floorId?: string;
  };
}

interface PropertyTreeProps {
  hierarchy?: any[];
  buildings?: any[];
  isLoading?: boolean;
  selectedNode: SelectedNode | null;
  onSelectNode: (node: SelectedNode) => void;
  onAddBuilding?: () => void;
  onAddBlock?: (buildingId: string) => void;
  onAddFloor?: (blockId: string) => void;
  onAddApartment?: (floorId: string) => void;
  className?: string;
}

export function PropertyTree({
  hierarchy,
  buildings,
  isLoading,
  selectedNode,
  onSelectNode,
  onAddBuilding,
  onAddBlock,
  onAddFloor,
  onAddApartment,
  className,
}: PropertyTreeProps) {
  const treeData = hierarchy || buildings || [];
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const toggleExpand = (nodeKey: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeKey]: !prev[nodeKey],
    }));
  };

  // Filter hierarchy based on search term
  const filteredHierarchy = useMemo(() => {
    if (!searchTerm.trim()) return treeData;
    const term = searchTerm.toLowerCase();

    return treeData
      .map((building) => {
        const matchesBuilding =
          building.name.toLowerCase().includes(term) || building.code.toLowerCase().includes(term);

        const filteredBlocks = (building.blocks || [])
          .map((block: any) => {
            const matchesBlock =
              block.name.toLowerCase().includes(term) || block.code.toLowerCase().includes(term);

            const filteredFloors = (block.floors || [])
              .map((floor: any) => {
                const matchesFloor =
                  floor.name.toLowerCase().includes(term) ||
                  floor.floorNumber.toString().includes(term);

                const filteredApts = (floor.apartments || []).filter(
                  (apt: any) =>
                    apt.code.toLowerCase().includes(term) ||
                    apt.residents?.some((r: any) => r.fullName?.toLowerCase().includes(term))
                );

                if (matchesFloor || filteredApts.length > 0) {
                  return { ...floor, apartments: filteredApts };
                }
                return null;
              })
              .filter(Boolean);

            if (matchesBlock || filteredFloors.length > 0) {
              return { ...block, floors: filteredFloors };
            }
            return null;
          })
          .filter(Boolean);

        if (matchesBuilding || filteredBlocks.length > 0) {
          return { ...building, blocks: filteredBlocks };
        }
        return null;
      })
      .filter(Boolean);
  }, [hierarchy, searchTerm]);

  // Expand all when searching
  const isSearching = searchTerm.trim().length > 0;

  return (
    <div className={cn('flex flex-col h-full bg-card rounded-xl border shadow-sm overflow-hidden', className)}>
      {/* Tree Header & Search */}
      <div className="p-3.5 border-b bg-muted/40 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Sơ đồ Cấu trúc</h3>
          </div>
          <Badge variant="outline" className="text-[11px] font-mono">
            {treeData.length} Tòa nhà
          </Badge>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Tìm theo mã căn, tầng, tháp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-8 text-xs bg-background"
          />
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 text-xs">
        {filteredHierarchy.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <p className="text-xs">Không tìm thấy cấu trúc phù hợp</p>
          </div>
        ) : (
          filteredHierarchy.map((building) => {
            const buildingKey = `building-${building.id}`;
            const isBuildingExpanded = isSearching || expandedNodes[buildingKey] !== false;
            const isBuildingSelected =
              selectedNode?.type === 'BUILDING' && selectedNode.id === building.id;

            const totalApts = (building.blocks || []).reduce(
              (sum: number, b: any) =>
                sum +
                (b.floors || []).reduce(
                  (fSum: number, f: any) => fSum + (f.apartments?.length || 0),
                  0
                ),
              0
            );

            return (
              <div key={building.id} className="space-y-0.5">
                {/* Building Item */}
                <div
                  onClick={() =>
                    onSelectNode({
                      type: 'BUILDING',
                      id: building.id,
                      data: building,
                      parentPath: {
                        buildingName: building.name,
                        buildingId: building.id,
                      },
                    })
                  }
                  className={cn(
                    'group flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors select-none',
                    isBuildingSelected
                      ? 'bg-primary text-primary-foreground font-medium shadow-xs'
                      : 'hover:bg-muted text-foreground'
                  )}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <button
                      type="button"
                      onClick={(e) => toggleExpand(buildingKey, e)}
                      className="p-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors"
                    >
                      {isBuildingExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                      )}
                    </button>
                    <Building2 className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                    <span className="truncate font-semibold">{building.name}</span>
                  </div>
                  <Badge
                    variant={isBuildingSelected ? 'secondary' : 'outline'}
                    className="text-[10px] px-1.5 py-0 h-4 font-mono shrink-0"
                  >
                    {building.blocks?.length || 0} tháp
                  </Badge>
                </div>

                {/* Blocks list */}
                {isBuildingExpanded && (
                  <div className="pl-4 ml-2 border-l border-border/60 space-y-0.5">
                    {(building.blocks || []).map((block: any) => {
                      const blockKey = `block-${block.id}`;
                      const isBlockExpanded = isSearching || expandedNodes[blockKey] === true;
                      const isBlockSelected =
                        selectedNode?.type === 'BLOCK' && selectedNode.id === block.id;

                      const blockAptsCount = (block.floors || []).reduce(
                        (sum: number, f: any) => sum + (f.apartments?.length || 0),
                        0
                      );

                      return (
                        <div key={block.id} className="space-y-0.5">
                          {/* Block Item */}
                          <div
                            onClick={() =>
                              onSelectNode({
                                type: 'BLOCK',
                                id: block.id,
                                data: block,
                                parentPath: {
                                  buildingName: building.name,
                                  buildingId: building.id,
                                  blockName: block.name,
                                  blockId: block.id,
                                },
                              })
                            }
                            className={cn(
                              'group flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-colors select-none',
                              isBlockSelected
                                ? 'bg-primary/90 text-primary-foreground font-medium'
                                : 'hover:bg-muted text-foreground'
                            )}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <button
                                type="button"
                                onClick={(e) => toggleExpand(blockKey, e)}
                                className="p-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors"
                              >
                                {isBlockExpanded ? (
                                  <ChevronDown className="h-3 w-3 shrink-0" />
                                ) : (
                                  <ChevronRight className="h-3 w-3 shrink-0" />
                                )}
                              </button>
                              <Layers className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                              <span className="truncate font-medium">{block.name}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground group-hover:text-foreground">
                              {blockAptsCount} căn
                            </span>
                          </div>

                          {/* Floors list */}
                          {isBlockExpanded && (
                            <div className="pl-4 ml-2 border-l border-border/60 space-y-0.5">
                              {(block.floors || []).map((floor: any) => {
                                const floorKey = `floor-${floor.id}`;
                                const isFloorExpanded =
                                  isSearching || expandedNodes[floorKey] === true;
                                const isFloorSelected =
                                  selectedNode?.type === 'FLOOR' && selectedNode.id === floor.id;

                                return (
                                  <div key={floor.id} className="space-y-0.5">
                                    {/* Floor Item */}
                                    <div
                                      onClick={() =>
                                        onSelectNode({
                                          type: 'FLOOR',
                                          id: floor.id,
                                          data: floor,
                                          parentPath: {
                                            buildingName: building.name,
                                            buildingId: building.id,
                                            blockName: block.name,
                                            blockId: block.id,
                                            floorName: floor.name,
                                            floorId: floor.id,
                                          },
                                        })
                                      }
                                      className={cn(
                                        'group flex items-center justify-between px-2 py-1 rounded-md cursor-pointer transition-colors select-none',
                                        isFloorSelected
                                          ? 'bg-primary/80 text-primary-foreground font-medium'
                                          : 'hover:bg-muted/70 text-foreground/90'
                                      )}
                                    >
                                      <div className="flex items-center gap-1.5 truncate">
                                        <button
                                          type="button"
                                          onClick={(e) => toggleExpand(floorKey, e)}
                                          className="p-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors"
                                        >
                                          {isFloorExpanded ? (
                                            <ChevronDown className="h-2.5 w-2.5 shrink-0" />
                                          ) : (
                                            <ChevronRight className="h-2.5 w-2.5 shrink-0" />
                                          )}
                                        </button>
                                        <Hash className="h-3 w-3 shrink-0 text-indigo-400" />
                                        <span className="truncate">{floor.name}</span>
                                      </div>
                                      <span className="text-[10px] text-muted-foreground">
                                        {floor.apartments?.length || 0}
                                      </span>
                                    </div>

                                    {/* Apartments list */}
                                    {isFloorExpanded && (
                                      <div className="pl-3 ml-2 border-l border-border/40 grid grid-cols-1 gap-0.5 py-0.5">
                                        {(floor.apartments || []).map((apt: any) => {
                                          const isAptSelected =
                                            selectedNode?.type === 'APARTMENT' &&
                                            selectedNode.id === apt.id;

                                          const isOccupied = apt.status === 'OCCUPIED';
                                          const isMaintenance =
                                            apt.status === 'UNDER_MAINTENANCE';

                                          return (
                                            <div
                                              key={apt.id}
                                              onClick={() =>
                                                onSelectNode({
                                                  type: 'APARTMENT',
                                                  id: apt.id,
                                                  data: apt,
                                                  parentPath: {
                                                    buildingName: building.name,
                                                    buildingId: building.id,
                                                    blockName: block.name,
                                                    blockId: block.id,
                                                    floorName: floor.name,
                                                    floorId: floor.id,
                                                  },
                                                })
                                              }
                                              className={cn(
                                                'flex items-center justify-between px-2 py-1 rounded cursor-pointer transition-colors text-[11px]',
                                                isAptSelected
                                                  ? 'bg-blue-600 text-white font-medium'
                                                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                                              )}
                                            >
                                              <div className="flex items-center gap-1.5 truncate">
                                                <span
                                                  className={cn(
                                                    'w-2 h-2 rounded-full shrink-0',
                                                    isOccupied
                                                      ? 'bg-emerald-500'
                                                      : isMaintenance
                                                      ? 'bg-amber-500'
                                                      : 'bg-slate-300 dark:bg-slate-600'
                                                  )}
                                                />
                                                <span className="font-mono">{apt.code}</span>
                                              </div>

                                              <div className="flex items-center gap-1 shrink-0">
                                                {apt.invoices?.length > 0 && (
                                                  <span title="Đang nợ phí">
                                                    <Receipt className="h-3 w-3 text-red-500" />
                                                  </span>
                                                )}
                                                {apt.feedbacks?.length > 0 && (
                                                  <span title="Sự cố mở">
                                                    <Wrench className="h-3 w-3 text-amber-500" />
                                                  </span>
                                                )}
                                                {apt.residents?.length > 0 && (
                                                  <span className="text-[9px] text-muted-foreground">
                                                    {apt.residents.length} ng
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
