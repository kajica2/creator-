
import React from 'react';
import { Hashtag, HashtagSize } from '../types';
import { useAccessibility, useKeyboardNavigation } from '../src/hooks/useAccessibility';
import { textAlternatives, ARIA_ROLES } from '../src/utils/accessibility';

interface HashtagProps {
  hashtag: Hashtag;
  isSelected: boolean;
  onSelect: (name: string) => void;
  tabIndex?: number;
  onKeyboardFocus?: () => void;
  ariaLabel?: string;
}

// Enhanced color map with accessibility considerations
const sizeColorMap: Record<HashtagSize, string> = {
  [HashtagSize.Mega]: 'bg-red-500', // High contrast red for mega hashtags
  [HashtagSize.Large]: 'bg-orange-500', // Warm orange for large hashtags
  [HashtagSize.Medium]: 'bg-green-500', // Clear green for medium hashtags
  [HashtagSize.Small]: 'bg-blue-500', // Cool blue for small hashtags
  [HashtagSize.Micro]: 'bg-purple-500', // Purple for micro hashtags
};

// Size labels for screen readers
export const sizeLabels: Record<HashtagSize, string> = {
  [HashtagSize.Mega]: 'Very popular',
  [HashtagSize.Large]: 'Popular',
  [HashtagSize.Medium]: 'Moderately popular',
  [HashtagSize.Small]: 'Less popular',
  [HashtagSize.Micro]: 'Niche',
};

// Enhanced hashtag cloud component with full accessibility support
export const AccessibleHashtagCloud: React.FC<{
  hashtags: Hashtag[];
  selectedHashtags: Set<string>;
  onHashtagSelect: (name: string) => void;
  maxDisplayed?: number;
  allowKeyboardNavigation?: boolean;
}> = ({
  hashtags,
  selectedHashtags,
  onHashtagSelect,
  maxDisplayed = 50,
  allowKeyboardNavigation = true
}) => {
  const { announceMessage } = useAccessibility();
  const [focusedIndex, setFocusedIndex] = React.useState(-1);

  const displayedHashtags = hashtags.slice(0, maxDisplayed);
  const totalSelected = selectedHashtags.size;

  // Enhanced keyboard navigation for hashtag clouds
  const { handleKeyDown: handleCloudKeyDown } = useKeyboardNavigation(
    undefined, // Enter handled by individual hashtags
    undefined, // Space handled by individual hashtags
    (direction) => {
      if (!allowKeyboardNavigation) return;

      const maxIndex = displayedHashtags.length - 1;
      let newIndex = focusedIndex;

      switch (direction) {
        case 'up':
        case 'left':
          newIndex = focusedIndex > 0 ? focusedIndex - 1 : maxIndex;
          break;
        case 'down':
        case 'right':
          newIndex = focusedIndex < maxIndex ? focusedIndex + 1 : 0;
          break;
      }

      setFocusedIndex(newIndex);
      const hashtagElement = document.querySelector(`[data-hashtag="${displayedHashtags[newIndex].name}"]`) as HTMLElement;
      hashtagElement?.focus();
    }
  );

  React.useEffect(() => {
    announceMessage(
      textAlternatives.hashtagCloud(
        displayedHashtags.map(h => h.name),
        displayedHashtags.length
      )
    );
  }, [displayedHashtags, announceMessage]);

  return (
    <div
      role="region"
      aria-label={`Hashtag selection cloud with ${displayedHashtags.length} hashtags. ${totalSelected} selected.`}
      className="space-y-2"
    >
      <div className="sr-only" aria-live="polite">
        {totalSelected} hashtags currently selected. Use arrow keys to navigate, Enter or Space to select.
      </div>

      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Hashtag selection buttons"
        onKeyDown={handleCloudKeyDown}
      >
        {displayedHashtags.map((hashtag, index) => (
          <HashtagComponent
            key={hashtag.name}
            hashtag={hashtag}
            isSelected={selectedHashtags.has(hashtag.name)}
            onSelect={onHashtagSelect}
            tabIndex={allowKeyboardNavigation ? (index === 0 ? 0 : -1) : 0}
            onKeyboardFocus={() => setFocusedIndex(index)}
            ariaLabel={`${hashtag.name} hashtag, ${sizeLabels[hashtag.size]}, ${hashtag.count} posts`}
          />
        ))}
      </div>

      {hashtags.length > maxDisplayed && (
        <p className="text-sm text-gray-400">
          Showing {maxDisplayed} of {hashtags.length} hashtags.
        </p>
      )}
    </div>
  );
};

export const HashtagComponent: React.FC<HashtagProps> = ({
  hashtag,
  isSelected,
  onSelect,
  tabIndex = 0,
  onKeyboardFocus,
  ariaLabel
}) => {
  const { announceMessage } = useAccessibility();

  const { handleKeyDown } = useKeyboardNavigation(
    () => {
      onSelect(hashtag.name);
      announceMessage(
        isSelected
          ? `${hashtag.name} hashtag removed from selection`
          : `${hashtag.name} hashtag added to selection`
      );
    },
    () => {
      onSelect(hashtag.name);
      announceMessage(
        isSelected
          ? `${hashtag.name} hashtag removed from selection`
          : `${hashtag.name} hashtag added to selection`
      );
    }
  );

  const baseClasses = "flex items-center space-x-2 text-sm px-3 py-1.5 rounded-full cursor-pointer transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900";
  const selectedClasses = "bg-purple-600 text-white shadow-lg ring-2 ring-purple-400";
  const unselectedClasses = "bg-gray-700 text-gray-300 hover:bg-gray-600";

  // Create accessible label
  const accessibleLabel = ariaLabel ||
    `${hashtag.name} hashtag, ${hashtag.size} size, ${hashtag.count} posts. ${isSelected ? 'Selected' : 'Not selected'}. Click to ${isSelected ? 'remove from' : 'add to'} selection.`;

  return (
    <button
      onClick={() => {
        onSelect(hashtag.name);
        announceMessage(
          isSelected
            ? `${hashtag.name} hashtag removed from selection`
            : `${hashtag.name} hashtag added to selection`
        );
      }}
      onKeyDown={handleKeyDown}
      onFocus={() => {
        onKeyboardFocus?.();
      }}
      className={`${baseClasses} ${isSelected ? selectedClasses : unselectedClasses}`}
      aria-label={accessibleLabel}
      aria-pressed={isSelected}
      role="button"
      tabIndex={tabIndex}
      data-hashtag={hashtag.name}
      data-size={hashtag.size}
    >
      <span
        className={`w-2.5 h-2.5 rounded-full ${sizeColorMap[hashtag.size]}`}
        aria-hidden="true"
        title={`${hashtag.size} size indicator`}
      ></span>
      <span className="font-medium">{hashtag.name}</span>
      <span
        className="text-xs text-gray-400"
        aria-label={`${hashtag.count} posts`}
      >
        {hashtag.count}
      </span>
      <span className="sr-only">
        {isSelected ? 'Selected' : 'Not selected'}.
        Press Enter or Space to {isSelected ? 'remove from' : 'add to'} selection.
      </span>
    </button>
  );
};
