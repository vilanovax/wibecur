'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Loader2,
  Plus,
  BarChart3,
  Megaphone,
  X,
  Eye,
  MousePointerClick,
  Calendar,
  ChevronDown,
} from 'lucide-react';
import DatePicker, { DateObject } from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import 'react-multi-date-picker/styles/colors/teal.css';
import Toast, { type ToastType } from '@/components/shared/Toast';
import SponsoredTextBanner from '@/components/shared/SponsoredTextBanner';
import MetricCard from '@/components/admin/design-system/MetricCard';
import SponsoredPlacementRowMenu from '@/app/admin/custom/sponsored/SponsoredPlacementRowMenu';
import type {
  SponsoredPlacementPublic,
  SponsoredSurface,
} from '@/lib/sponsored-placements';
import { SPONSORED_SURFACE_META } from '@/lib/sponsored-placements';

type CategoryOption = { id: string; name: string; slug: string };
type ListOption = {
  id: string;
  title: string;
  slug: string;
  categoryId: string | null;
  categories: { name: string; slug: string } | null;
};

type PlacementRow = {
  id: string;
  name: string | null;
  scopeType: string;
  categoryId: string | null;
  listIds: string[];
  listId: string | null;
  surface: string;
  headline: string;
  bodyText: string | null;
  ctaLabel: string;
  destinationUrl: string;
  sponsorName: string | null;
  disclosureLabel: string;
  startAt: string;
  endAt: string | null;
  isActive: boolean;
  priority: number;
  impressions: number;
  clicks: number;
  isLive: boolean;
  isExpired: boolean;
  categories: CategoryOption | null;
  lists: { id: string; title: string; slug: string } | null;
};

type PerformanceData = {
  impressions: number;
  clicks: number;
  ctr: number;
  daily: { date: string; impressions: number; clicks: number }[];
};

type DurationPreset = 'week1' | 'month1' | 'open';

const DEFAULT_FORM = {
  name: '',
  scopeType: 'CATEGORY_ALL' as 'CATEGORY_ALL' | 'CATEGORY_SELECTED' | 'LIST',
  surface: 'LIST_BANNER' as SponsoredSurface,
  categoryId: '',
  listId: '',
  listIds: [] as string[],
  headline: '',
  bodyText: '',
  ctaLabel: 'مشاهده',
  destinationUrl: '',
  sponsorName: '',
  disclosureLabel: 'تبلیغ',
  priority: 0,
  isActive: true,
};

const inputClass =
  'w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30';

const labelClass = 'block text-xs font-medium text-[var(--color-text-muted)] mb-1.5';

const datePickerInputClass = `${inputClass} !py-2 !px-2 flex-1 text-right`;

function normalizeDestinationUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `http://${trimmed.replace(/^\/+/, '')}`;
}

function scopeLabel(p: PlacementRow): string {
  if (p.scopeType === 'LIST') return `لیست: ${p.lists?.title ?? p.listId}`;
  if (p.scopeType === 'CATEGORY_SELECTED') {
    return `دسته ${p.categories?.name ?? ''} (${p.listIds.length.toLocaleString('fa-IR')} لیست)`;
  }
  return `همه لیست‌های ${p.categories?.name ?? ''}`;
}

function surfaceLabel(surface: string): string {
  const meta = SPONSORED_SURFACE_META[surface as SponsoredSurface];
  return meta?.label ?? surface;
}

function isListSurface(surface: string): boolean {
  return surface !== 'CATEGORY_BANNER';
}

function previewVariantForSurface(surface: SponsoredSurface): 'banner' | 'sidebar' | 'inline' {
  if (surface === 'LIST_SIDEBAR') return 'sidebar';
  if (surface === 'LIST_AFTER_SIMILAR') return 'inline';
  return 'banner';
}

function formatTimeFromDate(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function placementToForm(p: PlacementRow): typeof DEFAULT_FORM {
  return {
    name: p.name ?? '',
    scopeType: p.scopeType as typeof DEFAULT_FORM.scopeType,
    surface: p.surface as SponsoredSurface,
    categoryId: p.categoryId ?? '',
    listId: p.listId ?? '',
    listIds: p.listIds ?? [],
    headline: p.headline,
    bodyText: p.bodyText ?? '',
    ctaLabel: p.ctaLabel,
    destinationUrl: p.destinationUrl,
    sponsorName: p.sponsorName ?? '',
    disclosureLabel: p.disclosureLabel || 'تبلیغ',
    priority: p.priority,
    isActive: p.isActive,
  };
}

function loadScheduleFromPlacement(p: Pick<PlacementRow, 'startAt' | 'endAt'>) {
  const start = new Date(p.startAt);
  const startDate = new DateObject({ date: start, calendar: persian, locale: persian_fa });
  const startTime = formatTimeFromDate(start);

  if (p.endAt) {
    const end = new Date(p.endAt);
    return {
      startDate,
      startTime,
      endDate: new DateObject({ date: end, calendar: persian, locale: persian_fa }),
      endTime: formatTimeFromDate(end),
    };
  }

  return {
    startDate,
    startTime,
    endDate: null,
    endTime: '23:59',
  };
}

function combineDateAndTime(date: DateObject | null, time: string, isEnd = false): string | null {
  if (!date) return null;
  const d = date.toDate();
  const [h, m] = time.split(':').map(Number);
  if (isEnd) d.setHours(h ?? 23, m ?? 59, 59, 999);
  else d.setHours(h ?? 0, m ?? 0, 0, 0);
  return d.toISOString();
}

function formatPersianDay(iso: string): string {
  try {
    return new DateObject({ date: new Date(iso), calendar: persian, locale: persian_fa }).format(
      'DD MMMM YYYY'
    );
  } catch {
    return iso.slice(0, 10);
  }
}

function FormSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-2.5 bg-[var(--color-bg)] text-sm font-medium text-[var(--color-text)]"
      >
        {title}
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open ? <div className="p-4 space-y-3">{children}</div> : null}
    </div>
  );
}

export default function SponsoredPlacementsClient() {
  const [placements, setPlacements] = useState<PlacementRow[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [lists, setLists] = useState<ListOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [formStartDate, setFormStartDate] = useState<DateObject | null>(null);
  const [formStartTime, setFormStartTime] = useState('00:00');
  const [formEndDate, setFormEndDate] = useState<DateObject | null>(null);
  const [formEndTime, setFormEndTime] = useState('23:59');
  const [activePreset, setActivePreset] = useState<DurationPreset | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [perfId, setPerfId] = useState<string | null>(null);
  const [perf, setPerf] = useState<PerformanceData | null>(null);
  const [perfLoading, setPerfLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/custom/sponsored');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'خطا');
      setPlacements(json.placements ?? []);
      setCategories(json.categories ?? []);
      setLists(json.lists ?? []);
    } catch (e: unknown) {
      setToast({
        message: e instanceof Error ? e.message : 'خطا در دریافت',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const stats = useMemo(
    () => ({
      active: placements.filter((p) => p.isLive).length,
      total: placements.length,
      impressions: placements.reduce((s, p) => s + p.impressions, 0),
      clicks: placements.reduce((s, p) => s + p.clicks, 0),
    }),
    [placements]
  );

  const categoryLists = useMemo(() => {
    if (!form.categoryId) return lists;
    return lists.filter((l) => l.categoryId === form.categoryId);
  }, [lists, form.categoryId]);

  const previewPlacement: SponsoredPlacementPublic | null = form.headline.trim()
    ? {
        id: 'preview',
        headline: form.headline,
        bodyText: form.bodyText || null,
        ctaLabel: form.ctaLabel || 'مشاهده',
        clickUrl: '#',
        disclosureLabel: form.disclosureLabel || 'تبلیغ',
        sponsorName: form.sponsorName || null,
      }
    : null;

  const resetFormState = () => {
    setForm(DEFAULT_FORM);
    setFormStartDate(null);
    setFormStartTime('00:00');
    setFormEndDate(null);
    setFormEndTime('23:59');
    setActivePreset(null);
    setFormError(null);
  };

  const openForm = () => {
    const now = new Date();
    setEditingId(null);
    setFormStartDate(new DateObject({ date: now, calendar: persian, locale: persian_fa }));
    setFormStartTime(formatTimeFromDate(now));
    setFormEndDate(null);
    setFormEndTime('23:59');
    setActivePreset(null);
    setFormError(null);
    setForm(DEFAULT_FORM);
    setFormOpen(true);
  };

  const openEditForm = (p: PlacementRow) => {
    const schedule = loadScheduleFromPlacement(p);
    setEditingId(p.id);
    setForm(placementToForm(p));
    setFormStartDate(schedule.startDate);
    setFormStartTime(schedule.startTime);
    setFormEndDate(schedule.endDate);
    setFormEndTime(schedule.endTime);
    setActivePreset(null);
    setFormError(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    resetFormState();
  };

  const applyPreset = (preset: DurationPreset) => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    setActivePreset(preset);
    setFormStartDate(new DateObject({ date: start, calendar: persian, locale: persian_fa }));
    setFormStartTime('00:00');

    if (preset === 'week1') {
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      setFormEndDate(new DateObject({ date: end, calendar: persian, locale: persian_fa }));
      setFormEndTime('23:59');
      return;
    }

    if (preset === 'month1') {
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      setFormEndDate(new DateObject({ date: end, calendar: persian, locale: persian_fa }));
      setFormEndTime('23:59');
      return;
    }

    setFormEndDate(null);
    setFormEndTime('23:59');
  };

  const validateForm = (): string | null => {
    if (!form.headline.trim()) return 'عنوان تبلیغ الزامی است';
    const destinationUrl = normalizeDestinationUrl(form.destinationUrl);
    if (!destinationUrl) return 'لینک مقصد الزامی است';
    if (!/^https?:\/\//i.test(destinationUrl)) {
      return 'لینک باید با http:// یا https:// شروع شود';
    }
    if (!formStartDate) return 'تاریخ شروع الزامی است';
    if (
      form.scopeType === 'LIST' &&
      !form.listId
    ) {
      return 'یک لیست انتخاب کنید';
    }
    if (
      isListSurface(form.surface) &&
      (form.scopeType === 'CATEGORY_ALL' ||
        form.scopeType === 'CATEGORY_SELECTED') &&
      !form.categoryId
    ) {
      return 'دسته را انتخاب کنید';
    }
    if (form.scopeType === 'CATEGORY_SELECTED' && form.listIds.length === 0) {
      return 'حداقل یک لیست انتخاب کنید';
    }
    if (form.surface === 'CATEGORY_BANNER' && !form.categoryId) {
      return 'برای بنر دسته، دسته را انتخاب کنید';
    }
    const startIso = combineDateAndTime(formStartDate, formStartTime);
    const endIso = formEndDate ? combineDateAndTime(formEndDate, formEndTime, true) : null;
    if (startIso && endIso && new Date(endIso) <= new Date(startIso)) {
      return 'تاریخ پایان باید بعد از شروع باشد';
    }
    return null;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const err = validateForm();
    if (err) {
      setFormError(err);
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      const startAt = combineDateAndTime(formStartDate, formStartTime)!;
      const endAt = formEndDate ? combineDateAndTime(formEndDate, formEndTime, true) : null;
      const payload = {
        ...form,
        destinationUrl: normalizeDestinationUrl(form.destinationUrl),
        startAt,
        endAt,
        categoryId: form.categoryId || null,
        listId: form.scopeType === 'LIST' ? form.listId : null,
        listIds: form.scopeType === 'CATEGORY_SELECTED' ? form.listIds : [],
      };
      const res = await fetch(
        editingId ? `/api/admin/custom/sponsored/${editingId}` : '/api/admin/custom/sponsored',
        {
          method: editingId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'خطا در ذخیره');
      setToast({
        message: editingId ? 'تبلیغ به‌روزرسانی شد' : 'تبلیغ ایجاد شد',
        type: 'success',
      });
      closeForm();
      await fetchData();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'خطا');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('این تبلیغ حذف شود؟')) return;
    try {
      const res = await fetch(`/api/admin/custom/sponsored/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'خطا');
      setToast({ message: 'حذف شد', type: 'success' });
      if (perfId === id) setPerfId(null);
      await fetchData();
    } catch (e: unknown) {
      setToast({
        message: e instanceof Error ? e.message : 'خطا',
        type: 'error',
      });
    }
  };

  const handleToggleActive = async (p: PlacementRow) => {
    setTogglingId(p.id);
    try {
      const res = await fetch(`/api/admin/custom/sponsored/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !p.isActive }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'خطا');
      setToast({
        message: p.isActive ? 'تبلیغ غیرفعال شد' : 'تبلیغ فعال شد',
        type: 'success',
      });
      await fetchData();
    } catch (e: unknown) {
      setToast({
        message: e instanceof Error ? e.message : 'خطا',
        type: 'error',
      });
    } finally {
      setTogglingId(null);
    }
  };

  const loadPerformance = async (id: string) => {
    setPerfId(id);
    setPerfLoading(true);
    setPerf(null);
    try {
      const res = await fetch(`/api/admin/custom/sponsored/${id}/performance`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'خطا');
      setPerf(json.data);
    } catch (e: unknown) {
      setToast({
        message: e instanceof Error ? e.message : 'خطا در گزارش',
        type: 'error',
      });
      setPerf(null);
      setPerfId(null);
    } finally {
      setPerfLoading(false);
    }
  };

  const toggleListSelection = (listId: string) => {
    setForm((f) => ({
      ...f,
      listIds: f.listIds.includes(listId)
        ? f.listIds.filter((id) => id !== listId)
        : [...f.listIds, listId],
    }));
  };

  const selectedPlacement = perfId ? placements.find((p) => p.id === perfId) : null;

  return (
    <div className="space-y-6 pb-8" dir="rtl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-[var(--color-text)]">
            <Megaphone className="h-5 w-5 text-amber-600" />
            تبلیغات اسپانسری
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            متن تبلیغ با لینک — چند تبلیغ هم‌پوزیشن زیر هم نمایش داده می‌شوند
          </p>
        </div>
        <button
          type="button"
          onClick={openForm}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          تبلیغ جدید
        </button>
      </div>

      {!loading && placements.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard title="فعال" value={stats.active} icon={Megaphone} />
          <MetricCard title="کل تبلیغ‌ها" value={stats.total} icon={Calendar} />
          <MetricCard title="نمایش" value={stats.impressions} icon={Eye} />
          <MetricCard title="کلیک" value={stats.clicks} icon={MousePointerClick} />
        </div>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
        </div>
      ) : placements.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg)] px-6 py-14 text-center">
          <Megaphone className="mx-auto h-10 w-10 text-[var(--color-text-muted)] opacity-40" />
          <p className="mt-3 font-medium text-[var(--color-text)]">هنوز تبلیغی ثبت نشده</p>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            اولین تبلیغ متنی را برای دسته یا لیست ایجاد کنید
          </p>
          <button
            type="button"
            onClick={openForm}
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-white"
          >
            <Plus className="h-4 w-4" />
            ایجاد تبلیغ
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
          <div className="-mx-px overflow-x-auto rounded-2xl">
            <table className="w-full min-w-[880px] table-fixed text-sm">
              <colgroup>
                <col style={{ width: '28%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '22%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '48px' }} />
              </colgroup>
              <thead className="bg-[var(--color-bg)] text-[var(--color-text-muted)]">
                <tr>
                  <th className="px-4 py-3 text-right font-medium">تبلیغ</th>
                  <th className="px-4 py-3 text-right font-medium">محل نمایش</th>
                  <th className="px-4 py-3 text-right font-medium">محدوده</th>
                  <th className="hidden px-4 py-3 text-right font-medium md:table-cell">زمان‌بندی</th>
                  <th className="px-4 py-3 text-right font-medium">وضعیت</th>
                  <th className="px-4 py-3 text-right font-medium">نمایش / کلیک</th>
                  <th
                    className="sticky left-0 z-20 bg-[var(--color-bg)] px-2 py-3 shadow-[4px_0_8px_-6px_rgba(0,0,0,0.08)]"
                    aria-label="عملیات"
                  />
                </tr>
              </thead>
              <tbody>
                {placements.map((p) => (
                  <tr
                    key={p.id}
                    className="group border-t border-[var(--color-border)] hover:bg-[var(--color-bg)]/60 transition-colors"
                  >
                    <td className="px-4 py-3 align-top">
                      <p className="font-medium text-[var(--color-text)] line-clamp-2">{p.headline}</p>
                      <p className="mt-0.5 truncate text-xs text-[var(--color-text-muted)]" dir="ltr">
                        {p.destinationUrl}
                      </p>
                      {p.sponsorName ? (
                        <p className="mt-0.5 truncate text-xs text-amber-700">{p.sponsorName}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p className="text-xs font-medium text-[var(--color-text)]">
                        {surfaceLabel(p.surface)}
                      </p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p className="text-xs leading-relaxed text-[var(--color-text)] line-clamp-3">
                        {scopeLabel(p)}
                      </p>
                    </td>
                    <td className="hidden px-4 py-3 align-top md:table-cell">
                      <p className="text-xs text-[var(--color-text)]">{formatPersianDay(p.startAt)}</p>
                      <p className="text-[10px] text-[var(--color-text-muted)]">
                        {p.endAt ? `تا ${formatPersianDay(p.endAt)}` : 'بدون پایان'}
                      </p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          p.isLive
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                            : p.isExpired
                              ? 'bg-gray-100 text-[var(--color-text-muted)] dark:bg-gray-700/50 dark:text-[var(--color-text-subtle)]'
                              : 'bg-gray-100 text-[var(--color-text-muted)] dark:bg-gray-700/50 dark:text-[var(--color-text-subtle)]'
                        }`}
                      >
                        {p.isLive ? 'فعال' : p.isExpired ? 'منقضی' : 'غیرفعال'}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top text-xs tabular-nums whitespace-nowrap">
                      <span className="text-[var(--color-text)]">
                        {p.impressions.toLocaleString('fa-IR')}
                      </span>
                      <span className="text-[var(--color-text-muted)]"> / </span>
                      <span className="text-[var(--color-text)]">
                        {p.clicks.toLocaleString('fa-IR')}
                      </span>
                      {p.impressions > 0 ? (
                        <span className="mr-1 text-[var(--color-text-muted)]">
                          ({((p.clicks / p.impressions) * 100).toFixed(1)}٪)
                        </span>
                      ) : null}
                    </td>
                    <td className="sticky left-0 z-10 bg-[var(--color-surface)] px-2 py-3 shadow-[4px_0_8px_-6px_rgba(0,0,0,0.12)] group-hover:bg-[var(--color-bg)]">
                      <SponsoredPlacementRowMenu
                        isActive={p.isActive}
                        toggling={togglingId === p.id}
                        onEdit={() => openEditForm(p)}
                        onToggleActive={() => void handleToggleActive(p)}
                        onPerformance={() => void loadPerformance(p.id)}
                        onDelete={() => void handleDelete(p.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {formOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[var(--color-surface)] rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-4xl max-h-[92vh] sm:max-h-[90vh] overflow-hidden flex flex-col border border-[var(--color-border)]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)] shrink-0">
              <div>
                <h2 className="text-lg font-bold text-[var(--color-text)]">
                  {editingId ? 'ویرایش تبلیغ' : 'تبلیغ جدید'}
                </h2>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  {editingId ? 'تغییر محتوا، محدوده یا زمان‌بندی' : 'محتوا، محدوده نمایش و زمان‌بندی'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeForm}
                className="p-2 rounded-xl hover:bg-[var(--color-bg)]"
                aria-label="بستن"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-1 min-h-0 overflow-hidden flex-col lg:flex-row">
              <form
                id="sponsored-form"
                onSubmit={(e) => void handleSubmit(e)}
                className="flex-1 overflow-y-auto p-5 space-y-4"
              >
                <FormSection title="محل و محدوده نمایش">
                  <div>
                    <label className={labelClass}>محل نمایش در صفحه</label>
                    <p className="mb-2 text-[11px] text-[var(--color-text-muted)] leading-relaxed">
                      هر صفحه می‌تواند چند تبلیغ فعال در هر محل داشته باشد — همهٔ تبلیغ‌های
                      هم‌پوزیشن زیر هم نمایش داده می‌شوند. اولویت بالاتر بالاتر قرار می‌گیرد.
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {(Object.keys(SPONSORED_SURFACE_META) as SponsoredSurface[]).map((surface) => {
                        const meta = SPONSORED_SURFACE_META[surface];
                        const selected = form.surface === surface;
                        return (
                          <button
                            key={surface}
                            type="button"
                            onClick={() =>
                              setForm((f) => ({
                                ...f,
                                surface,
                                scopeType:
                                  surface === 'CATEGORY_BANNER' && f.scopeType === 'LIST'
                                    ? 'CATEGORY_ALL'
                                    : f.scopeType,
                              }))
                            }
                            className={`rounded-xl border p-3 text-right transition-colors ${
                              selected
                                ? 'border-[var(--primary)] bg-[var(--primary)]/5 ring-1 ring-[var(--primary)]/30'
                                : 'border-[var(--color-border)] hover:border-[var(--primary)]/30'
                            }`}
                          >
                            <p className="text-sm font-semibold text-[var(--color-text)]">
                              {meta.label}
                            </p>
                            <p className="mt-1 text-[11px] text-[var(--color-text-muted)] leading-snug">
                              {meta.hint}
                            </p>
                            <span className="mt-2 inline-block rounded-md bg-[var(--color-bg)] px-2 py-0.5 text-[10px] text-[var(--color-text-muted)]">
                              {meta.page === 'list' ? 'صفحه لیست' : 'صفحه دسته'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {form.surface === 'CATEGORY_BANNER' ? (
                    <div>
                      <label className={labelClass}>دسته</label>
                      <select
                        className={inputClass}
                        value={form.categoryId}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, categoryId: e.target.value, listIds: [] }))
                        }
                      >
                        <option value="">انتخاب دسته</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className={labelClass}>نوع محدوده</label>
                        <select
                          className={inputClass}
                          value={form.scopeType}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              scopeType: e.target.value as typeof f.scopeType,
                            }))
                          }
                        >
                          <option value="CATEGORY_ALL">همه لیست‌های دسته</option>
                          <option value="CATEGORY_SELECTED">لیست‌های انتخابی</option>
                          <option value="LIST">یک لیست</option>
                        </select>
                      </div>

                      {(form.scopeType === 'CATEGORY_ALL' ||
                        form.scopeType === 'CATEGORY_SELECTED') && (
                        <div>
                          <label className={labelClass}>دسته</label>
                          <select
                            className={inputClass}
                            value={form.categoryId}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, categoryId: e.target.value, listIds: [] }))
                            }
                          >
                            <option value="">انتخاب دسته</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {form.scopeType === 'LIST' && (
                        <div>
                          <label className={labelClass}>لیست</label>
                          <select
                            className={inputClass}
                            value={form.listId}
                            onChange={(e) => setForm((f) => ({ ...f, listId: e.target.value }))}
                          >
                            <option value="">انتخاب لیست</option>
                            {lists.map((l) => (
                              <option key={l.id} value={l.id}>
                                {l.title} ({l.categories?.name ?? '—'})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {form.scopeType === 'CATEGORY_SELECTED' && form.categoryId ? (
                        <div>
                          <label className={labelClass}>
                            لیست‌های هدف ({form.listIds.length.toLocaleString('fa-IR')} انتخاب)
                          </label>
                          <div className="max-h-36 overflow-y-auto rounded-xl border border-[var(--color-border)] p-2">
                            <div className="flex flex-wrap gap-1.5">
                              {categoryLists.map((l) => {
                                const selected = form.listIds.includes(l.id);
                                return (
                                  <button
                                    key={l.id}
                                    type="button"
                                    onClick={() => toggleListSelection(l.id)}
                                    className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                                      selected
                                        ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                                        : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--primary)]/40'
                                    }`}
                                  >
                                    {l.title}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </>
                  )}
                </FormSection>

                <FormSection title="محتوای تبلیغ" defaultOpen>
                  <div>
                    <label className={labelClass}>نام داخلی (اختیاری)</label>
                    <input
                      className={inputClass}
                      placeholder="مثلاً کمپین دیجی‌کالا"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>عنوان تبلیغ *</label>
                    <input
                      className={inputClass}
                      placeholder="بهترین سایت دانلود منابع"
                      value={form.headline}
                      onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>متن توضیح</label>
                    <textarea
                      className={inputClass}
                      placeholder="توضیح کوتاه (اختیاری)"
                      rows={2}
                      value={form.bodyText}
                      onChange={(e) => setForm((f) => ({ ...f, bodyText: e.target.value }))}
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>متن دکمه</label>
                      <input
                        className={inputClass}
                        value={form.ctaLabel}
                        onChange={(e) => setForm((f) => ({ ...f, ctaLabel: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>نام اسپانسر</label>
                      <input
                        className={inputClass}
                        placeholder="اختیاری"
                        value={form.sponsorName}
                        onChange={(e) => setForm((f) => ({ ...f, sponsorName: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>لینک مقصد *</label>
                    <div className="flex overflow-hidden rounded-xl border border-[var(--color-border)] focus-within:ring-2 focus-within:ring-[var(--primary)]/30">
                      <span className="flex shrink-0 items-center bg-[var(--color-bg)] px-3 text-xs text-[var(--color-text-muted)] border-l border-[var(--color-border)]">
                        http://
                      </span>
                      <input
                        className="min-w-0 flex-1 border-0 bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text)] focus:outline-none"
                        dir="ltr"
                        placeholder="www.example.com"
                        value={form.destinationUrl.replace(/^https?:\/\//i, '')}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            destinationUrl: e.target.value.replace(/^https?:\/\//i, ''),
                          }))
                        }
                        onBlur={() =>
                          setForm((f) => ({
                            ...f,
                            destinationUrl: normalizeDestinationUrl(f.destinationUrl),
                          }))
                        }
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-[var(--color-text-muted)]">
                      اگر http:// ننویسید، هنگام ذخیره خودکار اضافه می‌شود
                    </p>
                  </div>
                </FormSection>

                <FormSection title="زمان‌بندی">
                  <label className="flex items-center gap-2 cursor-pointer w-fit">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                      className="rounded border-[var(--color-border)]"
                    />
                    <span className="text-sm text-[var(--color-text)]">تبلیغ فعال باشد</span>
                  </label>

                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { id: 'week1' as const, label: '۱ هفته' },
                        { id: 'month1' as const, label: '۱ ماه' },
                        { id: 'open' as const, label: 'بدون پایان' },
                      ] as const
                    ).map(({ id, label }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => applyPreset(id)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                          activePreset === id
                            ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                            : 'border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--primary)]/40'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {formStartDate ? (
                    <p className="text-xs text-[var(--color-text-muted)] bg-[var(--color-bg)] rounded-xl px-3 py-2">
                      شروع: {formStartDate.format?.('DD MMMM YYYY') ?? '—'}
                      {formEndDate
                        ? ` · پایان: ${formEndDate.format?.('DD MMMM YYYY') ?? '—'}`
                        : ' · بدون پایان'}
                    </p>
                  ) : null}

                  <div className="grid sm:grid-cols-2 gap-3 p-3 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)]">
                    <div>
                      <label className={labelClass}>تاریخ شروع (شمسی)</label>
                      <div className="flex gap-2">
                        <DatePicker
                          value={formStartDate}
                          onChange={(d) => {
                            setFormStartDate(d ?? null);
                            setActivePreset(null);
                          }}
                          calendar={persian}
                          locale={persian_fa}
                          calendarPosition="bottom-right"
                          portal
                          zIndex={10060}
                          format="DD MMMM YYYY"
                          placeholder="انتخاب تاریخ"
                          inputClass={datePickerInputClass}
                        />
                        <input
                          type="time"
                          value={formStartTime}
                          onChange={(e) => setFormStartTime(e.target.value)}
                          className="rounded-xl border border-[var(--color-border)] text-sm px-2 w-[88px] bg-[var(--color-surface)]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>تاریخ پایان (شمسی، اختیاری)</label>
                      <div className="flex gap-2">
                        <DatePicker
                          value={formEndDate}
                          onChange={(d) => {
                            setFormEndDate(d ?? null);
                            setActivePreset(null);
                          }}
                          calendar={persian}
                          locale={persian_fa}
                          calendarPosition="bottom-right"
                          portal
                          zIndex={10060}
                          format="DD MMMM YYYY"
                          placeholder="بدون پایان"
                          inputClass={datePickerInputClass}
                        />
                        <input
                          type="time"
                          value={formEndTime}
                          onChange={(e) => setFormEndTime(e.target.value)}
                          className="rounded-xl border border-[var(--color-border)] text-sm px-2 w-[88px] bg-[var(--color-surface)]"
                        />
                      </div>
                    </div>
                  </div>
                </FormSection>

                {formError ? (
                  <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2">
                    {formError}
                  </p>
                ) : null}
              </form>

              <div className="hidden lg:flex lg:flex-col w-[300px] shrink-0 border-r border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                <p className="text-xs font-medium text-[var(--color-text-muted)] mb-3">پیش‌نمایش</p>
                <div className="flex-1 flex items-start">
                  {previewPlacement ? (
                    <SponsoredTextBanner
                      placement={previewPlacement}
                      variant={previewVariantForSurface(form.surface)}
                    />
                  ) : (
                    <p className="text-sm text-[var(--color-text-muted)]">
                      عنوان تبلیغ را وارد کنید تا پیش‌نمایش نمایش داده شود
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[var(--color-border)] shrink-0 bg-[var(--color-surface)]">
              <button
                type="button"
                onClick={closeForm}
                className="rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-bg)]"
              >
                انصراف
              </button>
              <button
                type="submit"
                form="sponsored-form"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {submitting ? 'در حال ذخیره…' : editingId ? 'ذخیره تغییرات' : 'ذخیره تبلیغ'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {perfId ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[var(--color-surface)] rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col border border-[var(--color-border)]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
              <div>
                <h3 className="font-bold text-[var(--color-text)]">گزارش عملکرد</h3>
                {selectedPlacement ? (
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5 truncate max-w-[280px]">
                    {selectedPlacement.headline}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setPerfId(null)}
                className="p-2 rounded-xl hover:bg-[var(--color-bg)]"
                aria-label="بستن"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto">
              {perfLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-7 w-7 animate-spin text-[var(--primary)]" />
                </div>
              ) : perf ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-[var(--color-bg)] p-3 text-center">
                      <p className="text-xs text-[var(--color-text-muted)]">نمایش</p>
                      <p className="text-lg font-bold tabular-nums">
                        {perf.impressions.toLocaleString('fa-IR')}
                      </p>
                    </div>
                    <div className="rounded-xl bg-[var(--color-bg)] p-3 text-center">
                      <p className="text-xs text-[var(--color-text-muted)]">کلیک</p>
                      <p className="text-lg font-bold tabular-nums">
                        {perf.clicks.toLocaleString('fa-IR')}
                      </p>
                    </div>
                    <div className="rounded-xl bg-[var(--color-bg)] p-3 text-center">
                      <p className="text-xs text-[var(--color-text-muted)]">CTR</p>
                      <p className="text-lg font-bold tabular-nums">
                        {(perf.ctr * 100).toFixed(1)}٪
                      </p>
                    </div>
                  </div>
                  {perf.daily.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
                      <table className="min-w-full text-xs">
                        <thead className="bg-[var(--color-bg)]">
                          <tr className="text-[var(--color-text-muted)]">
                            <th className="px-3 py-2 text-right font-medium">تاریخ</th>
                            <th className="px-3 py-2 text-right font-medium">نمایش</th>
                            <th className="px-3 py-2 text-right font-medium">کلیک</th>
                          </tr>
                        </thead>
                        <tbody>
                          {perf.daily.map((d) => (
                            <tr key={d.date} className="border-t border-[var(--color-border)]">
                              <td className="px-3 py-2">{formatPersianDay(d.date)}</td>
                              <td className="px-3 py-2 tabular-nums">
                                {d.impressions.toLocaleString('fa-IR')}
                              </td>
                              <td className="px-3 py-2 tabular-nums">
                                {d.clicks.toLocaleString('fa-IR')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-center text-[var(--color-text-muted)] py-4">
                      هنوز رویدادی ثبت نشده
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      ) : null}
    </div>
  );
}
