import React from 'react';
import { HashtagCategory } from '../types';
import { HashtagComponent } from './Hashtag';

interface HashtagCategoryProps {
  category: HashtagCategory;
  selectedHashtags: Set<string>;
  onHashtagSelect: (name: string) => void;
}

export const HashtagCategoryComponent: React.FC<HashtagCategoryProps> = ({ category, selectedHashtags, onHashtagSelect }) => {
  return (
    <div className="space-y-3">
      <h3 className="font-bold text-lg text-purple-300">{category.category}</h3>
      <div className="flex flex-wrap gap-2">
        {category.hashtags.map((hashtag) => (
          <HashtagComponent
            key={hashtag.name}
            hashtag={hashtag}
            isSelected={selectedHashtags.has(hashtag.name)}
            onSelect={onHashtagSelect}
          />
        ))}
      </div>
    </div>
  );
};
