'use client';

import { useState, useEffect, useRef } from 'react';
import { Trophy, X } from 'lucide-react';
import Toast from '@/components/shared/Toast';

const CATEGORY_COLORS: Record<string, string> = {
  creation: 'from-[#7C3AED] to-[#9333EA]',
  impact: 'from-amber-500 to-orange-500',
  community: 'from-blue-500 to-indigo-500',
  consistency: 'from-emerald-500 to-green-500',
};

interface AchievementItem {
  id: string;
  code: string;
  title: string;
  description: string;
  category: string;
  tier: string;
  icon: string;
  isSecret: boolean;
  unlocked: boolean;
  unlockedAt: string | null;
}

export default function ProfileAchievementsSection() {
  const [list, setList] = useState<AchievementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AchievementItem | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' } | null>(null);
  const hasShownUnlock = useRef(false);

  useEffect(() => {
    fetch('/api/user/achievements')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data?.achievements)) {
          setList(json.data.achievements);
        }
        const newly = json.data?.newlyUnlocked as { code: string; title: string; icon: string }[] | undefined;
        if (newly?.length > 0 && !hasShownUnlock.current) {
          hasShownUnlock.current = true;
          const first = newly[0];
          setToast({ message: `دستاورد جدید! ${first.title} فعال شد ${first.icon}`, type: 'success' });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading && list.length === 0) {
    return (
      <section className="px-4 mt-6">
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-3" />
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-square rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 mt-6">
      <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 mb-3">
        <Trophy className="w-5 h-5 text-amber-500" />
        دستاوردها
      </h2>
      <div className="grid grid-cols-4 gap-3">
        {list.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setSelected(a)}
            className={`
              flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all
              active:scale-95
              ${a.unlocked
                ? `border-transparent bg-gradient-to-br ${CATEGORY_COLORS[a.category] ?? 'from-gray-400 to-gray-500'} bg-opacity-15`
                : 'border-gray-200 bg-gray-50'
              }
            `}
          >
            <span className="text-2xl mb-1">{a.unlocked ? a.icon : (a.isSecret ? '?' : '🔒')}</span>
            <span className={`text-[10px] font-medium text-center line-clamp-2 ${a.unlocked ? 'text-gray-700' : 'text-gray-400'}`}>
              {a.unlocked || !a.isSecret ? a.title : '???'}
            </span>
          </button>
        ))}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-xl animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{selected.icon}</span>
                <div>
                  <h3 className="font-bold text-gray-900">{selected.title}</h3>
                  <p className="text-xs text-gray-500 capitalize">{selected.category}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="p-2 rounded-full hover:bg-gray-100"
                aria-label="بستن"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{selected.description}</p>
            {selected.unlocked && selected.unlockedAt && (
              <p className="text-xs text-gray-400 mt-3">
                باز شده در {new Date(selected.unlockedAt).toLocaleDateString('fa-IR')}
              </p>
            )}
          </div>
        </div>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </section>
  );
}
