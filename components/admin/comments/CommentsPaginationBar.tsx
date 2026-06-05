'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Pagination from '@/components/admin/shared/Pagination';
import {
  COMMENTS_PAGE_SIZE_OPTIONS,
  type CommentsPageSize,
} from '@/lib/admin/comments-page-size';

type Props = {
  currentPage: number;
  totalPages: number;
  basePath: string;
  searchParams: Record<string, string>;
  pageSize: CommentsPageSize;
  totalCount: number;
};

export default function CommentsPaginationBar({
  currentPage,
  totalPages,
  basePath,
  searchParams,
  pageSize,
  totalCount,
}: Props) {
  const router = useRouter();
  const urlSearchParams = useSearchParams();

  const rangeStart = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalCount);

  const setPageSize = (next: CommentsPageSize) => {
    const params = new URLSearchParams(urlSearchParams.toString());
    if (next === 10) params.delete('pageSize');
    else params.set('pageSize', String(next));
    params.delete('page');
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  };

  return (
    <div
      className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6"
      dir="rtl"
    >
      <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
        <label htmlFor="comments-page-size">تعداد در صفحه:</label>
        <select
          id="comments-page-size"
          value={pageSize}
          onChange={(e) =>
            setPageSize(Number(e.target.value) as CommentsPageSize)
          }
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-sm"
        >
          {COMMENTS_PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n.toLocaleString('fa-IR')}
            </option>
          ))}
        </select>
        {totalCount > 0 && (
          <span className="text-xs hidden sm:inline">
            {rangeStart.toLocaleString('fa-IR')}–{rangeEnd.toLocaleString('fa-IR')} از{' '}
            {totalCount.toLocaleString('fa-IR')}
          </span>
        )}
      </div>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        basePath={basePath}
        searchParams={searchParams}
      />
    </div>
  );
}
