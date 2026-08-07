import { describe, expect, it, vi, beforeEach } from 'vitest';
import { changeUserPassword } from '@/lib/user-password-server';

const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    users: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
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
