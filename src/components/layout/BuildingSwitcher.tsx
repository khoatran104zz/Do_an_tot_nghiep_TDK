'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useBuildingContext } from '@/context/BuildingContext';
import { Building2, ChevronDown, Check, Globe, Crown, Shield } from 'lucide-react';
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

  const isPlatform =
    user.role === 'PLATFORM_ADMIN' || (user.role === 'ADMIN' && !user.tenantId);
  const isTenant =
    user.role === 'TENANT_ADMIN' || (user.role === 'ADMIN' && !!user.tenantId);
  const isMgr = user.role === 'MANAGER';

  // If manager only has 1 building, render fixed badge
  if (isMgr && buildings.length <= 1) {
    return (
      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 text-xs font-semibold select-none">
        <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 text-xs">
          <Building2 className="h-3 w-3" />
        </div>
        <div className="flex flex-col text-left max-w-[170px] truncate">
          <span className="text-[10px] text-slate-400 font-medium leading-tight">
            🏢 Tòa nhà phân công
          </span>
          <span className="font-bold text-slate-900 dark:text-slate-100 truncate text-[11px]">
            {activeBuilding ? activeBuilding.name : isLoading ? 'Đang tải...' : 'Chưa phân công'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer select-none',
          isPlatform
            ? isAllSelected
              ? 'bg-purple-50/80 dark:bg-purple-950/40 border-purple-200/80 dark:border-purple-800/80 text-purple-800 dark:text-purple-200 shadow-2xs'
              : 'bg-slate-50/90 dark:bg-slate-800/80 border-purple-300 dark:border-purple-700 text-slate-800 dark:text-slate-100 shadow-2xs'
            : isTenant
            ? isAllSelected
              ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-200 shadow-2xs'
              : 'bg-slate-50/90 dark:bg-slate-800/80 border-emerald-300 dark:border-emerald-700 text-slate-800 dark:text-slate-100 shadow-2xs'
            : 'bg-slate-50/90 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-2xs',
          isOpen && 'ring-2 ring-emerald-500/20 border-emerald-500/50'
        )}
        title={
          isPlatform
            ? 'Phạm vi quản trị K-Home Platform'
            : isTenant
            ? `Phạm vi tổ hợp: ${user.tenantName || 'SmartCity'}`
            : 'Tòa nhà bạn được phân công vận hành'
        }
      >
        <div
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded-lg text-xs',
            isPlatform
              ? 'bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-300'
              : isTenant
              ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300'
              : 'bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300'
          )}
        >
          {isPlatform ? (
            isAllSelected ? <Globe className="h-3 w-3" /> : <Crown className="h-3 w-3 text-purple-500" />
          ) : isTenant ? (
            <Shield className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Building2 className="h-3 w-3 text-blue-600" />
          )}
        </div>

        <div className="flex flex-col text-left max-w-[140px] sm:max-w-[200px] truncate">
          <span className="text-[10px] text-slate-400 font-medium leading-tight flex items-center gap-1 truncate">
            {isPlatform ? (
              <>
                <Crown className="h-2.5 w-2.5 text-purple-500 inline shrink-0" /> K-Home Platform
              </>
            ) : isTenant ? (
              <>
                🏢 {user.tenantName || 'Tổ hợp Chung cư'}
              </>
            ) : (
              '🏢 Quản lý Tòa nhà'
            )}
          </span>
          <span className="font-bold text-slate-900 dark:text-slate-100 truncate text-[11px]">
            {isAllSelected
              ? isPlatform
                ? '🌐 Toàn nền tảng'
                : '🏢 Tất cả tòa nhà tổ hợp'
              : activeBuilding
              ? activeBuilding.name
              : isLoading
              ? 'Đang tải...'
              : 'Chưa chọn tòa nhà'}
          </span>
        </div>

        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 text-slate-400 transition-transform duration-200 shrink-0',
            isOpen && 'rotate-180 text-emerald-600'
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 p-1.5 animate-in fade-in-50 zoom-in-95 duration-100">
          <div className="px-2 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {isPlatform ? 'Phạm vi Nền tảng' : isTenant ? `Tổ hợp: ${user.tenantName || 'Hiện tại'}` : 'Tòa nhà được gán'}
          </div>

          {/* All Buildings Option (for Platform Admin or Tenant Admin) */}
          {(isPlatform || isTenant) && (
            <button
              type="button"
              onClick={() => {
                setSelectedBuildingId(null);
                setIsOpen(false);
              }}
              className={cn(
                'flex w-full items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-left',
                isAllSelected
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              )}
            >
              <div className="flex items-center gap-2 truncate">
                <Globe className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span className="truncate">
                  {isPlatform ? '🌐 Toàn nền tảng (Tất cả Khách hàng)' : '🏢 Tất cả tòa nhà trong Tổ hợp'}
                </span>
              </div>
              {isAllSelected && <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 ml-1" />}
            </button>
          )}

          <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

          {/* List of available buildings */}
          <div className="max-h-56 overflow-y-auto space-y-0.5">
            {buildings.length === 0 ? (
              <div className="px-2 py-3 text-center text-xs text-slate-400">
                Không tìm thấy tòa nhà nào
              </div>
            ) : (
              buildings.map((building) => {
                const isSelected = selectedBuildingId === building.id;
                return (
                  <button
                    key={building.id}
                    type="button"
                    onClick={() => {
                      setSelectedBuildingId(building.id);
                      setIsOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-left',
                      isSelected
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <div className="truncate">
                        <div className="font-medium truncate">{building.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {building.code}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 ml-1" />
                    )}
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
