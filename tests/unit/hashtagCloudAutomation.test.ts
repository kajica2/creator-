import { describe, it, expect } from 'vitest';
import { listAutomationSegments } from '../../utils/hashtagCloudAutomation';

describe('hashtagCloudAutomation', () => {
  it('returns default automation segments in deterministic order', () => {
    const segments = listAutomationSegments();

    expect(segments.length).toBeGreaterThan(0);
    expect(segments[0]).toMatchObject({
      key: 'global',
      label: expect.stringContaining('Global'),
    });

    const uniqueKeys = new Set(segments.map((segment) => segment.key));
    expect(uniqueKeys.size).toBe(segments.length);
  });
});

