'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { X, Share2, Eye, Star, Heart, TrendingUp } from 'lucide-react';

export interface AchievementMetrics {
  saves?: number;
  views?: number;
  likes?: number;
  growthPercent?: number;
}

export interface AchievementModel {
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

interface AchievementBottomSheetProps {
  achievement: AchievementModel | null;
  metrics?: AchievementMetrics | null;
  rankingContext?: string | null;
  onClose: () => void;
}

const CATEGORY_GLOW: Record<string, string> = {
  impact: 'from-orange-100/80 via-amber-50/60 to-transparent',
  creation: 'from-purple-100/80 via-violet-50/60 to-transparent',
  community: 'from-emerald-100/80 via-teal-50/60 to-transparent',
  consistency: 'from-blue-100/80 via-sky-50/60 to-transparent',
};

const TIER_LABELS: Record<string, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  elite: 'Elite',
};

function getImpactLevelLabel(category: string, tier: string): string {
  const tierLabel = TIER_LABELS[tier] || tier;
  const catMap: Record<string, string> = {
    creation: 'سطح ساخت',
    impact: 'سطح تاثیر',
    community: 'سطح جامعه',
    consistency: 'سطح پایداری',
  };
  return `${catMap[category] || category} · ${tierLabel}`;
}

export default function AchievementBottomSheet({
  achievement,
  metrics,
  rankingContext,
  onClose,
}: AchievementBottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (achievement) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [!!achievement]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && achievement) onClose();
    };
    if (achievement) document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [achievement, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose();
  };

  if (!achievement) return null;

  const glowClass = CATEGORY_GLOW[achievement.category] || 'from-gray-100/80 to-transparent';
  const impactLabel = getImpactLevelLabel(achievement.category, achievement.tier);
  const hasMetrics = metrics && (metrics.saves ?? metrics.views ?? metrics.likes ?? metrics.growthPercent) !== undefined;
  const formattedDate = achievement.unlockedAt
    ? new Date(achievement.unlockedAt).toLocaleDateString('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' })
    : null;

  const handleShare = () => {
    const text = `دستاورد ${achievement.title} ${achievement.icon} را در وایب باز کردم!`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: achievement.title,
        text,
        url: typeof window !== 'undefined' ? window.location.origin : '',
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text).catch(() => {});
    }
    onClose();
  };

  const sheet = (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[60] flex items-end justify-center"
      onClick={handleBackdropClick}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md animate-in fade-in duration-200" />

      <div
        ref={sheetRef}
        dir="rtl"
        className="relative bg-white rounded-t-3xl shadow-2xl w-full max-w-md animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-8 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* 1️⃣ Header Section */}
        <div className="flex items-start justify-between gap-3 px-5 pt-2 pb-4 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-[22px] font-bold text-gray-900 leading-tight">
              {achievement.title} {achievement.icon}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">{impactLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors flex-shrink-0"
            aria-label="بستن"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-6 space-y-6">
          {/* 2️⃣ Hero Badge Section */}
          <div
            className={`flex flex-col items-center py-8 rounded-2xl bg-gradient-to-b ${glowClass}`}
          >
            <div
              className="w-[88px] h-[88px] rounded-full flex items-center justify-center bg-white/80 shadow-lg animate-in zoom-in-95 duration-300"
              style={{ animationFillMode: 'both' }}
            >
              <span
                className={`text-5xl select-none ${achievement.unlocked ? '' : 'grayscale opacity-60'}`}
              >
                {achievement.unlocked ? achievement.icon : (achievement.isSecret ? '?' : '🔒')}
              </span>
            </div>
            <p className="font-bold text-gray-900 mt-4 text-base">باز شد!</p>
            <p className="text-sm text-gray-600 mt-0.5 text-center max-w-[280px]">
              {achievement.description}
            </p>
          </div>

          {/* 3️⃣ Impact Metrics Card */}
          {hasMetrics && (
            <div className="rounded-2xl bg-gray-50/80 border border-gray-100 p-4">
              <div className="grid grid-cols-2 gap-4">
                {typeof metrics!.views === 'number' && (
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-lg font-bold text-gray-900">{metrics!.views}</p>
                      <p className="text-xs text-gray-500">بازدید</p>
                    </div>
                  </div>
                )}
                {typeof metrics!.saves === 'number' && (
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500" />
                    <div>
                      <p className="text-lg font-bold text-gray-900">{metrics!.saves}</p>
                      <p className="text-xs text-gray-500">ذخیره</p>
                    </div>
                  </div>
                )}
                {typeof metrics!.likes === 'number' && (
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-rose-500" />
                    <div>
                      <p className="text-lg font-bold text-gray-900">{metrics!.likes}</p>
                      <p className="text-xs text-gray-500">لایک</p>
                    </div>
                  </div>
                )}
                {typeof metrics!.growthPercent === 'number' && (
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                    <div>
                      <p className="text-lg font-bold text-gray-900">{metrics!.growthPercent}٪</p>
                      <p className="text-xs text-gray-500">رشد</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4️⃣ Context Line */}
          {rankingContext && (
            <p className="text-sm text-gray-500 text-center">{rankingContext}</p>
          )}

          {/* 5️⃣ Unlock Date */}
          {formattedDate && (
            <p className="text-xs text-gray-400 text-center">باز شده در {formattedDate}</p>
          )}

          {/* 6️⃣ CTA Buttons */}
          <div className="flex flex-col gap-3 pt-2">
            <Link
              href="/leaderboard"
              className="w-full py-3.5 px-5 rounded-[14px] bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-white font-medium text-sm text-center hover:opacity-95 transition-opacity shadow-sm"
              onClick={onClose}
            >
              مشاهده رتبه‌بندی کریتورها
            </Link>
            <button
              type="button"
              onClick={handleShare}
              className="w-full py-3 px-5 rounded-[14px] border-2 border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              اشتراک‌گذاری دستاورد
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(sheet, document.body);
  }
  return sheet;
}
