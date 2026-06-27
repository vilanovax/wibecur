'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import BottomSheet from '@/components/mobile/shared/BottomSheet';
import ConfirmBottomSheet from '@/components/mobile/shared/ConfirmBottomSheet';
import Toast from '@/components/shared/Toast';
import AvatarSelectionSheet from './AvatarSelectionSheet';
import { Camera, Check, Eye, EyeOff, KeyRound, Loader2, XCircle } from 'lucide-react';
import { VIBE_AVATARS, isUserEliteLevel } from '@/lib/vibe-avatars';
import type { CuratorLevelKey } from '@/lib/curator';
import { getLevelConfig } from '@/lib/curator';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import EliteAvatarFrame from '@/components/shared/EliteAvatarFrame';
import { normalizeUsername, sanitizeUsernameInput, validateUsernameFormat } from '@/lib/username';

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

type UsernameCheckStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

const inputClass =
  'w-full h-11 px-3 rounded-xl border border-wibe bg-white wibe-small text-foreground placeholder:text-wibe-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors';

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
    <label htmlFor={htmlFor} className="mb-1.5 block text-right">
      <span className="wibe-caption font-medium text-foreground">
        {children}
        {required && <span className="text-red-500 ms-0.5">*</span>}
      </span>
      {hint && <span className="mt-0.5 block wibe-caption text-wibe-secondary">{hint}</span>}
    </label>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        dir="ltr"
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-primary' : 'bg-gray-200'
        }`}
      >
        <span
          className={`absolute top-0.5 start-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
      <div className="min-w-0 flex-1 text-right">
        <span className="block wibe-small font-medium text-foreground">{label}</span>
        {description && (
          <span className="mt-0.5 block wibe-caption leading-relaxed text-wibe-secondary">
            {description}
          </span>
        )}
      </div>
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
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`${inputClass} pe-10`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute end-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-wibe-secondary hover:bg-gray-100"
          aria-label={visible ? 'مخفی کردن رمز' : 'نمایش رمز'}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
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
  currentVibeAvatar?: (typeof VIBE_AVATARS)[number];
  imageUrl: string | null;
  displayName: string;
  email: string;
  avatarStatus: 'APPROVED' | 'PENDING' | 'REJECTED' | null;
  isElite: boolean;
}) {
  const inner = (
    <div className="relative">
      <div
        className="relative overflow-hidden rounded-full border-2 border-wibe bg-wibe-card shadow-sm"
        style={{ width: size, height: size }}
      >
        {avatarType === 'DEFAULT' && currentVibeAvatar ? (
          <div
            className={`flex h-full w-full items-center justify-center text-3xl ${currentVibeAvatar.bgClass}`}
          >
            {currentVibeAvatar.emoji}
          </div>
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
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
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

  const currentVibeAvatar = VIBE_AVATARS.find((a) => a.id === avatarId);
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

  const usernameInputBorder =
    usernameStatus === 'taken' || usernameStatus === 'invalid'
      ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
      : usernameStatus === 'available'
        ? 'border-emerald-300 focus:border-emerald-400 focus:ring-emerald-200'
        : 'border-wibe focus:border-primary focus:ring-primary/20';

  return (
    <>
      <BottomSheet
        isOpen={isOpen}
        onClose={requestClose}
        title="ویرایش پروفایل"
        subtitle={isDirty ? 'تغییرات ذخیره نشده' : 'نام، آواتار و تنظیمات نمایش'}
        maxHeight="92vh"
        escapeToClose={!showDiscardConfirm}
        closeOnBackdrop={!showDiscardConfirm}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-2.5 pb-4">
            {error && (
              <div className="mb-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 wibe-caption text-red-600">
                {error}
              </div>
            )}

            {/* Avatar — compact hero */}
            <section className="mb-4 flex flex-col items-center rounded-2xl bg-wibe-surface/70 px-3 py-4">
              <button
                type="button"
                onClick={() => setShowAvatarSheet(true)}
                className="group relative rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                aria-label="تغییر آواتار"
              >
                <AvatarPreview
                  avatarType={avatarType}
                  currentVibeAvatar={currentVibeAvatar}
                  imageUrl={imageUrl}
                  displayName={displayName}
                  email={user.email}
                  avatarStatus={avatarStatus}
                  isElite={isElite}
                />
                <span className="absolute -bottom-0.5 -end-0.5 flex h-8 w-8 items-center justify-center rounded-full border-2 border-wibe-card bg-primary text-white shadow-md transition-transform group-active:scale-95">
                  <Camera className="h-3.5 w-3.5" />
                </span>
              </button>

              <p className="mt-3 wibe-small font-medium text-foreground">آواتار</p>
              <p className="mt-0.5 wibe-caption text-wibe-secondary">
                {avatarType === 'UPLOADED' && avatarStatus === 'PENDING'
                  ? 'عکس در انتظار تأیید است'
                  : 'از مجموعه vibe یا عکس شخصی'}
              </p>
              <button
                type="button"
                onClick={() => setShowAvatarSheet(true)}
                className="mt-2.5 inline-flex h-9 items-center gap-1.5 rounded-xl border border-primary/25 bg-primary/5 px-4 wibe-caption font-semibold text-primary transition-transform active:scale-[0.98]"
              >
                <Camera className="h-3.5 w-3.5" />
                تغییر آواتار
              </button>
            </section>

            {/* Basic info */}
            <section className="space-y-3.5">
              <h3 className="wibe-caption font-semibold uppercase tracking-wide text-wibe-secondary">
                اطلاعات پایه
              </h3>

              <div>
                <FieldLabel htmlFor="edit-display-name" required>
                  نام نمایشی
                </FieldLabel>
                <input
                  id="edit-display-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="نام شما"
                  autoComplete="name"
                  className={inputClass}
                />
              </div>

              <div>
                <FieldLabel htmlFor="edit-username" hint="فقط حروف انگلیسی، عدد و _">
                  نام کاربری
                </FieldLabel>
                <div className="relative">
                  <span
                    className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 wibe-caption text-wibe-secondary"
                    aria-hidden
                  >
                    @
                  </span>
                  <input
                    id="edit-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(sanitizeUsernameInput(e.target.value))}
                    placeholder="username"
                    dir="ltr"
                    autoComplete="username"
                    aria-invalid={usernameStatus === 'taken' || usernameStatus === 'invalid'}
                    aria-describedby={
                      usernameHint ? 'edit-username-hint' : undefined
                    }
                    className={`${inputClass} ps-7 pe-9 font-mono text-left ${usernameInputBorder}`}
                  />
                  {usernameStatus === 'checking' && (
                    <Loader2
                      className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-wibe-secondary"
                      aria-hidden
                    />
                  )}
                  {usernameStatus === 'available' && (
                    <Check
                      className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600"
                      aria-hidden
                    />
                  )}
                  {(usernameStatus === 'taken' || usernameStatus === 'invalid') && (
                    <XCircle
                      className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-red-500"
                      aria-hidden
                    />
                  )}
                </div>
                {usernameHint && (
                  <p
                    id="edit-username-hint"
                    className={`mt-1.5 text-right wibe-caption ${
                      usernameStatus === 'available'
                        ? 'text-emerald-600'
                        : usernameStatus === 'checking'
                          ? 'text-wibe-secondary'
                          : usernameStatus === 'taken' || usernameStatus === 'invalid'
                            ? 'text-red-600'
                            : 'text-wibe-secondary'
                    }`}
                  >
                    {usernameHint}
                  </p>
                )}
              </div>

              {isTrustedOrAbove && (
                <div className="flex justify-end">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 wibe-caption font-medium ${levelConfig.bgClass}`}
                  >
                    <span aria-hidden>{levelConfig.icon}</span>
                    {levelConfig.short}
                  </span>
                </div>
              )}
            </section>

            <div className="my-4 h-px bg-wibe" aria-hidden />

            {/* Bio */}
            <section>
              <div className="mb-1.5 flex items-baseline justify-between gap-2">
                <span
                  className={`wibe-caption tabular-nums ${
                    bioRemaining < 20 ? 'text-amber-600' : 'text-wibe-secondary'
                  }`}
                >
                  {bio.length.toLocaleString('fa-IR')}/{BIO_MAX.toLocaleString('fa-IR')}
                </span>
                <h3 className="wibe-small font-semibold text-foreground">بیو</h3>
              </div>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
                placeholder="چند خط درباره vibe خودت بنویس…"
                rows={3}
                className="w-full min-h-[88px] resize-none rounded-xl border border-wibe bg-white px-3 py-2.5 wibe-small text-foreground placeholder:text-wibe-secondary/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="mt-1.5 text-right wibe-caption text-wibe-secondary">
                در پروفایل عمومی نمایش داده می‌شود
              </p>
            </section>

            <div className="my-4 h-px bg-wibe" aria-hidden />

            {/* Password */}
            <section>
              <div className="mb-3 flex items-center justify-end gap-2">
                <h3 className="wibe-caption font-semibold uppercase tracking-wide text-wibe-secondary">
                  رمز عبور
                </h3>
                <KeyRound className="h-4 w-4 text-wibe-secondary" aria-hidden />
              </div>
              {hasPassword === null ? (
                <p className="text-right wibe-caption text-wibe-secondary animate-pulse">
                  در حال بررسی…
                </p>
              ) : hasPassword === false ? (
                <p className="text-right wibe-caption leading-relaxed text-wibe-secondary">
                  برای این حساب رمز تنظیم نشده است.
                </p>
              ) : (
                <div className="space-y-3 rounded-2xl border border-wibe bg-wibe-card p-3">
                  {passwordError && (
                    <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 wibe-caption text-red-600">
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
                  <PasswordField
                    id="edit-new-password"
                    label="رمز جدید"
                    value={newPassword}
                    onChange={setNewPassword}
                    placeholder="حداقل ۸ کاراکتر"
                    autoComplete="new-password"
                  />
                  <PasswordField
                    id="edit-confirm-password"
                    label="تکرار رمز جدید"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    autoComplete="new-password"
                  />
                  <p className="text-right wibe-caption text-wibe-secondary">
                    پس از تغییر، با رمز جدید وارد شوید.
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleChangePassword()}
                    disabled={
                      isChangingPassword ||
                      !currentPassword ||
                      !newPassword ||
                      !confirmPassword
                    }
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-primary/25 bg-primary/5 wibe-small font-semibold text-primary transition-colors hover:bg-primary/10 disabled:opacity-45"
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        در حال تغییر…
                      </>
                    ) : (
                      'تغییر رمز عبور'
                    )}
                  </button>
                </div>
              )}
            </section>

            <div className="my-4 h-px bg-wibe" aria-hidden />

            {/* Settings */}
            <section>
              <h3 className="mb-1 wibe-caption font-semibold uppercase tracking-wide text-wibe-secondary">
                تنظیمات
              </h3>
              <div className="divide-y divide-wibe rounded-2xl border border-wibe bg-wibe-card px-3">
                <ToggleRow
                  label="نمایش مدال"
                  description="نشان سطح کیوریتور در پروفایل"
                  checked={showBadge}
                  onChange={setShowBadge}
                />
                <ToggleRow
                  label="اعلان کامنت"
                  description="وقتی روی لیستت کامنت می‌گذارند"
                  checked={allowCommentNotifications}
                  onChange={setAllowCommentNotifications}
                />
                <ToggleRow
                  label="به‌روزرسانی لیست‌های ذخیره‌شده"
                  description="وقتی آیتم جدید به لیستی که ذخیره کردی اضافه شود"
                  checked={allowBookmarkListNotifications}
                  onChange={setAllowBookmarkListNotifications}
                />
              </div>
            </section>
          </div>

          {/* Sticky footer */}
          <div className="flex-shrink-0 border-t border-wibe bg-wibe-card px-2.5 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={requestClose}
                disabled={isSaving}
                className="h-11 flex-1 rounded-xl border border-wibe bg-white wibe-small font-semibold text-foreground transition-colors hover:bg-gray-50 active:scale-[0.99] disabled:opacity-50"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!canSave}
                className="flex h-11 flex-[1.4] items-center justify-center gap-2 rounded-xl bg-primary wibe-small font-semibold text-white transition-transform active:scale-[0.99] disabled:opacity-45"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    در حال ذخیره...
                  </>
                ) : (
                  'ذخیره تغییرات'
                )}
              </button>
            </div>
          </div>
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
