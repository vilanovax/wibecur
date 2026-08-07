'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Shield,
  Lock,
  Check,
  CheckCircle2,
  AlertTriangle,
  Megaphone,
  FolderX,
  FileWarning,
  MessageCircle,
  Loader2,
} from 'lucide-react';
import BottomSheet from '@/components/mobile/shared/BottomSheet';

const REPORT_REASONS = [
  {
    id: 'misleading',
    label: 'اطلاعات گمراه‌کننده',
    description: 'عنوان یا توضیحات با محتوا هم‌خوان نیست',
    icon: FileWarning,
  },
  {
    id: 'offensive',
    label: 'محتوای نامناسب',
    description: 'زبان توهین‌آمیز یا آزاردهنده',
    icon: AlertTriangle,
  },
  {
    id: 'spam',
    label: 'اسپم یا تبلیغ',
    description: 'لیست تبلیغاتی یا غیرمرتبط',
    icon: Megaphone,
  },
  {
    id: 'wrong_category',
    label: 'دسته‌بندی اشتباه',
    description: 'لیست در دسته نامناسب قرار دارد',
    icon: FolderX,
  },
  {
    id: 'other',
    label: 'سایر',
    description: 'دلیل دیگری داری',
    icon: MessageCircle,
  },
] as const;

const DESCRIPTION_MAX_LENGTH = 300;

interface ListReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  listId: string;
  onReportSuccess?: () => void;
}

export default function ListReportModal({
  isOpen,
  onClose,
  listId,
  onReportSuccess,
}: ListReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const resetForm = useCallback(() => {
    setSelectedReason(null);
    setDescription('');
    setError(null);
    setIsSuccess(false);
    setIsSubmitting(false);
  }, []);

  useEffect(() => {
    if (isOpen) resetForm();
  }, [isOpen, resetForm]);

  useEffect(() => {
    if (selectedReason === 'other') {
      requestAnimationFrame(() => descriptionRef.current?.focus());
    }
  }, [selectedReason]);

  const canSubmit =
    !!selectedReason &&
    !isSubmitting &&
    (selectedReason !== 'other' || description.trim().length > 0);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/lists/${listId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: selectedReason,
          description: selectedReason === 'other' ? description.trim() : undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'خطا در ثبت گزارش');
      }
      setIsSuccess(true);
      onReportSuccess?.();
      window.setTimeout(() => onClose(), 1400);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در ثبت گزارش');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={() => !isSubmitting && onClose()}
      title="گزارش لیست"
      subtitle="گزارش شما ناشناس بررسی می‌شود."
      maxHeight="88vh"
    >
      {isSuccess ? (
        <div className="flex flex-col items-center justify-center px-6 py-10">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-9 w-9 text-green-600" strokeWidth={2} />
          </div>
          <p className="text-center text-base font-medium text-foreground">گزارش ثبت شد</p>
          <p className="mt-1 text-center text-sm text-wibe-secondary">از کمکت ممنونیم.</p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-3 pt-1">
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50/70 px-3 py-2.5">
              <Shield className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden />
              <p className="text-xs leading-relaxed text-wibe-secondary">
                اگر این لیست مشکل دارد، به ما بگو تا وایب برای همه سالم بماند.
              </p>
            </div>

            <p className="mb-2.5 text-sm font-medium text-foreground">دلیل گزارش</p>
            <div className="space-y-2" role="radiogroup" aria-label="دلیل گزارش">
              {REPORT_REASONS.map((reason) => {
                const Icon = reason.icon;
                const isSelected = selectedReason === reason.id;
                return (
                  <button
                    key={reason.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => {
                      setSelectedReason(reason.id);
                      setError(null);
                      if (reason.id !== 'other') setDescription('');
                    }}
                    disabled={isSubmitting}
                    className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-right transition-colors disabled:opacity-50 ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-wibe bg-wibe-card hover:border-gray-300'
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        isSelected ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-wibe-secondary'
                      }`}
                    >
                      <Icon className="h-4 w-4" strokeWidth={2} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-foreground">{reason.label}</div>
                      <div className="mt-0.5 text-xs text-wibe-secondary">{reason.description}</div>
                    </div>
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                        isSelected ? 'border-primary bg-primary' : 'border-gray-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedReason === 'other' && (
              <div className="mt-3">
                <label htmlFor="list-report-desc" className="mb-1.5 block text-sm font-medium text-foreground">
                  توضیح کوتاه <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="list-report-desc"
                  ref={descriptionRef}
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, DESCRIPTION_MAX_LENGTH))}
                  rows={3}
                  placeholder="مثلاً: عنوان لیست با آیتم‌ها مطابقت ندارد..."
                  disabled={isSubmitting}
                  className="w-full resize-none rounded-xl border border-wibe bg-gray-50/50 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:opacity-50"
                />
              </div>
            )}

            {error && (
              <div className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-wibe bg-wibe-card px-4 pb-6 pt-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  در حال ارسال…
                </>
              ) : (
                'ارسال گزارش'
              )}
            </button>
            <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-wibe-secondary">
              <Lock className="h-3.5 w-3.5" aria-hidden />
              <span>هویت تو برای سازنده لیست نمایش داده نمی‌شود.</span>
            </div>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
