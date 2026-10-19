'use client';

import { useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { Separator } from '@/components/ui/separator';
import { Sheet } from '@/components/ui/sheet';
import { useToast } from '@/components/ui/toast';

export default function DesignSystemShowcase() {
  const [page, setPage] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { toast } = useToast();

  return (
    <div className="space-y-6 px-4 py-6">
      <header className="space-y-1">
        <h1 className="text-h1 font-bold text-foreground">نمایش طراحی</h1>
        <p className="text-muted-foreground">
          دکمه، کارت، ورودی، بج، آواتار، صفحه‌بندی، شیت و اعلان روی پوستهٔ کاغذی.
        </p>
      </header>

      <Card className="space-y-3 bg-popover p-4">
        <h2 className="text-h3 font-semibold text-foreground">دکمه</h2>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="brand">
            ذخیره
          </Button>
          <Button type="button" variant="outline">
            انصراف
          </Button>
          <Button type="button" variant="ghost">
            بیشتر
          </Button>
        </div>
      </Card>

      <Card className="space-y-3 bg-popover p-4">
        <h2 className="text-h3 font-semibold text-foreground">ورودی</h2>
        <Input placeholder="جست‌وجوی لیست" aria-label="جست‌وجو" />
      </Card>

      <Card className="space-y-3 bg-popover p-4">
        <h2 className="text-h3 font-semibold text-foreground">بج و آواتار</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="brand">داغ</Badge>
          <Badge variant="success">عمومی</Badge>
          <Badge variant="warning">پیش‌نویس</Badge>
          <Avatar name="سارا" size="lg" />
          <Avatar name="رامتین" size="md" />
        </div>
      </Card>

      <Alert variant="warning">این فقط نمونه است و چیزی ذخیره نمی‌شود.</Alert>

      <Separator label="کنترل‌ها" />

      <Card className="space-y-4 bg-popover p-4">
        <h2 className="text-h3 font-semibold text-foreground">صفحه‌بندی</h2>
        <Pagination page={page} total={5} onChange={setPage} />
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => setSheetOpen(true)}>
          باز کردن شیت
        </Button>
        <Button
          type="button"
          variant="brand"
          onClick={() => toast({ title: 'ذخیره شد', variant: 'success' })}
        >
          نشان دادن اعلان
        </Button>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen} side="bottom" title="نمونهٔ شیت">
        <p className="text-muted-foreground">این کشو از کیت وایب‌فارسی است و فقط برای نمایش کنترل است.</p>
      </Sheet>
    </div>
  );
}
