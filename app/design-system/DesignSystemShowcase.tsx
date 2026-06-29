'use client';

import { useState } from 'react';
import HorizontalScrollFade from '@/components/shared/HorizontalScrollFade';
import SectionIcon from '@/components/shared/SectionIcon';
import ListRowCompact from '@/components/shared/ListRowCompact';
import WibeButton from '@/components/ui/WibeButton';
import WibeCard from '@/components/ui/WibeCard';
import WibeSection from '@/components/ui/WibeSection';
import { listBadgeLabel, listBadgeSolidClass } from '@/lib/list-badge-styles';
import { brand, semantic, wibe } from '@/lib/design-tokens';

const DEMO_LIST = {
  id: 'demo',
  title: 'بهترین کافه‌های تهران برای آخر هفته',
  slug: 'demo-list',
  coverImage: null,
  saveCount: 128,
  itemCount: 12,
  creator: { name: 'سارا' },
  categories: { icon: '☕', slug: 'cafe' },
};

function Swatch({ name, hex }: { name: string; hex: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-wibe bg-wibe-card p-3">
      <span
        className="h-10 w-10 shrink-0 rounded-lg border border-wibe shadow-sm"
        style={{ backgroundColor: hex }}
        aria-hidden
      />
      <div className="min-w-0">
        <p className="wibe-small font-semibold text-foreground">{name}</p>
        <p className="wibe-caption font-mono text-wibe-secondary">{hex}</p>
      </div>
    </div>
  );
}

function TypeRow({ label, className, sample }: { label: string; className: string; sample: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-wibe/60 py-3 last:border-0 sm:flex-row sm:items-baseline sm:gap-4">
      <code className="wibe-caption shrink-0 text-primary sm:w-28">{label}</code>
      <p className={className}>{sample}</p>
    </div>
  );
}

export default function DesignSystemShowcase() {
  const [chip, setChip] = useState<'a' | 'b'>('a');

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-6 lg:px-0 lg:py-8">
      <header className="space-y-2">
        <h1 className="wibe-h1">Wibe Design System</h1>
        <p className="wibe-body text-wibe-secondary">
          مرجع داخلی توکن‌ها، تایپوگرافی و primitiveهای consumer UI.
        </p>
      </header>

      <WibeSection title="Typography" iconVariant="forYou" headerClassName="px-0">
        <WibeCard padding="md" className="mt-1">
          <TypeRow label="wibe-display" className="wibe-display" sample="نمایش بزرگ" />
          <TypeRow label="wibe-h1" className="wibe-h1" sample="عنوان صفحه" />
          <TypeRow label="wibe-h2" className="wibe-h2" sample="عنوان بخش" />
          <TypeRow label="wibe-h3" className="wibe-h3" sample="عنوان سکشن" />
          <TypeRow label="wibe-body" className="wibe-body" sample="متن بدنه — خوانا و راحت" />
          <TypeRow label="wibe-small" className="wibe-small" sample="متن ثانویه و توضیح" />
          <TypeRow label="wibe-caption" className="wibe-caption" sample="کپشن و متادیتا" />
        </WibeCard>
      </WibeSection>

      <WibeSection title="Colors" iconVariant="saved" headerClassName="px-0">
        <div className="mt-1 grid gap-2 sm:grid-cols-2">
          <Swatch name="primary" hex={brand.primary} />
          <Swatch name="warning / hot" hex={semantic.hot} />
          <Swatch name="success" hex={semantic.success} />
          <Swatch name="danger" hex={semantic.danger} />
          <Swatch name="wibe.surface" hex={wibe.surface} />
          <Swatch name="wibe.border" hex={wibe.border} />
        </div>
      </WibeSection>

      <WibeSection title="Buttons" headerClassName="px-0">
        <div className="mt-1 flex flex-wrap gap-2">
          <WibeButton variant="primary">Primary</WibeButton>
          <WibeButton variant="secondary">Secondary</WibeButton>
          <WibeButton variant="outline">Outline</WibeButton>
          <WibeButton variant="ghost">Ghost</WibeButton>
        </div>
      </WibeSection>

      <WibeSection title="Chips" headerClassName="px-0">
        <div className="mt-1 flex flex-wrap gap-2">
          <button
            type="button"
            className={`wibe-chip ${chip === 'a' ? 'wibe-chip-active' : 'wibe-chip-inactive'}`}
            onClick={() => setChip('a')}
          >
            فعال
          </button>
          <button
            type="button"
            className={`wibe-chip ${chip === 'b' ? 'wibe-chip-active' : 'wibe-chip-inactive'}`}
            onClick={() => setChip('b')}
          >
            غیرفعال
          </button>
        </div>
      </WibeSection>

      <WibeSection title="List badges" iconVariant="trending" headerClassName="px-0">
        <div className="mt-1 flex flex-wrap gap-2">
          {(['trending', 'new', 'featured', 'rising'] as const).map((key) => (
            <span
              key={key}
              className={`rounded-pill px-2.5 py-0.5 wibe-caption font-semibold ${listBadgeSolidClass(key)}`}
            >
              {listBadgeLabel(key)}
            </span>
          ))}
        </div>
      </WibeSection>

      <WibeSection title="Section icons" headerClassName="px-0">
        <div className="mt-1 flex flex-wrap gap-4">
          {(
            ['trending', 'new', 'saved', 'viral', 'rising', 'bookmark', 'forYou', 'curators'] as const
          ).map((variant) => (
            <div key={variant} className="flex items-center gap-2 rounded-lg border border-wibe px-3 py-2">
              <SectionIcon variant={variant} />
              <span className="wibe-caption text-wibe-secondary">{variant}</span>
            </div>
          ))}
        </div>
      </WibeSection>

      <WibeSection title="ListRowCompact" iconVariant="new" headerClassName="px-0">
        <div className="mt-1 max-w-md">
          <ListRowCompact list={DEMO_LIST} />
        </div>
      </WibeSection>

      <WibeSection title="Horizontal scroll fade" headerClassName="px-0">
        <HorizontalScrollFade
          surface="card"
          innerClassName="flex gap-2 pb-1"
          className="mt-1 rounded-xl border border-wibe bg-wibe-card p-3"
        >
          {['فیلم', 'کتاب', 'کافه', 'سفر', 'موسیقی', 'بازی', 'هنر'].map((label) => (
            <span key={label} className="wibe-chip wibe-chip-inactive whitespace-nowrap">
              {label}
            </span>
          ))}
        </HorizontalScrollFade>
      </WibeSection>
    </div>
  );
}
