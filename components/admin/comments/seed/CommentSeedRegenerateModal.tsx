'use client';

import { useEffect, useState } from 'react';
import { Loader2, RefreshCw, X } from 'lucide-react';
import { DateObject } from 'react-multi-date-picker';
import PersianDateTimeField from '@/components/admin/shared/PersianDateTimeField';
import type { ToneMix } from '@/lib/comment-seed/types';
import {
  combinePersianDateAndTime,
  isoToPersianDateObject,
  isoToTimeString,
} from '@/lib/utils/persian-datetime';
import type { SeedDraftRow } from './CommentSeedDraftTable';

const TONE_OPTIONS = [
  { id: 'positive', label: 'مثبت' },
  { id: 'negative', label: 'منفی' },
  { id: 'neutral', label: 'خنثی' },
  { id: 'question', label: 'سوالی' },
] as const;

type PersonaOption = { id: string; displayName: string };

export type RegenerateSettings = {
  tone: string;
  wordCountMin: number;
  wordCountMax: number;
  personaId: string;
  reschedule: boolean;
  scheduledAt?: string;
};

type Props = {
  draft: SeedDraftRow | null;
  campaignDefaults: {
    wordCountMin: number;
    wordCountMax: number;
    toneMix: ToneMix;
  };
  personas: PersonaOption[];
  loading?: boolean;
  onClose: () => void;
  onConfirm: (draftId: string, settings: RegenerateSettings) => Promise<void>;
};

export default function CommentSeedRegenerateModal({
  draft,
  campaignDefaults,
  personas,
  loading,
  onClose,
  onConfirm,
}: Props) {
  const [tone, setTone] = useState('neutral');
  const [wordCountMin, setWordCountMin] = useState(40);
  const [wordCountMax, setWordCountMax] = useState(120);
  const [personaId, setPersonaId] = useState('keep');
  const [reschedule, setReschedule] = useState(false);
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [customDate, setCustomDate] = useState<DateObject | null>(null);
  const [customTime, setCustomTime] = useState('12:00');

  useEffect(() => {
    if (!draft) return;
    setTone(draft.tone);
    setWordCountMin(campaignDefaults.wordCountMin);
    setWordCountMax(campaignDefaults.wordCountMax);
    setPersonaId('keep');
    setReschedule(false);
    setUseCustomDate(false);
    setCustomDate(isoToPersianDateObject(draft.scheduledAt));
    setCustomTime(isoToTimeString(draft.scheduledAt));
  }, [draft, campaignDefaults]);

  if (!draft) return null;

  const inputClass =
    'mt-1 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm';

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
        aria-label="بستن"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-md rounded-t-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl sm:rounded-2xl"
        dir="rtl"
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
          <h3 className="text-base font-semibold text-[var(--color-text)]">بازتولید کامنت</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-4 py-4">
          <div className="rounded-xl bg-[var(--color-bg)] px-3 py-2 text-sm">
            <span className="text-[var(--color-text-muted)]">آیتم: </span>
            <span className="font-medium">{draft.items.title}</span>
          </div>

          <label className="block text-sm font-medium">
            لحن
            <select value={tone} onChange={(e) => setTone(e.target.value)} className={inputClass}>
              {TONE_OPTIONS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium">
              حداقل کاراکتر
              <input
                type="number"
                min={20}
                max={300}
                value={wordCountMin}
                onChange={(e) => setWordCountMin(parseInt(e.target.value, 10) || 40)}
                className={inputClass}
              />
            </label>
            <label className="block text-sm font-medium">
              حداکثر کاراکتر
              <input
                type="number"
                min={20}
                max={400}
                value={wordCountMax}
                onChange={(e) => setWordCountMax(parseInt(e.target.value, 10) || 120)}
                className={inputClass}
              />
            </label>
          </div>

          <label className="block text-sm font-medium">
            پرسونا
            <select value={personaId} onChange={(e) => setPersonaId(e.target.value)} className={inputClass}>
              <option value="keep">همان پرسونای فعلی ({draft.persona.displayName})</option>
              <option value="random">پرسونای تصادفی دیگر</option>
              {personas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.displayName}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={reschedule}
              onChange={(e) => {
                setReschedule(e.target.checked);
                if (e.target.checked) setUseCustomDate(false);
              }}
              className="rounded border-[var(--color-border)]"
            />
            تاریخ انتشار جدید (تصادفی در بازه کمپین)
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={useCustomDate}
              onChange={(e) => {
                setUseCustomDate(e.target.checked);
                if (e.target.checked) setReschedule(false);
              }}
              className="rounded border-[var(--color-border)]"
            />
            تعیین دستی تاریخ انتشار
          </label>

          {useCustomDate && (
            <PersianDateTimeField
              label="تاریخ انتشار"
              date={customDate}
              time={customTime}
              onDateChange={setCustomDate}
              onTimeChange={setCustomTime}
            />
          )}
        </div>

        <div className="flex gap-2 border-t border-[var(--color-border)] px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium hover:bg-[var(--color-bg)] disabled:opacity-50"
          >
            انصراف
          </button>
          <button
            type="button"
            disabled={loading || wordCountMin > wordCountMax}
            onClick={() => {
              let scheduledAt: string | undefined;
              if (useCustomDate) {
                scheduledAt = combinePersianDateAndTime(customDate, customTime) ?? undefined;
              }
              void onConfirm(draft.id, {
                tone,
                wordCountMin,
                wordCountMax,
                personaId,
                reschedule,
                scheduledAt,
              });
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            بازتولید
          </button>
        </div>
      </div>
    </div>
  );
}
