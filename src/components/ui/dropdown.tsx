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
      role="button"
      tabIndex={0}
      aria-haspopup="true"
      aria-expanded={context.open}
      onClick={() => context.setOpen((prev) => !prev)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          context.setOpen((prev) => !prev);
        }
      }}
      className={cn('inline-flex cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30 rounded-xl', className)}
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

  const [mounted, setMounted] = React.useState(context.open);
  const [isClosing, setIsClosing] = React.useState(false);

  React.useEffect(() => {
    if (context.open) {
      setMounted(true);
      setIsClosing(false);
    } else if (mounted) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setMounted(false);
        setIsClosing(false);
      }, 140);
      return () => clearTimeout(timer);
    }
  }, [context.open, mounted]);

  if (!mounted) return null;

  return (
    <div
      role="menu"
      className={cn(
        'absolute z-50 mt-2 min-w-48 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-lg shadow-slate-900/5 dark:shadow-slate-950/50 focus:outline-none',
        align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left',
        isClosing ? 'animate-dropdown-out' : 'animate-dropdown-in',
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
      role="menuitem"
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors duration-150 text-left select-none cursor-pointer active:scale-[0.98] min-h-[36px] focus-visible:outline-none focus-visible:bg-slate-100 dark:focus-visible:bg-slate-800',
        destructive
          ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-700 dark:hover:text-red-300 active:bg-red-100 focus-visible:bg-red-50'
          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white active:bg-slate-200 dark:active:bg-slate-700',
        disabled && 'cursor-not-allowed opacity-50 pointer-events-none active:scale-100',
        className
      )}
    >
      {icon && <span className="shrink-0 text-slate-400 dark:text-slate-500">{icon}</span>}
      <span className="flex-1 truncate">{children}</span>
    </button>
  );
}

export function DropdownDivider() {
  return <div className="my-1 h-px bg-slate-100 dark:bg-slate-800 -mx-1.5" />;
}

export function DropdownHeader({ children }: { children: React.ReactNode }) {
  return <div className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{children}</div>;
}

