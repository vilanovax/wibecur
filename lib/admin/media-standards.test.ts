import { describe, expect, it } from 'vitest';
import { mediaIssues, mediaSource, parseMediaIssue } from './media-standards';

describe('mediaIssues', () => {
  it('flags a small, heavy, non-webp list banner', () => {
    expect(
      mediaIssues({
        kind: 'list-banner',
        url: 'https://cdn.example/a.jpg',
        bytes: 200 * 1024,
        width: 800,
        height: 400,
        format: 'jpeg',
        broken: false,
      })
    ).toEqual(['format', 'heavy', 'small', 'ratio']);
  });

  it('accepts a list banner at the standard size', () => {
    expect(
      mediaIssues({
        kind: 'list-banner',
        url: 'https://c466145.parspack.net/c466145/wibe/a.webp',
        bytes: 140 * 1024,
        width: 1600,
        height: 686,
        format: 'webp',
        broken: false,
      })
    ).toEqual([]);
  });

  it('does not treat a missing image as a broken link', () => {
    expect(
      mediaIssues({
        kind: 'item',
        url: null,
        bytes: null,
        width: null,
        height: null,
        format: null,
        broken: true,
      })
    ).toEqual([]);
  });
});

describe('mediaSource', () => {
  it('splits local files, ParsPack, and external links', () => {
    expect(mediaSource('/images/banners/cafe.webp')).toBe('local');
    expect(mediaSource('https://c466145.parspack.net/c466145/wibe/a.webp')).toBe('parspack');
    expect(mediaSource('https://cdn.example/a.jpg')).toBe('external');
  });
});

describe('parseMediaIssue', () => {
  it('keeps a known issue', () => {
    expect(parseMediaIssue('heavy')).toBe('heavy');
    expect(parseMediaIssue('nope')).toBeNull();
  });
});
