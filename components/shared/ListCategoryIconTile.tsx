import CategoryIcon from '@/components/shared/CategoryIcon';
import { cn } from '@/lib/utils';

type ListCategoryIconTileProps = {
  icon?: string | null;
  iconImage?: string | null;
  /** sm ≈ ۵۶px | md ≈ ۶۴/۸۰ | lg ≈ ۸۰ */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const sizeMap = {
  sm: 'sm' as const,
  md: 'md' as const,
  lg: 'lg' as const,
};

const tileClass: Record<NonNullable<ListCategoryIconTileProps['size']>, string> = {
  sm: 'size-14',
  md: 'size-16 lg:size-20',
  lg: 'size-20',
};

/**
 * کاشی آیکون دسته برای ردیف‌های فشرده —
 * تصویر گرافیکی یا ایموجی پشتیبان.
 */
export default function ListCategoryIconTile({
  icon,
  iconImage,
  size = 'md',
  className,
}: ListCategoryIconTileProps) {
  return (
    <CategoryIcon
      icon={icon}
      iconImage={iconImage}
      size={sizeMap[size]}
      className={cn(tileClass[size], 'text-2xl lg:text-3xl', className)}
    />
  );
}
