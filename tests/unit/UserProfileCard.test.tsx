import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserProfileCard from '../../components/UserProfileCard';

vi.mock('../../supabase/utils', () => ({
  fetchUserRatingSummary: vi.fn().mockResolvedValue({
    averageScore: 4.6,
    totalRatings: 12,
    fiveStar: 8,
    fourStar: 3,
    threeStar: 1,
    twoStar: 0,
    oneStar: 0,
    lastReviewedAt: new Date().toISOString(),
  }),
  submitUserRating: vi.fn().mockResolvedValue({}),
}));

const { fetchUserRatingSummary, submitUserRating } = require('../../supabase/utils');

describe('UserProfileCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders rating summary and allows star selection', async () => {
    render(
      <UserProfileCard
        displayName="Creator Collective"
        handle="creator-collective"
        headline="Building viral systems"
      />,
    );

    expect(fetchUserRatingSummary).toHaveBeenCalledWith('creator-collective');

    await waitFor(() => {
      expect(screen.getByText('4.6')).toBeInTheDocument();
      expect(screen.getByText('12 community ratings')).toBeInTheDocument();
    });

    const starButton = screen.getAllByText('★')[4];
    fireEvent.click(starButton);

    const submitButton = screen.getByText('Share Rating');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(submitUserRating).toHaveBeenCalledWith(
        expect.objectContaining({
          targetHandle: 'creator-collective',
          score: 5,
        }),
      );
    });
  });
});

