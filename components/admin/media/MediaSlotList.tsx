'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { faNumber } from '@/lib/utils';
import type { MediaSlot } from '@/lib/admin/media-targets';
import MediaSlotRow from '@/components/admin/media/MediaSlotRow';

export default function MediaSlotList({
  slots,
  layout,
}: {
  slots: MediaSlot[];
  layout: 'list' | 'grid';
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function toggle(key: string, on: boolean) {
    setSelected((current) => (on ? [...current, key] : current.filter((item) => item !== key)));
  }

  async function normalize() {
    const items = slots
      .filter((slot) => selected.includes(slot.key))
      .map((slot) => ({ kind: slot.kind, id: slot.id, detail: slot.detail }));
    if (items.length === 0) return;
    setBusy(true);
    setMessage('');
    setError('');
    try {
      const response = await fetch('/api/admin/media', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'normalize', items }),
      });
      const data = (await response.json()) as {
        error?: string;
        updated?: number;
        errors?: { target: string; error: string }[];
      };
      if (!response.ok) throw new Error(data.error || 'تبدیل انجام نشد.');
      const failed = data.errors ?? [];
      setMessage(`${faNumber(data.updated ?? 0)} تصویر به WebP استاندارد تبدیل شد.`);
      if (failed.length > 0) setError(failed.map((row) => `${row.target}: ${row.error}`).join(' — '));
      setSelected([]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تبدیل انجام نشد.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void normalize()}
          disabled={busy || selected.length === 0}
          className="inline-flex min-h-11 items-center rounded-xl bg-[var(--primary)] px-4 text-sm font-semibold text-white disabled:opacity-40"
        >
          {busy ? 'در حال تبدیل' : `تبدیل ${faNumber(selected.length)} تصویر به WebP`}
        </button>
        {message ? <p className="text-sm text-[var(--color-text)]">{message}</p> : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
      </div>
      {layout === 'grid' ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {slots.map((slot) => (
            <MediaSlotRow
              key={slot.key}
              slot={slot}
              layout="grid"
              selected={selected.includes(slot.key)}
              onSelectedChange={(on) => toggle(slot.key, on)}
            />
          ))}
        </div>
      ) : (
        <div className="divide-y divide-[var(--color-border)] overflow-hidden rounded-xl border border-[var(--color-border)]">
          {slots.map((slot) => (
            <MediaSlotRow
              key={slot.key}
              slot={slot}
              selected={selected.includes(slot.key)}
              onSelectedChange={(on) => toggle(slot.key, on)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
