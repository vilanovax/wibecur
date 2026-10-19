'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import BottomSheet from '@/components/mobile/shared/BottomSheet';
import ConfirmBottomSheet from '@/components/mobile/shared/ConfirmBottomSheet';
import Toast from '@/components/shared/Toast';
import AvatarSelectionSheet from './AvatarSelectionSheet';
import { Camera, Check, KeyRound, Loader2, XCircle, User, Shield, Bell, Sparkles, AtSign, BadgeCheck } from 'lucide-react';
import { isUserEliteLevel, resolveVibeAvatar, type VibeAvatarOption } from '@/lib/vibe-avatars';
import VibeAvatarDisplay from '@/components/shared/VibeAvatarDisplay';
import type { CuratorLevelKey } from '@/lib/curator';
import { getLevelConfig } from '@/lib/curator';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import EliteAvatarFrame from '@/components/shared/EliteAvatarFrame';
import { normalizeUsername, sanitizeUsernameInput, validateUsernameFormat } from '@/lib/username';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PasswordInput } from '@/components/ui/password-input';
import { Switch } from '@/components/ui/switch';

export interface EditProfileUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  username?: string | null;
  bio?: string | null;
  avatarType?: 'DEFAULT' | 'UPLOADED';
  avatarId?: string | null;
  avatarStatus?: 'APPROVED' | 'PENDING' | 'REJECTED' | null;
  showBadge?: boolean;
  allowCommentNotifications?: boolean;
  allowBookmarkListNotifications?: boolean;
  curatorLevel?: string;
}

interface EditProfileSheet2Props {
  isOpen: boolean;
  onClose: () => void;
  user: EditProfileUser;
  userLevel: CuratorLevelKey;
  onUpdate: () => void;
}

const BIO_MAX = 160;
const USERNAME_CHECK_DEBOUNCE_MS = 450;

type EditTab = 'profile' | 'security' | 'preferences';

const EDIT_TABS: { id: EditTab; label: string; icon: typeof User }[] = [
  { id: 'profile', label: 'پروفایل', icon: User },
  { id: 'security', label: 'امنیت', icon: Shield },
  { id: 'preferences', label: 'اعلان‌ها', icon: Bell },
];

type UsernameCheckStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

function FieldLabel({
  htmlFor,
  children,
  hint,
  required,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  hint?: string;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-start" dir="rtl">
      <span className="wibe-caption font-medium text-foreground">
        {required && <span className="me-0.5 text-destructive">*</span>}
        {children}
      </span>
      {hint && (
        <span className="mt-0.5 block wibe-caption leading-relaxed text-muted-foreground">{hint}</span>
      )}
    </label>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  icon,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center justify-between gap-4 rounded-xl px-3 py-3.5 transition-colors hover:bg-muted"
      dir="rtl"
    >
      <div className="flex min-w-0 flex-1 items-start gap-3 text-start">
        {icon && (
          <span className="flex size-11 shrink-0 items-center justify-center rounded-surface bg-brand/10 text-brand">
            {icon}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <span className="block wibe-small font-medium text-foreground">{label}</span>
          {description && (
            <span className="mt-0.5 block wibe-caption leading-relaxed text-muted-foreground">
              {description}
            </span>
          )}
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}

function EditTabBar({
  active,
  onChange,
  dirtyProfile,
}: {
  active: EditTab;
  onChange: (tab: EditTab) => void;
  dirtyProfile: boolean;
}) {
  return (
    <div
      className="mb-4 flex gap-1.5 rounded-xl border border-border bg-muted p-1"
      dir="rtl"
      role="tablist"
      aria-label="بخش‌های ویرایش پروفایل"
    >
      {EDIT_TABS.map(({ id, label, icon: Icon }) => {
        const selected = active === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(id)}
            className={`relative flex h-11 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-semibold transition-colors ${
              selected
                ? 'bg-popover text-brand shadow-sm'
                : 'text-muted-foreground'
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>{label}</span>
            {id !== 'security' && dirtyProfile && (
              <span
                className={`absolute top-1.5 end-1.5 h-1.5 w-1.5 rounded-full ${
                  selected ? 'bg-brand' : 'bg-warning'
                }`}
                aria-hidden
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

function SectionHeader({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-start gap-2" dir="rtl">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary">
        {icon}
      </span>
      <h3 className="wibe-small font-semibold text-foreground">{title}</h3>
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <div dir="rtl">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <PasswordInput
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="h-12"
      />
    </div>
  );
}

function AvatarPreview({
  size = 72,
  avatarType,
  currentVibeAvatar,
  imageUrl,
  displayName,
  email,
  avatarStatus,
  isElite,
}: {
  size?: number;
  avatarType: 'DEFAULT' | 'UPLOADED';
  currentVibeAvatar?: VibeAvatarOption;
  imageUrl: string | null;
  displayName: string;
  email: string;
  avatarStatus: 'APPROVED' | 'PENDING' | 'REJECTED' | null;
  isElite: boolean;
}) {
  const inner = (
    <div className="relative">
      <div
        className="relative overflow-hidden rounded-full border-2 border-border bg-popover shadow-sm"
        style={{ width: size, height: size }}
      >
        {avatarType === 'DEFAULT' && currentVibeAvatar ? (
          <VibeAvatarDisplay avatar={currentVibeAvatar} size={size} className="h-full w-full" />
        ) : imageUrl ? (
          <ImageWithFallback
            src={imageUrl}
            alt="آواتار"
            className="h-full w-full object-cover"
            fallbackIcon={(displayName?.[0] || '?').toUpperCase()}
            fallbackClassName="flex h-full w-full items-center justify-center bg-primary/10 text-lg font-bold text-primary"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary/10 text-xl font-bold text-primary">
            {(displayName?.[0] || email?.[0] || '?').toUpperCase()}
          </div>
        )}
      </div>
      {avatarType === 'UPLOADED' && avatarStatus === 'PENDING' && (
        <span className="absolute -bottom-1 inset-x-0 mx-auto w-fit whitespace-nowrap rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-foreground">
          در انتظار تأیید
        </span>
      )}
    </div>
  );

  if (isElite) {
    return <EliteAvatarFrame size={size + 6}>{inner}</EliteAvatarFrame>;
  }
  return inner;
}

function buildSnapshot(user: EditProfileUser) {
  return {
    displayName: user.name ?? '',
    username: user.username ?? '',
    bio: (user.bio ?? '').slice(0, BIO_MAX),
    showBadge: user.showBadge ?? true,
    allowCommentNotifications: user.allowCommentNotifications ?? true,
    allowBookmarkListNotifications: user.allowBookmarkListNotifications ?? true,
    avatarType: user.avatarType ?? 'DEFAULT',
    avatarId: user.avatarId ?? null,
  };
}

export default function EditProfileSheet2({
  isOpen,
  onClose,
  user,
  userLevel,
  onUpdate,
}: EditProfileSheet2Props) {
  const initialRef = useRef(buildSnapshot(user));

  const [displayName, setDisplayName] = useState(user.name ?? '');
  const [username, setUsername] = useState(user.username ?? '');
  const [bio, setBio] = useState(user.bio ?? '');
  const [showBadge, setShowBadge] = useState(user.showBadge ?? true);
  const [allowCommentNotifications, setAllowCommentNotifications] = useState(
    user.allowCommentNotifications ?? true
  );
  const [allowBookmarkListNotifications, setAllowBookmarkListNotifications] = useState(
    user.allowBookmarkListNotifications ?? true
  );
  const [avatarType, setAvatarType] = useState<'DEFAULT' | 'UPLOADED'>(user.avatarType ?? 'DEFAULT');
  const [avatarId, setAvatarId] = useState<string | null>(user.avatarId ?? null);
  const [avatarStatus, setAvatarStatus] = useState<'APPROVED' | 'PENDING' | 'REJECTED' | null>(
    user.avatarStatus ?? null
  );
  const [imageUrl, setImageUrl] = useState<string | null>(user.image ?? null);

  const [showAvatarSheet, setShowAvatarSheet] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<UsernameCheckStatus>('idle');
  const [usernameHint, setUsernameHint] = useState('');
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<EditTab>('profile');
  const prevOpenRef = useRef(false);
  const usernameCheckSeq = useRef(0);

  useEffect(() => {
    const justOpened = isOpen && !prevOpenRef.current;
    prevOpenRef.current = isOpen;
    if (justOpened) {
      const snapshot = buildSnapshot(user);
      initialRef.current = snapshot;
      setDisplayName(snapshot.displayName);
      setUsername(snapshot.username);
      setBio(snapshot.bio);
      setShowBadge(snapshot.showBadge);
      setAllowCommentNotifications(snapshot.allowCommentNotifications);
      setAllowBookmarkListNotifications(snapshot.allowBookmarkListNotifications);
      setAvatarType(snapshot.avatarType);
      setAvatarId(snapshot.avatarId);
      setAvatarStatus(user.avatarStatus ?? null);
      setImageUrl(user.image ?? null);
      setError('');
      setUsernameStatus('idle');
      setUsernameHint('');
      setShowDiscardConfirm(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError('');
      setHasPassword(null);
      setActiveTab('profile');
      void fetch('/api/user/password')
        .then((r) => r.json())
        .then((json) => {
          if (json.success) setHasPassword(Boolean(json.hasPassword));
          else setHasPassword(false);
        })
        .catch(() => setHasPassword(false));
    }
  }, [isOpen, user]);

  useEffect(() => {
    const trimmed = normalizeUsername(username);
    const initial = normalizeUsername(initialRef.current.username);

    if (!trimmed) {
      setUsernameStatus('idle');
      setUsernameHint('');
      return;
    }

    if (trimmed === initial) {
      setUsernameStatus('idle');
      setUsernameHint('');
      return;
    }

    const format = validateUsernameFormat(trimmed);
    if (!format.valid) {
      setUsernameStatus('invalid');
      setUsernameHint(format.error ?? 'نام کاربری نامعتبر است');
      return;
    }

    setUsernameStatus('checking');
    setUsernameHint('در حال بررسی…');

    const seq = ++usernameCheckSeq.current;
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/user/username/check?username=${encodeURIComponent(trimmed)}`
        );
        const data = await res.json();

        if (seq !== usernameCheckSeq.current) return;

        if (!data.success) {
          setUsernameStatus('idle');
          setUsernameHint('');
          return;
        }

        if (data.data.available) {
          setUsernameStatus('available');
          setUsernameHint('این نام کاربری در دسترس است');
        } else if (data.data.reason === 'taken') {
          setUsernameStatus('taken');
          setUsernameHint('این نام کاربری قبلاً استفاده شده');
        } else if (data.data.reason === 'invalid') {
          setUsernameStatus('invalid');
          setUsernameHint(data.data.error ?? 'نام کاربری نامعتبر است');
        } else {
          setUsernameStatus('idle');
          setUsernameHint('');
        }
      } catch {
        if (seq !== usernameCheckSeq.current) return;
        setUsernameStatus('idle');
        setUsernameHint('');
      }
    }, USERNAME_CHECK_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [username]);

  const isDirty = useMemo(() => {
    const initial = initialRef.current;
    return (
      displayName.trim() !== initial.displayName.trim() ||
      username.trim() !== initial.username.trim() ||
      bio !== initial.bio ||
      showBadge !== initial.showBadge ||
      allowCommentNotifications !== initial.allowCommentNotifications ||
      allowBookmarkListNotifications !== initial.allowBookmarkListNotifications ||
      avatarType !== initial.avatarType ||
      avatarId !== initial.avatarId
    );
  }, [
    displayName,
    username,
    bio,
    showBadge,
    allowCommentNotifications,
    allowBookmarkListNotifications,
    avatarType,
    avatarId,
  ]);

  const requestClose = useCallback(() => {
    if (isDirty && !isSaving) {
      setShowDiscardConfirm(true);
      return;
    }
    onClose();
  }, [isDirty, isSaving, onClose]);

  const confirmDiscard = useCallback(() => {
    setShowDiscardConfirm(false);
    onClose();
  }, [onClose]);

  const handleSave = async () => {
    setError('');
    if (!displayName.trim()) {
      setError('نام نمایشی الزامی است');
      return;
    }
    if (usernameStatus === 'taken' || usernameStatus === 'invalid') {
      setError(usernameHint || 'نام کاربری نامعتبر است');
      return;
    }
    if (usernameStatus === 'checking') {
      setError('لطفاً تا پایان بررسی نام کاربری صبر کنید');
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: displayName.trim(),
          username: username.trim() || undefined,
          bio: (bio || '').slice(0, BIO_MAX) || null,
          showBadge,
          allowCommentNotifications,
          allowBookmarkListNotifications,
          avatarType: avatarType || 'DEFAULT',
          avatarId: avatarType === 'DEFAULT' && avatarId ? String(avatarId) : null,
        }),
      });
      let data: { success?: boolean; error?: string } = {};
      try {
        data = await res.json();
      } catch {
        setError('پاسخ سرور نامعتبر بود. دوباره تلاش کنید.');
        return;
      }
      if (!data.success) {
        setError(data.error || 'خطا در ذخیره');
        return;
      }
      initialRef.current = buildSnapshot({
        ...user,
        name: displayName.trim(),
        username: username.trim() || null,
        bio: bio || null,
        showBadge,
        allowCommentNotifications,
        allowBookmarkListNotifications,
        avatarType,
        avatarId,
      });
      onClose();
      onUpdate();
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('profile-updated'));
      setToast({ message: 'تغییرات با موفقیت ذخیره شد', type: 'success' });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در ذخیره');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('هر سه فیلد رمز را پر کنید');
      return;
    }
    setIsChangingPassword(true);
    try {
      const res = await fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'خطا در تغییر رمز');
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setToast({ message: data.message || 'رمز عبور تغییر کرد', type: 'success' });
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : 'خطا در تغییر رمز');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSelectVibeAvatar = (id: string) => {
    setAvatarType('DEFAULT');
    setAvatarId(id);
    setAvatarStatus(null);
    setShowAvatarSheet(false);
  };

  const handleUploadPhoto = async (file: File): Promise<{ success: boolean; message?: string }> => {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    try {
      const res = await fetch('/api/user/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: base64 }),
      });
      const data = await res.json();
      if (!data.success) return { success: false, message: data.error };
      setAvatarType('UPLOADED');
      setAvatarStatus('PENDING');
      setImageUrl(data.data?.user?.image ?? null);
      onUpdate();
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('profile-updated'));
      return { success: true };
    } catch {
      return { success: false, message: 'خطا در آپلود' };
    }
  };

  const currentVibeAvatar = resolveVibeAvatar(avatarId);
  const levelKey = (user.curatorLevel ?? 'EXPLORER') as CuratorLevelKey;
  const levelConfig = getLevelConfig(levelKey);
  const isElite = isUserEliteLevel(levelKey);
  const isTrustedOrAbove =
    ['TRUSTED_CURATOR', 'INFLUENTIAL_CURATOR', 'ELITE_CURATOR', 'VIBE_LEGEND'].indexOf(levelKey) >= 0;

  const bioRemaining = BIO_MAX - bio.length;
  const usernameBlockingSave =
    usernameStatus === 'taken' || usernameStatus === 'invalid' || usernameStatus === 'checking';
  const canSave =
    Boolean(displayName.trim()) && isDirty && !isSaving && !usernameBlockingSave;

  const subtitle =
    activeTab === 'profile'
      ? isDirty
        ? 'تغییرات ذخیره نشده'
        : 'نام، آواتار و بیو'
      : activeTab === 'security'
        ? 'رمز عبور و امنیت حساب'
        : 'اعلان‌ها و نمایش پروفایل';

  const showSaveFooter = activeTab !== 'security';

  const footer = showSaveFooter ? (
    <div className="flex gap-2 px-2.5 lg:px-0" dir="rtl">
      <Button
        type="button"
        variant="brand"
        size="lg"
        className="flex-[1.4]"
        onClick={handleSave}
        disabled={!canSave}
      >
        {isSaving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            در حال ذخیره...
          </>
        ) : (
          'ذخیره تغییرات'
        )}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="flex-1"
        onClick={requestClose}
        disabled={isSaving}
      >
        انصراف
      </Button>
    </div>
  ) : (
    <div className="px-2.5 lg:px-0" dir="rtl">
      <Button type="button" variant="outline" size="lg" className="w-full" onClick={requestClose}>
        بستن
      </Button>
    </div>
  );

  return (
    <>
      <BottomSheet
        isOpen={isOpen}
        onClose={requestClose}
        title="ویرایش پروفایل"
        subtitle={subtitle}
        maxHeight="92vh"
        desktopMaxWidth="lg"
        escapeToClose={!showDiscardConfirm}
        closeOnBackdrop={!showDiscardConfirm}
        footer={footer}
      >
        <div className="px-2.5 pb-2 lg:px-0 lg:pb-1" dir="rtl">
          <EditTabBar active={activeTab} onChange={setActiveTab} dirtyProfile={isDirty} />

          {error && (
            <div className="mb-4 flex items-start justify-start gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-start text-xs text-destructive">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="lg:grid lg:grid-cols-[minmax(148px,168px)_1fr] lg:gap-6 lg:items-start">
              {/* Avatar column */}
              <section className="mb-5 flex flex-row items-center gap-4 rounded-xl border border-border bg-popover p-4 lg:mb-0 lg:flex-col lg:items-center lg:p-5">
                <button
                  type="button"
                  onClick={() => setShowAvatarSheet(true)}
                  className="group relative shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  aria-label="تغییر آواتار"
                >
                  <AvatarPreview
                    size={80}
                    avatarType={avatarType}
                    currentVibeAvatar={currentVibeAvatar}
                    imageUrl={imageUrl}
                    displayName={displayName}
                    email={user.email}
                    avatarStatus={avatarStatus}
                    isElite={isElite}
                  />
                  <span className="absolute -bottom-0.5 -end-0.5 flex size-8 items-center justify-center rounded-full border-2 border-popover bg-brand text-brand-foreground">
                    <Camera className="h-3.5 w-3.5" />
                  </span>
                </button>

                <div className="min-w-0 flex-1 text-start lg:flex-none lg:text-center">
                  <p className="truncate wibe-small font-semibold text-foreground">
                    {displayName.trim() || 'کاربر'}
                  </p>
                  <p className="mt-0.5 truncate wibe-caption text-muted-foreground">
                    <bdi dir="ltr" className="font-mono">
                      @{username || 'username'}
                    </bdi>
                  </p>
                  <p className="mt-1.5 wibe-caption leading-relaxed text-muted-foreground lg:max-w-[140px]">
                    {avatarType === 'UPLOADED' && avatarStatus === 'PENDING'
                      ? 'در انتظار تأیید'
                      : 'آواتار مجموعه یا عکس شخصی'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowAvatarSheet(true)}
                    className="mt-2.5 inline-flex h-11 items-center gap-1.5 rounded-control border border-brand/30 bg-popover px-3.5 text-sm font-semibold text-brand"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    تغییر آواتار
                  </button>
                </div>
              </section>

              {/* Fields column */}
              <section className="space-y-4">
                <div className="rounded-xl border border-border bg-popover p-4 shadow-surface">
                  <SectionHeader title="اطلاعات عمومی" icon={<User className="h-3.5 w-3.5" />} />

                  <div className="space-y-3.5">
                    <div>
                      <FieldLabel htmlFor="edit-display-name" required>
                        نام نمایشی
                      </FieldLabel>
                      <Input
                        id="edit-display-name"
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="نام شما"
                        autoComplete="name"
                        dir="rtl"
                        className="h-12"
                      />
                    </div>

                    <div>
                      <FieldLabel htmlFor="edit-username" hint="فقط حروف انگلیسی، عدد و _">
                        نام کاربری
                      </FieldLabel>
                      <Input
                        id="edit-username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(sanitizeUsernameInput(e.target.value))}
                        placeholder="username"
                        dir="ltr"
                        autoComplete="username"
                        aria-invalid={usernameStatus === 'taken' || usernameStatus === 'invalid'}
                        aria-describedby={usernameHint ? 'edit-username-hint' : undefined}
                        startAddon="@"
                        endAddon={
                          usernameStatus === 'checking' ? (
                            <Loader2 className="size-4 animate-spin" aria-hidden />
                          ) : usernameStatus === 'available' ? (
                            <Check className="size-4 text-success" aria-hidden />
                          ) : usernameStatus === 'taken' || usernameStatus === 'invalid' ? (
                            <XCircle className="size-4 text-destructive" aria-hidden />
                          ) : null
                        }
                        className="h-12"
                      />
                      {usernameHint && (
                        <p
                          id="edit-username-hint"
                          className={`mt-1.5 text-start text-xs ${
                            usernameStatus === 'available'
                              ? 'text-success'
                              : usernameStatus === 'checking'
                                ? 'text-muted-foreground'
                                : usernameStatus === 'taken' || usernameStatus === 'invalid'
                                  ? 'text-destructive'
                                  : 'text-muted-foreground'
                          }`}
                        >
                          {usernameHint}
                        </p>
                      )}
                    </div>

                    {isTrustedOrAbove && (
                      <div className="flex justify-start pt-0.5" dir="rtl">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 wibe-caption font-medium ${levelConfig.bgClass}`}
                        >
                          <span aria-hidden>{levelConfig.icon}</span>
                          {levelConfig.short}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-popover p-4 shadow-surface">
                  <div className="mb-3 flex items-baseline justify-between gap-2" dir="rtl">
                    <h3 className="wibe-small font-semibold text-foreground">بیو</h3>
                    <span
                      className={`wibe-caption tabular-nums ${
                        bioRemaining < 20 ? 'font-medium text-warning' : 'text-muted-foreground'
                      }`}
                    >
                      {bio.length.toLocaleString('fa-IR')} از {BIO_MAX.toLocaleString('fa-IR')}
                    </span>
                  </div>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
                    placeholder="چند خط درباره خودت بنویس…"
                    rows={3}
                    maxLength={BIO_MAX}
                    dir="rtl"
                    className="min-h-24"
                  />
                  <p className="mt-2 text-start wibe-caption text-muted-foreground">
                    در پروفایل عمومی نمایش داده می‌شود
                  </p>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'security' && (
            <section className="mx-auto max-w-md" dir="rtl">
              <div className="mb-4 flex flex-col items-center text-center">
                <span className="flex size-14 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <KeyRound className="h-6 w-6" />
                </span>
                <h3 className="mt-3 wibe-body font-semibold text-foreground">تغییر رمز عبور</h3>
                <p className="mt-1 max-w-xs wibe-caption leading-relaxed text-muted-foreground">
                  برای امنیت بیشتر، رمز قوی و منحصربه‌فرد انتخاب کنید.
                </p>
              </div>

              {hasPassword === null ? (
                <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-muted px-4 py-8 text-start text-xs text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  در حال بررسی…
                </div>
              ) : hasPassword === false ? (
                <div className="rounded-xl border border-dashed border-border bg-muted px-4 py-8 text-center">
                  <p className="wibe-small font-medium text-foreground">رمز تنظیم نشده</p>
                  <p className="mt-1.5 wibe-caption leading-relaxed text-muted-foreground">
                    برای این حساب رمز عبور تعریف نشده است.
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5 rounded-xl border border-border bg-popover p-4 shadow-surface">
                  {passwordError && (
                    <p className="flex items-start justify-start gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-start text-xs text-destructive">
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                      {passwordError}
                    </p>
                  )}
                  <PasswordField
                    id="edit-current-password"
                    label="رمز فعلی"
                    value={currentPassword}
                    onChange={setCurrentPassword}
                    autoComplete="current-password"
                  />
                  <div className="grid gap-3.5 lg:grid-cols-2">
                    <PasswordField
                      id="edit-new-password"
                      label="رمز جدید"
                      value={newPassword}
                      onChange={setNewPassword}
                      placeholder="حداقل ۶ کاراکتر"
                      autoComplete="new-password"
                    />
                    <PasswordField
                      id="edit-confirm-password"
                      label="تکرار رمز جدید"
                      value={confirmPassword}
                      onChange={setConfirmPassword}
                      autoComplete="new-password"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="brand"
                    size="lg"
                    className="w-full"
                    onClick={() => void handleChangePassword()}
                    disabled={
                      isChangingPassword ||
                      !currentPassword ||
                      !newPassword ||
                      !confirmPassword
                    }
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        در حال تغییر…
                      </>
                    ) : (
                      <>
                        <KeyRound className="h-4 w-4" />
                        تغییر رمز عبور
                      </>
                    )}
                  </Button>
                  <p className="text-center wibe-caption text-muted-foreground">
                    پس از تغییر، با رمز جدید وارد شوید.
                  </p>
                </div>
              )}
            </section>
          )}

          {activeTab === 'preferences' && (
            <section className="space-y-4" dir="rtl">
              <SectionHeader title="تنظیمات نمایش و اعلان" icon={<Bell className="h-3.5 w-3.5" />} />
              <div className="rounded-xl border border-border bg-popover px-1 py-1 shadow-surface">
                <ToggleRow
                  label="نمایش مدال"
                  description="نشان سطح کیوریتور در پروفایل عمومی"
                  checked={showBadge}
                  onChange={setShowBadge}
                  icon={<BadgeCheck className="h-4 w-4" />}
                />
                <div className="mx-3 h-px bg-border" aria-hidden />
                <ToggleRow
                  label="اعلان کامنت"
                  description="وقتی روی لیستت کامنت می‌گذارند"
                  checked={allowCommentNotifications}
                  onChange={setAllowCommentNotifications}
                  icon={<AtSign className="h-4 w-4" />}
                />
                <div className="mx-3 h-px bg-border" aria-hidden />
                <ToggleRow
                  label="به‌روزرسانی لیست‌های ذخیره‌شده"
                  description="وقتی آیتم جدید به لیستی که ذخیره کردی اضافه شود"
                  checked={allowBookmarkListNotifications}
                  onChange={setAllowBookmarkListNotifications}
                  icon={<Sparkles className="h-4 w-4" />}
                />
              </div>

              <p className="rounded-xl bg-muted px-3 py-2.5 text-start text-xs leading-relaxed text-muted-foreground">
                تغییرات این بخش با دکمه «ذخیره تغییرات» در پایین اعمال می‌شود.
              </p>
            </section>
          )}
        </div>
      </BottomSheet>

      <ConfirmBottomSheet
        isOpen={showDiscardConfirm}
        onClose={() => setShowDiscardConfirm(false)}
        onConfirm={confirmDiscard}
        title="تغییرات ذخیره نشده"
        message="اگر الان ببندی، تغییراتی که دادی از بین می‌ره."
        confirmLabel="بستن بدون ذخیره"
        cancelLabel="ادامه ویرایش"
        variant="danger"
      />

      <AvatarSelectionSheet
        isOpen={showAvatarSheet}
        onClose={() => setShowAvatarSheet(false)}
        currentAvatarId={avatarId}
        currentAvatarType={avatarType}
        currentAvatarStatus={avatarStatus}
        currentImageUrl={imageUrl}
        userLevel={userLevel}
        onSelectVibeAvatar={handleSelectVibeAvatar}
        onUploadPhoto={handleUploadPhoto}
      />

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </>
  );
}
