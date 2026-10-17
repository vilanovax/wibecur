'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, Image as ImageIcon, X } from 'lucide-react';
import BottomSheet from '@/components/mobile/shared/BottomSheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface EditPersonalListFormProps {
  isOpen: boolean;
  onClose: () => void;
  list: {
    id: string;
    title: string;
    description: string | null;
    coverImage: string | null;
  };
  onSuccess?: () => void;
}

export default function EditPersonalListForm({
  isOpen,
  onClose,
  list,
  onSuccess,
}: EditPersonalListFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    coverImage: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_DESCRIPTION_LENGTH = 300;

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: list.title,
        description: list.description || '',
        coverImage: list.coverImage || '',
      });
      setError('');
    }
  }, [isOpen, list]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // Limit description length
    if (name === 'description' && value.length > MAX_DESCRIPTION_LENGTH) {
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('لطفاً یک فایل تصویری انتخاب کنید');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('حجم فایل باید کمتر از 5 مگابایت باشد');
      return;
    }

    setError('');
    setIsUploadingImage(true);

    try {
      // Upload file to server
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      // Tell the server this is a list cover upload
      uploadFormData.append('purpose', 'cover');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'خطا در آپلود تصویر');
      }

      const data = await res.json();
      setFormData((prev) => ({ ...prev, coverImage: data.url }));
    } catch (err: any) {
      setError(err.message || 'خطا در آپلود تصویر');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('عنوان الزامی است');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`/api/user/lists/${list.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          coverImage: formData.coverImage.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'خطا در ویرایش لیست');
      }

      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (err: any) {
      setError(err.message || 'خطا در ویرایش لیست');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="ویرایش لیست">
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto overscroll-contain p-6 min-h-0">
          {error && (
            <div className="mb-4 rounded-surface border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="mb-4">
            <label
              htmlFor="title"
              className="block text-sm font-medium text-foreground mb-2"
            >
              عنوان لیست <span className="text-destructive">*</span>
            </label>
            <Input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="h-12"
              placeholder="عنوان لیست را وارد کنید..."
              required
              disabled={isLoading}
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-foreground mb-2"
            >
              توضیحات (اختیاری)
            </label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              maxLength={MAX_DESCRIPTION_LENGTH}
              placeholder="توضیحات لیست را وارد کنید..."
              disabled={isLoading}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {formData.description.length} / {MAX_DESCRIPTION_LENGTH} کاراکتر
            </p>
          </div>

          {/* Cover Image */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              تصویر کاور (اختیاری)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isLoading || isUploadingImage}
            />
            {formData.coverImage ? (
              <div className="space-y-2">
                <div className="relative h-48 w-full overflow-hidden rounded-surface border border-border">
                  <img
                    src={formData.coverImage}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, coverImage: '' }))}
                    className="absolute end-2 top-2 flex size-11 items-center justify-center rounded-full bg-destructive text-white"
                    disabled={isLoading || isUploadingImage}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || isUploadingImage}
                className="flex min-h-12 w-full flex-col items-center justify-center gap-2 rounded-surface border border-dashed border-border px-4 py-8 text-muted-foreground transition-colors hover:border-brand"
              >
                {isUploadingImage ? (
                  <>
                    <Loader2 className="size-6 animate-spin text-brand" />
                    <span className="text-sm">در حال آپلود...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-8 h-8" />
                    <span className="text-sm font-medium">انتخاب تصویر از گالری</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 border-t border-border bg-popover p-4">
          <div className="flex gap-3">
            <Button type="button" variant="secondary" size="lg" className="flex-1" onClick={onClose} disabled={isLoading || isUploadingImage}>
              انصراف
            </Button>
            <Button
              type="submit"
              variant="brand"
              size="lg"
              className="flex-1"
              disabled={isLoading || isUploadingImage || !formData.title.trim()}
            >
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
        </div>
      </form>
    </BottomSheet>
  );
}

