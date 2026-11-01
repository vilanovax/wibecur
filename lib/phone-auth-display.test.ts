import { describe, expect, it } from 'vitest';
import { accountDisplayLabel } from '@/lib/phone-auth';

describe('accountDisplayLabel', () => {
  it('prefers name, then username, and hides phone.wibe emails', () => {
    expect(accountDisplayLabel('سارا', '989100000201@phone.wibe')).toBe('سارا');
    expect(accountDisplayLabel(null, '989100000201@phone.wibe', 'u00000201')).toBe('u00000201');
    expect(accountDisplayLabel(null, '989100000201@phone.wibe')).toBe('حساب من');
    expect(accountDisplayLabel(null, 'sara@example.com')).toBe('sara@example.com');
  });
});
