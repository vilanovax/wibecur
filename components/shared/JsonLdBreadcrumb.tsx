import { buildBreadcrumbJsonLd, type BreadcrumbSchemaItem } from '@/lib/breadcrumb-schema';

interface JsonLdBreadcrumbProps {
  items: BreadcrumbSchemaItem[];
}

/** اسکریپت JSON-LD breadcrumb — سرور یا کلاینت */
export default function JsonLdBreadcrumb({ items }: JsonLdBreadcrumbProps) {
  if (items.length === 0) return null;

  const jsonLd = buildBreadcrumbJsonLd(items);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
