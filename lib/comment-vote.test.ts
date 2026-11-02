import { describe, expect, it } from 'vitest';
import { computeWeightedScore } from '@/lib/comment-utils';

/** همان منطق delta داخل lib/comment-vote.ts */
function deltasForVoteChange(
  existingValue: number | null | undefined,
  nextValue: number | null
): { upDelta: number; downDelta: number } {
  let upDelta = 0;
  let downDelta = 0;
  if (existingValue === 1) upDelta -= 1;
  else if (existingValue === -1) downDelta -= 1;
  if (nextValue === 1) upDelta += 1;
  else if (nextValue === -1) downDelta += 1;
  return { upDelta, downDelta };
}

describe('comment vote deltas', () => {
  it('adds an upvote from empty', () => {
    expect(deltasForVoteChange(null, 1)).toEqual({ upDelta: 1, downDelta: 0 });
  });

  it('removes an upvote on toggle-off', () => {
    expect(deltasForVoteChange(1, null)).toEqual({ upDelta: -1, downDelta: 0 });
  });

  it('switches upvote to downvote without net +2', () => {
    expect(deltasForVoteChange(1, -1)).toEqual({ upDelta: -1, downDelta: 1 });
  });

  it('keeps weighted score stable for equal ups and downs', () => {
    expect(computeWeightedScore(3, 3)).toBeCloseTo(0.5, 5);
  });
});
