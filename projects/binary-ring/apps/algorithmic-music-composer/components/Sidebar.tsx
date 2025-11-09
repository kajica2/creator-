
import React from 'react';
import type { Algorithm } from '../types';
import { ALGORITHMS } from '../constants';

interface SidebarProps {
  selectedAlgorithm: Algorithm;
  onSelectAlgorithm: (algorithm: Algorithm) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ selectedAlgorithm, onSelectAlgorithm }) => {
  return (
    <nav className="w-64 bg-gray-950/50 border-r border-gray-800 p-4 flex flex-col">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-white">Algorithmic Composer</h1>
        <p className="text-sm text-gray-400">Generative Music Explorer</p>
      </div>
      <ul className="space-y-2">
        {ALGORITHMS.map((algo) => (
          <li key={algo.id}>
            <button
              onClick={() => onSelectAlgorithm(algo)}
              className={`w-full flex items-center space-x-3 p-2 rounded-lg text-left transition-colors duration-200 ${
                selectedAlgorithm.id === algo.id
                  ? 'bg-blue-600/20 text-blue-300'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <algo.Icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">{algo.name}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-auto text-center text-xs text-gray-600">
        <p>Powered by Gemini & React</p>
      </div>
    </nav>
  );
};
