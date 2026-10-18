import { describe, expect, it } from 'vitest';
import ItemCoverPlaceholder, {
  getItemCoverPlaceholderGradient,
} from '@/components/shared/ItemCoverPlaceholder';

describe('ItemCoverPlaceholder', () => {
  it('uses category gradient while the poster is still loading', () => {
    const gradient = getItemCoverPlaceholderGradient('ماتریکس', 'movies', 'loading');
    expect(gradient).not.toContain('slate-200');
    expect(gradient).toContain('from-');
  });

  it('uses category gradient for empty state', () => {
    const gradient = getItemCoverPlaceholderGradient('ماتریکس', 'movies', 'empty');
    expect(gradient).not.toContain('slate-200');
    expect(gradient).toContain('from-');
  });

  it('strips generic film prefix for initial display', () => {
    const { container } = renderPlaceholder('فیلم درام عاشقانه', 'empty');
    expect(container.textContent).toContain('د');
    expect(container.textContent).toContain('فیلم درام عاشقانه');
  });
});

function renderPlaceholder(title: string, state: 'idle' | 'loading' | 'empty') {
  const React = require('react');
  const { render } = require('@testing-library/react');
  return render(
    React.createElement(ItemCoverPlaceholder, {
      title,
      categorySlug: 'movies',
      fallbackIcon: '🎬',
      state,
      layout: 'grid',
      className: 'h-40 w-28',
    })
  );
}
