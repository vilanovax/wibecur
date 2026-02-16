'use client';

import { adminRadius, adminShadow } from '@/lib/admin/design-system/tokens';

export interface DebugTableColumn<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DebugTableProps<T extends Record<string, unknown>> {
  columns: DebugTableColumn<T>[];
  data: T[];
  keyField?: keyof T | ((row: T) => string);
  emptyMessage?: string;
  className?: string;
}

export default function DebugTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyField = 'id' as keyof T,
  emptyMessage = 'داده‌ای وجود ندارد',
  className = '',
}: DebugTableProps<T>) {
  const getKey = (row: T) =>
    typeof keyField === 'function' ? keyField(row) : String(row[keyField] ?? '');

  return (
    <div
      className={[
        adminRadius.card,
        adminShadow.card,
        'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 overflow-hidden',
        className,
      ].join(' ')}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[400px] text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={[
                    'text-start py-3 px-4 font-semibold text-gray-700 dark:text-gray-300',
                    col.className ?? '',
                  ].join(' ')}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-8 text-center text-gray-500 dark:text-gray-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={getKey(row)}
                  className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={[
                        'py-3 px-4 text-gray-700 dark:text-gray-300',
                        col.className ?? '',
                      ].join(' ')}
                    >
                      {col.render
                        ? col.render(row)
                        : String(row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
