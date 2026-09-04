'use client';

import React, { useEffect, useState } from 'react';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  decimals?: number;
  formatFn?: (val: number) => string;
  className?: string;
}

export function AnimatedNumber({
  value,
  duration = 600,
  decimals = 0,
  formatFn,
  className,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || duration <= 0) {
      setDisplayValue(value);
      return;
    }

    let startTimestamp: number | null = null;
    const startValue = 0;
    const endValue = value;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const rawCurrent = startValue + (endValue - startValue) * easeProgress;
      const current = decimals > 0 ? parseFloat(rawCurrent.toFixed(decimals)) : Math.round(rawCurrent);

      setDisplayValue(current);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(endValue);
      }
    };

    const animId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animId);
  }, [value, duration, decimals]);

  const output = formatFn
    ? formatFn(displayValue)
    : decimals > 0
    ? displayValue.toLocaleString('vi-VN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    : displayValue.toLocaleString('vi-VN');

  return <span className={className}>{output}</span>;
}
