import { afterEach, describe, expect, it, vi } from 'vitest';
import { getSmsIrConfig } from './sms-ir';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('getSmsIrConfig production fail-closed', () => {
  it('does not auto dry-run in production without API key', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('SMS_IR_API_KEY', '');
    vi.stubEnv('SMS_IR_DRY_RUN', '');
    const config = getSmsIrConfig();
    expect(config.dryRun).toBe(false);
    expect(config.apiKey).toBe('');
  });

  it('ignores SMS_IR_DRY_RUN in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('SMS_IR_API_KEY', 'real-key');
    vi.stubEnv('SMS_IR_DRY_RUN', 'true');
    const config = getSmsIrConfig();
    expect(config.dryRun).toBe(false);
  });

  it('allows dry-run in development without key', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('SMS_IR_API_KEY', '');
    vi.stubEnv('SMS_IR_DRY_RUN', '');
    expect(getSmsIrConfig().dryRun).toBe(true);
  });
});
