
import React from 'react';
import { Hashtag, HashtagSize } from '../types';

interface HashtagProps {
  hashtag: Hashtag;
  isSelected: boolean;
  onSelect: (name: string) => void;
}

const sizeColorMap: Record<HashtagSize, string> = {
  [HashtagSize.Mega]: 'bg-red-500',
  [HashtagSize.Large]: 'bg-orange-500',
  [HashtagSize.Medium]: 'bg-green-500',
  [HashtagSize.Small]: 'bg-blue-500',
  [HashtagSize.Micro]: 'bg-purple-500',
};

export const HashtagComponent: React.FC<HashtagProps> = ({ hashtag, isSelected, onSelect }) => {
  const baseClasses = "flex items-center space-x-2 text-sm px-3 py-1.5 rounded-full cursor-pointer transition-all duration-200 ease-in-out transform hover:scale-105";
  const selectedClasses = "bg-purple-600 text-white shadow-lg ring-2 ring-purple-400";
  const unselectedClasses = "bg-gray-700 text-gray-300 hover:bg-gray-600";
  
  return (
    <div
      onClick={() => onSelect(hashtag.name)}
      className={`${baseClasses} ${isSelected ? selectedClasses : unselectedClasses}`}
    >
      <span className={`w-2.5 h-2.5 rounded-full ${sizeColorMap[hashtag.size]}`}></span>
      <span className="font-medium">{hashtag.name}</span>
      <span className="text-xs text-gray-400">{hashtag.count}</span>
    </div>
  );
};
