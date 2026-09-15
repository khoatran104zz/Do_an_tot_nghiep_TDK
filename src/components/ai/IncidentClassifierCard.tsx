'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Check, Wrench, AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react';
import { useClassifyIncident } from '@/hooks/use-ai';
import { TicketCategory, TicketPriority } from '@prisma/client';

interface IncidentClassifierCardProps {
  title: string;
  content: string;
  onApplySuggestion: (suggestion: {
    category: TicketCategory;
    priority: TicketPriority;
  }) => void;
}

export function IncidentClassifierCard({
  title,
  content,
  onApplySuggestion,
}: IncidentClassifierCardProps) {
  const classifyMutation = useClassifyIncident();
  const [suggestion, setSuggestion] = useState<any | null>(null);
  const [isApplied, setIsApplied] = useState(false);

  useEffect(() => {
    setIsApplied(false);
    const combined = `${title} ${content}`.trim();
    if (combined.length < 6) {
      setSuggestion(null);
      return;
    }

    const timer = setTimeout(() => {
      classifyMutation.mutate(
        { title, content },
        {
          onSuccess: (res: any) => {
            if (res?.data) {
              setSuggestion(res.data);
            }
          },
        }
      );
    }, 700);

    return () => clearTimeout(timer);
  }, [title, content]);

  if (!suggestion && !classifyMutation.isPending) return null;

  const getCategoryLabel = (c: string) => {
    switch (c) {
      case 'WATER':
        return 'Nước & Đường ống';
      case 'ELECTRIC':
        return 'Điện sinh hoạt';
      case 'ELEVATOR':
        return 'Thang máy';
      case 'SECURITY':
        return 'An ninh trật tự';
      case 'CLEANLINESS':
        return 'Vệ sinh môi trường';
      default:
        return 'Vấn đề khác';
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'CRITICAL':
        return <Badge className="bg-rose-500 text-white text-[10px]">Nguy cấp</Badge>;
      case 'URGENT':
        return <Badge className="bg-amber-500 text-white text-[10px]">Gấp</Badge>;
      case 'HIGH':
        return <Badge className="bg-orange-500 text-white text-[10px]">Cao</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10px]">Bình thường</Badge>;
    }
  };

  return (
    <div className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 p-3 text-xs space-y-2 animate-in fade-in-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-bold text-blue-900 dark:text-blue-200">
          <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
          <span>Gợi ý phân loại sự cố thông minh (AI Suggestion)</span>
        </div>
        {classifyMutation.isPending && (
          <span className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400">
            <Loader2 className="h-3 w-3 animate-spin" />
            Đang phân tích...
          </span>
        )}
      </div>

      {suggestion && (
        <>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed italic">
            &ldquo;{suggestion.reason}&rdquo;
          </p>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-blue-100 dark:border-blue-900/40">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-500">Đề xuất:</span>
              <strong className="text-slate-800 dark:text-slate-200">
                {getCategoryLabel(suggestion.category)}
              </strong>
              {getPriorityBadge(suggestion.priority)}
              <span className="text-[10px] text-slate-400">({suggestion.department})</span>
            </div>

            <div className="flex items-center gap-1.5">
              {isApplied ? (
                <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" />
                  Đã áp dụng gợi ý
                </span>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    onApplySuggestion({
                      category: suggestion.category as TicketCategory,
                      priority: suggestion.priority as TicketPriority,
                    });
                    setIsApplied(true);
                  }}
                  className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Áp dụng gợi ý
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
