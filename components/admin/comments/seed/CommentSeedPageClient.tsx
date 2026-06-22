'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Settings2,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';
import CommentsSubNav from '@/components/admin/comments/CommentsSubNav';
import PageHeader from '@/components/admin/layout/PageHeader';
import ActionButton from '@/components/admin/design-system/ActionButton';
import CommentSeedStepper, { type CommentSeedStep } from './CommentSeedStepper';
import CommentSeedCampaignSidebar, { type CampaignListItem } from './CommentSeedCampaignSidebar';
import CommentSeedDraftTable, { type SeedDraftRow } from './CommentSeedDraftTable';
import CommentSeedRulesPanel, { type SeedRuleRow } from './CommentSeedRulesPanel';
import CommentSeedStatsBar from './CommentSeedStatsBar';
import { DEFAULT_TONE_MIX, type ToneMix } from '@/lib/comment-seed/types';

type Campaign = CampaignListItem & {
  targetIds: string[];
  commentCount: number;
  perItemCount: number | null;
  toneMix: ToneMix;
  wordCountMin: number;
  wordCountMax: number;
  dateFrom: string;
  dateTo: string;
};

type Persona = { id: string; displayName: string; username: string; isActive: boolean };

type DraftUpdatePatch = {
  content?: string;
  personaId?: string;
  scheduledAt?: string;
  status?: string;
  tone?: string;
};

const TONE_LABELS: Record<keyof ToneMix, string> = {
  positive: 'مثبت',
  negative: 'منفی',
  neutral: 'خنثی',
  question: 'سوالی',
};

const TONE_COLORS: Record<keyof ToneMix, string> = {
  positive: 'bg-emerald-500',
  negative: 'bg-rose-500',
  neutral: 'bg-slate-400',
  question: 'bg-violet-500',
};

const TARGET_HINTS: Record<'item' | 'list' | 'category', string> = {
  item: 'شناسه آیتم‌ها را با کاما یا خط جدید جدا کنید',
  list: 'شناسه لیست‌ها — کامنت روی همه آیتم‌های هر لیست تولید می‌شود',
  category: 'شناسه دسته‌ها — کامنت روی همه آیتم‌های فعال هر دسته',
};

function defaultDateRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 28);
  return {
    from: from.toISOString().slice(0, 16),
    to: to.toISOString().slice(0, 16),
  };
}

function toneMixTotal(mix: ToneMix) {
  return mix.positive + mix.negative + mix.neutral + mix.question;
}

type MainTab = 'campaign' | 'rules';

export default function CommentSeedPageClient() {
  const dates = useMemo(() => defaultDateRange(), []);
  const [mainTab, setMainTab] = useState<MainTab>('campaign');
  const [step, setStep] = useState<CommentSeedStep>(1);
  const [isNew, setIsNew] = useState(true);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<SeedDraftRow[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [rules, setRules] = useState<SeedRuleRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [targetPreview, setTargetPreview] = useState<number | null>(null);
  const [draftFilter, setDraftFilter] = useState<string>('all');

  const [title, setTitle] = useState('کمپین جدید');
  const [targetType, setTargetType] = useState<'item' | 'list' | 'category'>('item');
  const [targetIdsRaw, setTargetIdsRaw] = useState('');
  const [commentCount, setCommentCount] = useState(10);
  const [perItemCount, setPerItemCount] = useState('');
  const [toneMix, setToneMix] = useState<ToneMix>(DEFAULT_TONE_MIX);
  const [wordCountMin, setWordCountMin] = useState(40);
  const [wordCountMax, setWordCountMax] = useState(120);
  const [dateFrom, setDateFrom] = useState(dates.from);
  const [dateTo, setDateTo] = useState(dates.to);

  const [ruleScopeType, setRuleScopeType] = useState<'category' | 'list' | 'item'>('item');
  const [ruleScopeId, setRuleScopeId] = useState('');
  const [ruleEnabled, setRuleEnabled] = useState(true);

  const targetIds = useMemo(
    () =>
      targetIdsRaw
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean),
    [targetIdsRaw]
  );

  const selectedCampaign = campaigns.find((c) => c.id === selectedId) ?? null;
  const toneTotal = toneMixTotal(toneMix);
  const toneValid = toneTotal === 100;

  const approvedCount = drafts.filter((d) => d.status === 'approved').length;
  const draftCount = drafts.filter((d) => d.status === 'draft').length;

  const filteredDrafts = useMemo(() => {
    if (draftFilter === 'all') return drafts;
    return drafts.filter((d) => d.status === draftFilter);
  }, [drafts, draftFilter]);

  const completedThrough: CommentSeedStep = useMemo(() => {
    if (!selectedId) return 1;
    if (drafts.length > 0) return 4;
    if (selectedCampaign && selectedCampaign.status !== 'draft') return 3;
    return 2;
  }, [selectedId, drafts.length, selectedCampaign]);

  const loadCampaigns = useCallback(async () => {
    const res = await fetch('/api/admin/comments/seed/campaigns');
    const json = await res.json();
    if (json.success) setCampaigns(json.data);
  }, []);

  const loadPersonas = useCallback(async () => {
    const res = await fetch('/api/admin/comments/seed/personas');
    const json = await res.json();
    if (json.success) setPersonas(json.data);
  }, []);

  const loadRules = useCallback(async () => {
    const res = await fetch('/api/admin/comments/seed/rules');
    const json = await res.json();
    if (json.success) setRules(json.data);
  }, []);

  const loadDrafts = useCallback(async (campaignId: string) => {
    const res = await fetch(`/api/admin/comments/seed/campaigns/${campaignId}/drafts`);
    const json = await res.json();
    if (json.success) setDrafts(json.data);
  }, []);

  useEffect(() => {
    void loadCampaigns();
    void loadPersonas();
    void loadRules();
  }, [loadCampaigns, loadPersonas, loadRules]);

  useEffect(() => {
    if (selectedId) void loadDrafts(selectedId);
    else setDrafts([]);
  }, [selectedId, loadDrafts]);

  useEffect(() => {
    if (!isNew && selectedId && drafts.length > 0) {
      setStep(4);
    }
  }, [drafts.length, selectedId, isNew]);

  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(t);
    }
  }, [message]);

  useEffect(() => {
    if (targetIds.length === 0) {
      setTargetPreview(null);
      return;
    }
    const t = setTimeout(async () => {
      const res = await fetch('/api/admin/comments/seed/target-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType, targetIds }),
      });
      const json = await res.json();
      if (json.success) setTargetPreview(json.data.itemCount);
    }, 400);
    return () => clearTimeout(t);
  }, [targetType, targetIds]);

  function resetNewCampaign() {
    setIsNew(true);
    setSelectedId(null);
    setStep(1);
    setTitle('کمپین جدید');
    setTargetType('item');
    setTargetIdsRaw('');
    setCommentCount(10);
    setPerItemCount('');
    setToneMix(DEFAULT_TONE_MIX);
    setWordCountMin(40);
    setWordCountMax(120);
    setDateFrom(dates.from);
    setDateTo(dates.to);
    setError(null);
  }

  function selectCampaign(id: string) {
    const c = campaigns.find((x) => x.id === id);
    if (!c) return;
    setIsNew(false);
    setSelectedId(id);
    setTitle(c.title);
    setTargetType(c.targetType);
    setTargetIdsRaw(c.targetIds.join('\n'));
    setCommentCount(c.commentCount);
    setPerItemCount(c.perItemCount?.toString() ?? '');
    setToneMix(c.toneMix);
    setWordCountMin(c.wordCountMin);
    setWordCountMax(c.wordCountMax);
    setDateFrom(c.dateFrom.slice(0, 16));
    setDateTo(c.dateTo.slice(0, 16));
    setStep(3);
    setError(null);
  }

  function normalizeToneMix() {
    const total = toneMixTotal(toneMix);
    if (total === 0) return;
    const factor = 100 / total;
    setToneMix({
      positive: Math.round(toneMix.positive * factor),
      negative: Math.round(toneMix.negative * factor),
      neutral: Math.round(toneMix.neutral * factor),
      question: Math.round(toneMix.question * factor),
    });
  }

  async function createCampaign() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/comments/seed/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          targetType,
          targetIds,
          commentCount,
          perItemCount: perItemCount ? parseInt(perItemCount, 10) : undefined,
          toneMix,
          wordCountMin,
          wordCountMax,
          dateFrom: new Date(dateFrom).toISOString(),
          dateTo: new Date(dateTo).toISOString(),
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? 'خطا');
      setSelectedId(json.data.id);
      setIsNew(false);
      setStep(3);
      setMessage('کمپین با موفقیت ایجاد شد');
      await loadCampaigns();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
    } finally {
      setLoading(false);
    }
  }

  async function generateDrafts() {
    if (!selectedId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/comments/seed/campaigns/${selectedId}/generate`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? 'خطا در تولید');
      setMessage(`${json.data.created.toLocaleString('fa-IR')} پیش‌نویس ساخته شد`);
      setStep(4);
      await loadCampaigns();
      await loadDrafts(selectedId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
    } finally {
      setLoading(false);
    }
  }

  async function approveAllDrafts() {
    if (!selectedId) return;
    setLoading(true);
    try {
      await Promise.all(
        drafts
          .filter((d) => d.status === 'draft')
          .map((d) =>
            fetch(`/api/admin/comments/seed/drafts/${d.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'approved' }),
            })
          )
      );
      await loadDrafts(selectedId);
      setMessage('همه پیش‌نویس‌ها تایید شدند');
    } finally {
      setLoading(false);
    }
  }

  async function publishDrafts() {
    if (!selectedId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/comments/seed/campaigns/${selectedId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onlyApproved: true }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? 'خطا در انتشار');
      setMessage(`${json.data.published.toLocaleString('fa-IR')} کامنت منتشر شد`);
      await loadCampaigns();
      await loadDrafts(selectedId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
    } finally {
      setLoading(false);
    }
  }

  async function updateDraft(id: string, patch: DraftUpdatePatch) {
    const res = await fetch(`/api/admin/comments/seed/drafts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error ?? 'خطا');
    if (selectedId) await loadDrafts(selectedId);
  }

  async function deleteDraft(id: string) {
    await fetch(`/api/admin/comments/seed/drafts/${id}`, { method: 'DELETE' });
    if (selectedId) await loadDrafts(selectedId);
  }

  async function saveRule() {
    if (!ruleScopeId.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/comments/seed/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scopeType: ruleScopeType,
          scopeId: ruleScopeId.trim(),
          enabled: ruleEnabled,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? 'خطا');
      setRuleScopeId('');
      await loadRules();
      setMessage('قانون ذخیره شد');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
    } finally {
      setLoading(false);
    }
  }

  async function toggleRule(rule: SeedRuleRow) {
    await fetch(`/api/admin/comments/seed/rules/${rule.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !rule.enabled }),
    });
    await loadRules();
  }

  const canGoNext = useMemo(() => {
    if (step === 1) return title.trim().length >= 2 && targetIds.length > 0;
    if (step === 2) return toneValid && wordCountMin <= wordCountMax && commentCount >= 1;
    return false;
  }, [step, title, targetIds, toneValid, wordCountMin, wordCountMax, commentCount]);

  function handleNext() {
    if (step === 1 && canGoNext) setStep(2);
    else if (step === 2 && canGoNext && !selectedId) void createCampaign();
    else if (step === 2 && canGoNext && selectedId) setStep(3);
  }

  const inputClass =
    'mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

  return (
    <div dir="rtl">
      <CommentsSubNav />

      <PageHeader
        title="کامنت‌سازی هوشمند"
        subtitle="تولید کامنت آیتم با AI، پیش‌نمایش، و انتشار با پرسونای کاربری"
        actions={
          <CommentSeedStatsBar
            campaignCount={campaigns.length}
            personaCount={personas.filter((p) => p.isActive).length}
            rulesCount={rules.length}
            targetItemCount={targetPreview}
            showTarget={mainTab === 'campaign' && step === 1 && targetIds.length > 0}
          />
        }
      />

      {personas.length === 0 && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">پرسونایی برای انتشار وجود ندارد</p>
            <p className="mt-1 text-xs text-amber-800">
              <code className="rounded bg-white/80 px-1.5 py-0.5 font-mono">
                npx tsx scripts/create-comment-personas.ts 50
              </code>
            </p>
          </div>
        </div>
      )}

      {/* Toast alerts */}
      {(message || error) && (
        <div className="pointer-events-none fixed bottom-6 left-6 z-50 max-w-sm">
          {message && (
            <div className="pointer-events-auto mb-2 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-lg">
              <Sparkles className="h-4 w-4 shrink-0" />
              {message}
            </div>
          )}
          {error && (
            <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 shadow-lg">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </div>
      )}

      <div className="mb-5 flex gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-1">
        {(
          [
            { id: 'campaign' as const, label: 'کمپین‌ها', icon: Sparkles },
            { id: 'rules' as const, label: 'قوانین نمایش', icon: Settings2 },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setMainTab(id)}
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
              mainTab === id
                ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {mainTab === 'rules' ? (
        <CommentSeedRulesPanel
          rules={rules}
          scopeType={ruleScopeType}
          scopeId={ruleScopeId}
          enabled={ruleEnabled}
          loading={loading}
          onScopeTypeChange={setRuleScopeType}
          onScopeIdChange={setRuleScopeId}
          onEnabledChange={setRuleEnabled}
          onSave={() => void saveRule()}
          onToggle={(r) => void toggleRule(r)}
        />
      ) : (
        <div
          className={`grid gap-5 ${campaigns.length > 0 ? 'lg:grid-cols-[260px_1fr]' : 'max-w-3xl'}`}
        >
          {campaigns.length > 0 && (
            <CommentSeedCampaignSidebar
              campaigns={campaigns}
              selectedId={selectedId}
              isNew={isNew}
              onSelect={selectCampaign}
              onNew={resetNewCampaign}
            />
          )}

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-6">
            <CommentSeedStepper
              current={step}
              completedThrough={completedThrough}
              onStepClick={(s) => {
                if (s <= completedThrough + 1 || (selectedId && s <= 4)) setStep(s);
              }}
            />

            {/* Step 1: Target */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/50 px-4 py-3">
                  <h3 className="text-base font-semibold text-[var(--color-text)]">انتخاب هدف</h3>
                  <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
                    مشخص کنید کامنت‌ها روی کدام آیتم‌ها تولید شوند
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-medium">
                    عنوان کمپین
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className={inputClass}
                    />
                  </label>
                  <div>
                    <span className="text-sm font-medium">نوع هدف</span>
                    <div className="mt-1.5 flex gap-2">
                      {(['item', 'list', 'category'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTargetType(t)}
                          className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                            targetType === t
                              ? 'bg-primary text-white shadow-sm'
                              : 'border border-[var(--color-border)] hover:bg-[var(--color-bg)]'
                          }`}
                        >
                          {t === 'item' ? 'آیتم' : t === 'list' ? 'لیست' : 'دسته'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <label className="block text-sm font-medium">
                  شناسه‌ها
                  <textarea
                    value={targetIdsRaw}
                    onChange={(e) => setTargetIdsRaw(e.target.value)}
                    rows={3}
                    placeholder={TARGET_HINTS[targetType]}
                    className={`${inputClass} max-w-2xl font-mono text-xs`}
                  />
                  <span className="mt-1 block text-xs text-[var(--color-text-muted)]">
                    {TARGET_HINTS[targetType]}
                  </span>
                </label>

                {targetPreview != null && targetIds.length > 0 && (
                  <div className="inline-flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5">
                    <Target className="h-4 w-4 text-primary" />
                    <p className="text-sm">
                      <span className="font-bold tabular-nums text-primary">
                        {targetPreview.toLocaleString('fa-IR')}
                      </span>
                      <span className="text-[var(--color-text-muted)]"> آیتم هدف از </span>
                      <span className="font-medium tabular-nums">
                        {targetIds.length.toLocaleString('fa-IR')}
                      </span>
                      <span className="text-[var(--color-text-muted)]"> شناسه</span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Config */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/50 px-4 py-3">
                  <h3 className="text-base font-semibold text-[var(--color-text)]">تنظیمات تولید</h3>
                  <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
                    تعداد، طول متن، بازه تاریخ و ترکیب لحن
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-medium">
                    تعداد کل کامنت
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={commentCount}
                      onChange={(e) => setCommentCount(parseInt(e.target.value, 10) || 1)}
                      className={inputClass}
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    تعداد per-item
                    <input
                      value={perItemCount}
                      onChange={(e) => setPerItemCount(e.target.value)}
                      placeholder="خالی = توزیع خودکار"
                      className={inputClass}
                    />
                    <span className="mt-1 block text-xs text-[var(--color-text-muted)]">
                      حداکثر کامنت روی هر آیتم
                    </span>
                  </label>
                  <label className="block text-sm font-medium">
                    حداقل کاراکتر
                    <input
                      type="number"
                      value={wordCountMin}
                      onChange={(e) => setWordCountMin(parseInt(e.target.value, 10) || 40)}
                      className={inputClass}
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    حداکثر کاراکتر
                    <input
                      type="number"
                      value={wordCountMax}
                      onChange={(e) => setWordCountMax(parseInt(e.target.value, 10) || 120)}
                      className={inputClass}
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    از تاریخ
                    <input
                      type="datetime-local"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className={inputClass}
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    تا تاریخ
                    <input
                      type="datetime-local"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className={inputClass}
                    />
                  </label>
                </div>

                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/30 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium">ترکیب لحن</span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold ${toneValid ? 'text-emerald-600' : 'text-amber-600'}`}
                      >
                        مجموع: {toneTotal.toLocaleString('fa-IR')}%
                      </span>
                      {!toneValid && (
                        <button
                          type="button"
                          onClick={normalizeToneMix}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          نرمال‌سازی
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mb-4 flex h-3 overflow-hidden rounded-full">
                    {(Object.keys(TONE_LABELS) as Array<keyof ToneMix>).map((key) => (
                      <div
                        key={key}
                        className={`${TONE_COLORS[key]} transition-all`}
                        style={{ width: `${Math.max(0, toneMix[key])}%` }}
                        title={`${TONE_LABELS[key]}: ${toneMix[key]}%`}
                      />
                    ))}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {(Object.keys(TONE_LABELS) as Array<keyof ToneMix>).map((key) => (
                      <label key={key} className="block text-sm">
                        <span className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${TONE_COLORS[key]}`} />
                          {TONE_LABELS[key]}
                        </span>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={toneMix[key]}
                          onChange={(e) =>
                            setToneMix((prev) => ({
                              ...prev,
                              [key]: parseInt(e.target.value, 10) || 0,
                            }))
                          }
                          className="mt-1 w-full accent-primary"
                        />
                        <span className="text-xs text-[var(--color-text-muted)]">
                          {toneMix[key].toLocaleString('fa-IR')}%
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Generate */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-semibold text-[var(--color-text)]">تولید پیش‌نویس‌ها</h3>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    AI بر اساس تنظیمات کمپین، کامنت‌ها را می‌سازد
                  </p>
                </div>

                {!selectedId ? (
                  <div className="rounded-xl border border-dashed border-[var(--color-border)] px-6 py-10 text-center">
                    <p className="text-sm text-[var(--color-text-muted)]">
                      ابتدا کمپین را در مرحله قبل ایجاد کنید
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-[var(--color-text)]">{title}</p>
                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                          {commentCount.toLocaleString('fa-IR')} کامنت ·{' '}
                          {targetPreview?.toLocaleString('fa-IR') ?? '؟'} آیتم هدف
                        </p>
                      </div>
                      <ActionButton
                        variant="primary"
                        disabled={loading || personas.length === 0}
                        icon={loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                        onClick={() => void generateDrafts()}
                      >
                        {loading ? 'در حال تولید...' : 'تولید پیش‌نویس‌ها'}
                      </ActionButton>
                    </div>

                    {personas.length === 0 && (
                      <p className="mt-4 text-xs text-amber-700">
                        برای تولید، حداقل یک پرسونا لازم است
                      </p>
                    )}

                    {drafts.length > 0 && (
                      <p className="mt-4 text-sm text-emerald-700">
                        {drafts.length.toLocaleString('fa-IR')} پیش‌نویس موجود — به مرحله بعد بروید
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Preview & Publish */}
            {step === 4 && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-[var(--color-text)]">
                      پیش‌نمایش و انتشار
                    </h3>
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                      {drafts.length.toLocaleString('fa-IR')} پیش‌نویس ·{' '}
                      {approvedCount.toLocaleString('fa-IR')} تایید شده
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <ActionButton
                      variant="secondary"
                      disabled={loading || draftCount === 0}
                      onClick={() => void approveAllDrafts()}
                    >
                      تایید همه ({draftCount.toLocaleString('fa-IR')})
                    </ActionButton>
                    <ActionButton
                      variant="primary"
                      disabled={loading || approvedCount === 0}
                      className="!bg-emerald-600 !border-emerald-600 hover:!bg-emerald-700"
                      onClick={() => void publishDrafts()}
                    >
                      انتشار ({approvedCount.toLocaleString('fa-IR')})
                    </ActionButton>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'all', label: 'همه' },
                    { id: 'draft', label: 'پیش‌نویس' },
                    { id: 'approved', label: 'تایید شده' },
                    { id: 'published', label: 'منتشر شده' },
                  ].map(({ id, label }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setDraftFilter(id)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                        draftFilter === id
                          ? 'bg-primary text-white'
                          : 'border border-[var(--color-border)] hover:bg-[var(--color-bg)]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <CommentSeedDraftTable
                  drafts={filteredDrafts}
                  personas={personas}
                  loading={loading}
                  onUpdate={updateDraft}
                  onDelete={deleteDraft}
                  onApprove={(id) => updateDraft(id, { status: 'approved' })}
                />
              </div>
            )}

            {/* Step navigation */}
            {step < 4 && (
              <div className="mt-8 flex items-center justify-between border-t border-[var(--color-border)] pt-5">
                <button
                  type="button"
                  disabled={step === 1}
                  onClick={() => setStep((s) => (s > 1 ? ((s - 1) as CommentSeedStep) : s))}
                  className="inline-flex items-center gap-1 rounded-xl px-4 py-2 text-sm font-medium text-[var(--color-text-muted)] transition hover:bg-[var(--color-bg)] disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                  قبلی
                </button>

                {step < 3 && (
                  <ActionButton
                    variant="primary"
                    disabled={!canGoNext || loading}
                    icon={loading ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
                    onClick={handleNext}
                  >
                    {step === 2 && !selectedId ? 'ایجاد کمپین' : 'بعدی'}
                    {!loading && <ChevronLeft className="h-4 w-4" />}
                  </ActionButton>
                )}

                {step === 3 && drafts.length > 0 && (
                  <ActionButton variant="primary" onClick={() => setStep(4)}>
                    پیش‌نمایش
                    <ChevronLeft className="h-4 w-4" />
                  </ActionButton>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
