'use client';

import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const hasDarkClass = document.documentElement.classList.contains('dark');
    const storedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = storedTheme === 'dark' || (!storedTheme && systemPrefersDark) || hasDarkClass;

    setIsDark(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ isDark: boolean }>;
      if (customEvent.detail) {
        setIsDark(customEvent.detail.isDark);
      } else {
        setIsDark(document.documentElement.classList.contains('dark'));
      }
    };

    window.addEventListener('theme-change', handleThemeChange);
    window.addEventListener('storage', handleThemeChange);

    return () => {
      window.removeEventListener('theme-change', handleThemeChange);
      window.removeEventListener('storage', handleThemeChange);
    };
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }

    window.dispatchEvent(
      new CustomEvent('theme-change', { detail: { isDark: nextDark } })
    );
  };

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon-sm"
        className={cn('text-slate-400 hover:text-slate-600 rounded-xl', className)}
        aria-label="Chuyển chế độ sáng/tối"
      >
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={toggleTheme}
      className={cn(
        'text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-xl transition-colors cursor-pointer',
        className
      )}
      title={isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
      aria-label={isDark ? 'Chế độ sáng' : 'Chế độ tối'}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-400 hover:rotate-45 transition-transform duration-200" />
      ) : (
        <Moon className="h-4 w-4 text-slate-600 hover:-rotate-12 transition-transform duration-200" />
      )}
    </Button>
  );
}

