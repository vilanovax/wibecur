'use client';

import { useState } from 'react';
import { List, Package } from 'lucide-react';
import BottomSheet from '@/components/mobile/shared/BottomSheet';
import SuggestListForm from './SuggestListForm';
import SuggestItemForm from './SuggestItemForm';

interface SuggestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SuggestType = 'list' | 'item' | null;

export default function SuggestModal({ isOpen, onClose }: SuggestModalProps) {
  const [selectedType, setSelectedType] = useState<SuggestType>(null);

  const handleClose = () => {
    setSelectedType(null);
    onClose();
  };

  if (!isOpen) return null;

  // اگر نوع انتخاب نشده، صفحه انتخاب را نمایش بده
  if (!selectedType) {
    return (
      <BottomSheet isOpen={isOpen} onClose={handleClose} title="پیشنهاد محتوا">
        <div className="p-6 space-y-4">
          <p className="text-gray-600 text-center mb-6">
            چه چیزی می‌خواهید پیشنهاد دهید؟
          </p>

          <button
            onClick={() => setSelectedType('list')}
            className="w-full p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all flex items-center gap-4"
          >
            <div className="p-3 bg-blue-100 rounded-lg">
              <List className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1 text-right">
              <h3 className="font-bold text-lg text-gray-900">پیشنهاد لیست</h3>
              <p className="text-sm text-gray-500 mt-1">
                یک لیست جدید برای اضافه شدن به مجموعه پیشنهاد دهید
              </p>
            </div>
          </button>

          <button
            onClick={() => setSelectedType('item')}
            className="w-full p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all flex items-center gap-4"
          >
            <div className="p-3 bg-purple-100 rounded-lg">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1 text-right">
              <h3 className="font-bold text-lg text-gray-900">پیشنهاد آیتم</h3>
              <p className="text-sm text-gray-500 mt-1">
                یک آیتم جدید به یک لیست موجود اضافه کنید
              </p>
            </div>
          </button>
        </div>
      </BottomSheet>
    );
  }

  // نمایش فرم مناسب بر اساس انتخاب
  return (
    <>
      {selectedType === 'list' && (
        <SuggestListForm isOpen={isOpen} onClose={handleClose} />
      )}
      {selectedType === 'item' && (
        <SuggestItemForm isOpen={isOpen} onClose={handleClose} />
      )}
    </>
  );
}

