import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export type PageBreadcrumbItem = {
  label: string;
  href?: string;
};

interface PageBreadcrumbProps {
  items: PageBreadcrumbItem[];
  className?: string;
}

export default function PageBreadcrumb({ items, className = '' }: PageBreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="مسیر صفحه" className={`flex flex-wrap items-center gap-0.5 ${className}`}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={`${item.label}-${index}`} className="inline-flex min-w-0 max-w-full items-center gap-0.5">
            {index > 0 && (
              <ChevronLeft className="mx-0.5 h-3.5 w-3.5 shrink-0 rotate-180 text-wibe-secondary/50" aria-hidden />
            )}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="max-w-[8rem] truncate wibe-caption text-wibe-secondary transition-colors hover:text-primary sm:max-w-[10rem]"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={`max-w-[12rem] truncate wibe-caption sm:max-w-[16rem] ${
                  isLast ? 'font-medium text-foreground' : 'text-wibe-secondary'
                }`}
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
