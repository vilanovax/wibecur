'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ClipboardPaste,
  Eye,
  FileJson,
  Loader2,
  Upload,
  X,
} from 'lucide-react';
import PersonProfilePreviewCard from '@/components/admin/people/PersonProfilePreviewCard';
import type { DiscoveredPerson } from '@/lib/person-profiles';
import {
  PERSON_BIO_JSON_EXAMPLE,
  tryParsePersonBioImportPayload,
  type PersonBioImportItem,
} from '@/lib/person-bio-ai';

type Props = {
  initialJson?: string;
  knownPeople?: DiscoveredPerson[];
  importing: boolean;
  onClose: () => void;
  onImport: (payload: { people: PersonBioImportItem[] }) => Promise<void>;
};

type ParseState =
  | { status: 'empty' }
  | { status: 'invalid'; error: string }
  | { status: 'valid'; people: PersonBioImportItem[] };

function parseImportJson(text: string): ParseState {
  const trimmed = text.trim();
  if (!trimmed) return { status: 'empty' };
  try {
    const raw = JSON.parse(trimmed) as unknown;
    const result = tryParsePersonBioImportPayload(raw);
    if (!result.success) return { status: 'invalid', error: result.error };
    if (result.data.people.length === 0) {
      return { status: 'invalid', error: 'هیچ پروفایل معتبری در JSON پیدا نشد' };
    }
    return { status: 'valid', people: result.data.people };
  } catch {
    return { status: 'invalid', error: 'JSON نامعتبر است — syntax را بررسی کنید' };
  }
}

export default function PersonImportModal({
  initialJson = '',
  knownPeople = [],
  importing,
  onClose,
  onImport,
}: Props) {
  const [json, setJson] = useState(initialJson);
  const [debouncedJson, setDebouncedJson] = useState(initialJson);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mobileTab, setMobileTab] = useState<'json' | 'preview'>('json');

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedJson(json), 250);
    return () => window.clearTimeout(timer);
  }, [json]);

  const parseState = useMemo(() => parseImportJson(debouncedJson), [debouncedJson]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [debouncedJson]);

  const selectedPerson =
    parseState.status === 'valid'
      ? parseState.people[Math.min(selectedIndex, parseState.people.length - 1)]
      : null;

  const itemCountFor = (person: PersonBioImportItem) =>
    knownPeople.find((p) => p.role === person.role && p.slug === person.slug)?.itemCount;

  const handlePasteExample = () => {
    setJson(JSON.stringify(PERSON_BIO_JSON_EXAMPLE, null, 2));
    setMobileTab('preview');
  };

  const handleImport = async () => {
    if (parseState.status !== 'valid') return;
    await onImport({ people: parseState.people });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-2 sm:items-center sm:p-4">
      <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3 sm:px-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                <Upload className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-bold text-[var(--color-text)]">ورود JSON پروفایل‌ها</h2>
                <p className="text-xs text-[var(--color-text-muted)]">
                  JSON را بچسبانید — پیش‌نمایش زنده قبل از اعمال
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]"
            aria-label="بستن"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-4 py-2 sm:px-5">
          {parseState.status === 'valid' ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {parseState.people.length.toLocaleString('fa-IR')} پروفایل آماده
            </span>
          ) : parseState.status === 'invalid' ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">
              <AlertCircle className="h-3.5 w-3.5" />
              {parseState.error}
            </span>
          ) : (
            <span className="text-xs text-[var(--color-text-muted)]">JSON را وارد کنید یا نمونه را بارگذاری کنید</span>
          )}

          <div className="ms-auto flex gap-1 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileTab('json')}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                mobileTab === 'json' ? 'bg-indigo-600 text-white' : 'text-[var(--color-text-muted)]'
              }`}
            >
              JSON
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('preview')}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium ${
                mobileTab === 'preview' ? 'bg-indigo-600 text-white' : 'text-[var(--color-text-muted)]'
              }`}
            >
              <Eye className="h-3 w-3" />
              پیش‌نمایش
            </button>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 lg:grid-cols-2">
          <div
            className={`flex min-h-0 flex-col border-[var(--color-border)] p-4 sm:p-5 lg:border-e ${
              mobileTab === 'preview' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">JSON</label>
              <button
                type="button"
                onClick={handlePasteExample}
                className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border)] px-2 py-1 text-[11px] font-medium hover:bg-[var(--color-bg)]"
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
              placeholder={JSON.stringify(PERSON_BIO_JSON_EXAMPLE, null, 2)}
              className="min-h-[280px] flex-1 resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5 font-mono text-xs leading-relaxed focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <p className="mt-2 text-[11px] text-[var(--color-text-muted)]">
              ساختار:{' '}
              <code dir="ltr" className="rounded bg-[var(--color-bg)] px-1">
                {'{ "people": [{ role, slug, displayName, bio, ... }] }'}
              </code>
            </p>
          </div>

          <div
            className={`flex min-h-0 flex-col overflow-hidden bg-[var(--color-bg)]/40 p-4 sm:p-5 ${
              mobileTab === 'json' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            <p className="mb-3 text-xs font-semibold text-[var(--color-text-muted)]">پیش‌نمایش</p>

            {parseState.status === 'valid' ? (
              <>
                {parseState.people.length > 1 && (
                  <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
                    {parseState.people.map((person, index) => (
                      <button
                        key={`${person.role}:${person.slug}:${index}`}
                        type="button"
                        onClick={() => setSelectedIndex(index)}
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          selectedIndex === index
                            ? 'bg-indigo-600 text-white'
                            : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]'
                        }`}
                      >
                        {person.displayName}
                      </button>
                    ))}
                  </div>
                )}
                {selectedPerson && (
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <PersonProfilePreviewCard
                      role={selectedPerson.role}
                      slug={selectedPerson.slug}
                      displayName={selectedPerson.displayName}
                      bio={selectedPerson.bio}
                      imageUrl={selectedPerson.imageUrl}
                      externalUrl={selectedPerson.externalUrl}
                      status={selectedPerson.status ?? 'published'}
                      itemCount={itemCountFor(selectedPerson)}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] px-6 py-12 text-center">
                <FileJson className="mb-3 h-10 w-10 text-[var(--color-text-muted)] opacity-40" />
                <p className="text-sm font-medium text-[var(--color-text)]">
                  {parseState.status === 'invalid' ? 'JSON نیاز به اصلاح دارد' : 'منتظر JSON…'}
                </p>
                <p className="mt-1 max-w-xs text-xs text-[var(--color-text-muted)]">
                  {parseState.status === 'invalid'
                    ? parseState.error
                    : 'پس از وارد کردن JSON معتبر، پیش‌نمایش صفحه هر شخص اینجا نمایش داده می‌شود.'}
                </p>
              </div>
            )}
          </div>
        </div>

        <footer className="flex flex-col-reverse gap-2 border-t border-[var(--color-border)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium hover:bg-[var(--color-bg)]"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={() => void handleImport()}
            disabled={importing || parseState.status !== 'valid'}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {importing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {parseState.status === 'valid'
              ? `اعمال ${parseState.people.length.toLocaleString('fa-IR')} پروفایل`
              : 'اعمال'}
          </button>
        </footer>
      </div>
    </div>
  );
}
