'use client';

import { useState } from 'react';
import { X, ListPlus } from 'lucide-react';

type ListOption = { id: string; title: string; icon?: string | null };

interface AddToListModalProps {
  open: boolean;
  onClose: () => void;
  catalogId: string;
  catalogTitle: string;
  lists: ListOption[];
  existingListIds: string[];
  onSuccess?: (listTitle: string) => void;
}

export default function AddToListModal({
  open,
  onClose,
  catalogId,
  catalogTitle,
  lists,
  existingListIds,
  onSuccess,
}: AddToListModalProps) {
  const [listId, setListId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const available = lists.filter((l) => !existingListIds.includes(l.id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listId) {
      setError('لیست را انتخاب کنید');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/items/add-to-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ catalogItemId: catalogId, listId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا');
      const title = lists.find((l) => l.id === listId)?.title ?? 'لیست';
      onSuccess?.(title);
      onClose();
      setListId('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40" dir="rtl">
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-xl"
        role="dialog"
        aria-labelledby="add-to-list-title"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 id="add-to-list-title" className="font-bold text-gray-900 flex items-center gap-2">
            <ListPlus className="w-5 h-5 text-violet-600" />
            افزودن به لیست
          </h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-sm text-gray-600">
            «<span className="font-semibold text-gray-900">{catalogTitle}</span>» به کدام لیست
            اضافه شود؟
          </p>
          {available.length === 0 ? (
            <p className="text-sm text-amber-800 bg-amber-50 rounded-xl px-3 py-2">
              این آیتم در همهٔ لیست‌های فعال موجود است.
            </p>
          ) : (
            <select
              value={listId}
              onChange={(e) => setListId(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-violet-500/25"
              required
            >
              <option value="">انتخاب لیست…</option>
              {available.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.icon || '📋'} {l.title}
                </option>
              ))}
            </select>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={loading || available.length === 0}
              className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold disabled:opacity-50"
            >
              {loading ? '…' : 'افزودن'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium"
            >
              انصراف
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
