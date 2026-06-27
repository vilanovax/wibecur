'use client';

import { useCallback, useEffect, useRef, useState, lazy, Suspense } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  ClipboardCopy,
  ExternalLink,
  Eye,
  FileJson,
  GitMerge,
  Loader2,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Upload,
  UserRound,
  Users,
  Wand2,
  X,
  ImageIcon,
  CloudUpload,
} from 'lucide-react';
import {
  PERSON_ROLE_META,
  PERSON_ROLES,
  isPersonPublicReady,
  personPublicPath,
  type PersonPageData,
  type PersonRole,
} from '@/lib/people';
import {
  COMMENT_AI_PROVIDER_OPTIONS,
  commentAiProviderLabel,
  type CommentAiProvider,
  type PersonBioAiSettings,
} from '@/lib/comment-ai-provider';
import {
  PERSON_BIO_JSON_EXAMPLE,
  buildPersonBioJsonSchemaDoc,
} from '@/lib/person-bio-ai';
import type {
  DiscoveredPerson,
  DiscoverPeoplePagination,
  DiscoverPeopleStats,
  PersonProfileRecord,
} from '@/lib/person-profiles';
import PersonPreviewModal from '@/components/admin/people/PersonPreviewModal';
import PersonImportModal from '@/components/admin/people/PersonImportModal';
import PersonSimilarNamesModal from '@/components/admin/people/PersonSimilarNamesModal';
import type { PersonBioImportItem } from '@/lib/person-bio-ai';

const PersonImagesSection = lazy(
  () => import('@/components/admin/people/PersonImagesSection')
);

type EditState = {
  displayName: string;
  bio: string;
  imageUrl: string;
  externalUrl: string;
  status: 'draft' | 'published';
};

const EMPTY_EDIT: EditState = {
  displayName: '',
  bio: '',
  imageUrl: '',
  externalUrl: '',
  status: 'published',
};

const PAGE_SIZES = [25, 50, 100] as const;

const ROLE_BADGE: Record<PersonRole, string> = {
  director: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-200',
  actor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200',
  author: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
  translator: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-200',
};

const EMPTY_AI_SETTINGS: PersonBioAiSettings = {
  personBioAiProvider: 'openai',
  providerLabel: 'OpenAI',
  openaiConfigured: false,
  deepseekConfigured: false,
  providerReady: false,
  effectiveProvider: null,
  fallbackActive: false,
};

const EMPTY_STATS: DiscoverPeopleStats = {
  total: 0,
  withBio: 0,
  withProfile: 0,
  missingBio: 0,
};

const EMPTY_PAGINATION: DiscoverPeoplePagination = {
  page: 1,
  limit: 50,
  total: 0,
  totalPages: 1,
};

export default function PeoplePageClient({ embedded = false }: { embedded?: boolean }) {
  const [roleFilter, setRoleFilter] = useState<PersonRole | 'all'>('all');
  const [missingBioOnly, setMissingBioOnly] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(50);

  const [people, setPeople] = useState<DiscoveredPerson[]>([]);
  const [stats, setStats] = useState<DiscoverPeopleStats>(EMPTY_STATS);
  const [pagination, setPagination] = useState<DiscoverPeoplePagination>(EMPTY_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [aiProvider, setAiProvider] = useState<CommentAiProvider>('openai');
  const [aiSettings, setAiSettings] = useState<PersonBioAiSettings>(EMPTY_AI_SETTINGS);
  const [savingAiProvider, setSavingAiProvider] = useState(false);

  const [selected, setSelected] = useState<DiscoveredPerson | null>(null);
  const [edit, setEdit] = useState<EditState>(EMPTY_EDIT);
  const [profile, setProfile] = useState<PersonProfileRecord | null>(null);
  const [itemCount, setItemCount] = useState(0);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [aiEnriching, setAiEnriching] = useState(false);
  const [imageLoading, setImageLoading] = useState<'fetch' | 'migrate' | null>(null);
  const [saveMessage, setSaveMessage] = useState('');

  const [copyModal, setCopyModal] = useState<{ title: string; content: string } | null>(null);
  const [importJson, setImportJson] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [similarNamesOpen, setSimilarNamesOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [copyLoading, setCopyLoading] = useState<'list' | 'prompt' | null>(null);
  const [previewData, setPreviewData] = useState<PersonPageData | null>(null);
  const [previewLoadingKey, setPreviewLoadingKey] = useState<string | null>(null);

  const fetchAbortRef = useRef<AbortController | null>(null);
  const loadSeqRef = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 450);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [roleFilter, missingBioOnly, debouncedQuery, pageSize]);

  const loadAiSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/people/settings');
      const json = await res.json();
      if (res.ok && json.success) {
        const data = json.data as PersonBioAiSettings;
        setAiSettings(data);
        setAiProvider(data.personBioAiProvider);
      }
    } catch {
      /* optional */
    }
  }, []);

  const loadPeople = useCallback(async () => {
    const seq = ++loadSeqRef.current;
    fetchAbortRef.current?.abort();
    const ctrl = new AbortController();
    fetchAbortRef.current = ctrl;

    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      });
      if (roleFilter !== 'all') params.set('role', roleFilter);
      if (debouncedQuery) params.set('q', debouncedQuery);
      if (missingBioOnly) params.set('missingBio', '1');

      const res = await fetch(`/api/admin/people?${params}`, { signal: ctrl.signal });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'خطا در بارگذاری');
      }

      if (seq !== loadSeqRef.current) return;

      setPeople(json.data.people as DiscoveredPerson[]);
      setStats(json.data.stats as DiscoverPeopleStats);
      setPagination(json.data.pagination as DiscoverPeoplePagination);
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
      if (seq !== loadSeqRef.current) return;
      setError(err instanceof Error ? err.message : 'خطا در بارگذاری');
      setPeople([]);
      setStats(EMPTY_STATS);
      setPagination(EMPTY_PAGINATION);
    } finally {
      if (seq === loadSeqRef.current) {
        setLoading(false);
      }
    }
  }, [roleFilter, debouncedQuery, missingBioOnly, page, pageSize]);

  const loadPeopleRef = useRef(loadPeople);
  loadPeopleRef.current = loadPeople;

  useEffect(() => {
    void loadAiSettings();
  }, [loadAiSettings]);

  useEffect(() => {
    void loadPeople();
  }, [loadPeople]);

  const openPreview = async (person: DiscoveredPerson) => {
    const key = `${person.role}:${person.slug}`;
    setPreviewLoadingKey(key);
    setError('');
    try {
      const res = await fetch(`/api/admin/people/${person.role}/${person.slug}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'خطا در بارگذاری پیش‌نمایش');
      }
      if (!json.data.publicPreview) {
        throw new Error('برای این شخص آیتمی در سایت پیدا نشد');
      }
      setPreviewData(json.data.publicPreview as PersonPageData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در بارگذاری پیش‌نمایش');
    } finally {
      setPreviewLoadingKey(null);
    }
  };

  const saveAiProvider = async (provider: CommentAiProvider) => {
    setSavingAiProvider(true);
    try {
      const res = await fetch('/api/admin/people/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personBioAiProvider: provider }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'خطا در ذخیره مدل');
      }
      setAiProvider(provider);
      void loadAiSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ذخیره مدل');
    } finally {
      setSavingAiProvider(false);
    }
  };

  const openEditor = async (person: DiscoveredPerson) => {
    setSelected(person);
    setDetailLoading(true);
    setSaveMessage('');
    setProfile(null);
    setEdit({
      displayName: person.displayName,
      bio: '',
      imageUrl: '',
      externalUrl: '',
      status: 'published',
    });
    setItemCount(person.itemCount);

    try {
      const res = await fetch(`/api/admin/people/${person.role}/${person.slug}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'خطا در بارگذاری پروفایل');
      }
      const p = json.data.profile as PersonProfileRecord | null;
      setProfile(p);
      if (p) {
        setEdit({
          displayName: p.displayName,
          bio: p.bio ?? '',
          imageUrl: p.imageUrl ?? '',
          externalUrl: p.externalUrl ?? '',
          status: p.status,
        });
      }
      if (json.data.discovered?.itemCount != null) {
        setItemCount(json.data.discovered.itemCount);
      }
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : 'خطا در بارگذاری جزئیات');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeEditor = () => {
    setSelected(null);
    setProfile(null);
    setSaveMessage('');
  };

  const applyProfile = (p: PersonProfileRecord, message: string) => {
    setProfile(p);
    setEdit({
      displayName: p.displayName,
      bio: p.bio ?? '',
      imageUrl: p.imageUrl ?? '',
      externalUrl: p.externalUrl ?? '',
      status: p.status,
    });
    setSaveMessage(message);
    void loadPeople();
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    setSaveMessage('');
    try {
      const res = await fetch(`/api/admin/people/${selected.role}/${selected.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: edit.displayName,
          bio: edit.bio,
          imageUrl: edit.imageUrl || null,
          externalUrl: edit.externalUrl || null,
          status: edit.status,
          tmdbId: profile?.tmdbId ?? null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'خطا در ذخیره');
      }
      applyProfile(json.data as PersonProfileRecord, 'ذخیره شد');
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : 'خطا در ذخیره');
    } finally {
      setSaving(false);
    }
  };

  const handleEnrich = async () => {
    if (!selected) return;
    setEnriching(true);
    setSaveMessage('');
    try {
      const res = await fetch(`/api/admin/people/${selected.role}/${selected.slug}/enrich`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'خطا در تکمیل از TMDB');
      }
      applyProfile(json.data as PersonProfileRecord, 'از TMDB تکمیل شد — در صورت نیاز ویرایش و ذخیره کنید');
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : 'خطا در تکمیل از TMDB');
    } finally {
      setEnriching(false);
    }
  };

  const handleAiEnrich = async (person?: DiscoveredPerson) => {
    const target = person ?? selected;
    if (!target) return;
    if (!aiSettings.providerReady) {
      setSaveMessage(
        'کلید OpenAI یا DeepSeek در تنظیمات → یکپارچه‌سازی وارد نشده است'
      );
      return;
    }
    setAiEnriching(true);
    setSaveMessage('');
    try {
      const res = await fetch(
        `/api/admin/people/${target.role}/${target.slug}/ai-enrich`,
        { method: 'POST' }
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'خطا در تکمیل با هوش مصنوعی');
      }
      applyProfile(
        json.data as PersonProfileRecord,
        'bio با هوش مصنوعی تولید شد — در صورت نیاز ویرایش و ذخیره کنید'
      );
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : 'خطا در تکمیل با هوش مصنوعی');
    } finally {
      setAiEnriching(false);
    }
  };

  const openAndAiEnrich = async (person: DiscoveredPerson) => {
    await openEditor(person);
    await handleAiEnrich(person);
  };

  const handleFetchImage = async () => {
    if (!selected) return;
    setImageLoading('fetch');
    setSaveMessage('');
    try {
      const res = await fetch(
        `/api/admin/people/${selected.role}/${selected.slug}/fetch-image`,
        { method: 'POST' }
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'خطا در دریافت تصویر');
      }
      if (json.data.newUrl) {
        setEdit((s) => ({ ...s, imageUrl: json.data.newUrl }));
      }
      setSaveMessage('تصویر از TMDB دریافت و روی ParsPack ذخیره شد');
      void loadPeople();
      void openEditor(selected);
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : 'خطا در دریافت تصویر');
    } finally {
      setImageLoading(null);
    }
  };

  const handleMigrateImage = async () => {
    if (!selected) return;
    setImageLoading('migrate');
    setSaveMessage('');
    try {
      const res = await fetch(
        `/api/admin/people/${selected.role}/${selected.slug}/migrate-image`,
        { method: 'POST' }
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'خطا در آپلود تصویر');
      }
      if (json.data.newUrl) {
        setEdit((s) => ({ ...s, imageUrl: json.data.newUrl }));
      }
      setSaveMessage('تصویر روی ParsPack ذخیره شد');
      void loadPeople();
      void openEditor(selected);
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : 'خطا در آپلود تصویر');
    } finally {
      setImageLoading(null);
    }
  };

  const handleCopyMissing = async (format: 'text' | 'prompt') => {
    setCopyLoading(format === 'text' ? 'list' : 'prompt');
    try {
      const params = new URLSearchParams({ format: format === 'text' ? 'text' : 'prompt' });
      if (roleFilter !== 'all') params.set('role', roleFilter);
      const res = await fetch(`/api/admin/people/missing-bio?${params}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'خطا');
      }
      const content = format === 'text' ? json.data.text : json.data.prompt;
      setCopyModal({
        title: format === 'text' ? 'لیست اشخاص بدون bio' : 'پرامپت برای هوش مصنوعی خارجی',
        content,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در آماده‌سازی لیست');
    } finally {
      setCopyLoading(null);
    }
  };

  const handleShowJsonSchema = () => {
    setCopyModal({
      title: 'نمونه JSON برای دریافت bio از AI',
      content: `${buildPersonBioJsonSchemaDoc()}\n\n---\n\nمثال:\n${JSON.stringify(PERSON_BIO_JSON_EXAMPLE, null, 2)}`,
    });
  };

  const handleImportJson = async (payload: { people: PersonBioImportItem[] }) => {
    setImporting(true);
    setSaveMessage('');
    try {
      const res = await fetch('/api/admin/people/import-bios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'خطا در ورود JSON');
      }
      setImportOpen(false);
      setImportJson('');
      setSaveMessage(
        `${json.data.updated.toLocaleString('fa-IR')} پروفایل به‌روزرسانی شد` +
          (json.data.failed > 0 ? ` · ${json.data.failed} خطا` : '')
      );
      void loadPeople();
      if (selected) {
        void openEditor(selected);
      }
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : 'JSON نامعتبر است');
    } finally {
      setImporting(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  const canEnrichTmdb = selected && (selected.role === 'director' || selected.role === 'actor');
  const busy = saving || enriching || aiEnriching || imageLoading != null;

  const rangeStart =
    pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const rangeEnd = Math.min(pagination.page * pagination.limit, pagination.total);

  const editorPublicReady = selected
    ? isPersonPublicReady({
        hasBio: Boolean(edit.bio.trim()),
        hasProfile: Boolean(profile),
        profileStatus: edit.status,
        itemCount,
      })
    : false;

  return (
    <div className="space-y-4">
      {!embedded && (
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-[var(--color-text)] md:text-2xl">اشخاص</h1>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              پروفایل کارگردان، بازیگر، نویسنده و مترجم — bio با AI یا JSON
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatChip icon={Users} label="کل" value={stats.total} />
            <StatChip icon={Sparkles} label="با bio" value={stats.withBio} tone="emerald" />
            <StatChip icon={UserRound} label="بدون bio" value={stats.missingBio} tone="amber" />
          </div>
        </header>
      )}

      {embedded && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <StatChip icon={Users} label="کل" value={stats.total} />
            <StatChip icon={Sparkles} label="با bio" value={stats.withBio} tone="emerald" />
            <StatChip icon={UserRound} label="بدون bio" value={stats.missingBio} tone="amber" />
          </div>
          {stats.total > 0 && (
            <BioProgressBar withBio={stats.withBio} total={stats.total} />
          )}
        </div>
      )}

      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 sm:p-4 space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="relative min-w-0 flex-1 max-w-md">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="جستجوی نام…"
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] py-2.5 ps-9 pe-3 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => void loadPeople()}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-bg)]"
              aria-label="بارگذاری مجدد"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-medium text-[var(--color-text-muted)] ms-1">مدل bio:</span>
            {COMMENT_AI_PROVIDER_OPTIONS.map((option) => {
              const configured =
                option.value === 'openai'
                  ? aiSettings.openaiConfigured
                  : aiSettings.deepseekConfigured;
              return (
              <button
                key={option.value}
                type="button"
                disabled={savingAiProvider}
                onClick={() => void saveAiProvider(option.value)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-60 ${
                  aiProvider === option.value
                    ? 'bg-indigo-600 text-white'
                    : 'border border-[var(--color-border)] hover:bg-[var(--color-bg)]'
                } ${!configured ? 'opacity-70' : ''}`}
                title={configured ? undefined : `کلید ${option.label} در تنظیمات وارد نشده`}
              >
                {option.label}
                {!configured && ' *'}
              </button>
            );
            })}
          </div>
          {!aiSettings.providerReady && (
            <p className="text-xs text-amber-700 dark:text-amber-300">
              برای bio با AI، کلید OpenAI یا DeepSeek را در{' '}
              <Link href="/admin/settings?tab=integrations" className="underline">
                تنظیمات یکپارچه‌سازی
              </Link>{' '}
              وارد کنید.
            </p>
          )}
          {aiSettings.fallbackActive && aiSettings.effectiveProvider && (
            <p className="text-xs text-[var(--color-text-muted)]">
              {commentAiProviderLabel(aiSettings.personBioAiProvider)} فعال نیست — از{' '}
              {commentAiProviderLabel(aiSettings.effectiveProvider)} استفاده می‌شود.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            <FilterChip active={roleFilter === 'all'} onClick={() => setRoleFilter('all')} label="همه" />
            {PERSON_ROLES.map((role) => (
              <FilterChip
                key={role}
                active={roleFilter === role}
                onClick={() => setRoleFilter(role)}
                label={PERSON_ROLE_META[role].label}
              />
            ))}
            <FilterChip
              active={missingBioOnly}
              onClick={() => setMissingBioOnly((v) => !v)}
              label="بدون bio"
              accent="amber"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            <div className="flex flex-wrap gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-1">
              <ActionButton
                icon={<ClipboardCopy className="h-3.5 w-3.5" />}
                label="کپی بدون bio"
                loading={copyLoading === 'list'}
                onClick={() => void handleCopyMissing('text')}
                subtle
              />
              <ActionButton
                icon={<Wand2 className="h-3.5 w-3.5" />}
                label="پرامپت AI"
                loading={copyLoading === 'prompt'}
                onClick={() => void handleCopyMissing('prompt')}
                subtle
              />
              <ActionButton
                icon={<FileJson className="h-3.5 w-3.5" />}
                label="نمونه JSON"
                onClick={handleShowJsonSchema}
                subtle
              />
            </div>
            <ActionButton
              icon={<GitMerge className="h-3.5 w-3.5" />}
              label="نام‌های مشابه"
              onClick={() => setSimilarNamesOpen(true)}
              subtle
            />
            <ActionButton
              icon={<Upload className="h-3.5 w-3.5" />}
              label="ورود JSON"
              onClick={() => setImportOpen(true)}
              primary
            />
          </div>
        </div>
      </section>

      <Suspense
        fallback={
          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-xs text-[var(--color-text-muted)]">
            در حال آماده‌سازی بخش تصاویر…
          </section>
        }
      >
        <PersonImagesSection
          roleFilter={roleFilter}
          statsEnabled={!loading}
          onUpdated={() => void loadPeopleRef.current()}
        />
      </Suspense>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {saveMessage && !selected && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200">
          {saveMessage}
        </div>
      )}

      <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
        <div className="min-w-0 flex-1">
          <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
            {loading ? (
              <div className="flex items-center justify-center gap-2 px-6 py-20 text-sm text-[var(--color-text-muted)]">
                <Loader2 className="h-5 w-5 animate-spin" />
                در حال بارگذاری…
              </div>
            ) : people.length === 0 ? (
              <div className="px-6 py-20 text-center text-sm text-[var(--color-text-muted)]">
                شخصی پیدا نشد
              </div>
            ) : (
              <div className="max-h-[calc(100vh-18rem)] overflow-auto">
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-[var(--color-bg)] text-[var(--color-text-muted)] shadow-[0_1px_0_var(--color-border)]">
                    <tr>
                      <th className="px-3 py-2.5 text-right font-medium">نام</th>
                      <th className="px-3 py-2.5 text-right font-medium">نقش</th>
                      <th className="hidden sm:table-cell px-3 py-2.5 text-right font-medium">آیتم</th>
                      <th className="px-3 py-2.5 text-right font-medium">bio</th>
                      <th className="hidden md:table-cell px-3 py-2.5 text-right font-medium">پروفایل</th>
                      <th className="px-3 py-2.5 text-left font-medium w-28">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {people.map((person) => {
                      const isSelected =
                        selected?.role === person.role && selected?.slug === person.slug;
                      const publicReady = isPersonPublicReady(person);
                      const previewKey = `${person.role}:${person.slug}`;
                      return (
                        <tr
                          key={`${person.role}:${person.slug}`}
                          className={`border-t border-[var(--color-border)] cursor-pointer transition-colors hover:bg-[var(--color-bg)]/70 ${
                            isSelected ? 'bg-indigo-50/70 dark:bg-indigo-950/25' : ''
                          }`}
                          onClick={() => void openEditor(person)}
                        >
                          <td className="px-3 py-2.5 font-medium text-[var(--color-text)] max-w-[180px] truncate">
                            {person.displayName}
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ${ROLE_BADGE[person.role]}`}
                            >
                              <span aria-hidden>{PERSON_ROLE_META[person.role].icon}</span>
                              <span className="hidden sm:inline">{PERSON_ROLE_META[person.role].label}</span>
                            </span>
                          </td>
                          <td className="hidden sm:table-cell px-3 py-2.5 tabular-nums text-[var(--color-text-muted)]">
                            {person.itemCount.toLocaleString('fa-IR')}
                          </td>
                          <td className="px-3 py-2.5">
                            <StatusDot ok={person.hasBio} okLabel="دارد" noLabel="ندارد" />
                          </td>
                          <td className="hidden md:table-cell px-3 py-2.5">
                            {person.hasProfile ? (
                              <span className="rounded-md bg-sky-100 px-2 py-0.5 text-[11px] font-medium text-sky-800 dark:bg-sky-900/30 dark:text-sky-200">
                                {person.profileStatus === 'draft' ? 'پیش‌نویس' : 'منتشر'}
                              </span>
                            ) : (
                              <span className="text-[11px] text-[var(--color-text-muted)]">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-left" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              {!person.hasBio && (
                                <button
                                  type="button"
                                  title={
                                    aiSettings.providerReady
                                      ? 'تکمیل bio با AI'
                                      : 'کلید AI در تنظیمات وارد نشده'
                                  }
                                  disabled={!aiSettings.providerReady || aiEnriching}
                                  onClick={() => void openAndAiEnrich(person)}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-indigo-600 hover:bg-indigo-50 disabled:opacity-40 dark:hover:bg-indigo-950/40"
                                >
                                  <Sparkles className="h-3.5 w-3.5" />
                                </button>
                              )}
                              {publicReady && (
                                <>
                                  <button
                                    type="button"
                                    title="پیش‌نمایش صفحه"
                                    disabled={previewLoadingKey === previewKey}
                                    onClick={() => void openPreview(person)}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/40 disabled:opacity-60"
                                  >
                                    {previewLoadingKey === previewKey ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Eye className="h-3.5 w-3.5" />
                                    )}
                                  </button>
                                  <Link
                                    href={personPublicPath(person.role, person.slug)}
                                    target="_blank"
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]"
                                    title="صفحه عمومی در سایت"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </Link>
                                </>
                              )}
                              <button
                                type="button"
                                onClick={() => void openEditor(person)}
                                className="rounded-lg border border-[var(--color-border)] px-2 py-1 text-[11px] font-medium hover:bg-[var(--color-bg)]"
                              >
                                ویرایش
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && pagination.totalPages > 0 && (
              <div className="flex flex-col gap-2 border-t border-[var(--color-border)] px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-[var(--color-text-muted)]">
                  {pagination.total === 0
                    ? 'بدون نتیجه'
                    : `${rangeStart.toLocaleString('fa-IR')}–${rangeEnd.toLocaleString('fa-IR')} از ${pagination.total.toLocaleString('fa-IR')}`}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={pageSize}
                    onChange={(e) =>
                      setPageSize(Number(e.target.value) as (typeof PAGE_SIZES)[number])
                    }
                    className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1.5 text-xs"
                    aria-label="تعداد در صفحه"
                  >
                    {PAGE_SIZES.map((size) => (
                      <option key={size} value={size}>
                        {size} در صفحه
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={pagination.page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] disabled:opacity-40 hover:bg-[var(--color-bg)]"
                    aria-label="صفحه قبل"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <span className="min-w-[4.5rem] text-center text-xs tabular-nums">
                    {pagination.page.toLocaleString('fa-IR')} / {pagination.totalPages.toLocaleString('fa-IR')}
                  </span>
                  <button
                    type="button"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] disabled:opacity-40 hover:bg-[var(--color-bg)]"
                    aria-label="صفحه بعد"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {selected && (
          <aside className="w-full shrink-0 xl:sticky xl:top-4 xl:w-[22rem]">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ${ROLE_BADGE[selected.role]}`}
                  >
                    {PERSON_ROLE_META[selected.role].icon} {PERSON_ROLE_META[selected.role].label}
                  </span>
                  <h2 className="mt-2 text-lg font-bold text-[var(--color-text)] truncate">
                    {selected.displayName}
                  </h2>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    {itemCount.toLocaleString('fa-IR')} آیتم ·{' '}
                    <span dir="ltr" className="font-mono text-[10px]">
                      {selected.slug}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeEditor}
                  className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]"
                  aria-label="بستن"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {detailLoading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-sm text-[var(--color-text-muted)]">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  بارگذاری…
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => void handleAiEnrich()}
                      disabled={busy}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                    >
                      {aiEnriching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      تکمیل bio با AI
                    </button>
                    {canEnrichTmdb && (
                      <button
                        type="button"
                        onClick={() => void handleEnrich()}
                        disabled={busy}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2.5 text-sm font-semibold text-violet-700 hover:bg-violet-100 disabled:opacity-60 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-200"
                      >
                        {enriching ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Wand2 className="h-4 w-4" />
                        )}
                        تکمیل از TMDB
                      </button>
                    )}
                  </div>

                  <Field label="نام نمایشی">
                    <input
                      value={edit.displayName}
                      onChange={(e) => setEdit((s) => ({ ...s, displayName: e.target.value }))}
                      className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm"
                    />
                  </Field>

                  <Field label="bio">
                    <textarea
                      value={edit.bio}
                      onChange={(e) => setEdit((s) => ({ ...s, bio: e.target.value }))}
                      rows={5}
                      className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm leading-relaxed"
                      placeholder="۲–۴ جمله فارسی برای صفحه پروفایل"
                    />
                    <p className="text-[11px] text-[var(--color-text-muted)]">
                      {edit.bio.length.toLocaleString('fa-IR')} کاراکتر
                    </p>
                  </Field>

                  <Field label="تصویر">
                    {edit.imageUrl && (
                      <div className="mb-2 flex justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={edit.imageUrl}
                          alt=""
                          className="h-20 w-20 rounded-2xl object-cover ring-1 ring-[var(--color-border)]"
                        />
                      </div>
                    )}
                    <input
                      value={edit.imageUrl}
                      onChange={(e) => setEdit((s) => ({ ...s, imageUrl: e.target.value }))}
                      dir="ltr"
                      className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm"
                      placeholder="https://…"
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
                      {canEnrichTmdb && (
                        <button
                          type="button"
                          onClick={() => void handleFetchImage()}
                          disabled={busy}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-[11px] font-semibold text-violet-700 hover:bg-violet-100 disabled:opacity-60 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-200"
                        >
                          {imageLoading === 'fetch' ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <ImageIcon className="h-3 w-3" />
                          )}
                          TMDB + ParsPack
                        </button>
                      )}
                      {edit.imageUrl.trim() && (
                        <button
                          type="button"
                          onClick={() => void handleMigrateImage()}
                          disabled={busy}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-[11px] font-semibold hover:bg-[var(--color-bg)] disabled:opacity-60"
                        >
                          {imageLoading === 'migrate' ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <CloudUpload className="h-3 w-3" />
                          )}
                          آپلود به ParsPack
                        </button>
                      )}
                    </div>
                  </Field>

                  <Field label="لینک خارجی">
                    <input
                      value={edit.externalUrl}
                      onChange={(e) => setEdit((s) => ({ ...s, externalUrl: e.target.value }))}
                      dir="ltr"
                      className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm"
                    />
                  </Field>

                  <Field label="وضعیت">
                    <select
                      value={edit.status}
                      onChange={(e) =>
                        setEdit((s) => ({
                          ...s,
                          status: e.target.value as 'draft' | 'published',
                        }))
                      }
                      className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm"
                    >
                      <option value="published">منتشر شده</option>
                      <option value="draft">پیش‌نویس</option>
                    </select>
                  </Field>

                  {saveMessage && (
                    <p className="rounded-lg bg-[var(--color-bg)] px-3 py-2 text-xs text-[var(--color-text-muted)]">
                      {saveMessage}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => void handleSave()}
                    disabled={busy}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    ذخیره
                  </button>

                  {editorPublicReady && selected ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => void openPreview(selected)}
                        disabled={previewLoadingKey === `${selected.role}:${selected.slug}`}
                        className="flex items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100 disabled:opacity-60 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-200"
                      >
                        {previewLoadingKey === `${selected.role}:${selected.slug}` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        پیش‌نمایش
                      </button>
                      <Link
                        href={personPublicPath(selected.role, selected.slug)}
                        target="_blank"
                        className="flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm font-medium hover:bg-[var(--color-bg)]"
                      >
                        <ExternalLink className="h-4 w-4" />
                        سایت
                      </Link>
                    </div>
                  ) : selected ? (
                    <p className="text-[11px] text-center text-[var(--color-text-muted)]">
                      برای انتشار در سایت: bio بنویسید، وضعیت را «منتشر شده» بگذارید و ذخیره کنید.
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {previewData && (
        <PersonPreviewModal data={previewData} onClose={() => setPreviewData(null)} />
      )}

      {copyModal && (
        <Modal title={copyModal.title} onClose={() => setCopyModal(null)}>
          <textarea
            readOnly
            value={copyModal.content}
            rows={14}
            dir={copyModal.title.includes('JSON') ? 'ltr' : 'rtl'}
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs font-mono leading-relaxed"
          />
          <button
            type="button"
            onClick={() => void copyToClipboard(copyModal.content)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <ClipboardCopy className="h-4 w-4" />
            کپی
          </button>
        </Modal>
      )}

      {importOpen && (
        <PersonImportModal
          initialJson={importJson}
          knownPeople={people}
          importing={importing}
          onClose={() => setImportOpen(false)}
          onImport={handleImportJson}
        />
      )}

      <PersonSimilarNamesModal
        open={similarNamesOpen}
        onClose={() => setSimilarNamesOpen(false)}
        roleFilter={roleFilter}
        onMerged={() => void loadPeopleRef.current()}
      />
    </div>
  );
}

function BioProgressBar({ withBio, total }: { withBio: number; total: number }) {
  const pct = Math.round((withBio / total) * 100);
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5">
      <div className="mb-1.5 flex items-center justify-between text-[11px]">
        <span className="font-medium text-[var(--color-text-muted)]">پیشرفت تکمیل bio</span>
        <span className="tabular-nums font-semibold text-emerald-700 dark:text-emerald-300">
          {pct.toLocaleString('fa-IR')}٪
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-bg)]">
        <div
          className="h-full rounded-full bg-gradient-to-l from-emerald-500 to-emerald-400 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function StatChip({
  icon: Icon,
  label,
  value,
  tone = 'default',
}: {
  icon: typeof Users;
  label: string;
  value: number;
  tone?: 'default' | 'emerald' | 'amber';
}) {
  const toneClass =
    tone === 'emerald'
      ? 'text-emerald-700 dark:text-emerald-300'
      : tone === 'amber'
        ? 'text-amber-700 dark:text-amber-300'
        : 'text-[var(--color-text)]';

  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 min-w-[7rem]">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/40">
        <Icon className="h-3.5 w-3.5 text-indigo-600" />
      </div>
      <div>
        <p className={`text-base font-bold tabular-nums leading-none ${toneClass}`}>
          {value.toLocaleString('fa-IR')}
        </p>
        <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function StatusDot({
  ok,
  okLabel,
  noLabel,
}: {
  ok: boolean;
  okLabel: string;
  noLabel: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium">
      <span
        className={`h-1.5 w-1.5 rounded-full ${ok ? 'bg-emerald-500' : 'bg-amber-400'}`}
        aria-hidden
      />
      <span className={ok ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}>
        {ok ? okLabel : noLabel}
      </span>
    </span>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  accent,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  accent?: 'amber';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? accent === 'amber'
            ? 'bg-amber-500 text-white'
            : 'bg-indigo-600 text-white'
          : 'bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
      }`}
    >
      {label}
    </button>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  loading,
  subtle,
  primary,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  loading?: boolean;
  subtle?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold disabled:opacity-60 ${
        primary
          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
          : subtle
            ? 'hover:bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            : 'border border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-surface)]'
      }`}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : icon}
      {label}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-[var(--color-text-muted)]">{label}</span>
      {children}
    </label>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-2xl rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="font-bold text-[var(--color-text)]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-[var(--color-bg)]"
            aria-label="بستن"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
