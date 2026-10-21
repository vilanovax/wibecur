import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LayoutGrid, List } from 'lucide-react';
import { requireAdmin } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/has-permission';
import { loadHeaviestMedia, loadMediaLibrary } from '@/lib/admin/media-library';
import {
  HEAVIEST_IMAGE_LIMIT,
  MEDIA_KIND_LABELS,
  MEDIA_KINDS,
  parseMediaFilter,
  parseMediaRank,
  parseMediaState,
  type MediaFilter,
  type MediaState,
} from '@/lib/admin/media-targets';
import { faNumber } from '@/lib/utils';
import MediaImportPanel from '@/components/admin/media/MediaImportPanel';
import MediaSlotRow from '@/components/admin/media/MediaSlotRow';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'کتابخانه تصاویر | پنل مدیریت',
};

type MediaView = 'list' | 'grid';

function pageHref(
  filter: MediaFilter,
  q: string,
  missing: boolean,
  page: number,
  view: MediaView,
  state: MediaState,
  heaviest: boolean,
) {
  const params = new URLSearchParams();
  if (filter !== 'all') params.set('kind', filter);
  if (q) params.set('q', q);
  if (!heaviest && missing) params.set('missing', '1');
  if (view === 'grid') params.set('view', 'grid');
  if (state !== 'all') params.set('state', state);
  if (heaviest) params.set('rank', 'bytes');
  if (!heaviest && page > 1) params.set('page', String(page));
  const query = params.toString();
  return query ? `/admin/media?${query}` : '/admin/media';
}

function exportHref(filter: MediaFilter, q: string, state: MediaState, heaviest: boolean) {
  const params = new URLSearchParams();
  if (filter !== 'all') params.set('kind', filter);
  if (heaviest && q) params.set('q', q);
  if (state !== 'all') params.set('state', state);
  if (heaviest) params.set('rank', 'bytes');
  const query = params.toString();
  return query ? `/api/admin/media?${query}` : '/api/admin/media';
}

export default async function MediaLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{
    kind?: string;
    q?: string;
    missing?: string;
    page?: string;
    view?: string;
    state?: string;
    rank?: string;
  }>;
}) {
  const session = await requireAdmin();
  if (!hasPermission(session.user.role, 'edit_list_media', session.user.adminPermissions)) {
    redirect('/admin/access-denied?from=/admin/media&perm=edit_list_media');
  }

  const params = await searchParams;
  const filter = parseMediaFilter(params.kind);
  const q = (params.q ?? '').trim();
  const missing = params.missing === '1';
  const view: MediaView = params.view === 'grid' ? 'grid' : 'list';
  const state = parseMediaState(params.state);
  const heaviest = parseMediaRank(params.rank) === 'bytes';
  const page = Math.max(1, Number(params.page) || 1);
  const [data, heavy] = await Promise.all([
    loadMediaLibrary({
      filter,
      q,
      missing: heaviest ? false : missing,
      state,
      page,
      countsOnly: heaviest,
    }),
    heaviest ? loadHeaviestMedia({ filter, q, state }) : Promise.resolve(null),
  ]);
  const slots = heavy ? heavy.slots : data.slots;
  const pageCount = Math.max(1, Math.ceil(data.total / data.pageSize));
  const filters: MediaFilter[] = ['all', ...MEDIA_KINDS];

  return (
    <div className="space-y-4 pb-20" dir="rtl">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-[var(--color-text)]">کتابخانه تصاویر</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            جایگزینی تصویر هر بخش. بنر ثابت سایت حذف نمی‌شود.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={exportHref(filter, q, state, heaviest)}
            className="inline-flex min-h-11 items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-semibold text-[var(--color-text)]"
            title={
              heaviest
                ? `${faNumber(HEAVIEST_IMAGE_LIMIT)} تصویر با بیشترین حجم`
                : filter === 'banner'
                  ? 'بنر سایت فایل خالی ندارد.'
                  : 'موارد بدون تصویر همین فیلتر'
            }
          >
            خروجی JSON
          </a>
          <MediaImportPanel />
        </div>
      </header>

      <form action="/admin/media" className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {filter !== 'all' ? <input type="hidden" name="kind" value={filter} /> : null}
        {missing ? <input type="hidden" name="missing" value="1" /> : null}
        {view === 'grid' ? <input type="hidden" name="view" value="grid" /> : null}
        {state !== 'all' ? <input type="hidden" name="state" value={state} /> : null}
        {heaviest ? <input type="hidden" name="rank" value="bytes" /> : null}
        <div className="flex min-h-11 min-w-0 flex-1 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          <input
            name="q"
            defaultValue={q}
            placeholder="جستجو در نام…"
            className="min-h-11 min-w-0 flex-1 bg-transparent px-3 text-sm text-[var(--color-text)] outline-none"
          />
          <button
            type="submit"
            className="inline-flex min-h-11 items-center bg-[var(--primary)] px-4 text-sm font-semibold text-white"
          >
            جستجو
          </button>
        </div>
      </form>

      <div className="flex flex-wrap gap-2">
        {filters.map((item) => {
          const active = item === filter;
          const label = item === 'all' ? 'همه' : MEDIA_KIND_LABELS[item];
          return (
            <Link
              key={item}
              href={pageHref(item, q, missing, 1, view, state, heaviest)}
              className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 text-sm ${
                active
                  ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                  : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]'
              }`}
            >
              {label}
              <span className={active ? 'opacity-80' : 'text-[var(--color-text-muted)]'}>
                {faNumber(data.counts[item])}
              </span>
            </Link>
          );
        })}
        <div className="ms-auto flex flex-wrap items-center gap-2">
          <div
            className="inline-flex overflow-hidden rounded-xl border border-[var(--color-border)]"
            role="group"
            aria-label="وضعیت"
          >
            {(
              [
                { mode: 'active' as const, label: 'فعال' },
                { mode: 'inactive' as const, label: 'غیرفعال' },
              ] as const
            ).map(({ mode, label }) => {
              const selected = state === mode;
              return (
                <Link
                  key={mode}
                  href={pageHref(filter, q, missing, 1, view, selected ? 'all' : mode, heaviest)}
                  aria-pressed={selected}
                  className={`inline-flex min-h-11 items-center px-3 text-sm font-semibold ${
                    selected ? 'bg-[var(--primary)] text-white' : 'bg-[var(--color-surface)] text-[var(--color-text)]'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
          <div
            className="inline-flex overflow-hidden rounded-xl border border-[var(--color-border)]"
            role="group"
            aria-label="نحوه نمایش"
          >
            {(
              [
                { mode: 'list' as const, label: 'لیست', icon: List },
                { mode: 'grid' as const, label: 'گرید', icon: LayoutGrid },
              ] as const
            ).map(({ mode, label, icon: Icon }) => {
              const active = view === mode;
              return (
                <Link
                  key={mode}
                  href={pageHref(filter, q, missing, 1, mode, state, heaviest)}
                  aria-current={active ? 'page' : undefined}
                  className={`inline-flex min-h-11 items-center gap-1.5 px-3 text-sm font-semibold ${
                    active
                      ? 'bg-[var(--primary)] text-white'
                      : 'bg-[var(--color-surface)] text-[var(--color-text)]'
                  }`}
                >
                  <Icon className="size-4" strokeWidth={2} aria-hidden />
                  {label}
                </Link>
              );
            })}
          </div>
          <Link
            href={pageHref(filter, q, !missing, 1, view, state, false)}
            className={`inline-flex min-h-11 items-center rounded-full border px-3 text-sm ${
            missing
              ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
              : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]'
          }`}
        >
            فقط بدون تصویر
          </Link>
          <Link
            href={pageHref(filter, q, false, 1, view, state, !heaviest)}
            aria-pressed={heaviest}
            className={`inline-flex min-h-11 items-center rounded-full border px-3 text-sm ${
              heaviest
                ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]'
            }`}
          >
            بزرگ‌ترین حجم
          </Link>
        </div>
      </div>

      {heaviest && heavy && !heavy.complete && slots.length > 0 ? (
        <p className="text-sm text-[var(--color-text-muted)]">
          خواندن همهٔ فایل‌ها تمام نشد. این فهرست از همان بخشی است که خوانده شد.
        </p>
      ) : null}

      {slots.length === 0 ? (
        <p className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm text-[var(--color-text-muted)]">
          {heaviest ? 'حجم این تصویرها از فضای سایت خوانده نشد.' : 'موردی با این فیلتر پیدا نشد.'}
        </p>
      ) : (
        view === 'grid' ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {slots.map((slot) => (
              <MediaSlotRow key={slot.key} slot={slot} layout="grid" />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)] overflow-hidden rounded-xl border border-[var(--color-border)]">
            {slots.map((slot) => (
              <MediaSlotRow key={slot.key} slot={slot} />
            ))}
          </div>
        )
      )}

      <div className="flex items-center justify-between gap-3 text-sm text-[var(--color-text-muted)]">
        <p>
          {heaviest
            ? `${faNumber(slots.length)} تصویر با بیشترین حجم`
            : `${faNumber(data.total)} مورد · صفحه ${faNumber(data.page)} از ${faNumber(pageCount)}`}
        </p>
        <div className="flex gap-2">
          {!heaviest && data.page > 1 ? (
            <Link
              href={pageHref(filter, q, missing, data.page - 1, view, state, false)}
              className="inline-flex min-h-11 items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3"
            >
              قبلی
            </Link>
          ) : null}
          {!heaviest && data.page < pageCount ? (
            <Link
              href={pageHref(filter, q, missing, data.page + 1, view, state, false)}
              className="inline-flex min-h-11 items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3"
            >
              بعدی
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
