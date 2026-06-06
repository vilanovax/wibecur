'use client';

type Props = {
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
};

/** فیلد نکتهٔ ویژه — برای فرم‌های ادمین و bulk import */
export default function ItemTipField({ value, onChange, compact = false }: Props) {
  return (
    <div className={compact ? '' : 'space-y-2'}>
      <label className={`block font-medium text-gray-700 ${compact ? 'text-[10px] font-semibold text-gray-500' : 'text-sm mb-2'}`}>
        نکته (اختیاری)
        {!compact && (
          <span className="text-xs font-normal text-gray-500 mr-2">
            — توضیح ویژهٔ ادمین که در صفحه جزئیات آیتم نمایش داده می‌شود
          </span>
        )}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={compact ? 2 : 3}
        maxLength={500}
        className={
          compact
            ? 'w-full mt-1 text-sm rounded-lg border border-gray-200 px-2 py-1'
            : 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent'
        }
        placeholder="مثلاً: پایان این فیلم را حتماً تا آخر ببینید — بدون اسپoiler!"
      />
    </div>
  );
}
