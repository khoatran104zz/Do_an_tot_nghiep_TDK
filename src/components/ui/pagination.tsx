import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems?: number;
  itemsPerPage?: number;
  currentItemsCount?: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  currentItemsCount,
  onPageChange,
  isLoading = false,
  className,
}: PaginationProps) {
  if (totalPages <= 1 && !totalItems) return null;

  return (
    <div className={cn('flex flex-col sm:flex-row items-center justify-between gap-3 px-1 text-sm text-slate-500', className)}>
      <div className="text-xs text-slate-500">
        {totalItems !== undefined && (
          <span>
            Hiển thị{' '}
            <strong className="font-semibold text-slate-700">{currentItemsCount ?? 0}</strong> /{' '}
            <strong className="font-semibold text-slate-700">{totalItems}</strong> bản ghi
          </span>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="min-h-[40px] sm:min-h-[36px] px-3 font-medium"
            disabled={page <= 1 || isLoading}
            onClick={() => onPageChange(page - 1)}
            aria-label="Chuyển đến trang trước"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Trước
          </Button>

          <span className="text-xs font-semibold px-3 py-2 bg-slate-100 rounded-lg text-slate-700 select-none">
            Trang {page} / {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            className="min-h-[40px] sm:min-h-[36px] px-3 font-medium"
            disabled={page >= totalPages || isLoading}
            onClick={() => onPageChange(page + 1)}
            aria-label="Chuyển đến trang sau"
          >
            Sau
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
