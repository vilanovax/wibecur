'use client';

import React from 'react';
import { Filter } from 'lucide-react';
import type { ModerationFiltersState } from './types';
import { TYPE_LABELS, ENTITY_LABELS, STATUS_LABELS, SEVERITY_LABELS } from './types';

interface ModerationFiltersProps {
  filters: ModerationFiltersState;
  onChange: (f: ModerationFiltersState) => void;
  totalCount: number;
}

export default function ModerationFilters({ filters, onChange, totalCount }: ModerationFiltersProps) {
  const set = (patch: Partial<ModerationFiltersState>) => {
    const next = { ...filters, ...patch };
    if (patch.page === undefined && (patch.type !== undefined || patch.entityType !== undefined || patch.status !== undefined || patch.severity !== undefined || patch.assigneeFilter !== undefined || patch.dateFrom !== undefined || patch.dateTo !== undefined || patch.search !== undefined)) {
      next.page = '1';
    }
    onChange(next);
  };

  return (
    <div className="sticky top-0 z-10 p-5 border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-3 items-center bg-white dark:bg-gray-800 rounded-t-xl" dir="rtl">
      <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
      <select className="rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm px-3 py-1.5 shadow-sm" value={filters.type} onChange={(e) => set({ type: e.target.value })}>
        <option value="">Type: All</option>
        {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
      <select className="rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm px-3 py-1.5 shadow-sm" value={filters.entityType} onChange={(e) => set({ entityType: e.target.value })}>
        <option value="">Entity: All</option>
        {Object.entries(ENTITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
      <select className="rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm px-3 py-1.5 shadow-sm" value={filters.severity} onChange={(e) => set({ severity: e.target.value })}>
        <option value="">Severity: All</option>
        {[1, 2, 3].map((s) => <option key={s} value={String(s)}>{SEVERITY_LABELS[s] ?? s}</option>)}
      </select>
      <select className="rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm px-3 py-1.5 shadow-sm" value={filters.status} onChange={(e) => set({ status: e.target.value })}>
        <option value="">Status: All</option>
        {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
      <select className="rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm px-3 py-1.5 shadow-sm" value={filters.assigneeFilter} onChange={(e) => set({ assigneeFilter: e.target.value })}>
        <option value="">Assignee: Anyone</option>
        <option value="me">Me</option>
        <option value="unassigned">Unassigned</option>
      </select>
      <input type="date" className="rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm px-3 py-1.5 w-36 shadow-sm" value={filters.dateFrom} onChange={(e) => set({ dateFrom: e.target.value })} />
      <input type="date" className="rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm px-3 py-1.5 w-36 shadow-sm" value={filters.dateTo} onChange={(e) => set({ dateTo: e.target.value })} />
      <input type="text" placeholder="جستجو..." className="rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm px-3 py-1.5 w-40 shadow-sm" value={filters.search} onChange={(e) => set({ search: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && set({ page: '1' })} />
      <span className="text-sm text-gray-500 mr-auto">تعداد: {totalCount}</span>
    </div>
  );
}
