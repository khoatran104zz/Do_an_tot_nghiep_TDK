'use client';

import React, { useState, useMemo } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchInput } from '@/components/shared/SearchInput';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownHeader,
  DropdownDivider,
} from '@/components/ui/dropdown';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Columns,
  AlertTriangle,
  RefreshCw,
  CheckSquare,
  Square,
  MinusSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  id?: string;
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
  hideable?: boolean;
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
  // Enterprise features
  enableRowSelection?: boolean;
  selectedRowIds?: (string | number)[];
  onRowSelect?: (id: string | number) => void;
  onSelectAll?: () => void;
  bulkActions?: React.ReactNode;
  enableColumnVisibility?: boolean;
  sortKey?: string;
  sortOrder?: 'asc' | 'desc';
  onSortChange?: (key: string, order: 'asc' | 'desc') => void;
  onRowClick?: (row: T) => void;
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
  // Enterprise
  enableRowSelection = false,
  selectedRowIds = [],
  onRowSelect,
  onSelectAll,
  bulkActions,
  enableColumnVisibility = false,
  sortKey,
  sortOrder,
  onSortChange,
  onRowClick,
}: DataTableProps<T>) {
  // Column visibility state
  const [hiddenColumnKeys, setHiddenColumnKeys] = useState<string[]>([]);

  const toggleColumnVisibility = (key: string) => {
    setHiddenColumnKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const visibleColumns = useMemo(() => {
    return columns.filter((col, idx) => {
      const colKey = col.id || (col.accessorKey as string) || `col_${idx}`;
      return !hiddenColumnKeys.includes(colKey);
    });
  }, [columns, hiddenColumnKeys]);

  // Handle Header Sort Click
  const handleHeaderSort = (col: Column<T>, idx: number) => {
    if (!col.sortable || !onSortChange) return;
    const key = (col.accessorKey as string) || col.id || `col_${idx}`;
    if (sortKey === key) {
      onSortChange(key, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(key, 'asc');
    }
  };

  // Selection helpers
  const allSelected = data.length > 0 && selectedRowIds.length === data.length;
  const partiallySelected = selectedRowIds.length > 0 && selectedRowIds.length < data.length;

  return (
    <div className="space-y-4">
      {/* Search & Extra Header Actions Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {onSearchChange ? (
          <div className="w-full sm:w-80">
            <SearchInput
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={onSearchChange}
              showShortcut
            />
          </div>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2 shrink-0">
          {enableColumnVisibility && (
            <Dropdown>
              <DropdownTrigger>
                <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <Columns className="h-3.5 w-3.5" />
                  Cột hiển thị
                </Button>
              </DropdownTrigger>
              <DropdownContent align="right" className="w-48">
                <DropdownHeader>Tùy chỉnh cột</DropdownHeader>
                <div className="p-1 space-y-1">
                  {columns.map((col, idx) => {
                    const colKey = col.id || (col.accessorKey as string) || `col_${idx}`;
                    const isVisible = !hiddenColumnKeys.includes(colKey);
                    return (
                      <button
                        key={colKey}
                        type="button"
                        onClick={() => toggleColumnVisibility(colKey)}
                        className="flex items-center justify-between w-full px-2.5 py-1.5 text-xs rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                      >
                        <span className="truncate">{col.header}</span>
                        {isVisible ? (
                          <CheckSquare className="h-3.5 w-3.5 text-blue-600" />
                        ) : (
                          <Square className="h-3.5 w-3.5 text-slate-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </DropdownContent>
            </Dropdown>
          )}

          {extraHeaderActions}
        </div>
      </div>

      {/* Bulk Actions Floating/Docked Toolbar */}
      {enableRowSelection && selectedRowIds.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-blue-50/90 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900 shadow-sm animate-in fade-in-50 duration-150">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-900 dark:text-blue-200">
            <CheckSquare className="h-4 w-4 text-blue-600" />
            <span>Đã chọn {selectedRowIds.length} mục</span>
          </div>
          <div className="flex items-center gap-2">{bulkActions}</div>
        </div>
      )}

      {/* Table Container */}
      <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-50/70">
                {enableRowSelection && (
                  <TableHead className="w-10 text-center">
                    <button
                      type="button"
                      onClick={onSelectAll}
                      className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
                      aria-label="Chọn tất cả các dòng"
                    >
                      {allSelected ? (
                        <CheckSquare className="h-4 w-4 text-blue-600" />
                      ) : partiallySelected ? (
                        <MinusSquare className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Square className="h-4 w-4 text-slate-400" />
                      )}
                    </button>
                  </TableHead>
                )}
                <TableHead className="w-14 text-center font-bold text-slate-600 dark:text-slate-400 text-xs">
                  STT
                </TableHead>
                {visibleColumns.map((col, idx) => {
                  const colKey = (col.accessorKey as string) || col.id || `col_${idx}`;
                  const isSorted = sortKey === colKey;
                  return (
                    <TableHead
                      key={idx}
                      className={cn(
                        'text-xs font-semibold text-slate-700 dark:text-slate-300 select-none',
                        col.sortable ? 'cursor-pointer hover:text-blue-600 dark:hover:text-blue-400' : '',
                        col.className
                      )}
                      onClick={() => handleHeaderSort(col, idx)}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{col.header}</span>
                        {col.sortable && (
                          <span className="text-slate-400">
                            {isSorted ? (
                              sortOrder === 'asc' ? (
                                <ArrowUp className="h-3 w-3 text-blue-600" />
                              ) : (
                                <ArrowDown className="h-3 w-3 text-blue-600" />
                              )
                            ) : (
                              <ArrowUpDown className="h-3 w-3 opacity-40 hover:opacity-100" />
                            )}
                          </span>
                        )}
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Skeleton Rows
                Array.from({ length: 5 }).map((_, rIdx) => (
                  <TableRow key={rIdx}>
                    {enableRowSelection && (
                      <TableCell className="text-center">
                        <Skeleton className="h-4 w-4 mx-auto rounded" />
                      </TableCell>
                    )}
                    <TableCell className="text-center">
                      <Skeleton className="h-4 w-5 mx-auto" />
                    </TableCell>
                    {visibleColumns.map((_, cIdx) => (
                      <TableCell key={cIdx}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : isError ? (
                // Error State Row
                <TableRow>
                  <TableCell
                    colSpan={visibleColumns.length + (enableRowSelection ? 2 : 1)}
                    className="py-12 text-center"
                  >
                    <div className="flex flex-col items-center justify-center gap-3 animate-in fade-in-50 duration-200">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 ring-8 ring-rose-50/50">
                        <AlertTriangle className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {errorMessage || 'Không thể tải dữ liệu từ máy chủ'}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                          Đã có lỗi xảy ra khi kết nối hoặc xử lý dữ liệu. Vui lòng kiểm tra lại kết nối mạng và thử lại.
                        </p>
                      </div>
                      {onRetry && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onRetry}
                          className="mt-2 text-xs font-medium text-slate-700 dark:text-slate-300 gap-1.5"
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
                  <TableCell
                    colSpan={visibleColumns.length + (enableRowSelection ? 2 : 1)}
                    className="p-0 border-0"
                  >
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
                data.map((row, index) => {
                  const isSelected = selectedRowIds.includes(row.id);
                  return (
                    <TableRow
                      key={row.id}
                      onClick={() => onRowClick && onRowClick(row)}
                      className={cn(
                        'transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50',
                        isSelected ? 'bg-blue-50/40 dark:bg-blue-950/20' : '',
                        onRowClick ? 'cursor-pointer' : ''
                      )}
                    >
                      {enableRowSelection && (
                        <TableCell
                          className="text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => onRowSelect && onRowSelect(row.id)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                          >
                            {isSelected ? (
                              <CheckSquare className="h-4 w-4 text-blue-600" />
                            ) : (
                              <Square className="h-4 w-4 text-slate-400" />
                            )}
                          </button>
                        </TableCell>
                      )}
                      <TableCell className="text-center font-medium text-slate-400 text-xs">
                        {(page - 1) * 10 + index + 1}
                      </TableCell>
                      {visibleColumns.map((col, cIdx) => (
                        <TableCell key={cIdx} className={col.className}>
                          {col.cell
                            ? col.cell(row)
                            : col.accessorKey
                            ? String(row[col.accessorKey] ?? '')
                            : null}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
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
