'use client';

import Link from 'next/link';
import { AlertTriangle, ChevronLeft } from 'lucide-react';
import type { PulseRisk, SuggestionHealth } from '@/lib/admin/pulse-utils';

interface PulseActionRequiredProps {
  risk?: PulseRisk | null;
  suggestions?: SuggestionHealth | null;
}

function Chip({
  href,
  label,
  value,
  danger,
}: {
  href: string;
  label: string;
  value: number;
  danger?: boolean;
}) {
  if (value <= 0) return null;
  return (
    <Link
      href={href}
      className={
        danger
          ? 'inline-flex items-center gap-1 rounded-md bg-red-600 text-white px-2 py-0.5 text-xs font-medium hover:bg-red-700'
          : 'inline-flex items-center gap-1 rounded-md bg-violet-600 text-white px-2 py-0.5 text-xs font-medium hover:bg-violet-700'
      }
    >
      <span className="font-bold tabular-nums">{value.toLocaleString('fa-IR')}</span>
      {label}
      <ChevronLeft className="h-3 w-3 opacity-70" />
    </Link>
  );
}

export default function PulseActionRequired({ risk, suggestions }: PulseActionRequiredProps) {
  const commentReports = risk?.commentReportsPending ?? 0;
  const itemReports = risk?.itemReportsPending ?? 0;
  const pendingSuggestions = suggestions?.pendingTotal ?? 0;

  if (commentReports + itemReports + pendingSuggestions === 0) return null;

  return (
    <div
      className="flex flex-wrap items-center gap-2 rounded-lg border border-red-200/80 dark:border-red-500/30 bg-red-50/40 dark:bg-red-950/20 px-2.5 py-1.5"
      aria-label="نیاز به اقدام"
    >
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-800 dark:text-red-200 shrink-0">
        <AlertTriangle className="h-3.5 w-3.5" />
        اقدام
      </span>
      <Chip href="/admin/comments/reports?resolved=false" label="کامنت" value={commentReports} danger />
      <Chip href="/admin/comments/item-reports?resolved=false" label="آیتم" value={itemReports} danger />
      <Chip href="/admin/suggestions" label="پیشنهاد" value={pendingSuggestions} />
    </div>
  );
}
