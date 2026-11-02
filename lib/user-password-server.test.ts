import { describe, expect, it, vi, beforeEach } from 'vitest';
import { changeUserPassword, setUserPasswordWithOtp } from '@/lib/user-password-server';

const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();
const mockConsumeOtp = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    users: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}));

vi.mock('@/lib/otp', () => ({
  consumeOtp: (...args: unknown[]) => mockConsumeOtp(...args),
  normalizeOtpInput: (v: string) => v.replace(/\D/g, '').slice(0, 5),
  validateOtpInput: (v: string) => (String(v).replace(/\D/g, '').length === 5 ? null : 'کد تأیید باید ۵ رقم باشد'),
}));

vi.mock('bcryptjs', () => ({
  default: {
    compareSync: (plain: string, hash: string) => plain === 'correct' && hash === 'hash',
    hashSync: (plain: string) => `hashed:${plain}`,
  },
}));

describe('changeUserPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindUnique.mockResolvedValue({
      id: 'u1',
      password: 'hash',
      isActive: true,
      deletedAt: null,
    });
    mockUpdate.mockResolvedValue({});
  });

  it('rejects wrong current password', async () => {
    const result = await changeUserPassword('u1', {
      currentPassword: 'wrong',
      newPassword: 'newpassword1',
      confirmPassword: 'newpassword1',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('اشتباه');
  });

  it('updates password when valid', async () => {
    const result = await changeUserPassword('u1', {
      currentPassword: 'correct',
      newPassword: 'newpassword1',
      confirmPassword: 'newpassword1',
    });
    expect(result.ok).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u1' },
        data: expect.objectContaining({ password: 'hashed:newpassword1' }),
      })
    );
  });
});

describe('setUserPasswordWithOtp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindUnique.mockResolvedValue({
      id: 'u1',
      isActive: true,
      deletedAt: null,
    });
    mockUpdate.mockResolvedValue({});
    mockConsumeOtp.mockResolvedValue({ ok: true, purpose: 'set-password' });
  });

  it('sets password after a valid otp', async () => {
    const result = await setUserPasswordWithOtp('u1', {
      otp: '12345',
      newPassword: 'newpassword1',
      confirmPassword: 'newpassword1',
      phone: '989121234567',
    });
    expect(result.ok).toBe(true);
    expect(mockConsumeOtp).toHaveBeenCalledWith(
      '989121234567',
      '12345',
      expect.objectContaining({ purpose: 'set-password' })
    );
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ password: 'hashed:newpassword1' }),
      })
    );
  });

  it('rejects invalid otp', async () => {
    mockConsumeOtp.mockResolvedValue({ ok: false, reason: 'mismatch' });
    const result = await setUserPasswordWithOtp('u1', {
      otp: '12345',
      newPassword: 'newpassword1',
      confirmPassword: 'newpassword1',
      phone: '989121234567',
    });
    expect(result.ok).toBe(false);
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
