import { buildBreadcrumbJsonLd, type BreadcrumbSchemaItem } from '@/lib/breadcrumb-schema';
import { serializeJsonLd } from '@/lib/json-ld';

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
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
    />
  );
}
