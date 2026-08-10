import PageBreadcrumb from '@/components/shared/PageBreadcrumb';
import JsonLdBreadcrumb from '@/components/shared/JsonLdBreadcrumb';
import { uiBreadcrumbToSchema } from '@/lib/breadcrumb-schema';

type ItemPageBreadcrumbProps = {
  category: { name: string; slug: string } | null;
  listTitle: string;
  listSlug: string;
  itemTitle: string;
};

export default function ItemPageBreadcrumb({
  category,
  listTitle,
  listSlug,
  itemTitle,
}: ItemPageBreadcrumbProps) {
  const breadcrumbItems = [
    { label: 'خانه', href: '/' },
    ...(category
      ? [{ label: category.name, href: `/categories/${category.slug}` }]
      : []),
    { label: listTitle, href: `/lists/${listSlug}` },
    { label: itemTitle?.trim() || 'آیتم' },
  ];

  return (
    <>
      <JsonLdBreadcrumb items={uiBreadcrumbToSchema(breadcrumbItems)} />
      <div className="hidden px-4 pt-2 lg:block lg:px-0 lg:pt-3">
        <PageBreadcrumb items={breadcrumbItems} />
      </div>
    </>
  );
}
