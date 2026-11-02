import { getCoverDisplayFlags } from '@/lib/admin/category-form-constants';

type ScrimDirection = 't' | 'l';

type Props = {
  /** ui | baked | photo — از تنظیمات دسته */
  coverDisplayMode?: string | null;
  title: string;
  /** کلاس تیتر روی کاور */
  titleClassName?: string;
  /** لایهٔ گرادیان — پیش‌فرض از پایین */
  scrimDirection?: ScrimDirection;
  /** محتوای اضافه زیر عنوان روی کاور (مثلاً آمار) */
  onCoverExtra?: React.ReactNode;
  /** کلاس پدینگ ظرف عنوان روی کاور */
  onCoverClassName?: string;
};

const SCRIM: Record<ScrimDirection, string> = {
  t: 'pointer-events-none absolute inset-0 bg-linear-to-t from-foreground/85 via-foreground/35 to-transparent',
  l: 'pointer-events-none absolute inset-0 bg-linear-to-l from-foreground/85 via-foreground/45 to-foreground/15',
};

/**
 * لایهٔ عنوان/سایه روی کاور لیست — فقط حالت ui.
 * عنوان زیر عکس (photo) را والد بیرون از overflow رندر کند.
 */
export default function ListCoverTitleOverlay({
  coverDisplayMode,
  title,
  titleClassName = 'line-clamp-2 wibe-small font-semibold text-background',
  scrimDirection = 't',
  onCoverExtra,
  onCoverClassName = 'absolute inset-x-0 bottom-0 z-10 p-2.5 text-start lg:p-3',
}: Props) {
  const { showScrim, showTitleOnCover } = getCoverDisplayFlags(coverDisplayMode);

  return (
    <>
      {showScrim ? <div className={SCRIM[scrimDirection]} aria-hidden /> : null}
      {showTitleOnCover ? (
        <div className={onCoverClassName}>
          <h3 className={titleClassName}>{title}</h3>
          {onCoverExtra}
        </div>
      ) : null}
    </>
  );
}
