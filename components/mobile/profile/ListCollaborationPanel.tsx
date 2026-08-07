'use client';

import { useCallback, useEffect, useState } from 'react';
import { UserPlus, Users, X } from 'lucide-react';
import UserAvatar from '@/components/shared/UserAvatar';

type CollaboratorMember = {
  id: string;
  userId: string;
  role: 'CONTRIBUTOR' | 'EDITOR';
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'REVOKED';
  invitedBy: string | null;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
};

interface ListCollaborationPanelProps {
  listId: string;
  isPublic: boolean;
  onChanged?: () => void;
}

export default function ListCollaborationPanel({
  listId,
  isPublic,
  onChanged,
}: ListCollaborationPanelProps) {
  const [collaborationEnabled, setCollaborationEnabled] = useState(false);
  const [members, setMembers] = useState<CollaboratorMember[]>([]);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/user/lists/${listId}/collaborators`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'خطا در بارگذاری همکاران');
      }
      setCollaborationEnabled(Boolean(data.data.collaborationEnabled));
      setMembers(data.data.members ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا در بارگذاری');
    } finally {
      setLoading(false);
    }
  }, [listId]);

  useEffect(() => {
    if (!isPublic) {
      void load();
    }
  }, [isPublic, load]);

  const toggleCollaboration = async () => {
    try {
      const res = await fetch(`/api/user/lists/${listId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collaborationEnabled: !collaborationEnabled }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'خطا در تغییر تنظیمات');
      }
      setCollaborationEnabled(!collaborationEnabled);
      onChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
    }
  };

  const inviteUser = async () => {
    if (!username.trim() || inviting) return;
    setInviting(true);
    setError('');
    try {
      const res = await fetch(`/api/user/lists/${listId}/collaborators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'خطا در ارسال دعوت');
      }
      setUsername('');
      await load();
      onChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا در دعوت');
    } finally {
      setInviting(false);
    }
  };

  const memberAction = async (memberUserId: string, action: 'accept' | 'reject' | 'revoke') => {
    setError('');
    try {
      const res = await fetch(`/api/user/lists/${listId}/collaborators/${memberUserId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'خطا در عملیات');
      }
      await load();
      onChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
    }
  };

  if (isPublic) {
    return (
      <p className="text-sm text-wibe-secondary">
        همکاری فقط برای لیست‌های شخصی فعال است.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-slate-600" />
          <div>
            <h3 className="text-base font-semibold text-foreground">همکاری در لیست</h3>
            <p className="text-sm text-wibe-secondary">دعوت دیگران برای افزودن آیتم</p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={collaborationEnabled}
          aria-label="همکاری در لیست"
          onClick={toggleCollaboration}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
            collaborationEnabled ? 'bg-primary' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
              collaborationEnabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="نام کاربری (@username)"
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
          dir="ltr"
        />
        <button
          type="button"
          onClick={inviteUser}
          disabled={inviting || !username.trim()}
          className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          <UserPlus className="h-4 w-4" />
          دعوت
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-wibe-secondary">در حال بارگذاری...</p>
      ) : members.length === 0 ? (
        <p className="text-sm text-wibe-secondary">هنوز همکاری دعوت نشده است.</p>
      ) : (
        <ul className="space-y-2">
          {members.map((member) => {
            const label = member.user.name || member.user.username || 'کاربر';
            const isIncomingRequest = member.status === 'PENDING' && member.invitedBy == null;
            return (
              <li
                key={member.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <UserAvatar src={member.user.image} name={label} size={32} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{label}</p>
                    {member.user.username && (
                      <p className="truncate text-xs text-wibe-secondary" dir="ltr">
                        @{member.user.username}
                      </p>
                    )}
                    <p className="text-xs text-wibe-secondary">
                      {member.status === 'PENDING'
                        ? isIncomingRequest
                          ? 'درخواست همکاری'
                          : 'دعوت در انتظار'
                        : 'همکار فعال'}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  {isIncomingRequest && (
                    <>
                      <button
                        type="button"
                        onClick={() => memberAction(member.userId, 'accept')}
                        className="rounded-md bg-primary px-2 py-1 text-xs font-semibold text-white"
                      >
                        بپذیر
                      </button>
                      <button
                        type="button"
                        onClick={() => memberAction(member.userId, 'reject')}
                        className="rounded-md border border-gray-200 px-2 py-1 text-xs text-wibe-secondary"
                      >
                        رد
                      </button>
                    </>
                  )}
                  {member.status === 'ACCEPTED' && (
                    <button
                      type="button"
                      onClick={() => memberAction(member.userId, 'revoke')}
                      className="rounded-md p-1 text-wibe-secondary hover:bg-gray-100"
                      aria-label="لغو دسترسی"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
