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
              <ChevronLeft className="mx-0.5 size-4 shrink-0 text-muted-foreground/50" aria-hidden />
            )}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="inline-flex min-h-11 max-w-32 items-center truncate text-xs sm:max-w-40"
              >
                <span className="truncate text-muted-foreground">{item.label}</span>
              </Link>
            ) : (
              <span
                className={`inline-flex min-h-11 max-w-48 items-center truncate text-xs sm:max-w-64 ${
                  isLast ? 'font-medium text-foreground' : 'text-muted-foreground'
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
