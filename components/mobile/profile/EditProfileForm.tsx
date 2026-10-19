'use client';

import { useState, useEffect } from 'react';
import BottomSheet from '@/components/mobile/shared/BottomSheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

interface EditProfileFormProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  onUpdate: () => void;
}

export default function EditProfileForm({
  isOpen,
  onClose,
  user,
  onUpdate,
}: EditProfileFormProps) {
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: user.name || '',
        email: user.email,
      });
      setError('');
    }
  }, [isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'خطا در به‌روزرسانی پروفایل');
      }

      onUpdate();
      onClose();
    } catch (err: any) {
      setError(err.message || 'خطا در به‌روزرسانی پروفایل');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="ویرایش پروفایل">
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
            نام
          </label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="h-12"
            placeholder="نام خود را وارد کنید"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
            ایمیل
          </label>
          <Input
            id="email"
            type="email"
            dir="ltr"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="h-12"
            placeholder="example@email.com"
            required
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" size="lg" className="flex-1" onClick={onClose} disabled={isLoading}>
            انصراف
          </Button>
          <Button type="submit" variant="brand" size="lg" className="flex-1" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                در حال ذخیره...
              </>
            ) : (
              'ذخیره تغییرات'
            )}
          </Button>
        </div>
      </form>
    </BottomSheet>
  );
}

