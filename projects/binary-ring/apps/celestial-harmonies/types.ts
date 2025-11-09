
export type ModelKey = 'newJerusalem' | 'platoLambda' | 'heptagram' | 'durerPentagon';

export interface GeometricModel {
  key: ModelKey;
  name: string;
  description: string;
  source: string;
  sonificationRule: string;
}

export interface GeometryElement {
  type: 'circle' | 'line' | 'path' | 'text' | 'polygon';
  props: Record<string, any>;
  id?: string;
  data?: any;
}

export type Geometry = GeometryElement[];

export interface MusicalNote {
  freq: number;
  startTime: number;
  duration: number;
  id?: string;
  waveform?: 'sine' | 'square' | 'triangle' | 'sawtooth';
}

export interface MusicSequence {
  notes: MusicalNote[];
  totalDuration: number;
}
