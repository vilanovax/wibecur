'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, X, Calendar, BarChart3, Lightbulb } from 'lucide-react';
import DatePicker, { type DateObject } from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import FeaturedHeroHeader from './components/FeaturedHeroHeader';
import CurrentActiveSlotCard from './components/CurrentActiveSlotCard';
import FeaturedFallbackMessage from './components/FeaturedFallbackMessage';
import AddSlotCard from './components/AddSlotCard';
import type { ConflictResult } from './components/AddSlotCard';
import UpcomingSlotsGrid from './components/UpcomingSlotsGrid';
import FeaturedPerformanceSection from './components/FeaturedPerformanceSection';
import WeeklyReportTab from './components/WeeklyReportTab';
import SmartSuggestionsTab from './components/SmartSuggestionsTab';

export type ListOption = {
  id: string;
  title: string;
  slug: string;
  saveCount: number;
  isFeatured?: boolean;
  isActive?: boolean;
  deletedAt?: string | null;
  categories: { name: string; slug: string } | null;
};

export type SlotItem = {
  id: string;
  listId: string;
  list: ListOption;
  startAt: string;
  endAt: string | null;
  orderIndex: number;
  viewListCount: number;
  quickSaveCount: number;
};

type Data = {
  current: SlotItem | null;
  fallbackList: { id: string; title: string; slug: string } | null;
  upcoming: SlotItem[];
  past: SlotItem[];
  lists: ListOption[];
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

type TabId = 'scheduler' | 'weekly-report' | 'suggestions';

export default function FeaturedManagementClient() {
  const [activeTab, setActiveTab] = useState<TabId>('scheduler');
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/custom/featured?t=${Date.now()}`);
      const json = await res.json();
      let lists: ListOption[] = Array.isArray(json.lists) ? json.lists : [];
      if (!res.ok) throw new Error(json.error || json.details || 'خطا در دریافت');
      if (lists.length === 0) {
        try {
          const listRes = await fetch(`/api/admin/custom/featured/lists?t=${Date.now()}`);
          const listJson = await listRes.json();
          if (listRes.ok && Array.isArray(listJson.lists)) lists = listJson.lists;
        } catch { /* ignore */ }
      }
      setData({
        current: json.current ?? null,
        fallbackList: json.fallbackList ?? null,
        upcoming: Array.isArray(json.upcoming) ? json.upcoming : [],
        past: Array.isArray(json.past) ? json.past : [],
        lists,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      await fetchData();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'خطا');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (slotId: string) => {
    if (!confirm('حذف این اسلات؟')) return;
    try {
      const res = await fetch(`/api/admin/custom/featured/${slotId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'خطا');
      await fetchData();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'خطا');
    }
  };

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

  const handlePreset = useCallback((preset: 'tomorrow' | 'nextWeek' | 'weekend') => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    if (preset === 'tomorrow') {
      d.setDate(d.getDate() + 1);
    } else if (preset === 'nextWeek') {
      d.setDate(d.getDate() + 7);
    } else {
      const day = d.getDay();
      const toSaturday = day === 5 ? 0 : day === 6 ? 6 : 5 - day;
      d.setDate(d.getDate() + (toSaturday <= 0 ? toSaturday + 7 : toSaturday));
    }
    setFormStartDate(new DateObject({ date: d, calendar: persian, locale: persian_fa }));
    setFormStartTime('00:00');
    if (preset === 'weekend') {
      const end = new Date(d);
      end.setDate(end.getDate() + 2);
      end.setHours(23, 59, 59, 999);
      setFormEndDate(new DateObject({ date: end, calendar: persian, locale: persian_fa }));
      setFormEndTime('23:59');
    } else {
      setFormEndDate(null);
      setFormEndTime('23:59');
    }
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12" dir="rtl">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-3xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 text-red-800 dark:text-red-200" dir="rtl">
        {error}
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="space-y-8 pb-8" dir="rtl">
      <FeaturedHeroHeader
        hasActiveSlot={!!data.current}
        onRefresh={fetchData}
        refreshing={loading}
      />

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setActiveTab('scheduler')}
          className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-xl border-b-2 -mb-px transition-colors ${
            activeTab === 'scheduler'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          برنامه‌ریزی
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('weekly-report')}
          className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-xl border-b-2 -mb-px transition-colors ${
            activeTab === 'weekly-report'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          گزارش هفتگی
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('suggestions')}
          className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-xl border-b-2 -mb-px transition-colors ${
            activeTab === 'suggestions'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Lightbulb className="w-4 h-4" />
          پیشنهاد هوشمند
        </button>
      </div>

      {activeTab === 'weekly-report' ? (
        <WeeklyReportTab />
      ) : activeTab === 'suggestions' ? (
        <SmartSuggestionsTab onScheduleList={(listId) => { setFormListId(listId); setActiveTab('scheduler'); }} />
      ) : (
        <>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          منتخب فعلی
        </h2>
        {data.current ? (
          <CurrentActiveSlotCard
            slot={data.current}
            formatDate={formatDate}
            remainingText={getRemainingText(data.current)}
            onEdit={() => openEditModal(data.current!)}
            onRemove={() => handleDelete(data.current!.id)}
          />
        ) : (
          <FeaturedFallbackMessage fallbackList={data.fallbackList} />
        )}
      </section>

      {data.current && (
        <section className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <FeaturedPerformanceSection slotId={data.current.id} />
        </section>
      )}

      <AddSlotCard
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

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          اسلات‌های بعدی
        </h2>
        <UpcomingSlotsGrid
          slots={data.upcoming}
          formatDate={formatDate}
          now={now}
          onEdit={openEditModal}
          onDelete={handleDelete}
        />
      </section>

      {data.past.length > 0 && (
        <section className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm overflow-x-auto">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
            تاریخچه
          </h2>
          <table className="w-full text-sm text-right">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-600">
                <th className="p-2 font-medium">لیست</th>
                <th className="p-2 font-medium">بازه</th>
                <th className="p-2 font-medium">مشاهده</th>
                <th className="p-2 font-medium">ذخیره سریع</th>
              </tr>
            </thead>
            <tbody>
              {data.past.map((s) => (
                <tr key={s.id} className="border-b border-gray-100 dark:border-gray-700">
                  <td className="p-2">{s.list.title}</td>
                  <td className="p-2 text-gray-500">
                    {formatDate(s.startAt)} – {s.endAt ? formatDate(s.endAt) : '—'}
                  </td>
                  <td className="p-2">{s.viewListCount}</td>
                  <td className="p-2">{s.quickSaveCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
        </>
      )}

      {editingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                ویرایش زمان‌بندی · {editingSlot.list.title}
              </h3>
              <button
                type="button"
                onClick={() => setEditingSlot(null)}
                className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="بستن"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاریخ شروع (شمسی)</label>
                <div className="flex gap-2 flex-wrap">
                  <DatePicker
                    value={editStartDate}
                    onChange={(d) => setEditStartDate(d ?? null)}
                    calendar={persian}
                    locale={persian_fa}
                    calendarPosition="bottom-right"
                    className="rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                  />
                  <input
                    type="time"
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    className="rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاریخ پایان (اختیاری)</label>
                <div className="flex gap-2 flex-wrap">
                  <DatePicker
                    value={editEndDate}
                    onChange={(d) => setEditEndDate(d ?? null)}
                    calendar={persian}
                    locale={persian_fa}
                    calendarPosition="bottom-right"
                    className="rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                  />
                  <input
                    type="time"
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    className="rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm px-3 py-2"
                  />
                </div>
              </div>
              {editError && <p className="text-sm text-red-600">{editError}</p>}
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingSlot(null)}
                  className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-sm"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50"
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
