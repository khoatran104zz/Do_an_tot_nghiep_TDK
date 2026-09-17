'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useBuildingContext } from '@/context/BuildingContext';
import { Building2, ChevronDown, Check, Globe, Shield, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BuildingSwitcher() {
  const { data: session } = useSession();
  const user = session?.user;
  const {
    selectedBuildingId,
    setSelectedBuildingId,
    buildings,
    activeBuilding,
    isLoading,
    isAllSelected,
  } = useBuildingContext();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user || user.role === 'RESIDENT') return null;

  const isAdmin = user.role === 'ADMIN';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer select-none',
          isAdmin
            ? isAllSelected
              ? 'bg-purple-50/80 dark:bg-purple-950/40 border-purple-200/80 dark:border-purple-800/80 text-purple-800 dark:text-purple-200 shadow-2xs'
              : 'bg-slate-50/90 dark:bg-slate-800/80 border-purple-300 dark:border-purple-700 text-slate-800 dark:text-slate-100 shadow-2xs'
            : 'bg-slate-50/90 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-2xs',
          isOpen && (isAdmin ? 'ring-2 ring-purple-500/20 border-purple-500/50' : 'ring-2 ring-blue-500/20 border-blue-500/50')
        )}
        title={isAdmin ? 'Phạm vi quản trị Super Admin' : 'Tòa nhà bạn được phân công vận hành'}
      >
        <div
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded-lg text-xs',
            isAdmin
              ? 'bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-300'
              : 'bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300'
          )}
        >
          {isAdmin ? (
            isAllSelected ? <Globe className="h-3 w-3" /> : <Crown className="h-3 w-3 text-amber-500" />
          ) : (
            <Building2 className="h-3 w-3" />
          )}
        </div>

        <div className="flex flex-col text-left max-w-[140px] sm:max-w-[190px] truncate">
          <span className="text-[10px] text-slate-400 font-medium leading-tight flex items-center gap-1">
            {isAdmin ? (
              <>
                <Crown className="h-2.5 w-2.5 text-amber-500 inline" /> Super Admin
              </>
            ) : (
              '🏢 Quản lý Tòa nhà'
            )}
          </span>
          <span className="font-bold text-slate-900 dark:text-slate-100 truncate text-[11px]">
            {isAdmin && isAllSelected
              ? '🌐 Toàn hệ thống'
              : activeBuilding
              ? activeBuilding.name
              : isLoading
              ? 'Đang tải...'
              : 'Chưa gán tòa nhà'}
          </span>
        </div>

        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 text-slate-400 transition-transform duration-200 shrink-0',
            isOpen && 'rotate-180 text-blue-600'
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 p-1.5 animate-in fade-in-50 zoom-in-95 duration-100">
          <div className="px-2 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {isAdmin ? 'Chuyển phạm vi xem' : 'Danh sách tòa nhà được gán'}
          </div>

          {/* ADMIN option: Global view */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                setSelectedBuildingId(null);
                setIsOpen(false);
              }}
              className={cn(
                'flex w-full items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-left',
                isAllSelected
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              )}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Globe className="h-4 w-4 text-blue-500 shrink-0" />
                <div className="truncate">
                  <p className="truncate font-bold">Toàn hệ thống (Tất cả)</p>
                  <p className="text-[10px] text-slate-400 font-normal">Xem tổng hợp đa tòa nhà</p>
                </div>
              </div>
              {isAllSelected && <Check className="h-4 w-4 text-blue-600 shrink-0" />}
            </button>
          )}

          {isAdmin && <div className="my-1 border-t border-slate-100 dark:border-slate-800" />}

          {/* Individual buildings list */}
          <div className="max-h-56 overflow-y-auto space-y-0.5 scrollbar-thin">
            {buildings.length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-400 text-center">
                Không tìm thấy tòa nhà
              </div>
            ) : (
              buildings.map((b) => {
                const isSelected = selectedBuildingId === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      setSelectedBuildingId(b.id);
                      setIsOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer text-left',
                      isSelected
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    )}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
                      <div className="truncate">
                        <p className="truncate">{b.name}</p>
                        <p className="text-[10px] text-slate-400 font-normal font-mono">{b.code}</p>
                      </div>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-blue-600 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
