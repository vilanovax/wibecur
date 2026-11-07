import { cn } from '@/lib/utils';

type ListCategoryIconTileProps = {
  icon?: string | null;
  /** sm ≈ ۵۶px | md ≈ ۶۴/۸۰ | lg ≈ ۸۰ */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const sizeClass: Record<NonNullable<ListCategoryIconTileProps['size']>, string> = {
  sm: 'size-14 text-xl',
  md: 'size-16 text-2xl lg:size-20 lg:text-3xl',
  lg: 'size-20 text-3xl',
};

/**
 * کاشی آیکون دسته برای ردیف‌های فشرده —
 * به‌جای کاور کوچک که متن baked را ناخوانا می‌کند.
 */
export default function ListCategoryIconTile({
  icon,
  size = 'md',
  className,
}: ListCategoryIconTileProps) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-xl bg-muted',
        sizeClass[size],
        className
      )}
      aria-hidden
    >
      <span>{icon?.trim() || '📋'}</span>
    </div>
  );
}
