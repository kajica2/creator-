// FIX: Import React to provide types for React.FC and React.SVGProps, resolving the "Cannot find namespace 'React'" error.
import React from 'react';

export type AlgorithmID = 
  | 'tape_loops'
  | 'markov_chains'
  | 'cellular_automata'
  | 'l_systems'
  | 'genetic_algorithms'
  | 'chaos_theory';

export interface Algorithm {
  id: AlgorithmID;
  name: string;
  description: string;
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
}

export interface Note {
  pitch: number; // MIDI note number
  start: number; // in beats
  duration: number; // in beats
  velocity: number; // 0-127
}