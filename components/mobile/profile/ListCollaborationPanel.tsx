'use client';

import { useCallback, useEffect, useState } from 'react';
import { UserPlus, Users, X } from 'lucide-react';
import UserAvatar from '@/components/shared/UserAvatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

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
      <p className="text-sm text-muted-foreground">
        همکاری فقط برای لیست‌های شخصی فعال است.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="size-5 text-muted-foreground" />
          <div>
            <h3 className="text-base font-semibold text-foreground">همکاری در لیست</h3>
            <p className="text-sm text-muted-foreground">دعوت دیگران برای افزودن آیتم</p>
          </div>
        </div>
        <Switch
          checked={collaborationEnabled}
          onCheckedChange={() => toggleCollaboration()}
          aria-label="همکاری در لیست"
        />
      </div>

      <div className="flex gap-2">
        <Input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="نام کاربری (@username)"
          className="h-12 flex-1"
          dir="ltr"
        />
        <Button type="button" variant="brand" size="lg" onClick={inviteUser} disabled={inviting || !username.trim()}>
          <UserPlus className="h-4 w-4" />
          دعوت
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading ? (
        <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>
      ) : members.length === 0 ? (
        <p className="text-sm text-muted-foreground">هنوز همکاری دعوت نشده است.</p>
      ) : (
        <ul className="space-y-2">
          {members.map((member) => {
            const label = member.user.name || member.user.username || 'کاربر';
            const isIncomingRequest = member.status === 'PENDING' && member.invitedBy == null;
            return (
              <li
                key={member.id}
                className="flex min-h-12 items-center justify-between gap-2 rounded-surface border border-border px-3"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <UserAvatar src={member.user.image} name={label} size={32} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{label}</p>
                    {member.user.username && (
                      <p className="truncate text-xs text-muted-foreground" dir="ltr">
                        @{member.user.username}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
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
                        className="inline-flex h-11 items-center rounded-control bg-brand px-3 text-sm font-semibold text-brand-foreground"
                      >
                        بپذیر
                      </button>
                      <button
                        type="button"
                        onClick={() => memberAction(member.userId, 'reject')}
                        className="inline-flex h-11 items-center rounded-control border border-border px-3 text-sm text-muted-foreground"
                      >
                        رد
                      </button>
                    </>
                  )}
                  {member.status === 'ACCEPTED' && (
                    <button
                      type="button"
                      onClick={() => memberAction(member.userId, 'revoke')}
                      className="inline-flex size-11 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
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
