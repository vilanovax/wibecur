import { getBaseUrl } from '@/lib/seo';

export type BreadcrumbSchemaItem = {
  name: string;
  /** مسیر نسبی — برای آیتم آخر optional */
  path?: string;
};

/** JSON-LD BreadcrumbList — https://schema.org/BreadcrumbList */
export function buildBreadcrumbJsonLd(
  items: BreadcrumbSchemaItem[],
  baseUrl?: string
): Record<string, unknown> {
  const base = (baseUrl ?? getBaseUrl()).replace(/\/$/, '');

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => {
      const isLast = index === items.length - 1;
      const entry: Record<string, unknown> = {
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
      };

      if (!isLast && item.path) {
        const path = item.path.startsWith('/') ? item.path : `/${item.path}`;
        entry.item = `${base}${path}`;
      }

      return entry;
    }),
  };
}

/** تبدیل آیتم‌های UI breadcrumb به schema */
export function uiBreadcrumbToSchema(
  items: Array<{ label: string; href?: string }>
): BreadcrumbSchemaItem[] {
  return items.map((item) => ({
    name: item.label,
    path: item.href,
  }));
}
