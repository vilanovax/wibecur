'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import BottomSheet from '@/components/mobile/shared/BottomSheet';

const TITLE_MAX = 200;
const DESCRIPTION_MAX = 2000;

export type AdminListQuickEditValues = {
  id: string;
  title: string;
  description: string | null;
  isActive: boolean;
  isPublic: boolean;
  isFeatured: boolean;
  commentsEnabled: boolean;
};

type AdminListQuickEditSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  list: AdminListQuickEditValues;
  onSaved: (next: AdminListQuickEditValues) => void;
  onError: (message: string) => void;
};

type ToggleKey = 'isActive' | 'isPublic' | 'isFeatured' | 'commentsEnabled';

const TOGGLES: { key: ToggleKey; label: string; hint: string }[] = [
  {
    key: 'isActive',
    label: 'فعال',
    hint: 'خاموش باشد، این صفحه برای بازدیدکننده‌ها باز نمی‌شود.',
  },
  {
    key: 'isPublic',
    label: 'عمومی',
    hint: 'خصوصی باشد، فقط از پنل ادمین دیده می‌شود.',
  },
  {
    key: 'isFeatured',
    label: 'ویژه',
    hint: 'در بخش‌های منتخب صفحهٔ اصلی می‌آید.',
  },
  {
    key: 'commentsEnabled',
    label: 'نظرها',
    hint: 'کاربران می‌توانند برای این لیست نظر بگذارند.',
  },
];

export default function AdminListQuickEditSheet({
  isOpen,
  onClose,
  list,
  onSaved,
  onError,
}: AdminListQuickEditSheetProps) {
  const [title, setTitle] = useState(list.title);
  const [description, setDescription] = useState(list.description ?? '');
  const [isActive, setIsActive] = useState(list.isActive);
  const [isPublic, setIsPublic] = useState(list.isPublic);
  const [isFeatured, setIsFeatured] = useState(list.isFeatured);
  const [commentsEnabled, setCommentsEnabled] = useState(list.commentsEnabled);
  const [saving, setSaving] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setTitle(list.title);
    setDescription(list.description ?? '');
    setIsActive(list.isActive);
    setIsPublic(list.isPublic);
    setIsFeatured(list.isFeatured);
    setCommentsEnabled(list.commentsEnabled);
    setTitleError(null);
  }, [
    isOpen,
    list.title,
    list.description,
    list.isActive,
    list.isPublic,
    list.isFeatured,
    list.commentsEnabled,
  ]);

  const flags: Record<ToggleKey, boolean> = {
    isActive,
    isPublic,
    isFeatured,
    commentsEnabled,
  };

  const setFlag = (key: ToggleKey, value: boolean) => {
    if (key === 'isActive') setIsActive(value);
    else if (key === 'isPublic') setIsPublic(value);
    else if (key === 'isFeatured') setIsFeatured(value);
    else setCommentsEnabled(value);
  };

  const save = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setTitleError('عنوان لیست را وارد کنید');
      return;
    }
    if (trimmedTitle.length > TITLE_MAX) {
      setTitleError('عنوان نباید بیشتر از ۲۰۰ نویسه باشد');
      return;
    }
    setTitleError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/lists/${list.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: trimmedTitle,
          description: description.trim() || null,
          isActive,
          isPublic,
          isFeatured,
          commentsEnabled,
        }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        onError(data?.error || 'ذخیرهٔ لیست انجام نشد');
        return;
      }
      onSaved({
        id: list.id,
        title: trimmedTitle,
        description: description.trim() || null,
        isActive,
        isPublic,
        isFeatured,
        commentsEnabled,
      });
    } catch {
      onError('ذخیرهٔ لیست انجام نشد');
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={saving ? () => undefined : onClose}
      title="ویرایش لیست"
      desktopMaxWidth="md"
    >
      <form
        className="space-y-4 pb-2"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <div className="space-y-1.5">
          <label htmlFor="admin-list-title" className="block text-sm font-medium text-foreground">
            عنوان
          </label>
          <Input
            id="admin-list-title"
            value={title}
            maxLength={TITLE_MAX}
            error={titleError ?? undefined}
            onChange={(event) => {
              setTitle(event.target.value);
              if (titleError) setTitleError(null);
            }}
            placeholder="نام لیست"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="admin-list-description" className="block text-sm font-medium text-foreground">
            توضیحات
          </label>
          <Textarea
            id="admin-list-description"
            value={description}
            maxLength={Math.max(DESCRIPTION_MAX, description.length)}
            showCount
            autoResize
            rows={3}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="این لیست دربارهٔ چیست؟"
          />
        </div>

        <div className="space-y-1">
          {TOGGLES.map((toggle) => (
            <div
              key={toggle.key}
              role="switch"
              aria-checked={flags[toggle.key]}
              tabIndex={0}
              onClick={() => setFlag(toggle.key, !flags[toggle.key])}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setFlag(toggle.key, !flags[toggle.key]);
                }
              }}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-1 py-1 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="min-w-0 flex-1 text-start">
                <span className="block text-sm font-medium leading-snug text-foreground">
                  {toggle.label}
                </span>
                <span className="block wibe-caption leading-relaxed text-muted-foreground">
                  {toggle.hint}
                </span>
              </span>
              <Switch
                checked={flags[toggle.key]}
                tabIndex={-1}
                aria-hidden
                className="pointer-events-none"
              />
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-1">
          <Button type="submit" variant="brand" size="lg" className="min-h-11 flex-1" disabled={saving}>
            {saving ? 'در حال ذخیره…' : 'ذخیره'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="min-h-11"
            disabled={saving}
            onClick={onClose}
          >
            انصراف
          </Button>
        </div>
      </form>
    </BottomSheet>
  );
}
