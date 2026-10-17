'use client';

import type { CuratedCategory } from '@/types/curated';
import { fa } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CategoryChipsProps {
  categories: CuratedCategory[];
  selectedId: string;
  onSelect: (id: string) => void;
  count?: number;
}

export default function CategoryChips({
  categories,
  selectedId,
  onSelect,
  count,
}: CategoryChipsProps) {
  if (categories.length === 0) return null;
  const value = categories.some((cat) => cat.id === selectedId) ? selectedId : categories[0].id;

  return (
    <div className="bg-muted/40 px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1 overflow-x-auto">
          <Tabs value={value} defaultValue={value} onValueChange={onSelect} variant="segmented">
            <TabsList aria-label="دسته‌های اکسپلور" className="w-max">
              {categories.map((cat) => (
                <TabsTrigger key={cat.id} value={cat.id} className="h-11 gap-1.5 px-3">
                  <span aria-hidden>{cat.icon}</span>
                  {cat.title}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        {count !== undefined && (
          <span className="shrink-0 text-sm text-muted-foreground">{fa(count)} لیست</span>
        )}
      </div>
    </div>
  );
}
