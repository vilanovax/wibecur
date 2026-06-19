'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import {
  formatSearchProfileSummary,
  getSearchProfileFromMetadata,
  type CatalogSearchProfile,
} from '@/lib/catalog-search-profile';

type Props = {
  catalogId: string;
  metadata: Record<string, unknown>;
  title: string;
  categorySlug: string;
  description?: string;
  onProfileUpdated: (metadata: Record<string, unknown>, profile: CatalogSearchProfile) => void;
  onError: (message: string) => void;
};

export default function CatalogSearchProfilePanel({
  catalogId,
  metadata,
  title,
  categorySlug,
  description,
  onProfileUpdated,
  onError,
}: Props) {
  const [loading, setLoading] = useState(false);
  const profile = getSearchProfileFromMetadata(metadata);

  const runEnrich = async (force: boolean) => {
    if (!title.trim()) {
      onError('ابتدا عنوان را وارد کنید');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/catalog-items/enrich-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ catalogIds: [catalogId], force }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.results?.[0]?.error || 'خطا در تولید پروفایل');
      }
      const result = data.results?.[0];
      if (!result?.profile) {
        throw new Error(result?.error || 'پروفایل ساخته نشد');
      }
      const merged = {
        ...metadata,
        searchProfile: result.profile,
      };
      onProfileUpdated(merged, result.profile);
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'خطا');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-violet-100 bg-violet-50/40 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-gray-900">پروفایل جستجو</h3>
          <p className="text-xs text-gray-600 mt-1">
            برای جستجوی هوشمند (ژانر فرعی، تم، کلیدواژه) — با AI تولید می‌شود.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void runEnrich(!!profile)}
          disabled={loading}
          className="inline-flex items-center gap-1.5 shrink-0 px-3 py-1.5 text-xs font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          {profile ? 'بازسازی' : 'تولید با AI'}
        </button>
      </div>

      {profile ? (
        <div className="space-y-2">
          <p className="text-xs text-violet-900 font-medium">{formatSearchProfileSummary(profile)}</p>
          <div className="flex flex-wrap gap-1.5">
            {[...profile.genres, ...profile.subgenres, ...profile.themes, ...profile.keywords]
              .slice(0, 12)
              .map((tag) => (
                <span
                  key={tag}
                  className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-white border border-violet-200 text-violet-800"
                >
                  {tag}
                </span>
              ))}
          </div>
          {profile.enrichedAt && (
            <p className="text-[10px] text-gray-500">
              آخرین به‌روزرسانی:{' '}
              {new Date(profile.enrichedAt).toLocaleDateString('fa-IR', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          )}
        </div>
      ) : (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-2">
          هنوز پروفایل جستجو ندارد — جستجوی «اکشن»، «سرقت» و … ممکن است این آیتم را پیدا نکند.
        </p>
      )}
    </div>
  );
}
