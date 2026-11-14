import { describe, expect, it, vi, beforeEach } from 'vitest';
import { resolveCategoryParentId } from '@/lib/admin/category-parent';

function mockPrisma(overrides?: {
  parent?: { id: string; parentId: string | null; deletedAt: Date | null; name: string } | null;
  childCount?: number;
}) {
  return {
    categories: {
      findUnique: vi.fn(async () => overrides?.parent ?? null),
      count: vi.fn(async () => overrides?.childCount ?? 0),
    },
  } as never;
}

describe('resolveCategoryParentId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('clears empty parent', async () => {
    const prisma = mockPrisma();
    await expect(resolveCategoryParentId(prisma, { parentId: '' })).resolves.toEqual({
      ok: true,
      parentId: null,
    });
    await expect(resolveCategoryParentId(prisma, { parentId: null })).resolves.toEqual({
      ok: true,
      parentId: null,
    });
  });

  it('rejects self parent', async () => {
    const prisma = mockPrisma();
    await expect(
      resolveCategoryParentId(prisma, { categoryId: 'c1', parentId: 'c1' })
    ).resolves.toEqual({ ok: false, error: 'دسته نمی‌تواند مادر خودش باشد' });
  });

  it('rejects missing parent', async () => {
    const prisma = mockPrisma({ parent: null });
    await expect(resolveCategoryParentId(prisma, { parentId: 'x' })).resolves.toMatchObject({
      ok: false,
    });
  });

  it('rejects nested parent (one level only)', async () => {
    const prisma = mockPrisma({
      parent: { id: 'p', parentId: 'root', deletedAt: null, name: 'فرزند' },
    });
    await expect(resolveCategoryParentId(prisma, { parentId: 'p' })).resolves.toMatchObject({
      ok: false,
    });
  });

  it('accepts root parent', async () => {
    const prisma = mockPrisma({
      parent: { id: 'root', parentId: null, deletedAt: null, name: 'کودک و نوجوان' },
    });
    await expect(
      resolveCategoryParentId(prisma, { categoryId: 'child', parentId: 'root' })
    ).resolves.toEqual({ ok: true, parentId: 'root' });
  });

  it('rejects making a parent category into a child', async () => {
    const prisma = mockPrisma({
      parent: { id: 'root', parentId: null, deletedAt: null, name: 'ریشه' },
      childCount: 2,
    });
    await expect(
      resolveCategoryParentId(prisma, { categoryId: 'has-kids', parentId: 'root' })
    ).resolves.toMatchObject({ ok: false });
  });
});
