'use client';

import { useState, useCallback, useEffect, useTransition } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import UserPulseSummary from '@/components/admin/users/UserPulseSummary';
import SmartFilterBar from '@/components/admin/users/SmartFilterBar';
import Pagination from '@/components/admin/shared/Pagination';
import Toast, { type ToastType } from '@/components/shared/Toast';
import type {
  UserIntelligenceRow,
  UsersIntelligenceData,
  UserSortKind,
} from '@/lib/admin/users-types';
import {
  USER_FILTER_PILLS,
  PULSE_TO_FILTER,
  type UserFilterKind,
  type UserPulseFilterKey,
} from '@/lib/admin/user-filter-utils';

const tableFallback = (
  <div className="min-h-[320px] animate-pulse rounded-2xl bg-[var(--color-border-muted)]" />
);

const UsersIntelligenceTable = dynamic(
  () => import('@/components/admin/users/UsersIntelligenceTable'),
  { loading: () => tableFallback }
);
const UserDetailModal = dynamic(
  () => import('@/components/admin/users/UserDetailModal'),
  { loading: () => null }
);
const UserToggleActiveDialog = dynamic(
  () => import('@/components/admin/users/UserToggleActiveDialog'),
  { loading: () => null }
);

interface UsersPageClientProps {
  data: UsersIntelligenceData;
}

export default function UsersPageClient({ data }: UsersPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isNavigating, startNavigation] = useTransition();

  const [search, setSearch] = useState(data.search || '');
  const [filterKind, setFilterKind] = useState<UserFilterKind>(data.filter);
  const [sort, setSort] = useState<UserSortKind>(data.sort);
  const [hideBots, setHideBots] = useState(data.hideBots);
  const [users, setUsers] = useState<UserIntelligenceRow[]>(data.users);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [liftingCommentId, setLiftingCommentId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [toggleTarget, setToggleTarget] = useState<{
    id: string;
    name: string | null;
    email: string;
    isActive: boolean;
  } | null>(null);
  const [toggleConfirmText, setToggleConfirmText] = useState('');

  useEffect(() => {
    setUsers(data.users);
    setSearch(data.search || '');
    setFilterKind(data.filter);
    setSort(data.sort);
    setHideBots(data.hideBots);
  }, [data]);

  const syncUrl = useCallback(
    (opts: {
      filter?: UserFilterKind;
      hideBots?: boolean;
      search?: string;
      sort?: UserSortKind;
      page?: string;
    }) => {
      const params = new URLSearchParams(searchParams.toString());
      const nextFilter = opts.filter ?? filterKind;
      const nextHideBots = opts.hideBots ?? hideBots;
      const nextSearch = opts.search ?? search;
      const nextSort = opts.sort ?? sort;

      if (nextFilter === 'all') params.delete('filter');
      else params.set('filter', nextFilter);

      if (nextHideBots) params.delete('hideBots');
      else params.set('hideBots', 'false');

      if (nextSearch.trim()) params.set('search', nextSearch.trim());
      else params.delete('search');

      if (nextSort === 'created_desc') params.delete('sort');
      else params.set('sort', nextSort);

      if (opts.page !== undefined) {
        if (opts.page === '1') params.delete('page');
        else params.set('page', opts.page);
      }

      const url = params.toString() ? `/admin/users?${params.toString()}` : '/admin/users';
      startNavigation(() => router.push(url));
    },
    [searchParams, filterKind, hideBots, search, sort, router]
  );

  const handleFilterChange = (value: UserFilterKind) => {
    setFilterKind(value);
    syncUrl({ filter: value, page: '1' });
  };

  const handleSortChange = (value: UserSortKind) => {
    setSort(value);
    syncUrl({ sort: value, page: '1' });
  };

  const handlePulseFilter = (key: UserPulseFilterKey) => {
    const next = PULSE_TO_FILTER[key];
    setFilterKind(next);
    syncUrl({ filter: next, page: '1' });
  };

  const handleHideBotsChange = (next: boolean) => {
    setHideBots(next);
    syncUrl({ hideBots: next, page: '1' });
  };

  const handleSearchSubmit = () => {
    syncUrl({ search, page: '1' });
  };

  const handleClearFilters = () => {
    setFilterKind('all');
    setSearch('');
    setSort('created_desc');
    const params = new URLSearchParams();
    if (!hideBots) params.set('hideBots', 'false');
    const url = params.toString() ? `/admin/users?${params.toString()}` : '/admin/users';
    startNavigation(() => router.push(url));
  };

  const handleUserClick = (user: UserIntelligenceRow) => {
    setSelectedUserId(user.id);
    setIsDetailModalOpen(true);
  };

  const requestToggleActive = (user: {
    id: string;
    name: string | null;
    email: string;
    isActive: boolean;
  }) => {
    setToggleTarget(user);
    setToggleConfirmText('');
  };

  const handleToggleActiveConfirm = async () => {
    if (!toggleTarget) return;
    if (toggleTarget.isActive && toggleConfirmText !== 'غیرفعال') return;

    const userId = toggleTarget.id;
    const currentStatus = toggleTarget.isActive;
    setTogglingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle-active`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'خطا در تغییر وضعیت کاربر');
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isActive: !currentStatus } : u))
      );
      setToast({
        message: currentStatus ? 'کاربر غیرفعال شد' : 'کاربر فعال شد',
        type: 'success',
      });
      router.refresh();
      if (selectedUserId === userId) {
        setIsDetailModalOpen(false);
        setSelectedUserId(null);
      }
      setToggleTarget(null);
      setToggleConfirmText('');
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'خطا در تغییر وضعیت کاربر';
      setToast({ message, type: 'error' });
    } finally {
      setTogglingId(null);
    }
  };

  const handleUnrestrictComment = async (user: UserIntelligenceRow) => {
    setLiftingCommentId(user.id);
    try {
      const res = await fetch(`/api/admin/comments/violations/user/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unrestrict' }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'خطا در رفع محدودیت کامنت');
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, commentStatus: 'allowed' as const } : u
        )
      );
      setToast({ message: 'محدودیت کامنت برداشته شد', type: 'success' });
      router.refresh();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'خطا در رفع محدودیت کامنت';
      setToast({ message, type: 'error' });
    } finally {
      setLiftingCommentId(null);
    }
  };

  const hasActiveFilters =
    filterKind !== 'all' || !!search.trim() || sort !== 'created_desc';

  const paginationParams: Record<string, string> = {};
  if (data.search) paginationParams.search = data.search;
  if (data.filter !== 'all') paginationParams.filter = data.filter;
  if (!data.hideBots) paginationParams.hideBots = 'false';
  if (data.sort !== 'created_desc') paginationParams.sort = data.sort;

  return (
    <>
      <div>
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">
              مدیریت کاربران
            </h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              شناسایی کاربران اثرگذار، در حال رشد و ریسکی — فیلتر و رشد ۷ روزه سمت سرور
            </p>
          </div>
          <p className="text-sm text-[var(--color-text-muted)] tabular-nums">
            نمایش{' '}
            <span className="font-semibold text-[var(--color-text)]">
              {users.length.toLocaleString('fa-IR')}
            </span>{' '}
            از{' '}
            <span className="font-semibold text-[var(--color-text)]">
              {data.totalCount.toLocaleString('fa-IR')}
            </span>{' '}
            کاربر
            {data.totalPages > 1 && (
              <>
                {' '}
                · صفحه {data.currentPage.toLocaleString('fa-IR')} از{' '}
                {data.totalPages.toLocaleString('fa-IR')}
              </>
            )}
          </p>
        </div>

        <UserPulseSummary data={data.pulse} onFilterClick={handlePulseFilter} activeFilter={filterKind} />

        <SmartFilterBar
          value={filterKind}
          onChange={handleFilterChange}
          filterCounts={data.filterCounts}
          searchQuery={search}
          onSearchChange={setSearch}
          onSearchSubmit={handleSearchSubmit}
          hideBots={hideBots}
          onHideBotsChange={handleHideBotsChange}
          sort={sort}
          onSortChange={handleSortChange}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
        />

        {/* حین ناوبری سرور (فیلتر/جستجو/مرتب) جدول کم‌رنگ و غیرفعال می‌شود تا فریزِ بی‌بازخورد نباشد */}
        <div className={`transition-opacity ${isNavigating ? 'opacity-50 pointer-events-none' : ''}`} aria-busy={isNavigating}>
          <UsersIntelligenceTable
            users={users}
            onToggleActiveRequest={requestToggleActive}
            onUnrestrictCommentRequest={handleUnrestrictComment}
            togglingId={togglingId}
            liftingCommentId={liftingCommentId}
            onUserClick={handleUserClick}
            emptyBecauseFilter={users.length === 0 && data.totalCount === 0 && filterKind !== 'all'}
            filterLabel={USER_FILTER_PILLS.find((p) => p.value === filterKind)?.label}
            hasSearch={!!data.search.trim()}
          />
        </div>

        {data.totalPages > 1 && (
          <div className="mt-6">
            <Pagination
              currentPage={data.currentPage}
              totalPages={data.totalPages}
              basePath="/admin/users"
              searchParams={paginationParams}
            />
          </div>
        )}
      </div>

      {selectedUserId && (
        <UserDetailModal
          userId={selectedUserId}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedUserId(null);
          }}
          onToggleActiveRequest={requestToggleActive}
          onCommentRestrictionLifted={() => {
            setUsers((prev) =>
              selectedUserId
                ? prev.map((u) =>
                    u.id === selectedUserId ? { ...u, commentStatus: 'allowed' as const } : u
                  )
                : prev
            );
            router.refresh();
          }}
        />
      )}

      <UserToggleActiveDialog
        isOpen={!!toggleTarget}
        userName={toggleTarget?.name || toggleTarget?.email || 'کاربر'}
        isActive={toggleTarget?.isActive ?? true}
        confirmText={toggleConfirmText}
        isSubmitting={!!togglingId}
        onConfirmTextChange={setToggleConfirmText}
        onCancel={() => {
          setToggleTarget(null);
          setToggleConfirmText('');
        }}
        onConfirm={handleToggleActiveConfirm}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
