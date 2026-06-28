'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ClipboardCopy,
  ClipboardPaste,
  FileJson,
  ImageIcon,
  List,
  Loader2,
  Upload,
  Wand2,
  X,
  XCircle,
} from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import type { PersonRole } from '@/lib/people';
import {
  PERSON_IMAGE_JSON_EXAMPLE,
  buildExternalAiImagePrompt,
  formatMissingImageNameListWithStatus,
  normalizePersonImageImportRaw,
  tryParsePersonImageImportPayload,
  type PersonImageImportItem,
  type PersonMissingImageEntry,
} from '@/lib/person-image-ai';

type Tab = 'names' | 'prompt' | 'import';

type NameListFilter = 'all' | 'none' | 'has';

type ImportItemStatus = 'pending' | 'running' | 'success' | 'failed';

type ImportProgress = {
  total: number;
  done: number;
  uploaded: number;
  failed: number;
  currentName: string;
  phase: 'tmdb' | 'upload' | 'idle';
  errors: string[];
  statuses: Record<string, ImportItemStatus>;
};

type ImportSummary = {
  uploaded: number;
  failed: number;
  errors: string[];
};

type Props = {
  roleFilter: PersonRole | 'all';
  onClose: () => void;
  onComplete?: (summary: ImportSummary) => void;
};

type ParseState =
  | { status: 'empty' }
  | { status: 'invalid'; error: string }
  | { status: 'valid'; people: PersonImageImportItem[] };

function filterPeopleForNameList(
  people: PersonMissingImageEntry[],
  filter: NameListFilter
): PersonMissingImageEntry[] {
  switch (filter) {
    case 'none':
      return people.filter((person) => person.imageStatus === 'none');
    case 'has':
      return people.filter((person) => person.imageStatus !== 'none');
    default:
      return people;
  }
}

function personKey(person: Pick<PersonImageImportItem, 'role' | 'slug'>) {
  return `${person.role}:${person.slug}`;
}

function parseImportJson(text: string): ParseState {
  const trimmed = text.trim();
  if (!trimmed) return { status: 'empty' };
  try {
    const raw = JSON.parse(trimmed) as unknown;
    const result = tryParsePersonImageImportPayload(normalizePersonImageImportRaw(raw));
    if (!result.success) return { status: 'invalid', error: result.error };
    if (result.data.people.length === 0) {
      return { status: 'invalid', error: 'هیچ تصویر معتبری در JSON پیدا نشد' };
    }
    return { status: 'valid', people: result.data.people };
  } catch {
    return { status: 'invalid', error: 'JSON نامعتبر است — syntax را بررسی کنید' };
  }
}

export default function PersonImageAiModal({
  roleFilter,
  onClose,
  onComplete,
}: Props) {
  const [tab, setTab] = useState<Tab>('names');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [people, setPeople] = useState<PersonMissingImageEntry[]>([]);
  const [nameListFilter, setNameListFilter] = useState<NameListFilter>('none');
  const [prompt, setPrompt] = useState('');
  const [copyDone, setCopyDone] = useState<string | null>(null);
  const [json, setJson] = useState('');
  const [debouncedJson, setDebouncedJson] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ imageFilter: 'all' });
      if (roleFilter !== 'all') params.set('role', roleFilter);

      const res = await fetch(`/api/admin/people/missing-image?${params}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'خطا در بارگذاری لیست');
      }

      const loaded = json.data.people as PersonMissingImageEntry[];
      setPeople(loaded);
      setPrompt(
        buildExternalAiImagePrompt(loaded.filter((person) => person.imageStatus !== 'storage'))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا');
    } finally {
      setLoading(false);
    }
  }, [roleFilter]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedJson(json), 250);
    return () => window.clearTimeout(timer);
  }, [json]);

  const imageCounts = useMemo(
    () => ({
      all: people.length,
      none: people.filter((person) => person.imageStatus === 'none').length,
      has: people.filter((person) => person.imageStatus !== 'none').length,
      storage: people.filter((person) => person.imageStatus === 'storage').length,
      external: people.filter((person) => person.imageStatus === 'external').length,
      missing: people.filter((person) => person.imageStatus !== 'storage').length,
    }),
    [people]
  );

  const filteredPeople = useMemo(
    () => filterPeopleForNameList(people, nameListFilter),
    [people, nameListFilter]
  );

  const nameList = useMemo(
    () => formatMissingImageNameListWithStatus(filteredPeople),
    [filteredPeople]
  );

  const parseState = useMemo(() => parseImportJson(debouncedJson), [debouncedJson]);

  useEffect(() => {
    setSelectedIndex(0);
    setImportSummary(null);
  }, [debouncedJson]);

  const selectedPerson =
    parseState.status === 'valid'
      ? parseState.people[Math.min(selectedIndex, parseState.people.length - 1)]
      : null;

  const progressPercent =
    importProgress && importProgress.total > 0
      ? Math.round((importProgress.done / importProgress.total) * 100)
      : 0;

  const copyText = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopyDone(key);
    window.setTimeout(() => setCopyDone(null), 2000);
  };

  const handleImport = async () => {
    if (parseState.status !== 'valid' || importing) return;

    const items = parseState.people;
    const initialStatuses = Object.fromEntries(
      items.map((p) => [personKey(p), 'pending' as ImportItemStatus])
    );

    setImportSummary(null);
    setImporting(true);
    setImportProgress({
      total: items.length,
      done: 0,
      uploaded: 0,
      failed: 0,
      currentName: items[0]?.displayName ?? '',
      phase: 'tmdb',
      errors: [],
      statuses: initialStatuses,
    });

    let uploaded = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < items.length; i++) {
      const person = items[i]!;
      const key = personKey(person);
      setSelectedIndex(i);

      setImportProgress((prev) =>
        prev
          ? {
              ...prev,
              currentName: person.displayName,
              phase: 'tmdb',
              statuses: { ...prev.statuses, [key]: 'running' },
            }
          : prev
      );

      try {
        const res = await fetch('/api/admin/people/import-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ people: [person] }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'خطا در import');
        }
        if (json.data.failed > 0) {
          const errMsg = json.data.errors?.[0] ?? 'خطا';
          throw new Error(errMsg);
        }
        uploaded += 1;
        setImportProgress((prev) =>
          prev
            ? {
                ...prev,
                done: prev.done + 1,
                uploaded: prev.uploaded + 1,
                statuses: { ...prev.statuses, [key]: 'success' },
              }
            : prev
        );
      } catch (err) {
        failed += 1;
        const message = `${person.displayName}: ${err instanceof Error ? err.message : 'خطا'}`;
        errors.push(message);
        setImportProgress((prev) =>
          prev
            ? {
                ...prev,
                done: prev.done + 1,
                failed: prev.failed + 1,
                errors: [...prev.errors, message],
                statuses: { ...prev.statuses, [key]: 'failed' },
              }
            : prev
        );
      }
    }

    const summary = { uploaded, failed, errors };
    setImportSummary(summary);
    setImporting(false);
    setImportProgress((prev) => (prev ? { ...prev, currentName: '' } : prev));
    onComplete?.(summary);
    void loadData();
  };

  const handleClose = () => {
    if (importing) return;
    onClose();
  };

  const tabs: { id: Tab; label: string; icon: typeof List }[] = [
    { id: 'names', label: 'لیست اسامی', icon: List },
    { id: 'prompt', label: 'پرامپت AI', icon: Wand2 },
    { id: 'import', label: 'ورود JSON', icon: FileJson },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-2 sm:items-center sm:p-4">
      <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
              <ImageIcon className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-bold text-[var(--color-text)]">تصاویر اشخاص — AI و import</h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                لیست → پرامپت AI → JSON → آپلود به ParsPack
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={importing}
            className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] disabled:opacity-40"
            aria-label="بستن"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] px-4 py-2 sm:px-5">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => !importing && setTab(id)}
              disabled={importing}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                tab === id
                  ? 'bg-violet-600 text-white'
                  : 'border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
          {!loading && (
            <span className="ms-auto rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              {imageCounts.missing.toLocaleString('fa-IR')} نفر بدون تصویر روی استوریج
            </span>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-[var(--color-text-muted)]">
              <Loader2 className="h-5 w-5 animate-spin" />
              در حال بارگذاری لیست…
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          ) : tab === 'names' ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/60 px-3 py-2.5 text-xs leading-relaxed text-[var(--color-text-muted)]">
                <strong className="text-[var(--color-text)]">مرحله ۱:</strong> لیست را کپی کنید و به
                AI بدهید. خروجی JSON را در تب «ورود JSON» بچسبانید.
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    { id: 'all' as const, label: 'همه', count: imageCounts.all },
                    { id: 'none' as const, label: 'بدون تصویر', count: imageCounts.none },
                    { id: 'has' as const, label: 'با تصویر', count: imageCounts.has },
                  ] as const
                ).map(({ id, label, count }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setNameListFilter(id)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      nameListFilter === id
                        ? 'bg-violet-600 text-white'
                        : 'border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]'
                    }`}
                  >
                    {label}
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
                        nameListFilter === id
                          ? 'bg-white/20 text-white'
                          : 'bg-[var(--color-bg)] text-[var(--color-text-muted)]'
                      }`}
                    >
                      {count.toLocaleString('fa-IR')}
                    </span>
                  </button>
                ))}
                <span className="text-[11px] text-[var(--color-text-muted)]">
                  استوریج: {imageCounts.storage.toLocaleString('fa-IR')} · خارجی:{' '}
                  {imageCounts.external.toLocaleString('fa-IR')}
                </span>
              </div>

              <textarea
                readOnly
                value={nameList}
                rows={16}
                dir="rtl"
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5 text-sm leading-relaxed"
              />
              <button
                type="button"
                onClick={() => void copyText(nameList, 'names')}
                disabled={filteredPeople.length === 0}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50 sm:w-auto"
              >
                <ClipboardCopy className="h-4 w-4" />
                {copyDone === 'names' ? 'کپی شد!' : `کپی ${filteredPeople.length.toLocaleString('fa-IR')} نام`}
              </button>
            </div>
          ) : tab === 'prompt' ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/60 px-3 py-2.5 text-xs leading-relaxed text-[var(--color-text-muted)]">
                <strong className="text-[var(--color-text)]">مرحله ۲:</strong> پرامپت کامل با role،
                slug و schema — مستقیم در ChatGPT/Claude/Gemini.
              </div>
              <textarea
                readOnly
                value={prompt}
                rows={16}
                dir="ltr"
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5 font-mono text-xs leading-relaxed"
              />
              <button
                type="button"
                onClick={() => void copyText(prompt, 'prompt')}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 sm:w-auto"
              >
                <ClipboardCopy className="h-4 w-4" />
                {copyDone === 'prompt' ? 'کپی شد!' : 'کپی پرامپت AI'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/60 px-3 py-2.5 text-xs leading-relaxed text-[var(--color-text-muted)]">
                <strong className="text-[var(--color-text)]">مرحله ۳:</strong> JSON خروجی AI را
                بچسبانید. هر تصویر دانلود و روی ParsPack ذخیره می‌شود.
              </div>

              <div className="grid min-h-[320px] gap-4 lg:grid-cols-2">
                <div className="flex min-h-0 flex-col order-2 lg:order-1">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <label className="text-xs font-semibold text-[var(--color-text-muted)]">JSON</label>
                    <button
                      type="button"
                      onClick={() => setJson(JSON.stringify(PERSON_IMAGE_JSON_EXAMPLE, null, 2))}
                      disabled={importing}
                      className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border)] px-2 py-1 text-[11px] font-medium hover:bg-[var(--color-bg)] disabled:opacity-50"
                    >
                      <ClipboardPaste className="h-3 w-3" />
                      نمونه
                    </button>
                  </div>
                  <textarea
                    value={json}
                    onChange={(e) => setJson(e.target.value)}
                    dir="ltr"
                    spellCheck={false}
                    disabled={importing}
                    placeholder={JSON.stringify(PERSON_IMAGE_JSON_EXAMPLE, null, 2)}
                    className="min-h-[260px] flex-1 resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5 font-mono text-xs leading-relaxed focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-60"
                  />
                  {parseState.status === 'valid' ? (
                    <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {parseState.people.length.toLocaleString('fa-IR')} تصویر آماده import
                    </span>
                  ) : parseState.status === 'invalid' ? (
                    <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-red-700 dark:text-red-300">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {parseState.error}
                    </span>
                  ) : (
                    <p className="mt-2 text-[11px] text-[var(--color-text-muted)]">
                      ساختار:{' '}
                      <code dir="ltr" className="rounded bg-[var(--color-bg)] px-1">
                        {'{ "people": [{ role, slug, displayName, imageUrl }] }'}
                      </code>
                    </p>
                  )}
                </div>

                <div className="flex min-h-0 flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/40 p-3 order-1 lg:order-2">
                  <p className="mb-3 text-xs font-semibold text-[var(--color-text-muted)]">پیش‌نمایش</p>
                  {parseState.status === 'valid' && selectedPerson ? (
                    <>
                      {parseState.people.length > 1 && (
                        <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
                          {parseState.people.map((person, index) => {
                            const key = personKey(person);
                            const status = importProgress?.statuses[key] ?? 'pending';
                            return (
                              <button
                                key={`${key}:${index}`}
                                type="button"
                                onClick={() => setSelectedIndex(index)}
                                disabled={importing && status === 'pending'}
                                className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                  selectedIndex === index
                                    ? 'bg-violet-600 text-white'
                                    : 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]'
                                }`}
                              >
                                {status === 'running' && (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                )}
                                {status === 'success' && (
                                  <Check className="h-3 w-3 text-emerald-500" />
                                )}
                                {status === 'failed' && (
                                  <XCircle className="h-3 w-3 text-red-500" />
                                )}
                                {person.displayName}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      <div className="flex flex-col items-center gap-3 py-2">
                        <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-[var(--color-surface)] shadow-md">
                          <ImageWithFallback
                            src={selectedPerson.imageUrl}
                            alt={selectedPerson.displayName}
                            className="h-full w-full object-cover"
                            fallbackIcon={selectedPerson.displayName[0]?.toUpperCase() ?? '?'}
                          />
                          {importProgress?.statuses[personKey(selectedPerson)] === 'running' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                              <Loader2 className="h-8 w-8 animate-spin text-white" />
                            </div>
                          )}
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-[var(--color-text)]">
                            {selectedPerson.displayName}
                          </p>
                          <p className="text-xs text-[var(--color-text-muted)]" dir="ltr">
                            {selectedPerson.role} / {selectedPerson.slug}
                          </p>
                        </div>
                      </div>

                      {parseState.people.length > 1 && (
                        <div className="mt-2 grid max-h-36 grid-cols-4 gap-2 overflow-y-auto sm:grid-cols-5">
                          {parseState.people.map((person, index) => {
                            const key = personKey(person);
                            const status = importProgress?.statuses[key] ?? 'pending';
                            return (
                              <button
                                key={`thumb-${key}:${index}`}
                                type="button"
                                onClick={() => setSelectedIndex(index)}
                                className={`relative aspect-square overflow-hidden rounded-xl border-2 transition-all ${
                                  selectedIndex === index
                                    ? 'border-violet-500 ring-2 ring-violet-500/20'
                                    : 'border-transparent hover:border-[var(--color-border)]'
                                }`}
                              >
                                <ImageWithFallback
                                  src={person.imageUrl}
                                  alt={person.displayName}
                                  className="h-full w-full object-cover"
                                  fallbackIcon="?"
                                />
                                {status === 'success' && (
                                  <span className="absolute inset-0 flex items-center justify-center bg-emerald-600/30">
                                    <Check className="h-5 w-5 text-white drop-shadow" />
                                  </span>
                                )}
                                {status === 'failed' && (
                                  <span className="absolute inset-0 flex items-center justify-center bg-red-600/30">
                                    <XCircle className="h-5 w-5 text-white drop-shadow" />
                                  </span>
                                )}
                                {status === 'running' && (
                                  <span className="absolute inset-0 flex items-center justify-center bg-violet-600/30">
                                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 text-center">
                      <FileJson className="mb-3 h-10 w-10 text-[var(--color-text-muted)] opacity-40" />
                      <p className="text-sm font-medium text-[var(--color-text)]">
                        JSON معتبر را بچسبانید
                      </p>
                      <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                        پس از import، تصاویر دانلود و روی ParsPack ذخیره می‌شوند.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {importSummary && (
                <div
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    importSummary.failed > 0
                      ? 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-100'
                  }`}
                >
                  <p className="font-semibold">
                    {importSummary.uploaded.toLocaleString('fa-IR')} تصویر ذخیره شد
                    {importSummary.failed > 0 &&
                      ` · ${importSummary.failed.toLocaleString('fa-IR')} خطا`}
                  </p>
                  {importSummary.errors.length > 0 && (
                    <ul className="mt-2 max-h-24 space-y-1 overflow-y-auto text-xs opacity-90">
                      {importSummary.errors.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {importProgress && importing && (
          <div className="border-t border-[var(--color-border)] bg-[var(--color-bg)]/80 px-4 py-3 sm:px-5">
            <div className="mb-2 flex items-center justify-between gap-2 text-xs">
              <span className="font-medium text-[var(--color-text)]">
                آپلود به ParsPack — {importProgress.done.toLocaleString('fa-IR')} /{' '}
                {importProgress.total.toLocaleString('fa-IR')}
              </span>
              <span className="tabular-nums text-[var(--color-text-muted)]">{progressPercent}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[var(--color-border)]">
              <div
                className="h-full rounded-full bg-gradient-to-l from-violet-600 to-violet-400 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {importProgress.currentName && (
              <p className="mt-2 truncate text-xs text-[var(--color-text-muted)]">
                {importProgress.phase === 'tmdb' ? 'جستجو در TMDB و آپلود: ' : 'در حال پردازش: '}
                {importProgress.currentName}
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-[var(--color-text-muted)]">
              <span className="text-emerald-700 dark:text-emerald-300">
                ✓ {importProgress.uploaded.toLocaleString('fa-IR')} موفق
              </span>
              {importProgress.failed > 0 && (
                <span className="text-red-600 dark:text-red-300">
                  ✗ {importProgress.failed.toLocaleString('fa-IR')} خطا
                </span>
              )}
            </div>
          </div>
        )}

        <footer className="flex flex-col-reverse gap-2 border-t border-[var(--color-border)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <button
            type="button"
            onClick={handleClose}
            disabled={importing}
            className="rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium hover:bg-[var(--color-bg)] disabled:opacity-50"
          >
            {importSummary ? 'بستن' : 'انصراف'}
          </button>
          {tab === 'import' && (
            <button
              type="button"
              onClick={() => void handleImport()}
              disabled={importing || parseState.status !== 'valid'}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {importing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {importing
                ? `در حال آپلود… ${progressPercent}%`
                : parseState.status === 'valid'
                  ? `آپلود ${parseState.people.length.toLocaleString('fa-IR')} تصویر به استوریج`
                  : 'آپلود به استوریج'}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
