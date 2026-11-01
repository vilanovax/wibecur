'use client';

import { Edit2, Trash2, Save, XCircle } from 'lucide-react';

export type BadWordRow = {
  id: string;
  word: string;
  filteredCount: number;
};

type Props = {
  words: BadWordRow[];
  editingId: string | null;
  editedWord: string;
  deletingId: string | null;
  onEdit: (word: BadWordRow) => void;
  onEditedWordChange: (value: string) => void;
  onSaveEdit: (id: string) => void;
  onCancelEdit: () => void;
  onDelete: (id: string) => void;
};

export default function BadWordsTable({
  words,
  editingId,
  editedWord,
  deletingId,
  onEdit,
  onEditedWordChange,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: Props) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-(--color-border) bg-(--color-surface) shadow-sm">
      <table className="w-full min-w-130" dir="rtl">
        <thead className="bg-(--color-bg) border-b border-(--color-border)">
          <tr>
            <th className="px-3 py-2.5 text-right text-xs font-semibold text-wibe-secondary">
              کلمه
            </th>
            <th className="px-3 py-2.5 text-right text-xs font-semibold text-wibe-secondary w-28">
              فیلتر شده
            </th>
            <th className="px-3 py-2.5 text-left text-xs font-semibold text-wibe-secondary w-28">
              عملیات
            </th>
          </tr>
        </thead>
        <tbody>
          {words.map((word) => {
            const isEditing = editingId === word.id;
            const hasHits = word.filteredCount > 0;
            return (
              <tr
                key={word.id}
                className={`border-b border-(--color-border-muted) transition-colors ${
                  hasHits
                    ? 'border-r-4 border-r-amber-500 bg-amber-50/40 dark:bg-amber-900/20'
                    : 'hover:bg-(--color-bg)'
                }`}
              >
                <td className="px-3 py-2.5">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedWord}
                      onChange={(e) => onEditedWordChange(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-(--color-border) focus:ring-2 focus:ring-(--primary)/30"
                      autoFocus
                    />
                  ) : (
                    <span className="text-sm font-medium text-(--color-text)">
                      {word.word}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-medium tabular-nums ${
                      hasHits
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
                        : 'bg-(--color-bg) text-wibe-secondary'
                    }`}
                  >
                    {word.filteredCount.toLocaleString('fa-IR')}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center justify-end gap-1">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onSaveEdit(word.id)}
                          className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50"
                          title="ذخیره"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={onCancelEdit}
                          className="p-1.5 rounded-lg text-wibe-secondary hover:bg-(--color-bg)"
                          title="انصراف"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => onEdit(word)}
                          className="p-1.5 rounded-lg text-primary hover:bg-primary/10"
                          title="ویرایش"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(word.id)}
                          disabled={deletingId === word.id}
                          className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 disabled:opacity-50"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
