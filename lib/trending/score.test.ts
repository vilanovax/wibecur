import { describe, it, expect } from 'vitest';
import {
  calculateTrendingScore,
  getTrendingBadge,
  calculateSaveVelocity,
  applyFastRisingBoost,
} from './score';

describe('calculateTrendingScore', () => {
  it('امتیاز پایه', () => {
    const score = calculateTrendingScore({
      S7: 10,
      L7: 5,
      C7: 3,
      V7: 0,
      AgeDays: 7,
      SaveVelocity: 2,
    });
    expect(score).toBeGreaterThan(0);
    // (10*4 + 3*3 + 5*2 + 0*0.5 + 2*5) / (1 + 7*0.1) = (40+9+10+10) / 1.7 ≈ 40.58
    expect(score).toBeCloseTo((40 + 9 + 10 + 10) / 1.7, 1);
  });

  it('لیست جدید امتیاز بالاتر', () => {
    const old = calculateTrendingScore({
      S7: 10,
      L7: 5,
      C7: 3,
      V7: 0,
      AgeDays: 30,
      SaveVelocity: 2,
    });
    const fresh = calculateTrendingScore({
      S7: 10,
      L7: 5,
      C7: 3,
      V7: 0,
      AgeDays: 1,
      SaveVelocity: 2,
    });
    expect(fresh).toBeGreaterThan(old);
  });

  it('SaveVelocity تأثیر دارد', () => {
    const low = calculateTrendingScore({
      S7: 5,
      L7: 0,
      C7: 0,
      V7: 0,
      AgeDays: 5,
      SaveVelocity: 0.5,
    });
    const high = calculateTrendingScore({
      S7: 5,
      L7: 0,
      C7: 0,
      V7: 0,
      AgeDays: 5,
      SaveVelocity: 5,
    });
    expect(high).toBeGreaterThan(low);
  });
});

describe('getTrendingBadge', () => {
  it('امتیاز زیر ۳۰۰ → none', () => {
    expect(getTrendingBadge(0)).toBe('none');
    expect(getTrendingBadge(299)).toBe('none');
  });

  it('امتیاز ۳۰۰ تا ۵۹۹ → hot', () => {
    expect(getTrendingBadge(300)).toBe('hot');
    expect(getTrendingBadge(599)).toBe('hot');
  });

  it('امتیاز ۶۰۰+ → viral', () => {
    expect(getTrendingBadge(600)).toBe('viral');
    expect(getTrendingBadge(1000)).toBe('viral');
  });
});

describe('calculateSaveVelocity', () => {
  it('S7=0 → 0', () => {
    expect(calculateSaveVelocity(0, 1)).toBe(0);
  });

  it('محاسبه صحیح', () => {
    expect(calculateSaveVelocity(10, 1)).toBe(10);
    expect(calculateSaveVelocity(10, 2)).toBe(5);
  });
});

describe('applyFastRisingBoost', () => {
  it('S1>=20 → +20', () => {
    expect(applyFastRisingBoost(10, 20)).toBe(30);
    expect(applyFastRisingBoost(10, 25)).toBe(30);
  });

  it('S1<20 → بدون تغییر', () => {
    expect(applyFastRisingBoost(10, 19)).toBe(10);
  });
});
