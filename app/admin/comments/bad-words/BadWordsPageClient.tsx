'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, X } from 'lucide-react';

interface BadWord {
  id: string;
  word: string;
  createdAt: string;
  updatedAt: string;
  filteredCount: number;
}

interface BadWordsPageClientProps {
  words: BadWord[];
}

export default function BadWordsPageClient({ words = [] }: BadWordsPageClientProps) {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/comments/bad-words', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ word: newWord.trim() }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'خطا در افزودن کلمه');
      }

      setNewWord('');
      setIsAdding(false);
      router.refresh();
    } catch (error: any) {
      alert(error.message || 'خطا در افزودن کلمه');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این کلمه اطمینان دارید؟')) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/comments/bad-words?id=${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'خطا در حذف کلمه');
      }

      router.refresh();
    } catch (error: any) {
      alert(error.message || 'خطا در حذف کلمه');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">مدیریت کلمات بد</h1>
          <p className="text-gray-500 mt-1">
            کامنت‌های حاوی این کلمات به صورت خودکار فیلتر می‌شوند
          </p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-5 h-5" />
          افزودن کلمه
        </button>
      </div>

      {/* Add Form */}
      {isAdding && (
        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-100">
          <form onSubmit={handleAdd} className="flex gap-3">
            <input
              type="text"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              placeholder="کلمه بد را وارد کنید..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !newWord.trim()}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {isLoading ? 'در حال افزودن...' : 'افزودن'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setNewWord('');
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </form>
        </div>
      )}

      {/* Words List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {words.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">کلمه بدی ثبت نشده است</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {words.map((word) => (
              <div
                key={word.id}
                className="p-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium text-gray-900 text-lg">{word.word}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {word.filteredCount} کامنت فیلتر شده
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(word.id)}
                  disabled={deletingId === word.id}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

