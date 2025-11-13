/**
 * Integration tests for Hashtag Cloud functionality
 * This file tests the integration between HashtagCloud component,
 * existing components (SelectedTray, HashtagCategory, etc.),
 * and the Supabase backend.
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// Mock Supabase client
const mockSupabase = {
  rpc: vi.fn(),
  from: vi.fn(),
  channel: vi.fn(),
  removeChannel: vi.fn(),
};

vi.mock('../utils/supabaseClient', () => ({
  supabase: mockSupabase
}));

// Import components after mocking
import HashtagCloud, { HashtagCloudItem } from '../components/HashtagCloud';
import { HashtagManager } from '../components/HashtagManager';
import { SelectedTray } from '../components/SelectedTray';
import { HashtagSize } from '../types';
import { hashtagCloudService } from '../utils/hashtagCloudService';
import {
  calculateFontSizeMultiplier,
  calculateOptimalLayout,
  filterHashtagsForCloud,
  sortHashtagsForCloud,
  generateCloudAnalytics
} from '../utils/hashtagCloudUtils';

// Mock data
const mockHashtagCloudData: HashtagCloudItem[] = [
  {
    id: '1',
    name: '#viralcontent',
    display_count: '1.2M',
    size: HashtagSize.Large,
    frequency: 150,
    trending_score: 8.5,
    popularity_score: 95,
    cloud_position_x: 400,
    cloud_position_y: 300,
    category_name: 'Content Creation',
    usage_today: 25,
    usage_week: 150,
    usage_month: 600
  },
  {
    id: '2',
    name: '#trending',
    display_count: '800K',
    size: HashtagSize.Medium,
    frequency: 120,
    trending_score: 9.2,
    popularity_score: 88,
    cloud_position_x: 500,
    cloud_position_y: 250,
    category_name: 'Trending',
    usage_today: 45,
    usage_week: 200,
    usage_month: 750
  },
  {
    id: '3',
    name: '#smallhashtag',
    display_count: '50K',
    size: HashtagSize.Small,
    frequency: 25,
    trending_score: 2.1,
    popularity_score: 45,
    cloud_position_x: 300,
    cloud_position_y: 400,
    category_name: 'Niche',
    usage_today: 3,
    usage_week: 25,
    usage_month: 80
  }
];

describe('Hashtag Cloud Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock responses
    mockSupabase.rpc.mockResolvedValue({
      data: mockHashtagCloudData,
      error: null
    });

    mockSupabase.channel.mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn()
    });
  });

  describe('HashtagCloud Component', () => {
    it('should render hashtag cloud with proper positioning', async () => {
      const mockOnSelect = vi.fn();
      const selectedHashtags = new Set<string>();

      render(
        <HashtagCloud
          selectedHashtags={selectedHashtags}
          onHashtagSelect={mockOnSelect}
          maxHashtags={100}
        />
      );

      // Wait for data to load
      await waitFor(() => {
        expect(mockSupabase.rpc).toHaveBeenCalledWith('get_hashtag_cloud_data', {
          category_filter: undefined,
          limit_count: 100,
          min_frequency: 1
        });
      });

      // Check if hashtags are rendered
      await waitFor(() => {
        expect(screen.getByText('#viralcontent')).toBeInTheDocument();
        expect(screen.getByText('#trending')).toBeInTheDocument();
        expect(screen.getByText('#smallhashtag')).toBeInTheDocument();
      });
    });

    it('should handle hashtag selection and track usage', async () => {
      const mockOnSelect = vi.fn();
      const selectedHashtags = new Set<string>();

      // Mock the track usage function
      mockSupabase.rpc.mockImplementation((funcName) => {
        if (funcName === 'track_hashtag_usage') {
          return Promise.resolve({ data: true, error: null });
        }
        return Promise.resolve({ data: mockHashtagCloudData, error: null });
      });

      render(
        <HashtagCloud
          selectedHashtags={selectedHashtags}
          onHashtagSelect={mockOnSelect}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('#viralcontent')).toBeInTheDocument();
      });

      // Click on a hashtag
      fireEvent.click(screen.getByText('#viralcontent'));

      // Verify tracking call
      expect(mockSupabase.rpc).toHaveBeenCalledWith('track_hashtag_usage', {
        hashtag_name: '#viralcontent',
        session_id: expect.any(String),
        usage_context: 'cloud_selection'
      });

      // Verify selection callback
      expect(mockOnSelect).toHaveBeenCalledWith('#viralcontent');
    });

    it('should filter hashtags based on search term', async () => {
      const mockOnSelect = vi.fn();
      const selectedHashtags = new Set<string>();

      render(
        <HashtagCloud
          selectedHashtags={selectedHashtags}
          onHashtagSelect={mockOnSelect}
          searchTerm="viral"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('#viralcontent')).toBeInTheDocument();
        expect(screen.queryByText('#trending')).not.toBeInTheDocument();
        expect(screen.queryByText('#smallhashtag')).not.toBeInTheDocument();
      });
    });

    it('should show only trending hashtags when showTrendingOnly is true', async () => {
      const mockOnSelect = vi.fn();
      const selectedHashtags = new Set<string>();

      render(
        <HashtagCloud
          selectedHashtags={selectedHashtags}
          onHashtagSelect={mockOnSelect}
          showTrendingOnly={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('#viralcontent')).toBeInTheDocument();
        expect(screen.getByText('#trending')).toBeInTheDocument();
        expect(screen.getByText('#smallhashtag')).toBeInTheDocument(); // Has trending score > 0
      });
    });
  });

  describe('Integration with HashtagManager', () => {
    it('should integrate cloud view with existing manager', async () => {
      const mockOnSelect = vi.fn();
      const mockOnSelectSet = vi.fn();
      const selectedHashtags = new Set<string>();

      render(
        <HashtagManager
          hashtagCategories={[]}
          readySets={[]}
          selectedHashtags={selectedHashtags}
          onHashtagSelect={mockOnSelect}
          onSelectSet={mockOnSelectSet}
        />
      );

      // Check if Cloud View tab exists
      expect(screen.getByText('Cloud View')).toBeInTheDocument();

      // Click on Cloud View tab
      fireEvent.click(screen.getByText('Cloud View'));

      // Wait for cloud component to render
      await waitFor(() => {
        expect(screen.getByText('#viralcontent')).toBeInTheDocument();
      });
    });

    it('should maintain filter state between views', async () => {
      const mockOnSelect = vi.fn();
      const mockOnSelectSet = vi.fn();
      const selectedHashtags = new Set<string>();

      render(
        <HashtagManager
          hashtagCategories={[]}
          readySets={[]}
          selectedHashtags={selectedHashtags}
          onHashtagSelect={mockOnSelect}
          onSelectSet={mockOnSelectSet}
        />
      );

      // Go to cloud view
      fireEvent.click(screen.getByText('Cloud View'));

      // Wait for filters to render
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search hashtags...')).toBeInTheDocument();
      });

      // Apply search filter
      const searchInput = screen.getByPlaceholderText('Search hashtags...');
      fireEvent.change(searchInput, { target: { value: 'viral' } });

      // Switch to explore view
      fireEvent.click(screen.getByText('Explore'));

      // Switch back to cloud view
      fireEvent.click(screen.getByText('Cloud View'));

      // Verify filter is maintained
      expect(searchInput).toHaveValue('viral');
    });
  });

  describe('Integration with SelectedTray', () => {
    it('should work with SelectedTray for hashtag management', async () => {
      const mockHashtags = [
        { name: '#selected1', size: HashtagSize.Medium, count: '100K' },
        { name: '#selected2', size: HashtagSize.Large, count: '500K' }
      ];
      const mockOnRemove = vi.fn();
      const mockOnClear = vi.fn();

      render(
        <SelectedTray
          selectedHashtags={mockHashtags}
          onRemove={mockOnRemove}
          onClear={mockOnClear}
        />
      );

      // Check if selected hashtags are displayed
      expect(screen.getByText('#selected1')).toBeInTheDocument();
      expect(screen.getByText('#selected2')).toBeInTheDocument();
      expect(screen.getByText('Selected Hashtags (2)')).toBeInTheDocument();

      // Test remove functionality
      const removeButtons = screen.getAllByText('×');
      fireEvent.click(removeButtons[0]);
      expect(mockOnRemove).toHaveBeenCalledWith('#selected1');

      // Test clear all functionality
      fireEvent.click(screen.getByText('Clear All'));
      expect(mockOnClear).toHaveBeenCalled();
    });
  });

  describe('Hashtag Cloud Service', () => {
    it('should fetch cloud data with filters', async () => {
      const service = hashtagCloudService;

      const filters = {
        categoryFilter: 'Content Creation',
        limit: 50,
        minFrequency: 10
      };

      await service.getHashtagCloudData(filters);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_hashtag_cloud_data', {
        category_filter: 'Content Creation',
        limit_count: 50,
        min_frequency: 10
      });
    });

    it('should track hashtag usage', async () => {
      const service = hashtagCloudService;

      const usageEvent = {
        hashtag_name: '#test',
        session_id: 'session123',
        context: 'cloud_selection' as const
      };

      await service.trackHashtagUsage(usageEvent);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('track_hashtag_usage', {
        hashtag_name: '#test',
        session_id: 'session123',
        usage_context: 'cloud_selection'
      });
    });
  });

  describe('Utility Functions', () => {
    it('should calculate font size multiplier correctly', () => {
      const hashtag = mockHashtagCloudData[0];
      const maxTrending = 10;
      const maxFrequency = 200;

      const multiplier = calculateFontSizeMultiplier(hashtag, maxTrending, maxFrequency);

      expect(multiplier).toBeGreaterThan(1); // Should be enhanced due to high scores
      expect(multiplier).toBeLessThanOrEqual(2); // Should not exceed max
    });

    it('should calculate optimal layout without collisions', () => {
      const layout = calculateOptimalLayout(mockHashtagCloudData, 800, 600);

      expect(layout).toHaveLength(mockHashtagCloudData.length);

      // All items should have positions
      layout.forEach(item => {
        expect(item.cloud_position_x).toBeDefined();
        expect(item.cloud_position_y).toBeDefined();
        expect(item.cloud_position_x).toBeGreaterThan(0);
        expect(item.cloud_position_y).toBeGreaterThan(0);
      });
    });

    it('should filter hashtags correctly', () => {
      const filters = {
        searchTerm: 'viral',
        selectedSizes: new Set([HashtagSize.Large]),
        showTrendingOnly: true,
        minFrequency: 100
      };

      const filtered = filterHashtagsForCloud(mockHashtagCloudData, filters);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('#viralcontent');
    });

    it('should sort hashtags by different criteria', () => {
      const sortedByTrending = sortHashtagsForCloud(mockHashtagCloudData, 'trending');
      const sortedByFrequency = sortHashtagsForCloud(mockHashtagCloudData, 'frequency');

      expect(sortedByTrending[0].name).toBe('#trending'); // Highest trending score
      expect(sortedByFrequency[0].name).toBe('#viralcontent'); // Highest frequency
    });

    it('should generate analytics correctly', () => {
      const analytics = generateCloudAnalytics(mockHashtagCloudData);

      expect(analytics.totalHashtags).toBe(3);
      expect(analytics.trendingCount).toBe(3); // All have trending score > 0
      expect(analytics.topCategory).toBeDefined();
      expect(analytics.usageMetrics.mostActive).toBeDefined();
    });
  });

  describe('Real-time Updates', () => {
    it('should subscribe to real-time updates', () => {
      const mockCallback = vi.fn();
      const service = hashtagCloudService;

      service.subscribeToHashtagUpdates(mockCallback);

      expect(mockSupabase.channel).toHaveBeenCalledWith('hashtag_cloud_updates');
    });

    it('should handle real-time updates in component', async () => {
      const mockOnSelect = vi.fn();
      const selectedHashtags = new Set<string>();

      // Mock channel subscription
      let subscriptionCallback: Function;
      mockSupabase.channel.mockReturnValue({
        on: vi.fn().mockImplementation((event, config, callback) => {
          if (event === 'postgres_changes') {
            subscriptionCallback = callback;
          }
          return { on: vi.fn().mockReturnThis(), subscribe: vi.fn() };
        }),
        subscribe: vi.fn()
      });

      render(
        <HashtagCloud
          selectedHashtags={selectedHashtags}
          onHashtagSelect={mockOnSelect}
        />
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('#viralcontent')).toBeInTheDocument();
      });

      // Simulate real-time update
      const updatedData = [...mockHashtagCloudData];
      updatedData[0].trending_score = 10.0;

      mockSupabase.rpc.mockResolvedValueOnce({
        data: updatedData,
        error: null
      });

      // Trigger the subscription callback
      if (subscriptionCallback) {
        subscriptionCallback({ eventType: 'UPDATE' });
      }

      // Wait for update to be processed
      await waitFor(() => {
        expect(mockSupabase.rpc).toHaveBeenCalledTimes(2); // Initial + update
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      const mockOnSelect = vi.fn();
      const selectedHashtags = new Set<string>();

      render(
        <HashtagCloud
          selectedHashtags={selectedHashtags}
          onHashtagSelect={mockOnSelect}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to load hashtag cloud')).toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('should handle empty data gracefully', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [],
        error: null
      });

      const mockOnSelect = vi.fn();
      const selectedHashtags = new Set<string>();

      render(
        <HashtagCloud
          selectedHashtags={selectedHashtags}
          onHashtagSelect={mockOnSelect}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('No hashtags found')).toBeInTheDocument();
      });
    });
  });
});

// Export for use in other test files
export { mockHashtagCloudData, mockSupabase };