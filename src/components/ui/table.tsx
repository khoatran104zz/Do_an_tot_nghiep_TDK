import * as React from 'react';
import { cn } from '@/lib/utils';

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div
      tabIndex={0}
      role="region"
      aria-label="Bảng dữ liệu có thể cuộn"
      className="relative w-full overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30 rounded-xl"
    >
      <table ref={ref} className={cn('w-full caption-bottom text-sm border-collapse', className)} {...props} />
    </div>
  )
);
Table.displayName = 'Table';

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn('[&_tr]:border-b bg-slate-50/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300', className)} {...props} />
  )
);
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn('[&_tr:last-child]:border-0 divide-y divide-slate-100 dark:divide-slate-800', className)} {...props} />
  )
);
TableBody.displayName = 'TableBody';

const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tfoot ref={ref} className={cn('border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 font-medium text-slate-700 dark:text-slate-300 [&>tr]:last-child:border-b-0', className)} {...props} />
  )
);
TableFooter.displayName = 'TableFooter';

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn('border-b border-slate-100 dark:border-slate-800/80 transition-colors duration-150 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 data-[state=selected]:bg-slate-100/80 dark:data-[state=selected]:bg-slate-800', className)}
      {...props}
    />
  )
);
TableRow.displayName = 'TableRow';

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn('h-10 px-4 text-left align-middle font-semibold text-slate-600 dark:text-slate-300 text-xs tracking-wider uppercase [&:has([role=checkbox])]:pr-0', className)}
      {...props}
    />
  )
);
TableHead.displayName = 'TableHead';

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn('p-4 align-middle text-slate-700 dark:text-slate-200 text-sm [&:has([role=checkbox])]:pr-0', className)} {...props} />
  )
);
TableCell.displayName = 'TableCell';

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell };

