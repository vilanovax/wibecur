'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
}

interface Tag {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  icon: string | null;
}

// کتگوری‌هایی که سلیقه‌محور هستن و ژانرشون مهمه
const TASTE_DRIVEN_SLUGS = ['movies', 'books', 'podcast'];

interface OnboardingClientProps {
  userName: string | null;
}

export default function OnboardingClient({ userName }: OnboardingClientProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/onboarding');
        const data = await res.json();
        if (data.success) {
          setCategories(data.data.categories);
          setTags(data.data.tags);
        }
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        // Remove tags of this category too
        const categoryTags = tags.filter((t) => t.categoryId === id);
        setSelectedTags((prevTags) => {
          const nextTags = new Set(prevTags);
          categoryTags.forEach((t) => nextTags.delete(t.id));
          return nextTags;
        });
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleTag = (id: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // کتگوری‌های انتخاب‌شده که سلیقه‌محور هستن (فیلم، کتاب، پادکست)
  const selectedTasteDriven = categories.filter(
    (c) => selectedCategories.has(c.id) && TASTE_DRIVEN_SLUGS.includes(c.slug)
  );

  const hasStep2 = selectedTasteDriven.length > 0;

  const handleNext = () => {
    if (step === 1 && hasStep2) {
      setStep(2);
    } else {
      handleSave();
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryIds: Array.from(selectedCategories),
          tagIds: Array.from(selectedTags),
        }),
      });
      const data = await res.json();
      if (data.success) {
        router.push('/');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0f0f1a] via-[#1a1a2e] to-[#16213e] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#7C3AED]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f0f1a] via-[#1a1a2e] to-[#16213e] text-white" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gradient-to-b from-[#0f0f1a] to-transparent pt-safe">
        <div className="px-6 pt-8 pb-4">
          {/* Progress */}
          <div className="flex gap-2 mb-6">
            <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-[#7C3AED]' : 'bg-white/20'}`} />
            <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-[#7C3AED]' : 'bg-white/20'}`} />
          </div>

          <h1 className="text-2xl font-black mb-2">
            {step === 1
              ? userName
                ? `${userName}، چه چیزایی دوست داری؟`
                : 'چه چیزایی دوست داری؟'
              : 'سلیقه‌تو بیشتر بگو!'}
          </h1>
          <p className="text-white/60 text-sm leading-relaxed">
            {step === 1
              ? 'انتخاب کن تا لیست‌های باحال‌تری بهت پیشنهاد بدیم. هر چقدر بیشتر انتخاب کنی، پیشنهادها بهتر میشن!'
              : 'ژانرهایی که بیشتر دوست داری رو انتخاب کن — فقط داریم سلیقه‌سنجی می‌کنیم!'}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-32">
        {step === 1 ? (
          /* مرحله ۱: انتخاب کتگوری‌ها */
          <div className="flex flex-wrap gap-3 justify-center pt-4">
            {categories.map((cat) => {
              const isSelected = selectedCategories.has(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={`
                    relative flex items-center gap-2.5 px-5 py-3.5 rounded-2xl
                    text-[15px] font-semibold transition-all duration-300
                    ${isSelected
                      ? 'scale-105 shadow-lg shadow-purple-500/30'
                      : 'hover:scale-[1.02] active:scale-95'
                    }
                  `}
                  style={{
                    background: isSelected
                      ? `linear-gradient(135deg, ${cat.color}, ${cat.color}dd)`
                      : 'rgba(255,255,255,0.08)',
                    border: isSelected
                      ? `2px solid ${cat.color}`
                      : '2px solid rgba(255,255,255,0.12)',
                    color: isSelected ? 'white' : 'rgba(255,255,255,0.8)',
                  }}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <span>{cat.name}</span>
                  {isSelected && (
                    <span className="absolute -top-1.5 -left-1.5 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                      <span className="text-[#7C3AED] text-xs font-bold">✓</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          /* مرحله ۲: انتخاب ژانرها بر اساس کتگوری‌های سلیقه‌محور */
          <div className="space-y-8 pt-4">
            {selectedTasteDriven.map((cat) => {
              const catTags = tags.filter((t) => t.categoryId === cat.id);
              if (catTags.length === 0) return null;

              return (
                <div key={cat.id}>
                  <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <span>{cat.icon}</span>
                    <span>ژانرهای {cat.name}</span>
                  </h3>
                  <div className="flex flex-wrap gap-2.5">
                    {catTags.map((tag) => {
                      const isSelected = selectedTags.has(tag.id);
                      return (
                        <button
                          key={tag.id}
                          onClick={() => toggleTag(tag.id)}
                          className={`
                            flex items-center gap-2 px-4 py-2.5 rounded-xl
                            text-sm font-medium transition-all duration-200
                            ${isSelected
                              ? 'scale-105'
                              : 'hover:scale-[1.02] active:scale-95'
                            }
                          `}
                          style={{
                            background: isSelected
                              ? `linear-gradient(135deg, ${cat.color}cc, ${cat.color}88)`
                              : 'rgba(255,255,255,0.08)',
                            border: isSelected
                              ? `1.5px solid ${cat.color}`
                              : '1.5px solid rgba(255,255,255,0.1)',
                            color: isSelected ? 'white' : 'rgba(255,255,255,0.7)',
                          }}
                        >
                          {tag.icon && <span>{tag.icon}</span>}
                          <span>{tag.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 inset-x-0 z-50 bg-gradient-to-t from-[#0f0f1a] via-[#0f0f1a] to-transparent pt-8 pb-safe">
        <div className="px-6 pb-6 flex gap-3">
          {step === 2 && (
            <button
              onClick={() => setStep(1)}
              className="px-6 py-3.5 rounded-2xl text-sm font-semibold bg-white/10 text-white/80 hover:bg-white/15 transition-colors"
            >
              قبلی
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={selectedCategories.size === 0 || isSaving}
            className={`
              flex-1 py-3.5 rounded-2xl text-sm font-bold transition-all
              flex items-center justify-center gap-2
              ${selectedCategories.size > 0
                ? 'bg-gradient-to-l from-[#7C3AED] to-[#6366F1] text-white shadow-lg shadow-purple-500/30 hover:shadow-xl active:scale-[0.98]'
                : 'bg-white/10 text-white/30 cursor-not-allowed'
              }
            `}
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : step === 1 && hasStep2 ? (
              'بعدی'
            ) : (
              'شروع کن! 🚀'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
