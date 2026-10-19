'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Loader2, X } from 'lucide-react';
import Toast, { type ToastType } from '@/components/shared/Toast';
import DatePicker, { DateObject } from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import FeaturedHeroHeader from './components/FeaturedHeroHeader';
import FeaturedStatsBar from './components/FeaturedStatsBar';
import FeaturedWeeklyDetails from './components/FeaturedWeeklyDetails';
import DeleteSlotDialog from './components/DeleteSlotDialog';
import type { ConflictResult, DurationPreset, ListOption } from './components/AddSlotCard';
import type { PreviewList } from './components/FeaturedMobilePreview';
import FeaturedSchedulerTab from './components/FeaturedSchedulerTab';
import type {
  FeaturedManagementData,
  FeaturedListOption,
  FeaturedSlotItem,
  FeaturedSlotPerformance,
  FeaturedWeeklyReportPayload,
} from '@/lib/admin/featured-management-types';
import type { WeeklyReport } from './components/featured-weekly-types';

const AddSlotWizardModal = dynamic(
  () => import('./components/AddSlotWizardModal'),
  { ssr: false }
);

export type { ListOption };

export type SlotItem = FeaturedSlotItem;

type Data = {
  current: SlotItem | null;
  fallbackList: { id: string; title: string; slug: string } | null;
  fallbackListDetail: FeaturedListOption | null;
  upcoming: SlotItem[];
  past: SlotItem[];
  lists: ListOption[];
  weeklyReport: FeaturedWeeklyReportPayload | null;
  currentPerformance: FeaturedSlotPerformance | null;
  currentRecommendations: string[];
};

const DEBOUNCE_MS = 400;

function getRemainingText(slot: SlotItem): string | null {
  const end = slot.endAt ? new Date(slot.endAt) : null;
  if (!end) return 'نامحدود';
  const now = new Date();
  if (end <= now) return null;
  const diff = end.getTime() - now.getTime();
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  if (days > 0) return `${days} روز باقی‌مانده`;
  const hours = Math.floor(diff / (60 * 60 * 1000));
  return hours > 0 ? `${hours} ساعت باقی‌مانده` : 'کمتر از یک ساعت';
}

function listToPreview(l: ListOption): PreviewList {
  return {
    title: l.title,
    description: l.description,
    coverImage: l.coverImage,
    saveCount: l.saveCount,
    itemCount: l.itemCount,
    badge: l.badge,
  };
}

function toClientData(payload: FeaturedManagementData, prevLists?: ListOption[]): Data {
  return {
    current: payload.current,
    fallbackList: payload.fallbackList,
    fallbackListDetail: payload.fallbackListDetail,
    upcoming: payload.upcoming,
    past: payload.past,
    lists: prevLists && prevLists.length > 0 ? prevLists : payload.lists,
    weeklyReport: payload.weeklyReport,
    currentPerformance: payload.currentPerformance,
    currentRecommendations: payload.currentRecommendations,
  };
}

function FeaturedManagementInner({
  initialData,
}: {
  initialData?: FeaturedManagementData | null;
}) {
  const [data, setData] = useState<Data | null>(() =>
    initialData ? toClientData(initialData) : null
  );
  const [loading, setLoading] = useState(!initialData);
  const [statsRefreshKey, setStatsRefreshKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [formCategorySlug, setFormCategorySlug] = useState('');
  const [formListId, setFormListId] = useState('');
  const [formStartDate, setFormStartDate] = useState<DateObject | null>(null);
  const [formStartTime, setFormStartTime] = useState('00:00');
  const [formEndDate, setFormEndDate] = useState<DateObject | null>(null);
  const [formEndTime, setFormEndTime] = useState('23:59');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [conflictResult, setConflictResult] = useState<ConflictResult>(null);
  const [editingSlot, setEditingSlot] = useState<SlotItem | null>(null);
  const [editStartDate, setEditStartDate] = useState<DateObject | null>(null);
  const [editStartTime, setEditStartTime] = useState('00:00');
  const [editEndDate, setEditEndDate] = useState<DateObject | null>(null);
  const [editEndTime, setEditEndTime] = useState('23:59');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const conflictTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listsLoadedRef = useRef(
    Boolean(initialData?.lists && initialData.lists.length > 0)
  );
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const ensureListsLoaded = useCallback(async () => {
    if (listsLoadedRef.current) return;
    try {
      const listRes = await fetch(`/api/admin/custom/featured/lists?t=${Date.now()}`);
      const listJson = await listRes.json();
      if (listRes.ok && Array.isArray(listJson.lists)) {
        listsLoadedRef.current = true;
        setData((prev) =>
          prev ? { ...prev, lists: listJson.lists as ListOption[] } : prev
        );
      }
    } catch {
      /* ignore — wizard can retry via refresh */
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/custom/featured?t=${Date.now()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.details || 'خطا در دریافت');
      setData((prev) =>
        toClientData(json as FeaturedManagementData, prev?.lists)
      );
      setStatsRefreshKey((k) => k + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialData) {
      void fetchData();
    }
  }, [initialData, fetchData]);

  const checkConflict = useCallback(async (startAt: string, endAt: string | null, excludeId?: string) => {
    const end = endAt || new Date('2099-12-31T23:59:59Z').toISOString();
    const params = new URLSearchParams({ startAt, endAt: end });
    if (excludeId) params.set('excludeId', excludeId);
    try {
      const res = await fetch(`/api/admin/custom/featured/check-conflict?${params}`);
      const json = await res.json();
      setConflictResult({
        conflict: json.conflict === true,
        conflictingSlot: json.conflictingSlot ?? undefined,
      });
    } catch {
      setConflictResult(null);
    }
  }, []);

  useEffect(() => {
    if (!formStartDate) {
      setConflictResult(null);
      return;
    }
    const startD = formStartDate.toDate();
    const [sh, sm] = formStartTime.split(':').map(Number);
    startD.setHours(sh ?? 0, sm ?? 0, 0, 0);
    let endD: Date;
    if (formEndDate) {
      endD = formEndDate.toDate();
      const [eh, em] = formEndTime.split(':').map(Number);
      endD.setHours(eh ?? 23, em ?? 59, 59, 999);
    } else {
      endD = new Date('2099-12-31T23:59:59Z');
    }
    if (endD <= startD) {
      setConflictResult(null);
      return;
    }
    if (conflictTimerRef.current) clearTimeout(conflictTimerRef.current);
    conflictTimerRef.current = setTimeout(() => {
      conflictTimerRef.current = null;
      checkConflict(startD.toISOString(), formEndDate ? endD.toISOString() : null);
    }, DEBOUNCE_MS);
    return () => {
      if (conflictTimerRef.current) clearTimeout(conflictTimerRef.current);
    };
  }, [formStartDate, formStartTime, formEndDate, formEndTime, checkConflict]);

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formListId || !formStartDate) {
      setSubmitError('لیست و تاریخ شروع الزامی هستند');
      return;
    }
    if (conflictResult?.conflict) return;
    setSubmitLoading(true);
    setSubmitError(null);
    try {
      const startD = formStartDate.toDate();
      const [sh, sm] = formStartTime.split(':').map(Number);
      startD.setHours(sh ?? 0, sm ?? 0, 0, 0);
      let endAt: string | undefined;
      if (formEndDate) {
        const endD = formEndDate.toDate();
        const [eh, em] = formEndTime.split(':').map(Number);
        endD.setHours(eh ?? 23, em ?? 59, 59, 999);
        endAt = endD.toISOString();
      }
      const res = await fetch('/api/admin/custom/featured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listId: formListId, startAt: startD.toISOString(), endAt }),
      });
      const text = await res.text();
      let json: { error?: string; details?: string } = {};
      try {
        json = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(res.ok ? 'پاسخ نامعتبر' : `خطا ${res.status}`);
      }
      if (!res.ok) throw new Error([json.error, json.details].filter(Boolean).join(' — ') || `خطا ${res.status}`);
      setFormListId('');
      setFormCategorySlug('');
      setFormStartDate(null);
      setFormStartTime('00:00');
      setFormEndDate(null);
      setFormEndTime('23:59');
      setConflictResult(null);
      setAddModalOpen(false);
      setToast({ message: 'اسلات با موفقیت ثبت شد', type: 'success' });
      await fetchData();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'خطا');
    } finally {
      setSubmitLoading(false);
    }
  };

  const requestDelete = (slotId: string, title: string) => {
    setDeleteTarget({ id: slotId, title });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/custom/featured/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'خطا');
      setDeleteTarget(null);
      setToast({ message: 'اسلات حذف شد', type: 'success' });
      await fetchData();
    } catch (e) {
      setToast({
        message: e instanceof Error ? e.message : 'خطا در حذف',
        type: 'error',
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const openAddModal = useCallback(
    (listId?: string) => {
      if (listId) setFormListId(listId);
      setAddModalOpen(true);
      void ensureListsLoaded();
    },
    [ensureListsLoaded]
  );

  const openEditModal = (slot: SlotItem) => {
    setEditingSlot(slot);
    setEditError(null);
    try {
      const start = new Date(slot.startAt);
      setEditStartDate(new DateObject({ date: start, calendar: persian, locale: persian_fa }));
      setEditStartTime(`${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`);
      if (slot.endAt) {
        const end = new Date(slot.endAt);
        setEditEndDate(new DateObject({ date: end, calendar: persian, locale: persian_fa }));
        setEditEndTime(`${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`);
      } else {
        setEditEndDate(null);
        setEditEndTime('23:59');
      }
    } catch {
      setEditStartDate(null);
      setEditStartTime('00:00');
      setEditEndDate(null);
      setEditEndTime('23:59');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot || !editStartDate) return;
    setEditLoading(true);
    setEditError(null);
    try {
      const startD = editStartDate.toDate();
      const [sh, sm] = editStartTime.split(':').map(Number);
      startD.setHours(sh ?? 0, sm ?? 0, 0, 0);
      let endAt: string | null = null;
      if (editEndDate) {
        const endD = editEndDate.toDate();
        const [eh, em] = editEndTime.split(':').map(Number);
        endD.setHours(eh ?? 23, em ?? 59, 59, 999);
        endAt = endD.toISOString();
      }
      const res = await fetch(`/api/admin/custom/featured/${editingSlot.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startAt: startD.toISOString(), endAt }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.details || 'خطا در ویرایش');
      setEditingSlot(null);
      setToast({ message: 'زمان‌بندی به‌روز شد', type: 'success' });
      await fetchData();
    } catch (e) {
      setEditError(e instanceof Error ? e.message : 'خطا');
    } finally {
      setEditLoading(false);
    }
  };

  const formatDate = useCallback((s: string) => {
    try {
      return new Date(s).toLocaleString('fa-IR', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return s;
    }
  }, []);

  const now = new Date();

  const handlePreset = useCallback((preset: DurationPreset) => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    if (preset === 'tomorrow') {
      start.setDate(start.getDate() + 1);
      setFormStartDate(new DateObject({ date: start, calendar: persian, locale: persian_fa }));
      setFormStartTime('00:00');
      setFormEndDate(null);
      setFormEndTime('23:59');
      return;
    }

    if (preset === 'week7') {
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      end.setHours(23, 59, 59, 999);
      setFormStartDate(new DateObject({ date: start, calendar: persian, locale: persian_fa }));
      setFormStartTime('00:00');
      setFormEndDate(new DateObject({ date: end, calendar: persian, locale: persian_fa }));
      setFormEndTime('23:59');
      return;
    }

    if (preset === 'weekend') {
      const day = start.getDay();
      const toSaturday = day === 5 ? 0 : day === 6 ? 6 : 5 - day;
      start.setDate(start.getDate() + (toSaturday <= 0 ? toSaturday + 7 : toSaturday));
      const end = new Date(start);
      end.setDate(end.getDate() + 2);
      end.setHours(23, 59, 59, 999);
      setFormStartDate(new DateObject({ date: start, calendar: persian, locale: persian_fa }));
      setFormStartTime('00:00');
      setFormEndDate(new DateObject({ date: end, calendar: persian, locale: persian_fa }));
      setFormEndTime('23:59');
      return;
    }

    setFormStartDate(new DateObject({ date: start, calendar: persian, locale: persian_fa }));
    setFormStartTime('00:00');
    setFormEndDate(null);
    setFormEndTime('23:59');
  }, []);

  if (loading && !data) {
    return (
      <div className="flex justify-center py-12" dir="rtl">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }
  if (error) {
    return (
      <div
        className="rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/60 p-6 text-red-800 dark:text-red-300"
        dir="rtl"
      >
        {error}
      </div>
    );
  }
  if (!data) return null;

  let previewList: PreviewList | null = null;
  let previewMode: 'live' | 'fallback' | 'empty' = 'empty';
  if (data.current?.list) {
    previewList = listToPreview(data.current.list as ListOption);
    previewMode = 'live';
  } else if (data.fallbackListDetail) {
    previewList = listToPreview(data.fallbackListDetail as ListOption);
    previewMode = 'fallback';
  } else if (data.fallbackList) {
    const full = data.lists.find((l) => l.id === data.fallbackList!.id);
    previewList = full
      ? listToPreview(full)
      : { title: data.fallbackList.title, saveCount: 0, itemCount: 0 };
    previewMode = 'fallback';
  }

  return (
    <div className="space-y-6 pb-8" dir="rtl">
      <FeaturedHeroHeader
        hasActiveSlot={!!data.current}
        upcomingCount={data.upcoming.length}
        onRefresh={fetchData}
        refreshing={loading}
        onAddSlot={() => openAddModal()}
      />

      <FeaturedStatsBar
        hasActiveSlot={!!data.current}
        upcomingCount={data.upcoming.length}
        pastCount={data.past.length}
        refreshKey={statsRefreshKey}
        initialReport={data.weeklyReport as WeeklyReport | null}
      />

      <FeaturedSchedulerTab
        current={data.current}
        fallbackList={data.fallbackList}
        upcoming={data.upcoming}
        past={data.past}
        previewList={previewList}
        previewMode={previewMode}
        formatDate={formatDate}
        remainingText={data.current ? getRemainingText(data.current) : null}
        now={now}
        onEditCurrent={() => openEditModal(data.current!)}
        onRemoveCurrent={() =>
          requestDelete(data.current!.id, data.current!.list.title)
        }
        onAddSlot={() => openAddModal()}
        onEditSlot={openEditModal}
        onDeleteSlot={(id) => {
          const slot =
            data.upcoming.find((s) => s.id === id) ??
            (data.current?.id === id ? data.current : null);
          requestDelete(id, slot?.list.title ?? 'اسلات');
        }}
        initialPerformance={data.currentPerformance}
        initialRecommendations={data.currentRecommendations}
      />

      <FeaturedWeeklyDetails
        onAddSlot={() => openAddModal()}
        refreshKey={statsRefreshKey}
        initialReport={data.weeklyReport as WeeklyReport | null}
      />

      <AddSlotWizardModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        lists={data.lists}
        formCategorySlug={formCategorySlug}
        formListId={formListId}
        formStartDate={formStartDate}
        formStartTime={formStartTime}
        formEndDate={formEndDate}
        formEndTime={formEndTime}
        conflict={conflictResult}
        submitLoading={submitLoading}
        submitError={submitError}
        onCategoryChange={setFormCategorySlug}
        onListChange={setFormListId}
        onStartDateChange={setFormStartDate}
        onStartTimeChange={setFormStartTime}
        onEndDateChange={setFormEndDate}
        onEndTimeChange={setFormEndTime}
        onPreset={handlePreset}
        onSubmit={handleAddSlot}
        formatDate={formatDate}
      />

      <DeleteSlotDialog
        isOpen={!!deleteTarget}
        listTitle={deleteTarget?.title ?? ''}
        loading={deleteLoading}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {editingSlot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[var(--color-surface)] rounded-2xl shadow-xl max-w-md w-full p-6 border border-[var(--color-border)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-[var(--color-text)]">
                ویرایش زمان‌بندی · {editingSlot.list.title}
              </h3>
              <button
                type="button"
                onClick={() => setEditingSlot(null)}
                className="p-2 rounded-xl text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]"
                aria-label="بستن"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                  تاریخ شروع (شمسی)
                </label>
                <div className="flex gap-2 flex-wrap">
                  <DatePicker
                    value={editStartDate}
                    onChange={(d) => setEditStartDate(d ?? null)}
                    calendar={persian}
                    locale={persian_fa}
                    calendarPosition="bottom-right"
                    className="rounded-xl border border-[var(--color-border)] text-sm"
                  />
                  <input
                    type="time"
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    className="rounded-xl border border-[var(--color-border)] text-sm px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                  تاریخ پایان (اختیاری)
                </label>
                <div className="flex gap-2 flex-wrap">
                  <DatePicker
                    value={editEndDate}
                    onChange={(d) => setEditEndDate(d ?? null)}
                    calendar={persian}
                    locale={persian_fa}
                    calendarPosition="bottom-right"
                    className="rounded-xl border border-[var(--color-border)] text-sm"
                  />
                  <input
                    type="time"
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    className="rounded-xl border border-[var(--color-border)] text-sm px-3 py-2"
                  />
                </div>
              </div>
              {editError && <p className="text-sm text-red-600 dark:text-red-400">{editError}</p>}
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingSlot(null)}
                  className="px-4 py-2 rounded-xl border border-[var(--color-border)] text-sm"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-sm hover:opacity-90 disabled:opacity-50"
                >
                  {editLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  ذخیره تغییرات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FeaturedManagementClient({
  initialData = null,
}: {
  initialData?: FeaturedManagementData | null;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12" dir="rtl">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        </div>
      }
    >
      <FeaturedManagementInner initialData={initialData} />
    </Suspense>
  );
}
