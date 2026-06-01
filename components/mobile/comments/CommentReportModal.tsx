'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Shield,
  Lock,
  Check,
  CheckCircle2,
  AlertTriangle,
  Megaphone,
  MessageCircleOff,
  MessageCircle,
  Loader2,
} from 'lucide-react';
import BottomSheet from '@/components/mobile/shared/BottomSheet';

const REPORT_REASONS = [
  {
    id: 'offensive',
    label: 'محتوای توهین‌آمیز',
    description: 'زبان نامناسب یا توهین‌آمیز',
    icon: AlertTriangle,
  },
  {
    id: 'spam',
    label: 'اسپم یا تبلیغ',
    description: 'تبلیغ یا محتوای نامرتبط',
    icon: Megaphone,
  },
  {
    id: 'harassment',
    label: 'آزار یا تهدید',
    description: 'آزار کاربران یا تهدید',
    icon: MessageCircleOff,
  },
  {
    id: 'off_topic',
    label: 'نامرتبط با گفتگو',
    description: 'ربطی به لیست یا موضوع ندارد',
    icon: MessageCircle,
  },
  {
    id: 'other',
    label: 'سایر',
    description: 'دلیل دیگری دارید',
    icon: MessageCircle,
  },
] as const;

const DESCRIPTION_MAX_LENGTH = 300;

interface CommentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** مسیر API — مثلاً `/api/lists/comments/[id]/report` */
  reportEndpoint: string;
  onReportSuccess?: () => void;
}

export default function CommentReportModal({
  isOpen,
  onClose,
  reportEndpoint,
  onReportSuccess,
}: CommentReportModalProps) {
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
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  useEffect(() => {
    if (selectedReason === 'other') {
      requestAnimationFrame(() => descriptionRef.current?.focus());
    }
  }, [selectedReason]);

  const selectedReasonMeta = REPORT_REASONS.find((r) => r.id === selectedReason);

  const canSubmit =
    !!selectedReason &&
    !isSubmitting &&
    (selectedReason !== 'other' || description.trim().length > 0);

  const handleSelectReason = (reasonId: string) => {
    if (isSubmitting) return;
    setSelectedReason(reasonId);
    setError(null);
    if (reasonId !== 'other') {
      setDescription('');
    }
  };

  const handleSubmit = async () => {
    if (!selectedReason || !selectedReasonMeta) {
      setError('لطفاً یک دلیل انتخاب کنید');
      return;
    }
    if (selectedReason === 'other' && !description.trim()) {
      setError('لطفاً توضیح کوتاهی بنویسید');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(reportEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: selectedReasonMeta.label,
          description: selectedReason === 'other' ? description.trim() : undefined,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            (response.status === 401 ? 'برای گزارش نظر وارد شو' : 'خطا در ثبت گزارش')
        );
      }

      setIsSuccess(true);
      onReportSuccess?.();
      window.setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در ثبت گزارش');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      title="گزارش نظر"
      subtitle="گزارش شما ناشناس بررسی می‌شود."
      maxHeight="88vh"
      zIndex={70}
    >
      {isSuccess ? (
        <div className="flex flex-col items-center justify-center px-6 py-10 animate-in fade-in zoom-in-95 duration-300">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-9 w-9 text-green-600" strokeWidth={2} />
          </div>
          <p className="text-center text-base font-medium leading-relaxed text-foreground">
            گزارش ثبت شد
          </p>
          <p className="mt-1 text-center text-sm text-wibe-secondary">
            از کمکت ممنونیم — تیم ما بررسی می‌کند.
          </p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-3 pt-1">
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50/70 px-3 py-2.5">
              <Shield className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden />
              <p className="text-xs leading-relaxed text-wibe-secondary">
                اگر این نظر مشکل دارد، دلیلش را بگو تا گفتگو سالم بماند.
              </p>
            </div>

            <p className="mb-2.5 text-sm font-medium text-foreground">دلیل گزارش</p>

            <div className="space-y-2" role="radiogroup" aria-label="دلیل گزارش نظر">
              {REPORT_REASONS.map((reason) => {
                const Icon = reason.icon;
                const isSelected = selectedReason === reason.id;
                return (
                  <button
                    key={reason.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => handleSelectReason(reason.id)}
                    disabled={isSubmitting}
                    className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-right transition-all duration-150 disabled:opacity-50 ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-wibe bg-wibe-card hover:border-gray-300'
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                        isSelected ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <Icon className="h-4 w-4" strokeWidth={2} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-foreground">{reason.label}</div>
                      <div className="mt-0.5 text-xs text-wibe-secondary">{reason.description}</div>
                    </div>
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                        isSelected ? 'border-primary bg-primary' : 'border-gray-300 bg-white'
                      }`}
                      aria-hidden
                    >
                      {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedReason === 'other' && (
              <div className="mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
                <label htmlFor="comment-report-description" className="mb-1.5 block text-sm font-medium text-foreground">
                  توضیح کوتاه <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="comment-report-description"
                  ref={descriptionRef}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value.slice(0, DESCRIPTION_MAX_LENGTH));
                    if (error) setError(null);
                  }}
                  rows={3}
                  placeholder="مثلاً: شامل توهین مستقیم به کاربران است..."
                  disabled={isSubmitting}
                  className="w-full resize-none rounded-xl border border-wibe bg-gray-50/50 px-3 py-2.5 text-sm transition-colors focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                />
                <p className="mt-1 text-left text-xs tabular-nums text-gray-400">
                  {description.length.toLocaleString('fa-IR')}/
                  {DESCRIPTION_MAX_LENGTH.toLocaleString('fa-IR')}
                </p>
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
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>در حال ارسال...</span>
                </>
              ) : (
                <span>ارسال گزارش</span>
              )}
            </button>
            <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-gray-400">
              <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>هویت شما برای نویسنده نظر نمایش داده نمی‌شود.</span>
            </div>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
