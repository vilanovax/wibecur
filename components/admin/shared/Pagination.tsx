'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
  searchParams?: Record<string, string>;
}

export default function Pagination({
  currentPage,
  totalPages,
  basePath,
  searchParams = {},
}: PaginationProps) {
  const searchParamsObj = useSearchParams();

  const createUrl = (page: number) => {
    const params = new URLSearchParams(searchParamsObj.toString());
    params.set('page', page.toString());
    
    // Keep existing search params
    Object.entries(searchParams).forEach(([key, value]) => {
      params.set(key, value);
    });

    return `${basePath}?${params.toString()}`;
  };

  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      {/* Previous Button */}
      <Link
        href={createUrl(currentPage - 1)}
        className={`px-4 py-2 rounded-lg border transition-colors ${
          currentPage === 1
            ? 'border-gray-200 text-gray-400 cursor-not-allowed pointer-events-none'
            : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-primary'
        }`}
      >
        قبلی
      </Link>

      {/* Page Numbers */}
      <div className="flex items-center gap-2">
        {getPageNumbers().map((page, index) => {
          if (page === 'ellipsis') {
            return (
              <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
                ...
              </span>
            );
          }

          const pageNum = page as number;
          const isActive = pageNum === currentPage;

          return (
            <Link
              key={pageNum}
              href={createUrl(pageNum)}
              className={`min-w-[40px] px-3 py-2 text-center rounded-lg border transition-colors ${
                isActive
                  ? 'bg-primary text-white border-primary'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-primary'
              }`}
            >
              {pageNum}
            </Link>
          );
        })}
      </div>

      {/* Next Button */}
      <Link
        href={createUrl(currentPage + 1)}
        className={`px-4 py-2 rounded-lg border transition-colors ${
          currentPage === totalPages
            ? 'border-gray-200 text-gray-400 cursor-not-allowed pointer-events-none'
            : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-primary'
        }`}
      >
        بعدی
      </Link>

      {/* Page Info */}
      <div className="mr-4 text-sm text-gray-600">
        صفحه {currentPage} از {totalPages}
      </div>
    </div>
  );
}

