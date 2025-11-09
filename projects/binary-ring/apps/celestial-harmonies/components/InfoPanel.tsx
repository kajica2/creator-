
import React from 'react';
import { GeometricModel } from '../types';

interface InfoPanelProps {
  model: GeometricModel;
}

export const InfoPanel: React.FC<InfoPanelProps> = ({ model }) => {
  return (
    <div className="bg-slate-800/50 p-6 rounded-lg shadow-xl border border-slate-700">
      <h2 className="text-3xl font-semibold text-yellow-300 mb-4">{model.name}</h2>
      <div className="space-y-4 text-slate-300 text-lg leading-relaxed">
        <p>{model.description}</p>
        <div>
          <h4 className="font-semibold text-yellow-400/80">Sonification Rule:</h4>
          <p className="italic text-slate-400">{model.sonificationRule}</p>
        </div>
        <p className="text-sm text-slate-500 pt-2 border-t border-slate-700">Source: {model.source}</p>
      </div>
    </div>
  );
};
