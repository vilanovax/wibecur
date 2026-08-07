import Image from 'next/image';
import { Construction } from 'lucide-react';
import type { MaintenancePageConfig } from '@/lib/maintenance-mode-types';

type Props = {
  config: Pick<
    MaintenancePageConfig,
    | 'title'
    | 'subtitle'
    | 'message'
    | 'showLogo'
    | 'accentColor'
    | 'logoUrl'
  >;
  preview?: boolean;
};

export default function SiteMaintenancePage({ config, preview = false }: Props) {
  const accent = config.accentColor || '#6366F1';

  return (
    <div
      className={`min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-b from-[#f4f5f8] to-[#e8eaef] ${
        preview ? 'min-h-[420px] rounded-2xl overflow-hidden' : ''
      }`}
      dir="rtl"
    >
      <div className="w-full max-w-lg">
        <div className="rounded-3xl border border-white/80 bg-white/90 backdrop-blur-sm shadow-xl shadow-black/5 p-8 sm:p-10 text-center">
          {config.showLogo && config.logoUrl ? (
            <div className="flex justify-center mb-6">
              <Image
                src={config.logoUrl}
                alt=""
                width={240}
                height={60}
                className="h-12 w-auto max-w-[220px] object-contain"
                unoptimized
              />
            </div>
          ) : (
            <div
              className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ backgroundColor: `${accent}18`, color: accent }}
            >
              <Construction className="h-7 w-7" aria-hidden />
            </div>
          )}

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-snug">
            {config.title}
          </h1>

          {config.subtitle ? (
            <p className="mt-2 text-sm font-medium text-gray-500">{config.subtitle}</p>
          ) : null}

          <div
            className="mx-auto mt-5 h-1 w-12 rounded-full"
            style={{ backgroundColor: accent }}
            aria-hidden
          />

          {config.message ? (
            <p className="mt-6 text-[15px] leading-7 text-gray-600 whitespace-pre-wrap">
              {config.message}
            </p>
          ) : null}

          {preview ? (
            <p className="mt-8 text-xs text-gray-400">پیش‌نمایش صفحه اضطراری</p>
          ) : (
            <p className="mt-8 text-xs text-gray-400">از صبر و شکیبایی شما سپاسگزاریم</p>
          )}
        </div>
      </div>
    </div>
  );
}
