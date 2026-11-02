import { describe, expect, it } from 'vitest';
import { POST } from './route';

describe('POST /api/auth/register', () => {
  it('returns 410 Gone — password registration without OTP is disabled', async () => {
    const res = await POST();
    expect(res.status).toBe(410);
    const body = await res.json();
    expect(body.success).toBe(false);
  });
});
