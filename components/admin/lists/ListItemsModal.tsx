'use client';

import React from 'react';
import { X } from 'lucide-react';

interface Item {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  externalUrl: string | null;
  order: number;
  metadata: any;
  createdAt: string;
  updatedAt: string;
}

interface ListItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  listId: string;
  listTitle: string;
}

export default function ListItemsModal({
  isOpen,
  onClose,
  listId,
  listTitle,
}: ListItemsModalProps) {
  const [items, setItems] = React.useState<Item[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen && listId) {
      fetchItems();
    }
  }, [isOpen, listId]);

  const fetchItems = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/items?listId=${listId}`);
      if (!response.ok) {
        throw new Error('خطا در دریافت آیتم‌ها');
      }
      const data = await response.json();
      setItems(data || []);
    } catch (err: any) {
      console.error('Error fetching items:', err);
      setError(err.message || 'خطا در دریافت آیتم‌ها');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">آیتم‌های لیست</h2>
            <p className="text-xs text-gray-500 mt-0.5">{listTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-gray-500 mt-4">در حال بارگذاری...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
              <button
                onClick={fetchItems}
                className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                تلاش مجدد
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">📋</div>
              <p className="text-gray-500">این لیست هنوز آیتمی ندارد</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
                >
                  {/* Number */}
                  <div className="flex-shrink-0 w-7 h-7 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 mb-1">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500 text-center">
              تعداد کل آیتم‌ها: {items.length}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

