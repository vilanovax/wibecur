import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  SITE_NAME,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  getBaseUrl,
  toAbsoluteImageUrl,
} from './seo';

describe('SEO constants', () => {
  it('ثابت‌های سایت', () => {
    expect(SITE_NAME).toBe('WibeCur');
    expect(SITE_DESCRIPTION).toContain('لیست');
    expect(SITE_KEYWORDS).toContain('WibeCur');
  });
});

describe('getBaseUrl', () => {
  const origAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  const origAuthUrl = process.env.NEXTAUTH_URL;

  afterEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = origAppUrl;
    process.env.NEXTAUTH_URL = origAuthUrl;
  });

  it('استفاده از NEXT_PUBLIC_APP_URL', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.example.com';
    process.env.NEXTAUTH_URL = '';
    expect(getBaseUrl()).toBe('https://app.example.com');
  });

  it('fallback به NEXTAUTH_URL', () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXTAUTH_URL = 'https://auth.example.com';
    expect(getBaseUrl()).toBe('https://auth.example.com');
  });

  it('fallback به wibecur.ir', () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.NEXTAUTH_URL;
    expect(getBaseUrl()).toBe('https://wibecur.ir');
  });
});

describe('toAbsoluteImageUrl', () => {
  const origAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  const origAuthUrl = process.env.NEXTAUTH_URL;

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXTAUTH_URL = 'https://example.com';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = origAppUrl;
    process.env.NEXTAUTH_URL = origAuthUrl;
  });

  it('برگرداندن undefined برای ورودی null/undefined', () => {
    expect(toAbsoluteImageUrl(null)).toBeUndefined();
    expect(toAbsoluteImageUrl(undefined)).toBeUndefined();
  });

  it('برگرداندن URL کامل بدون تغییر', () => {
    const url = 'https://cdn.example.com/image.jpg';
    expect(toAbsoluteImageUrl(url)).toBe(url);
  });

  it('تبدیل مسیر نسبی به مطلق', () => {
    expect(toAbsoluteImageUrl('/icon-512.png')).toBe('https://example.com/icon-512.png');
  });

  it('مسیر بدون اسلش ابتدایی', () => {
    expect(toAbsoluteImageUrl('images/logo.png')).toBe('https://example.com/images/logo.png');
  });
});
