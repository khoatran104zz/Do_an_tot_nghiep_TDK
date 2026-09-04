'use client';

import React from 'react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, X, AlertTriangle, RefreshCw } from 'lucide-react';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  page?: number;
  totalPages?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  extraHeaderActions?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
}

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  isLoading = false,
  isError = false,
  errorMessage,
  onRetry,
  searchPlaceholder = 'Tìm kiếm...',
  searchValue,
  onSearchChange,
  page = 1,
  totalPages = 1,
  totalItems,
  onPageChange,
  extraHeaderActions,
  emptyTitle = 'Không có dữ liệu phù hợp',
  emptyDescription = 'Vui lòng thử tìm kiếm hoặc điều chỉnh điều kiện lọc khác.',
  emptyActionLabel,
  onEmptyAction,
}: DataTableProps<T>) {
  return (
    <div className="space-y-4">
      {/* Search & Extra Header Actions Bar */}
      {(onSearchChange || extraHeaderActions) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {onSearchChange ? (
            <div className="relative w-full sm:w-80">
              <Input
                placeholder={searchPlaceholder}
                value={searchValue || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
                rightIcon={
                  searchValue ? (
                    <button
                      type="button"
                      onClick={() => onSearchChange('')}
                      className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                      aria-label="Xóa tìm kiếm"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <div />
          )}
          {extraHeaderActions && <div className="flex items-center gap-2">{extraHeaderActions}</div>}
        </div>
      )}

      {/* Table Container */}
      <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14 text-center font-bold">STT</TableHead>
              {columns.map((col, idx) => (
                <TableHead key={idx} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Skeleton Rows
              Array.from({ length: 5 }).map((_, rIdx) => (
                <TableRow key={rIdx}>
                  <TableCell className="text-center">
                    <Skeleton className="h-4 w-5 mx-auto" />
                  </TableCell>
                  {columns.map((_, cIdx) => (
                    <TableCell key={cIdx}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : isError ? (
              // Error State Row
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-3 animate-in fade-in-50 duration-200">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600 ring-8 ring-rose-50/50">
                      <AlertTriangle className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-slate-800">
                        {errorMessage || 'Không thể tải dữ liệu từ máy chủ'}
                      </h4>
                      <p className="text-xs text-slate-500 max-w-sm">
                        Đã có lỗi xảy ra khi kết nối hoặc xử lý dữ liệu. Vui lòng kiểm tra lại kết nối mạng và thử lại.
                      </p>
                    </div>
                    {onRetry && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onRetry}
                        className="mt-2 text-xs font-medium text-slate-700 hover:bg-slate-50 gap-1.5"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Thử lại
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              // Empty State
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="p-0 border-0">
                  <div className="animate-in fade-in-50 duration-200">
                    <EmptyState
                      title={emptyTitle}
                      description={emptyDescription}
                      actionLabel={
                        emptyActionLabel
                          ? emptyActionLabel
                          : searchValue
                          ? 'Xóa bộ lọc tìm kiếm'
                          : undefined
                      }
                      onAction={
                        onEmptyAction
                          ? onEmptyAction
                          : searchValue && onSearchChange
                          ? () => onSearchChange('')
                          : undefined
                      }
                    />
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              // Data Rows
              data.map((row, index) => (
                <TableRow key={row.id} className="transition-colors hover:bg-slate-50/80">
                  <TableCell className="text-center font-medium text-slate-400 text-xs">
                    {(page - 1) * 10 + index + 1}
                  </TableCell>
                  {columns.map((col, cIdx) => (
                    <TableCell key={cIdx} className={col.className}>
                      {col.cell
                        ? col.cell(row)
                        : col.accessorKey
                        ? String(row[col.accessorKey] ?? '')
                        : null}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Standardized Pagination Footer */}
      {totalPages > 1 && onPageChange && (
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          currentItemsCount={data.length}
          onPageChange={onPageChange}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
