
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { GraphicsViewer } from './components/GraphicsViewer';
import { MusicPlayer } from './components/MusicPlayer';
import { InfoPanel } from './components/InfoPanel';
import { GeometricModel, ModelKey } from './types';
import { GEOMETRIC_MODELS } from './constants';
import { generateGeometry } from './services/geometryService';
import { generateMusic } from './services/musicService';

type CompositionLength = 'short' | 'medium' | 'long';

const App: React.FC = () => {
  const [modelKey, setModelKey] = useState<ModelKey>('newJerusalem');
  const [size, setSize] = useState(300);
  const [tempo, setTempo] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [compositionLength, setCompositionLength] = useState<CompositionLength>('short');

  const currentModel = useMemo(() => GEOMETRIC_MODELS[modelKey], [modelKey]);

  const [geometry, setGeometry] = useState(generateGeometry(currentModel, size));
  const [music, setMusic] = useState(generateMusic(currentModel, geometry, tempo, compositionLength));

  useEffect(() => {
    const newGeometry = generateGeometry(currentModel, size);
    setGeometry(newGeometry);
  }, [currentModel, size]);

  useEffect(() => {
    const newMusic = generateMusic(currentModel, geometry, tempo, compositionLength);
    setMusic(newMusic);
  }, [currentModel, geometry, tempo, compositionLength]);
  
  const handleModelChange = useCallback((newModelKey: ModelKey) => {
    setIsPlaying(false);
    setModelKey(newModelKey);
  }, []);

  const handleSizeChange = useCallback((newSize: number) => {
    setSize(newSize);
  }, []);

  const handleTempoChange = useCallback((newTempo: number) => {
    setTempo(newTempo);
  }, []);

  const handleCompositionLengthChange = useCallback((newLength: CompositionLength) => {
    setCompositionLength(newLength);
  }, []);
  
  return (
    <div className="bg-slate-900 min-h-screen text-gray-200 flex flex-col items-center p-4 selection:bg-yellow-400 selection:text-slate-900">
      <header className="text-center my-6">
        <h1 className="text-5xl font-bold text-yellow-300 tracking-wider">Celestial Harmonies</h1>
        <p className="text-lg text-slate-400 mt-2">The Music of Sacred Geometry</p>
      </header>

      <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 bg-slate-800/50 p-6 rounded-lg shadow-2xl border border-slate-700 flex flex-col">
            <ControlPanel
                modelKey={modelKey}
                onModelChange={handleModelChange}
                size={size}
                onSizeChange={handleSizeChange}
                tempo={tempo}
                onTempoChange={handleTempoChange}
                compositionLength={compositionLength}
                onCompositionLengthChange={handleCompositionLengthChange}
            />
            <div className="mt-6 flex-grow">
                <MusicPlayer 
                    musicSequence={music} 
                    isPlaying={isPlaying}
                    setIsPlaying={setIsPlaying}
                />
            </div>
        </div>

        <main className="md:col-span-2 bg-slate-800/50 p-6 rounded-lg shadow-2xl border border-slate-700 flex flex-col justify-center items-center">
          <GraphicsViewer geometry={geometry} isPlaying={isPlaying} playbackTime={music.totalDuration * 1000} />
        </main>
      </div>

      <div className="w-full max-w-7xl mt-8">
        <InfoPanel model={currentModel} />
      </div>
       <footer className="text-center mt-12 mb-4 text-slate-500 text-sm">
        <p>Crafted with cosmic inspiration. Based on the principles of sacred geometry and ancient astronomy.</p>
      </footer>
    </div>
  );
};

export default App;
