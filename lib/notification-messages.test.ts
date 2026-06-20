import { describe, expect, it } from 'vitest';
import {
  formatListItemAddedNotification,
  resolveItemTypeLabel,
} from './notification-messages';

describe('resolveItemTypeLabel', () => {
  it('prefers category name', () => {
    expect(resolveItemTypeLabel('movie', 'فیلم')).toBe('فیلم');
  });

  it('falls back to slug label', () => {
    expect(resolveItemTypeLabel('restaurant', null)).toBe('رستوران');
  });

  it('uses generic label when unknown', () => {
    expect(resolveItemTypeLabel(null, null)).toBe('آیتم');
  });
});

describe('formatListItemAddedNotification', () => {
  it('formats single item message', () => {
    expect(
      formatListItemAddedNotification(1, 'فیلم', 'فیلم‌های اکشن ۲۰۲۵')
    ).toEqual({
      title: 'لیست ذخیره‌شده به‌روز شد',
      message: '۱ فیلم به «فیلم‌های اکشن ۲۰۲۵» اضافه شد',
    });
  });

  it('formats plural count message', () => {
    expect(
      formatListItemAddedNotification(3, 'رستوران', 'بهترین رستوران‌های روباز')
    ).toEqual({
      title: 'لیست ذخیره‌شده به‌روز شد',
      message: '۳ رستوران به «بهترین رستوران‌های روباز» اضافه شد',
    });
  });
});
