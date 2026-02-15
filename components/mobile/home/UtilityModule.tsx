'use client';

import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';

const QUICK_ACTIONS: { icon: string; label: string; category: string }[] = [
  { icon: '🎬', label: 'فیلم آرامش‌بخش', category: 'movie' },
  { icon: '☕', label: 'کافه مناسب قرار', category: 'cafe' },
  { icon: '📚', label: 'کتاب رشد فردی', category: 'book' },
  { icon: '🌍', label: 'مقصد سفر آخر هفته', category: 'travel' },
];

export default function UtilityModule() {
  const router = useRouter();

  const handleQuickAction = (category: string) => {
    router.push(`/user-lists?openCreate=1&category=${category}`);
  };

  return (
    <section className="mb-6 px-4" aria-labelledby="utility-module-title">
      <div
        className="rounded-[24px] overflow-hidden p-6 shadow-vibe-hero"
        style={{
          background: 'linear-gradient(135deg, rgba(129, 140, 248, 0.15) 0%, rgba(139, 92, 246, 0.12) 50%, rgba(236, 72, 153, 0.08) 100%)',
        }}
      >
        <h2
          id="utility-module-title"
          className="text-[18px] font-bold text-gray-900 mb-1 flex items-center gap-2"
        >
          <Sparkles className="w-5 h-5 text-primary" />
          سریع لیست بساز بر اساس حال و هوا
        </h2>
        <p className="text-[13px] text-gray-500 mb-4 leading-[1.5]">
          در کمتر از یک دقیقه، یک لیست جذاب بساز
        </p>

        <div className="grid grid-cols-2 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.category}
              type="button"
              onClick={() => handleQuickAction(action.category)}
              className="
                flex items-center gap-3 p-4 rounded-[18px] text-right
                bg-white/60 hover:bg-white/90 active:scale-[0.98]
                border border-white/80 shadow-sm
                transition-all duration-200 hover:shadow-md
              "
            >
              <span className="text-2xl flex-shrink-0" aria-hidden>
                {action.icon}
              </span>
              <span className="font-semibold text-[14px] text-gray-900 line-clamp-1">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
