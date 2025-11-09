
import React from 'react';
import type { Algorithm } from '../types';
import { GeminiExplanation } from './GeminiExplanation';
import { MarkovChainGenerator } from './algorithms/MarkovChainGenerator';
import { LSystemGenerator } from './algorithms/LSystemGenerator';
import { CellularAutomataGenerator } from './algorithms/CellularAutomataGenerator';
import { PlaceholderGenerator } from './algorithms/PlaceholderGenerator';

interface MethodViewerProps {
  algorithm: Algorithm;
}

const renderAlgorithmComponent = (algorithm: Algorithm) => {
  switch (algorithm.id) {
    case 'markov_chains':
      return <MarkovChainGenerator />;
    case 'l_systems':
        return <LSystemGenerator />;
    case 'cellular_automata':
        return <CellularAutomataGenerator />;
    case 'tape_loops':
    case 'genetic_algorithms':
    case 'chaos_theory':
        return <PlaceholderGenerator algorithmName={algorithm.name} />;
    default:
      return <div>Component for {algorithm.name} not found.</div>;
  }
};


export const MethodViewer: React.FC<MethodViewerProps> = ({ algorithm }) => {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header>
        <h2 className="text-3xl font-bold tracking-tight text-white">{algorithm.name}</h2>
        <p className="mt-1 text-lg text-gray-400">{algorithm.description}</p>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {renderAlgorithmComponent(algorithm)}
        </div>
        <div className="lg:col-span-1">
          <GeminiExplanation methodName={algorithm.name} />
        </div>
      </div>
    </div>
  );
};
