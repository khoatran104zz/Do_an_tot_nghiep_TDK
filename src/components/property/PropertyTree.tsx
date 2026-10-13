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
  Plus,
  ChevronsUpDown,
  Filter,
  X,
  RotateCcw,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ApartmentStatus } from '@prisma/client';

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
  canManage?: boolean;
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
  canManage = true,
  className,
}: PropertyTreeProps) {
  const treeData = hierarchy || buildings || [];
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const toggleExpand = (nodeKey: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeKey]: !prev[nodeKey],
    }));
  };

  const handleExpandAll = () => {
    const next: Record<string, boolean> = {};
    treeData.forEach((b: any) => {
      next[`building-${b.id}`] = true;
      (b.blocks || []).forEach((blk: any) => {
        next[`block-${blk.id}`] = true;
        (blk.floors || []).forEach((flr: any) => {
          next[`floor-${flr.id}`] = true;
        });
      });
    });
    setExpandedNodes(next);
  };

  const handleCollapseAll = () => {
    setExpandedNodes({});
  };

  // Filter hierarchy based on search term and status filter
  const filteredHierarchy = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const isAllStatus = statusFilter === 'ALL';

    if (!term && isAllStatus) return treeData;

    return treeData
      .map((building) => {
        const matchesBuildingText =
          !term ||
          building.name.toLowerCase().includes(term) ||
          building.code.toLowerCase().includes(term);

        const filteredBlocks = (building.blocks || [])
          .map((block: any) => {
            const matchesBlockText =
              !term ||
              block.name.toLowerCase().includes(term) ||
              block.code.toLowerCase().includes(term);

            const filteredFloors = (block.floors || [])
              .map((floor: any) => {
                const matchesFloorText =
                  !term ||
                  floor.name.toLowerCase().includes(term) ||
                  floor.floorNumber.toString().includes(term);

                const filteredApts = (floor.apartments || []).filter((apt: any) => {
                  const matchesStatus =
                    isAllStatus || apt.status === statusFilter;
                  const matchesAptText =
                    !term ||
                    apt.code.toLowerCase().includes(term) ||
                    apt.residents?.some((r: any) => r.fullName?.toLowerCase().includes(term));
                  return matchesStatus && matchesAptText;
                });

                if (
                  (matchesFloorText && (isAllStatus || filteredApts.length > 0)) ||
                  filteredApts.length > 0
                ) {
                  return { ...floor, apartments: filteredApts };
                }
                return null;
              })
              .filter(Boolean);

            if (
              (matchesBlockText && (isAllStatus || filteredFloors.length > 0)) ||
              filteredFloors.length > 0
            ) {
              return { ...block, floors: filteredFloors };
            }
            return null;
          })
          .filter(Boolean);

        if (
          (matchesBuildingText && (isAllStatus || filteredBlocks.length > 0)) ||
          filteredBlocks.length > 0
        ) {
          return { ...building, blocks: filteredBlocks };
        }
        return null;
      })
      .filter(Boolean);
  }, [treeData, searchTerm, statusFilter]);

  const isSearchingOrFiltering = searchTerm.trim().length > 0 || statusFilter !== 'ALL';

  if (isLoading) {
    return (
      <div className={cn('bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 space-y-3', className)}>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-9 w-full rounded-xl" />
        <div className="space-y-2 pt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden',
        className
      )}
    >
      {/* Tree Header */}
      <div className="p-3.5 sm:p-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#E8F5ED] dark:bg-[#0F6B4F]/20 text-[#0F6B4F] dark:text-emerald-400">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Sơ đồ phân cấp
              </h3>
              <p className="text-[11px] text-slate-500">
                Tòa nhà &bull; Khối &bull; Tầng &bull; Căn hộ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleExpandAll}
              title="Mở rộng tất cả"
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronsUpDown className="h-3.5 w-3.5" />
            </button>
            {canManage && onAddBuilding && (
              <Button
                size="sm"
                variant="outline"
                onClick={onAddBuilding}
                className="h-7 text-[11px] px-2 gap-1 font-semibold text-[#0F6B4F] border-[#0F6B4F]/30 hover:bg-[#E8F5ED]"
              >
                <Plus className="h-3 w-3" /> Thêm Tòa
              </Button>
            )}
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Tìm tòa, tháp, tầng hoặc mã căn..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8.5 pr-8 h-8.5 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Status filter pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[10px] font-semibold">
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'OCCUPIED', label: 'Đang ở', dot: 'bg-emerald-500' },
            { id: 'VACANT', label: 'Trống', dot: 'bg-slate-400' },
            { id: 'UNDER_MAINTENANCE', label: 'Bảo trì', dot: 'bg-amber-500' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setStatusFilter(item.id)}
              className={cn(
                'px-2 py-1 rounded-lg transition-all shrink-0 flex items-center gap-1 cursor-pointer border',
                statusFilter === item.id
                  ? 'bg-[#0F6B4F] text-white border-[#0F6B4F] font-bold shadow-2xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100'
              )}
            >
              {item.dot && <span className={cn('h-1.5 w-1.5 rounded-full', item.dot)} />}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tree Content Area */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1 text-xs max-h-[640px]">
        {filteredHierarchy.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-2">
            <Building2 className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {isSearchingOrFiltering ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có cấu trúc bất động sản'}
            </p>
            <p className="text-[11px] text-slate-400">
              {isSearchingOrFiltering ? 'Thử thay đổi từ khóa hoặc bộ lọc trạng thái' : 'Bắt đầu bằng việc thêm tòa nhà đầu tiên'}
            </p>
            {isSearchingOrFiltering && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                }}
                className="text-xs h-7 gap-1 mt-1"
              >
                <RotateCcw className="h-3 w-3" /> Đặt lại
              </Button>
            )}
          </div>
        ) : (
          filteredHierarchy.map((building) => {
            const buildingKey = `building-${building.id}`;
            const isBuildingExpanded =
              isSearchingOrFiltering || expandedNodes[buildingKey] !== false;
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
                {/* Building Row */}
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
                    'group flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer transition-all select-none border',
                    isBuildingSelected
                      ? 'bg-[#E8F5ED] dark:bg-[#0F6B4F]/20 border-[#0F6B4F] text-[#0F6B4F] dark:text-emerald-300 font-bold shadow-2xs'
                      : 'border-transparent hover:bg-slate-100/80 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                  )}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <button
                      type="button"
                      onClick={(e) => toggleExpand(buildingKey, e)}
                      className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors"
                    >
                      {isBuildingExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                      )}
                    </button>
                    <Building2
                      className={cn(
                        'h-4 w-4 shrink-0',
                        isBuildingSelected ? 'text-[#0F6B4F] dark:text-emerald-400' : 'text-[#0F6B4F]'
                      )}
                    />
                    <span className="truncate font-semibold">{building.name}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono px-1.5 py-0 h-4.5 bg-white/60 dark:bg-slate-900/60"
                    >
                      {building.blocks?.length || 0} tháp
                    </Badge>
                  </div>
                </div>

                {/* Blocks List */}
                {isBuildingExpanded && (
                  <div className="pl-3.5 ml-3 border-l-2 border-slate-200/80 dark:border-slate-800 space-y-0.5">
                    {(building.blocks || []).map((block: any) => {
                      const blockKey = `block-${block.id}`;
                      const isBlockExpanded =
                        isSearchingOrFiltering || expandedNodes[blockKey] === true;
                      const isBlockSelected =
                        selectedNode?.type === 'BLOCK' && selectedNode.id === block.id;

                      const blockAptsCount = (block.floors || []).reduce(
                        (sum: number, f: any) => sum + (f.apartments?.length || 0),
                        0
                      );

                      return (
                        <div key={block.id} className="space-y-0.5">
                          {/* Block Row */}
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
                              'group flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-all select-none border',
                              isBlockSelected
                                ? 'bg-[#E8F5ED] dark:bg-[#0F6B4F]/20 border-[#0F6B4F] text-[#0F6B4F] dark:text-emerald-300 font-bold shadow-2xs'
                                : 'border-transparent hover:bg-slate-100/80 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                            )}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <button
                                type="button"
                                onClick={(e) => toggleExpand(blockKey, e)}
                                className="p-0.5 hover:bg-black/5 dark:hover:bg-white/10 rounded transition-colors"
                              >
                                {isBlockExpanded ? (
                                  <ChevronDown className="h-3 w-3 shrink-0 text-slate-500" />
                                ) : (
                                  <ChevronRight className="h-3 w-3 shrink-0 text-slate-500" />
                                )}
                              </button>
                              <Layers className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
                              <span className="truncate font-medium">{block.name}</span>
                            </div>

                            <span className="text-[10px] text-slate-400 font-mono">
                              {blockAptsCount} căn
                            </span>
                          </div>

                          {/* Floors List */}
                          {isBlockExpanded && (
                            <div className="pl-3.5 ml-2.5 border-l-2 border-slate-200/60 dark:border-slate-800 space-y-0.5">
                              {(block.floors || []).map((floor: any) => {
                                const floorKey = `floor-${floor.id}`;
                                const isFloorExpanded =
                                  isSearchingOrFiltering || expandedNodes[floorKey] === true;
                                const isFloorSelected =
                                  selectedNode?.type === 'FLOOR' && selectedNode.id === floor.id;

                                return (
                                  <div key={floor.id} className="space-y-0.5">
                                    {/* Floor Row */}
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
                                        'group flex items-center justify-between px-2 py-1 rounded-md cursor-pointer transition-all select-none border',
                                        isFloorSelected
                                          ? 'bg-[#E8F5ED] dark:bg-[#0F6B4F]/20 border-[#0F6B4F] text-[#0F6B4F] dark:text-emerald-300 font-bold shadow-2xs'
                                          : 'border-transparent hover:bg-slate-100/70 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                                      )}
                                    >
                                      <div className="flex items-center gap-1.5 truncate">
                                        <button
                                          type="button"
                                          onClick={(e) => toggleExpand(floorKey, e)}
                                          className="p-0.5 hover:bg-black/5 dark:hover:bg-white/10 rounded transition-colors"
                                        >
                                          {isFloorExpanded ? (
                                            <ChevronDown className="h-2.5 w-2.5 shrink-0 text-slate-400" />
                                          ) : (
                                            <ChevronRight className="h-2.5 w-2.5 shrink-0 text-slate-400" />
                                          )}
                                        </button>
                                        <Hash className="h-3 w-3 shrink-0 text-indigo-500" />
                                        <span className="truncate">{floor.name}</span>
                                      </div>
                                      <span className="text-[10px] text-slate-400 font-mono">
                                        {floor.apartments?.length || 0}
                                      </span>
                                    </div>

                                    {/* Apartments List */}
                                    {isFloorExpanded && (
                                      <div className="pl-3 ml-2 border-l border-slate-200/50 dark:border-slate-800 space-y-0.5 py-0.5">
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
                                                'flex items-center justify-between px-2 py-1 rounded cursor-pointer transition-colors text-[11px] border',
                                                isAptSelected
                                                  ? 'bg-[#0F6B4F] text-white font-bold border-[#0F6B4F] shadow-2xs'
                                                  : 'border-transparent hover:bg-slate-100 text-slate-600 dark:text-slate-400 hover:text-slate-900'
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
                                                <span className="font-mono font-medium">{apt.code}</span>
                                              </div>

                                              <div className="flex items-center gap-1 shrink-0">
                                                {apt.invoices?.length > 0 && (
                                                  <span title="Đang nợ phí">
                                                    <Receipt
                                                      className={cn(
                                                        'h-3 w-3',
                                                        isAptSelected ? 'text-white' : 'text-rose-500'
                                                      )}
                                                    />
                                                  </span>
                                                )}
                                                {apt.feedbacks?.length > 0 && (
                                                  <span title="Sự cố mở">
                                                    <Wrench
                                                      className={cn(
                                                        'h-3 w-3',
                                                        isAptSelected ? 'text-white' : 'text-amber-500'
                                                      )}
                                                    />
                                                  </span>
                                                )}
                                                {apt.residents?.length > 0 && (
                                                  <span
                                                    className={cn(
                                                      'text-[9px] font-mono',
                                                      isAptSelected ? 'text-white/80' : 'text-slate-400'
                                                    )}
                                                  >
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
