'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, X } from 'lucide-react';
import Toast, { type ToastType } from '@/components/shared/Toast';
import CommentsSubNav, { type CommentsNavStats } from '@/components/admin/comments/CommentsSubNav';
import BadWordsPageHeader from '@/components/admin/comments/BadWordsPageHeader';
import BadWordsStatsBar from '@/components/admin/comments/BadWordsStatsBar';
import BadWordsTable, { type BadWordRow } from '@/components/admin/comments/BadWordsTable';
import RejectCommentDialog from '@/components/admin/comments/RejectCommentDialog';

interface BadWord extends BadWordRow {
  createdAt: string;
  updatedAt: string;
}

type Stats = {
  totalWords: number;
  activeWords: number;
  totalFiltered: number;
};

interface BadWordsPageClientProps {
  words: BadWord[];
  stats: Stats;
  navStats?: CommentsNavStats;
}

function splitWords(input: string): string[] {
  return input
    .split(/[،,]/)
    .map((w) => w.trim())
    .filter((w) => w.length > 0);
}

export default function BadWordsPageClient({
  words = [],
  stats,
  navStats,
}: BadWordsPageClientProps) {
  const router = useRouter();
  const [newWord, setNewWord] = useState('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BadWordRow | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedWord, setEditedWord] = useState('');
  const [localWords, setLocalWords] = useState<BadWord[]>(words);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(
    null
  );

  useEffect(() => {
    setLocalWords(words);
  }, [words]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    setToast({ message, type });
  }, []);

  const filteredWords = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return localWords;
    return localWords.filter((w) => w.word.toLowerCase().includes(q));
  }, [localWords, search]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim()) return;

    setIsLoading(true);
    try {
      const wordsToAdd = splitWords(newWord);
      if (wordsToAdd.length === 0) {
        showToast('حداقل یک کلمه وارد کنید', 'warning');
        return;
      }

      const results = await Promise.all(
        wordsToAdd.map((word) =>
          fetch('/api/admin/comments/bad-words', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ word }),
          }).then((res) => res.json())
        )
      );

      const errors = results.filter(
        (r) => !r.success && !r.error?.includes('قبلاً')
      );
      if (errors.length > 0 && errors.length === results.length) {
        throw new Error(errors[0].error || 'خطا در افزودن');
      }

      setNewWord('');
      showToast(
        wordsToAdd.length > 1
          ? `${wordsToAdd.length.toLocaleString('fa-IR')} کلمه افزوده شد`
          : 'کلمه افزوده شد',
        'success'
      );
      router.refresh();
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'خطا در افزودن', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEdit = async (id: string) => {
    if (!editedWord.trim()) {
      showToast('کلمه را وارد کنید', 'warning');
      return;
    }

    try {
      const res = await fetch(`/api/admin/comments/bad-words/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: editedWord.trim() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'خطا در ویرایش');

      setLocalWords((prev) =>
        prev.map((w) => (w.id === id ? { ...w, word: editedWord.trim() } : w))
      );
      setEditingId(null);
      setEditedWord('');
      showToast('کلمه ویرایش شد', 'success');
      router.refresh();
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'خطا', 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/comments/bad-words?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'خطا در حذف');
      setLocalWords((prev) => prev.filter((w) => w.id !== id));
      setDeleteTarget(null);
      showToast('کلمه حذف شد', 'success');
      router.refresh();
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'خطا', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div dir="rtl">
      <BadWordsPageHeader />
      {navStats && <CommentsSubNav stats={navStats} />}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={3000}
          onClose={() => setToast(null)}
        />
      )}

      <BadWordsStatsBar
        totalWords={stats.totalWords}
        activeWords={stats.activeWords}
        totalFiltered={stats.totalFiltered}
      />

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 mb-4 space-y-3">
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              placeholder="کلمه جدید — چند کلمه با ویرگول: کلمه۱، کلمه۲"
              className="w-full pr-3 pl-3 py-2 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] focus:ring-2 focus:ring-[var(--primary)]/30"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !newWord.trim()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 shrink-0"
          >
            <Plus className="w-4 h-4" />
            {isLoading ? 'در حال افزودن…' : 'افزودن'}
          </button>
        </form>

        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو در لیست کلمات…"
            className="w-full pr-10 pl-9 py-2 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-[var(--color-border-muted)]"
              aria-label="پاک کردن جستجو"
            >
              <X className="w-4 h-4 text-[var(--color-text-muted)]" />
            </button>
          )}
        </div>
        <p className="text-[10px] text-[var(--color-text-subtle)]">
          {filteredWords.length.toLocaleString('fa-IR')} از{' '}
          {localWords.length.toLocaleString('fa-IR')} کلمه نمایش داده می‌شود
        </p>
      </div>

      {filteredWords.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
          <p className="text-[var(--color-text-muted)]">
            {localWords.length === 0
              ? 'هنوز کلمه‌ای ثبت نشده — از فرم بالا اضافه کنید'
              : 'نتیجه‌ای برای جستجو یافت نشد'}
          </p>
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="mt-3 text-sm text-[var(--primary)] hover:underline"
            >
              پاک کردن جستجو
            </button>
          )}
        </div>
      ) : (
        <BadWordsTable
          words={filteredWords}
          editingId={editingId}
          editedWord={editedWord}
          deletingId={deletingId}
          onEdit={(w) => {
            setEditingId(w.id);
            setEditedWord(w.word);
          }}
          onEditedWordChange={setEditedWord}
          onSaveEdit={handleSaveEdit}
          onCancelEdit={() => {
            setEditingId(null);
            setEditedWord('');
          }}
          onDelete={(id) => {
            const w = localWords.find((x) => x.id === id);
            if (w) setDeleteTarget(w);
          }}
        />
      )}

      <RejectCommentDialog
        isOpen={!!deleteTarget}
        title="حذف کلمه"
        message="این کلمه از فیلتر خودکار حذف می‌شود. ادامه می‌دهید؟"
        preview={deleteTarget?.word}
        confirmLabel="حذف"
        loadingLabel="در حال حذف…"
        isLoading={!!deletingId}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
