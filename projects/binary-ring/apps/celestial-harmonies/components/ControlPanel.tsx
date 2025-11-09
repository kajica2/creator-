
import React from 'react';
import { ModelKey } from '../types';
import { GEOMETRIC_MODELS } from '../constants';

type CompositionLength = 'short' | 'medium' | 'long';

interface ControlPanelProps {
  modelKey: ModelKey;
  onModelChange: (model: ModelKey) => void;
  size: number;
  onSizeChange: (size: number) => void;
  tempo: number;
  onTempoChange: (tempo: number) => void;
  compositionLength: CompositionLength;
  onCompositionLengthChange: (length: CompositionLength) => void;
}

const Label: React.FC<{htmlFor: string; children: React.ReactNode}> = ({htmlFor, children}) => (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-300 mb-2">{children}</label>
);

export const ControlPanel: React.FC<ControlPanelProps> = ({
  modelKey,
  onModelChange,
  size,
  onSizeChange,
  tempo,
  onTempoChange,
  compositionLength,
  onCompositionLengthChange
}) => {
  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="model-select">Geometric Model</Label>
        <select
          id="model-select"
          value={modelKey}
          onChange={(e) => onModelChange(e.target.value as ModelKey)}
          className="w-full bg-slate-700 border border-slate-600 text-white rounded-md p-2 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
        >
          {Object.values(GEOMETRIC_MODELS).map((model) => (
            <option key={model.key} value={model.key}>
              {model.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="size-slider">Graphic Size</Label>
        <input
          id="size-slider"
          type="range"
          min="100"
          max="400"
          value={size}
          onChange={(e) => onSizeChange(Number(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-400"
        />
      </div>
       <div>
        <Label htmlFor="tempo-slider">Music Tempo (BPM)</Label>
        <input
          id="tempo-slider"
          type="range"
          min="40"
          max="200"
          value={tempo}
          onChange={(e) => onTempoChange(Number(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-400"
        />
      </div>
      <div>
        <Label htmlFor="composition-length">Composition Length</Label>
        <select
          id="composition-length"
          value={compositionLength}
          onChange={(e) => onCompositionLengthChange(e.target.value as CompositionLength)}
          className="w-full bg-slate-700 border border-slate-600 text-white rounded-md p-2 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
        >
          <option value="short">Short (Theme)</option>
          <option value="medium">Medium (~32 Bars)</option>
          <option value="long">Long (~64 Bars)</option>
        </select>
      </div>
    </div>
  );
};
