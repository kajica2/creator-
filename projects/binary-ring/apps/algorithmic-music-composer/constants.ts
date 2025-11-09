
import type { Algorithm } from './types';
import { TapeIcon, LinkIcon, GridIcon, LeafIcon, DnaIcon, SwirlIcon } from './components/icons/Icons';

export const ALGORITHMS: Algorithm[] = [
  {
    id: 'tape_loops',
    name: "Analog Tape Loops",
    description: "Brian Eno's system of ever-shifting phase relationships.",
    Icon: TapeIcon,
  },
  {
    id: 'markov_chains',
    name: 'Markov Chains',
    description: 'Sequence generation based on probability transitions.',
    Icon: LinkIcon,
  },
  {
    id: 'cellular_automata',
    name: 'Cellular Automata',
    description: 'Grid-based rules where cells evolve based on neighbors.',
    Icon: GridIcon,
  },
  {
    id: 'l_systems',
    name: 'L-Systems',
    description: 'String rewriting systems that generate self-similar structures.',
    Icon: LeafIcon,
  },
  {
    id: 'genetic_algorithms',
    name: 'Genetic Algorithms',
    description: 'Evolve musical material through selection and mutation.',
    Icon: DnaIcon,
  },
    {
    id: 'chaos_theory',
    name: 'Chaos & Attractors',
    description: 'Deterministic but unpredictable systems create organic patterns.',
    Icon: SwirlIcon,
  },
];

export const PIANO_ROLL_CONFIG = {
  PITCH_MIN: 48, // C3
  PITCH_MAX: 84, // C6
  BEAT_WIDTH: 20, // pixels
  NOTE_HEIGHT: 12, // pixels
  TOTAL_BEATS: 64,
};
