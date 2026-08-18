'use client';

import React from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

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
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  page?: number;
  totalPages?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  extraHeaderActions?: React.ReactNode;
}

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  isLoading = false,
  searchPlaceholder = 'Tìm kiếm...',
  searchValue,
  onSearchChange,
  page = 1,
  totalPages = 1,
  totalItems,
  onPageChange,
  extraHeaderActions,
}: DataTableProps<T>) {
  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      {(onSearchChange || extraHeaderActions) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {onSearchChange ? (
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder={searchPlaceholder}
                value={searchValue || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
          ) : (
            <div />
          )}
          {extraHeaderActions && <div className="flex items-center gap-2">{extraHeaderActions}</div>}
        </div>
      )}

      {/* Table Container */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center font-bold">STT</TableHead>
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
                    <div className="h-4 w-4 bg-slate-200 rounded animate-pulse mx-auto" />
                  </TableCell>
                  {columns.map((_, cIdx) => (
                    <TableCell key={cIdx}>
                      <div className="h-4 w-full bg-slate-100 rounded animate-pulse" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              // Empty State
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <Inbox className="h-10 w-10 stroke-1 mb-2 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600">Không có dữ liệu phù hợp</p>
                    <p className="text-xs text-slate-400 mt-0.5">Vui lòng thử tìm kiếm hoặc lọc theo điều kiện khác</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              // Data Rows
              data.map((row, index) => (
                <TableRow key={row.id}>
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

      {/* Pagination Footer */}
      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between px-2 text-sm text-slate-500">
          <div>
            {totalItems !== undefined && (
              <span>
                Hiển thị <strong className="font-semibold text-slate-700">{data.length}</strong> /{' '}
                <strong className="font-semibold text-slate-700">{totalItems}</strong> bản ghi
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || isLoading}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Trước
            </Button>
            <span className="text-xs font-semibold px-2 py-1 bg-slate-100 rounded text-slate-700">
              Trang {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || isLoading}
              onClick={() => onPageChange(page + 1)}
            >
              Sau
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
