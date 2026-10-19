'use client';

interface ListDetailSubNavProps {
  itemCount: number;
  commentCount: number;
  showSimilar: boolean;
  onItemsClick: () => void;
  onSimilarClick: () => void;
  onCommentsClick: () => void;
}

export default function ListDetailSubNav({
  itemCount,
  commentCount,
  showSimilar,
  onItemsClick,
  onSimilarClick,
  onCommentsClick,
}: ListDetailSubNavProps) {
  const tabs: Array<{ key: string; label: string; onClick: () => void }> = [
    {
      key: 'items',
      label: `آیتم‌ها (${itemCount.toLocaleString('fa-IR')})`,
      onClick: onItemsClick,
    },
  ];

  if (showSimilar) {
    tabs.push({ key: 'similar', label: 'مشابه', onClick: onSimilarClick });
  }

  tabs.push({
    key: 'comments',
    label: `نظرات (${commentCount.toLocaleString('fa-IR')})`,
    onClick: onCommentsClick,
  });

  return (
    <nav
      aria-label="بخش‌های لیست"
      className="sticky top-[6.75rem] z-20 border-b border-wibe/60 bg-wibe-surface/95 backdrop-blur-sm supports-[backdrop-filter]:bg-wibe-surface/90 lg:top-[7rem]"
    >
      <div className="-mx-0.5 flex gap-1 overflow-x-auto px-0.5 py-2 scrollbar-hide lg:mx-0">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={tab.onClick}
            className="shrink-0 rounded-lg px-3.5 py-2 wibe-caption font-medium text-wibe-secondary transition-colors hover:bg-wibe-surface hover:text-foreground active:scale-[0.98]"
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
