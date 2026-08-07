import type { HomeListData } from '@/types/home-data';

/** ستون‌های گرید فید دسکتاپ */
export const HOME_DESKTOP_GRID_COLS = 4;

export type FeedSeeAllCell = {
  type: 'see-all';
  href: string;
  label: string;
  description?: string;
};

export type FeedListCell<T extends { id: string }> = {
  type: 'list';
  data: T;
};

export type FeedGridCell<T extends { id: string }> = FeedListCell<T> | FeedSeeAllCell;

export function isSeeAllCell<T extends { id: string }>(
  cell: FeedGridCell<T>
): cell is FeedSeeAllCell {
  return cell.type === 'see-all';
}

export function padHomeFeedLists(
  primary: HomeListData[],
  fallback: HomeListData[],
  maxCount: number,
  excludeIds: Set<string> = new Set()
): HomeListData[] {
  const seen = new Set<string>(excludeIds);
  const out: HomeListData[] = [];

  for (const list of primary) {
    if (seen.has(list.id)) continue;
    seen.add(list.id);
    out.push(list);
    if (out.length >= maxCount) return out;
  }

  for (const list of fallback) {
    if (seen.has(list.id)) continue;
    seen.add(list.id);
    out.push(list);
    if (out.length >= maxCount) break;
  }

  return out;
}

/** ردیف‌های کامل گرید — جلوگیری از یک کارت تنها در آخر (مثلاً ۵ → ۴) */
export function trimToFullGridRows<T extends { id: string }>(
  lists: T[],
  cols: number = HOME_DESKTOP_GRID_COLS
): T[] {
  if (lists.length <= cols) return lists;
  const fullRows = Math.floor(lists.length / cols) * cols;
  return fullRows >= cols ? lists.slice(0, fullRows) : lists.slice(0, cols);
}

type BuildCellsOptions = {
  cols?: number;
  maxLists?: number;
  seeAll?: { href: string; label: string; description?: string };
};

/** سلول‌های گرید دسکتاپ — در صورت نیاز کارت «مشاهده همه» اضافه می‌شود */
export function buildDesktopFeedCells<T extends { id: string }>(
  lists: T[],
  options: BuildCellsOptions = {}
): FeedGridCell<T>[] {
  const cols = options.cols ?? HOME_DESKTOP_GRID_COLS;
  const maxLists = options.maxLists ?? 8;
  const sliced = lists.slice(0, maxLists);

  if (!options.seeAll) {
    return trimToFullGridRows(sliced, cols).map((data) => ({ type: 'list', data }));
  }

  const displayed = trimToFullGridRows(sliced, cols);
  const cells: FeedGridCell<T>[] = displayed.map((data) => ({ type: 'list', data }));

  // فقط وقتی ردیف آخر ناقص است — هرگز ردیف جدید با یک کارت «مشاهده همه»
  const partialRow = cells.length > 0 && cells.length % cols !== 0;

  if (partialRow && options.seeAll) {
    cells.push({ type: 'see-all', ...options.seeAll });
  }

  return cells;
}
