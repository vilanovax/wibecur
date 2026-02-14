'use client';

import { useState } from 'react';
import { X, Shield, Lock, Check, CheckCircle2, FileWarning, AlertTriangle, Megaphone, FolderX, Copy, MessageCircle } from 'lucide-react';
import BottomSheet from '@/components/mobile/shared/BottomSheet';

const REPORT_REASONS = [
  {
    id: 'incorrect_info',
    label: 'اطلاعات نادرست',
    description: 'اطلاعات ارائه‌شده صحیح نیست',
    icon: FileWarning,
  },
  {
    id: 'offensive',
    label: 'محتوای توهین‌آمیز',
    description: 'شامل زبان نامناسب یا آزاردهنده است',
    icon: AlertTriangle,
  },
  {
    id: 'spam',
    label: 'اسپم یا تبلیغ ناخواسته',
    description: 'محتوای تبلیغاتی یا غیرمرتبط',
    icon: Megaphone,
  },
  {
    id: 'wrong_category',
    label: 'دسته‌بندی اشتباه',
    description: 'آیتم در دسته اشتباه قرار دارد',
    icon: FolderX,
  },
  {
    id: 'duplicate',
    label: 'محتوای کپی یا تکراری',
    description: 'این آیتم قبلاً ثبت شده',
    icon: Copy,
  },
  {
    id: 'other',
    label: 'سایر',
    description: 'دلیل دیگری دارید؟',
    icon: MessageCircle,
  },
] as const;

const DESCRIPTION_MAX_LENGTH = 300;

interface ItemReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  onReportSuccess?: () => void;
}

export default function ItemReportModal({
  isOpen,
  onClose,
  itemId,
  onReportSuccess,
}: ItemReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!selectedReason) {
      setError('لطفاً یک دلیل انتخاب کنید');
      return;
    }
    if (selectedReason === 'other' && !description.trim()) {
      setError('لطفاً توضیحات را وارد کنید');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/items/${itemId}/report`, {
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
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در ثبت گزارش');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedReason(null);
      setDescription('');
      setError(null);
      setIsSuccess(false);
      onClose();
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose}>
      <div className="flex flex-col min-h-0 p-6 pb-8 overflow-y-auto">
        {/* ——— 1️⃣ Header (امنیت + ناشناس) ——— */}
        <div className="flex items-start justify-between gap-3 mb-6">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="p-2 rounded-xl bg-red-50 text-red-500 flex-shrink-0" aria-hidden>
              <Shield className="w-6 h-6" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-900 leading-snug">
                کمک کن وایب سالم بماند 🛡
              </h2>
              <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                گزارش شما به صورت ناشناس بررسی می‌شود.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 flex-shrink-0"
            aria-label="بستن"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {!isSuccess ? (
          <>
            {/* ——— 2️⃣ گزینه‌های گزارش (کارت‌استایل) ——— */}
            <div className="space-y-2.5 mb-5">
              {REPORT_REASONS.map((reason) => {
                const Icon = reason.icon;
                const isSelected = selectedReason === reason.id;
                return (
                  <button
                    key={reason.id}
                    type="button"
                    onClick={() => setSelectedReason(reason.id)}
                    disabled={isSubmitting}
                    className={`w-full text-right p-4 rounded-2xl border transition-all duration-200 flex items-center gap-3 disabled:opacity-50 ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-gray-200/80 bg-white hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <span className="flex-shrink-0 w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600">
                      <Icon className="w-5 h-5" strokeWidth={2} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900">{reason.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{reason.description}</div>
                    </div>
                    {isSelected && (
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* ——— توضیحات «سایر» (با انیمیشن باز شدن) ——— */}
            {selectedReason === 'other' && (
              <div className="mb-5 animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  توضیح (اختیاری)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, DESCRIPTION_MAX_LENGTH))}
                  rows={3}
                  placeholder="دلیل خود را در چند کلمه بنویسید..."
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none text-sm transition-colors disabled:opacity-50"
                />
                <p className="text-xs text-gray-400 mt-1 text-left">
                  {description.length}/{DESCRIPTION_MAX_LENGTH}
                </p>
              </div>
            )}

            {/* ——— خطا ——— */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* ——— 3️⃣ CTA ارسال گزارش ——— */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                !selectedReason ||
                (selectedReason === 'other' && !description.trim())
              }
              className="w-full py-4 rounded-2xl font-medium text-white bg-primary hover:bg-primary-dark focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
              {isSubmitting ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>در حال ارسال...</span>
                </>
              ) : (
                <span>ارسال گزارش</span>
              )}
            </button>
          </>
        ) : (
          /* ——— Success State ——— */
          <div className="flex flex-col items-center justify-center py-8 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-9 h-9 text-green-600" strokeWidth={2} />
            </div>
            <p className="text-center text-gray-800 font-medium leading-relaxed">
              گزارش شما ثبت شد. از کمک شما ممنونیم 🌱
            </p>
          </div>
        )}

        {/* ——— 4️⃣ اطمینان حریم خصوصی (همیشه در پایین) ——— */}
        {!isSuccess && (
          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-400">
            <Lock className="w-3.5 h-3.5 flex-shrink-0" />
            <span>هویت شما برای سازنده آیتم نمایش داده نمی‌شود.</span>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
