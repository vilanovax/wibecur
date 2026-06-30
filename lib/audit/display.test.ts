import { describe, expect, it } from 'vitest';
import {
  getAuditActionLabel,
  getAuditDiffRows,
  getEntityDisplayName,
  summarizeChangedFields,
} from '@/lib/audit/display';

describe('audit display', () => {
  it('labels actions in Persian', () => {
    expect(getAuditActionLabel('LIST_UPDATE')).toBe('ویرایش لیست');
  });

  it('builds diff rows excluding unchanged fields', () => {
    const rows = getAuditDiffRows(
      { title: 'قدیم', isActive: true, updatedAt: '2024-01-01' },
      { title: 'جدید', isActive: true, updatedAt: '2024-01-02' }
    );
    expect(rows.map((r) => r.key)).toEqual(['title', 'updatedAt']);
    expect(rows[0]?.before).toBe('قدیم');
    expect(rows[0]?.after).toBe('جدید');
  });

  it('summarizes meaningful changes', () => {
    expect(
      summarizeChangedFields({ title: 'a' }, { title: 'b', updatedAt: 'x' })
    ).toBe('عنوان');
  });

  it('extracts entity display name', () => {
    expect(
      getEntityDisplayName('LIST', null, { title: 'بهترین کتاب‌ها' })
    ).toBe('بهترین کتاب‌ها');
  });
});
