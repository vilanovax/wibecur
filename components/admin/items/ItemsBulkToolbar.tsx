'use client';

import { useMemo, useState } from 'react';
import { Trash2, EyeOff, Eye, MessageSquareOff, MessageSquare, X, ChevronDown } from 'lucide-react';
import {
  ITEM_BULK_ACTION_LABELS,
  type ItemBulkAction,
} from '@/lib/admin/item-bulk-actions';

type Props = {
  selectedIds: string[];
  selectedTitles: string[];
  onClear: () => void;
  onDone: (message: string) => void;
  onError: (message: string) => void;
};

const ACTION_ICONS: Partial<Record<ItemBulkAction, React.ReactNode>> = {
  delete: <Trash2 className="w-4 h-4" />,
  hide: <EyeOff className="w-4 h-4" />,
  show: <Eye className="w-4 h-4" />,
  'disable-comments': <MessageSquareOff className="w-4 h-4" />,
  'enable-comments': <MessageSquare className="w-4 h-4" />,
};

const ACTIONS: ItemBulkAction[] = [
  'hide',
  'show',
  'disable-comments',
  'enable-comments',
  'delete',
];

export default function ItemsBulkToolbar({
  selectedIds,
  selectedTitles,
  onClear,
  onDone,
  onError,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState<ItemBulkAction | null>(null);
  const [loading, setLoading] = useState(false);

  const count = selectedIds.length;
  const previewTitle = useMemo(() => {
    if (selectedTitles.length === 0) return '';
    if (selectedTitles.length === 1) return selectedTitles[0];
    return `${selectedTitles[0]} و ${(selectedTitles.length - 1).toLocaleString('fa-IR')} مورد دیگر`;
  }, [selectedTitles]);

  if (count === 0) return null;

  const openAction = (action: ItemBulkAction) => {
    setMenuOpen(false);
    setPending(action);
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!pending) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/items/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemIds: selectedIds,
          action: pending,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'عملیات ناموفق بود');
      }
      onDone(data.message || 'انجام شد');
      setConfirmOpen(false);
      setPending(null);
      onClear();
    } catch (e: unknown) {
      onError(e instanceof Error ? e.message : 'خطا');
    } finally {
      setLoading(false);
    }
  };

  const meta = pending ? ITEM_BULK_ACTION_LABELS[pending] : null;

  return (
    <>
      <div className="sticky top-0 z-20 mb-4 rounded-2xl border border-violet-200 bg-violet-50/95 backdrop-blur px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-bold text-violet-900 tabular-nums">
            {count.toLocaleString('fa-IR')} انتخاب
          </span>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-700"
            >
              عملیات گروهی
              <ChevronDown className="w-4 h-4" />
            </button>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                  aria-hidden
                />
                <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                  {ACTIONS.map((action) => {
                    const item = ITEM_BULK_ACTION_LABELS[action];
                    return (
                      <button
                        key={action}
                        type="button"
                        onClick={() => openAction(action)}
                        className={`flex w-full items-center gap-2 px-3 py-2.5 text-sm text-right hover:bg-gray-50 ${
                          item.variant === 'danger' ? 'text-red-700' : 'text-[var(--color-text)]'
                        }`}
                      >
                        {ACTION_ICONS[action]}
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 text-sm font-medium text-violet-700 hover:underline mr-auto"
          >
            <X className="w-4 h-4" />
            لغو انتخاب
          </button>
        </div>
      </div>

      {confirmOpen && pending && meta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            aria-hidden
            onClick={() => !loading && setConfirmOpen(false)}
          />
          <div
            className="relative w-full max-w-md rounded-2xl border border-gray-100 bg-white shadow-xl p-5 text-right"
            role="dialog"
            aria-modal="true"
          >
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">{meta.label}</h2>
            <p className="text-sm text-[var(--color-text-muted)] mb-2">{meta.description}</p>
            <p className="text-sm font-semibold text-[var(--color-text)] mb-4 truncate">{previewTitle}</p>
            <p className="text-xs text-[var(--color-text-muted)] mb-5">
              {count.toLocaleString('fa-IR')} آیتم انتخاب شده
            </p>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-[var(--color-text)] text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={() => void handleConfirm()}
                disabled={loading}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 flex items-center gap-2 ${
                  meta.variant === 'danger'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : meta.variant === 'primary'
                      ? 'bg-violet-600 hover:bg-violet-700 text-white'
                      : 'bg-gray-900 hover:bg-gray-800 text-white'
                }`}
              >
                {loading && (
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                )}
                {meta.label}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
