'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface DropdownContextType {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const DropdownContext = React.createContext<DropdownContextType | null>(null);

export interface DropdownProps {
  children: React.ReactNode;
}

export function Dropdown({ children }: DropdownProps) {
  const [open, setOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div ref={dropdownRef} className="relative inline-block text-left">
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

export function DropdownTrigger({ children, className }: { children: React.ReactNode; className?: string }) {
  const context = React.useContext(DropdownContext);
  if (!context) throw new Error('DropdownTrigger must be used within Dropdown');

  return (
    <div
      onClick={() => context.setOpen((prev) => !prev)}
      className={cn('inline-flex cursor-pointer', className)}
    >
      {children}
    </div>
  );
}

export function DropdownContent({
  children,
  align = 'right',
  className,
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}) {
  const context = React.useContext(DropdownContext);
  if (!context) throw new Error('DropdownContent must be used within Dropdown');

  if (!context.open) return null;

  return (
    <div
      className={cn(
        'absolute z-50 mt-2 min-w-48 rounded-xl border border-slate-200/80 bg-white p-1.5 shadow-lg shadow-slate-900/5 focus:outline-none animate-in fade-in-0 zoom-in-95',
        align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left',
        className
      )}
    >
      {children}
    </div>
  );
}

export function DropdownItem({
  children,
  onClick,
  disabled = false,
  destructive = false,
  icon,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  icon?: React.ReactNode;
  className?: string;
}) {
  const context = React.useContext(DropdownContext);

  const handleClick = () => {
    if (disabled) return;
    onClick?.();
    context?.setOpen(false);
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors text-left select-none cursor-pointer',
        destructive
          ? 'text-red-600 hover:bg-red-50 hover:text-red-700'
          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
        disabled && 'cursor-not-allowed opacity-50 pointer-events-none',
        className
      )}
    >
      {icon && <span className="shrink-0 text-slate-400">{icon}</span>}
      <span className="flex-1 truncate">{children}</span>
    </button>
  );
}

export function DropdownDivider() {
  return <div className="my-1 h-px bg-slate-100 -mx-1.5" />;
}

export function DropdownHeader({ children }: { children: React.ReactNode }) {
  return <div className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{children}</div>;
}
