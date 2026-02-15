'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import UserPulseSummary from '@/components/admin/users/UserPulseSummary';
import SmartFilterBar, { type UserFilterKind } from '@/components/admin/users/SmartFilterBar';
import UsersIntelligenceTable from '@/components/admin/users/UsersIntelligenceTable';
import Pagination from '@/components/admin/shared/Pagination';
import UserDetailModal from '@/components/admin/users/UserDetailModal';
import type { UserPulseSummary as UserPulseSummaryType } from '@/lib/admin/users-types';
import type { UserIntelligenceRow } from '@/lib/admin/users-types';

interface UsersPageClientProps {
  pulse: UserPulseSummaryType;
  users: UserIntelligenceRow[];
  currentSearch: string;
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export default function UsersPageClient({
  pulse,
  users: initialUsers,
  currentSearch,
  totalCount,
  currentPage,
  totalPages,
}: UsersPageClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState(currentSearch || '');
  const [filterKind, setFilterKind] = useState<UserFilterKind>('all');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [users, setUsers] = useState<UserIntelligenceRow[]>(initialUsers);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    let list = [...users];
    switch (filterKind) {
      case 'most_active':
        list = list.filter(
          (u) => u.listsCount >= 2 || u.bookmarksCount >= 5
        );
        break;
      case 'growing':
        list = list.filter((u) => u.growthPercent > 0 || u.curatorScore > 0);
        break;
      case 'curators':
        list = list.filter(
          (u) => u.curatorLevel !== 'EXPLORER' || u.curatorScore > 0
        );
        break;
      case 'suspicious':
        list = list.filter(
          (u) => u.userViolationsCount > 0 || u.commentReportsCount > 0
        );
        break;
      case 'new': {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        list = list.filter(
          (u) => new Date(u.createdAt) >= thirtyDaysAgo
        );
        break;
      }
      default:
        break;
    }
    return list;
  }, [users, filterKind]);

  const handleSearchSubmit = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    params.set('page', '1');
    router.push(`/admin/users?${params.toString()}`);
  };

  const handleUserClick = (user: UserIntelligenceRow) => {
    setSelectedUserId(user.id);
    setIsDetailModalOpen(true);
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    if (
      !confirm(
        `آیا می‌خواهید کاربر را ${currentStatus ? 'غیرفعال' : 'فعال'} کنید؟`
      )
    ) {
      return;
    }

    setTogglingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle-active`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to toggle user status');
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, isActive: !currentStatus } : u
        )
      );
      if (selectedUserId === userId) {
        setSelectedUserId(null);
        setIsDetailModalOpen(false);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'خطا در تغییر وضعیت کاربر';
      alert(message);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">
          مدیریت کاربران
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mb-6">
          شناسایی کاربران اثرگذار، در حال رشد و ریسکی
        </p>

        <UserPulseSummary data={pulse} />

        <SmartFilterBar
          value={filterKind}
          onChange={setFilterKind}
          searchQuery={search}
          onSearchChange={setSearch}
          onSearchSubmit={handleSearchSubmit}
        />

        <UsersIntelligenceTable
          users={filteredUsers}
          onToggleActive={handleToggleActive}
          togglingId={togglingId}
          onUserClick={handleUserClick}
        />

        {totalPages > 1 && (
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              basePath="/admin/users"
              searchParams={search ? { search } : {}}
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
          onToggleActive={(newStatus) => {
            setUsers((prev) =>
              prev.map((u) =>
                u.id === selectedUserId ? { ...u, isActive: newStatus } : u
              )
            );
            setSelectedUserId(null);
            setIsDetailModalOpen(false);
          }}
        />
      )}
    </>
  );
}
