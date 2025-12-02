'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, X, Edit2, Save, XCircle } from 'lucide-react';

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedWord, setEditedWord] = useState('');
  const [localWords, setLocalWords] = useState<BadWord[]>(words);

  // Update local words when props change
  useEffect(() => {
    setLocalWords(words);
  }, [words]);

  // Helper function to split words by comma
  const splitWords = (input: string): string[] => {
    return input
      .split(/[،,]/) // Split by Persian comma (،) or English comma (,)
      .map((w) => w.trim())
      .filter((w) => w.length > 0);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim()) return;

    setIsLoading(true);
    try {
      // Split words by comma
      const wordsToAdd = splitWords(newWord);

      if (wordsToAdd.length === 0) {
        alert('لطفاً حداقل یک کلمه وارد کنید');
        setIsLoading(false);
        return;
      }

      // Add all words
      const results = await Promise.all(
        wordsToAdd.map((word) =>
          fetch('/api/admin/comments/bad-words', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ word }),
          }).then((res) => res.json())
        )
      );

      // Check for errors (ignore duplicates)
      const errors = results.filter((r) => !r.success && !r.error?.includes('قبلاً'));
      if (errors.length > 0 && errors.length === results.length) {
        throw new Error(errors[0].error || 'خطا در افزودن کلمات');
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

  const handleEdit = (word: BadWord) => {
    setEditingId(word.id);
    setEditedWord(word.word);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editedWord.trim()) {
      alert('لطفاً کلمه را وارد کنید');
      return;
    }

    try {
      const res = await fetch(`/api/admin/comments/bad-words/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ word: editedWord.trim() }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'خطا در ویرایش کلمه');
      }

      // Update local state
      setLocalWords((prev) =>
        prev.map((w) => (w.id === id ? { ...w, word: editedWord.trim() } : w))
      );

      setEditingId(null);
      setEditedWord('');
      router.refresh();
    } catch (error: any) {
      alert(error.message || 'خطا در ویرایش کلمه');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditedWord('');
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

      // Update local state
      setLocalWords((prev) => prev.filter((w) => w.id !== id));

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
              placeholder="کلمات را وارد کنید (جدا شده با ویرگول): بیتربت، بی ادب، خر"
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

      {/* Words List - 2 Column Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {localWords.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">کلمه بدی ثبت نشده است</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            {localWords.map((word) => (
              <div
                key={word.id}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all bg-gray-50"
              >
                {editingId === word.id ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editedWord}
                      onChange={(e) => setEditedWord(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(word.id)}
                        className="flex-1 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        ذخیره
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        انصراف
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-lg truncate">
                        {word.word}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {word.filteredCount} کامنت فیلتر شده
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mr-2">
                      <button
                        onClick={() => handleEdit(word)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="ویرایش"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(word.id)}
                        disabled={deletingId === word.id}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

