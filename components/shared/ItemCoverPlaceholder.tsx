import {
  inferCategorySlugFromTitle,
  pickCategoryCoverGradient,
} from '@/lib/category-cover-images';

export type ItemCoverPlaceholderState = 'idle' | 'loading' | 'empty';

export type ItemCoverLayout = 'grid' | 'list' | 'default';

function getTitleInitial(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) return '؟';
  const stripped = trimmed.replace(/^فیلم\s+/u, '').trim() || trimmed;
  return stripped.charAt(0);
}

export function getItemCoverPlaceholderGradient(
  title: string,
  categorySlug?: string | null,
  state: ItemCoverPlaceholderState = 'idle'
): string {
  if (state === 'idle' || state === 'loading') {
    return 'from-slate-200 via-slate-100 to-slate-200';
  }
  const slug = categorySlug ?? inferCategorySlugFromTitle(title) ?? 'default';
  return pickCategoryCoverGradient(slug, title);
}

interface ItemCoverPlaceholderProps {
  title: string;
  categorySlug?: string | null;
  fallbackIcon?: string;
  state?: ItemCoverPlaceholderState;
  layout?: ItemCoverLayout;
  className?: string;
  /** برای screen readers */
  ariaLabel?: string;
}

export default function ItemCoverPlaceholder({
  title,
  categorySlug,
  fallbackIcon = '📋',
  state = 'idle',
  layout = 'default',
  className = '',
  ariaLabel,
}: ItemCoverPlaceholderProps) {
  const gradient = getItemCoverPlaceholderGradient(title, categorySlug, state);
  const initial = getTitleInitial(title);
  const showShimmer = state === 'idle' || state === 'loading';
  const isGrid = layout === 'grid';

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br ${gradient} ${className}`}
      aria-hidden={!ariaLabel}
      aria-label={ariaLabel}
      role={ariaLabel ? 'img' : undefined}
    >
      {showShimmer && (
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.45)_45%,rgba(255,255,255,0.55)_55%,transparent_100%)] bg-[length:220%_100%] animate-shimmer"
          aria-hidden
        />
      )}

      <div
        className={`absolute inset-0 flex flex-col items-center justify-center ${
          isGrid ? 'gap-2' : 'gap-1'
        }`}
      >
        {state === 'empty' ? (
          isGrid ? (
            <>
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/12 text-lg font-bold text-white/95 shadow-sm backdrop-blur-[2px] ring-1 ring-white/20">
                {initial}
              </span>
              <span className="max-w-[85%] truncate px-2 text-center wibe-caption font-medium text-white/75">
                {title}
              </span>
            </>
          ) : (
            <>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/10 text-sm font-bold text-white/90">
                {initial}
              </span>
              <span className="text-lg opacity-70">{fallbackIcon}</span>
            </>
          )
        ) : state === 'loading' && isGrid ? (
          <span className="text-2xl opacity-30 grayscale">{fallbackIcon}</span>
        ) : (
          <span
            className={`opacity-40 grayscale ${
              isGrid ? 'text-3xl' : layout === 'list' ? 'text-lg' : 'text-2xl sm:text-3xl'
            }`}
          >
            {fallbackIcon}
          </span>
        )}
      </div>
    </div>
  );
}
