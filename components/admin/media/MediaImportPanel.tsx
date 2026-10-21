'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { faNumber } from '@/lib/utils';

const SAMPLE = `{
  "assignments": [
    { "target": "category:cafe", "url": "https://..." },
    { "target": "list:great-breakfast-cafes", "url": "https://..." },
    { "target": "person:author:bozorg-alavi", "url": "https://..." }
  ]
}`;

export default function MediaImportPanel() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit() {
    setBusy(true);
    setMessage('');
    setError('');
    try {
      const parsed = JSON.parse(text) as unknown;
      const payload = Array.isArray(parsed)
        ? { action: 'import', assignments: parsed }
        : { action: 'import', ...(parsed as object) };
      const response = await fetch('/api/admin/media', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as {
        error?: string;
        updated?: number;
        errors?: { target: string; error: string }[];
      };
      if (!response.ok) throw new Error(data.error || 'ایمپورت انجام نشد.');
      const failed = data.errors ?? [];
      setMessage(`${faNumber(data.updated ?? 0)} تصویر ثبت شد.`);
      if (failed.length > 0) {
        setError(failed.map((row) => `${row.target}: ${row.error}`).join(' — '));
      } else {
        setText('');
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'JSON نامعتبر است.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-11 items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-semibold text-[var(--color-text)]"
        aria-expanded={open}
      >
        ایمپورت JSON
      </button>
      {open ? (
        <div className="basis-full space-y-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          <p className="text-xs text-[var(--color-text-muted)]">
            هر ردیف یک بخش را به یک آدرس تصویر وصل می‌کند. آدرس بیرونی اول روی فضای تصاویر سایت کپی می‌شود. بنرهای ثابت سایت از اینجا عوض نمی‌شوند.
          </p>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            dir="ltr"
            rows={8}
            placeholder={SAMPLE}
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-start text-sm text-[var(--color-text)]"
          />
          <button
            type="button"
            onClick={() => void submit()}
            disabled={busy || !text.trim()}
            className="inline-flex min-h-11 items-center rounded-xl bg-[var(--primary)] px-4 text-sm font-semibold text-white disabled:opacity-40"
          >
            {busy ? 'در حال ثبت' : 'ثبت نسبت‌ها'}
          </button>
          {message ? <p className="text-sm text-[var(--color-text)]">{message}</p> : null}
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
        </div>
      ) : null}
    </>
  );
}
