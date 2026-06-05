export type WeeklyReport = {
  weekStart: string;
  weekEnd: string;
  totalSlots: number;
  avgCTR: number;
  avgSaveLift: number | null;
  bestPerformer: { listTitle: string; listId: string; saveLiftPercent: number } | null;
  slots: {
    slotId: string;
    listTitle: string;
    listId: string;
    categoryName: string | null;
    categoryId: string | null;
    ctr: number;
    saveLiftPercent: number | null;
    scoreLiftPercent: number | null;
    impactLabel: string;
  }[];
  recommendations: string[];
};

export type CategoryInsights = {
  range: string;
  start: string;
  end: string;
  categories: {
    categoryId: string;
    categoryName: string;
    featuredCount: number;
    avgCTR: number;
    avgSaveLift: number | null;
    avgScoreLift: number | null;
    impactScore: number;
    rank: number;
  }[];
  recommendations: string[];
};

export function getMonday(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function formatPct(n: number | null): string {
  if (n == null) return '—';
  return `${n.toFixed(1)}%`;
}

export function impactLabelFa(label: string): string {
  if (label === 'High Impact') return 'تأثیر بالا';
  if (label === 'Moderate') return 'متوسط';
  return 'ضعیف';
}

export function impactClass(label: string): string {
  if (label === 'High Impact') return 'bg-emerald-100 text-emerald-800';
  if (label === 'Moderate') return 'bg-amber-100 text-amber-800';
  return 'bg-[var(--color-bg)] text-[var(--color-text-muted)]';
}
