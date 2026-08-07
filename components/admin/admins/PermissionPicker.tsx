'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { Permission } from '@/lib/auth/permissions';
import { PERMISSION_LABELS } from '@/lib/auth/permissions';
import type { PermissionGroup } from '@/lib/auth/permission-groups';

type Props = {
  groups: PermissionGroup[];
  selected: Permission[];
  onChange: (next: Permission[]) => void;
  disabled?: boolean;
};

export default function PermissionPicker({ groups, selected, onChange, disabled }: Props) {
  const selectedSet = new Set(selected);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggle = (perm: Permission) => {
    if (disabled) return;
    const next = new Set(selectedSet);
    if (next.has(perm)) next.delete(perm);
    else next.add(perm);
    onChange([...next]);
  };

  const toggleGroup = (group: PermissionGroup) => {
    if (disabled) return;
    const allSelected = group.permissions.every((p) => selectedSet.has(p));
    const next = new Set(selectedSet);
    for (const p of group.permissions) {
      if (allSelected) next.delete(p);
      else next.add(p);
    }
    onChange([...next]);
  };

  const toggleCollapse = (groupId: string) => {
    setCollapsed((c) => ({ ...c, [groupId]: !c[groupId] }));
  };

  return (
    <div className="space-y-2 max-h-[320px] overflow-y-auto pe-0.5" dir="rtl">
      {groups.map((group) => {
        const groupSelected = group.permissions.filter((p) => selectedSet.has(p)).length;
        const allInGroup = groupSelected === group.permissions.length;
        const isCollapsed = collapsed[group.id] ?? false;

        return (
          <section
            key={group.id}
            className="rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900/30 overflow-hidden"
          >
            <div className="flex items-stretch">
              <button
                type="button"
                disabled={disabled}
                onClick={() => toggleGroup(group)}
                className="flex-1 flex items-center justify-between gap-3 px-3 py-2.5 text-right hover:bg-gray-50 dark:hover:bg-gray-800/40 disabled:opacity-60 transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{group.label}</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                    {group.description}
                  </p>
                </div>
                <span
                  className={[
                    'text-[10px] tabular-nums shrink-0 rounded-md px-1.5 py-0.5 font-medium',
                    allInGroup
                      ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
                  ].join(' ')}
                >
                  {groupSelected}/{group.permissions.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => toggleCollapse(group.id)}
                aria-label={isCollapsed ? 'باز کردن' : 'بستن'}
                className="flex items-center justify-center px-2.5 border-r border-gray-100 dark:border-gray-700 text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/40"
              >
                {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </button>
            </div>
            {!isCollapsed ? (
              <ul className="px-2 pb-2 pt-0.5 grid grid-cols-1 gap-0.5 border-t border-gray-100 dark:border-gray-700">
                {group.permissions.map((perm) => (
                  <li key={perm}>
                    <label className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={selectedSet.has(perm)}
                        disabled={disabled}
                        onChange={() => toggle(perm)}
                        className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                      />
                      <span className="text-gray-700 dark:text-gray-200 text-xs">
                        {PERMISSION_LABELS[perm]}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

