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
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="xs"
            disabled={page <= 1 || isLoading}
            onClick={() => onPageChange(page - 1)}
            aria-label="Trang trước"
          >
            <ChevronLeft className="h-3.5 w-3.5 mr-1" />
            Trước
          </Button>

          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-md text-slate-700">
            Trang {page} / {totalPages}
          </span>

          <Button
            variant="outline"
            size="xs"
            disabled={page >= totalPages || isLoading}
            onClick={() => onPageChange(page + 1)}
            aria-label="Trang sau"
          >
            Sau
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
