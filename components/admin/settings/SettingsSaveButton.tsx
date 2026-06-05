'use client';

import { Loader2 } from 'lucide-react';

type Props = {
  onClick: () => void;
  loading?: boolean;
  label?: string;
  loadingLabel?: string;
};

export default function SettingsSaveButton({
  onClick,
  loading = false,
  label = 'ذخیره',
  loadingLabel = 'در حال ذخیره…',
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {loading ? loadingLabel : label}
    </button>
  );
}
