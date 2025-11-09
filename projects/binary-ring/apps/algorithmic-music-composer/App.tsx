
import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { MethodViewer } from './components/MethodViewer';
import { ALGORITHMS } from './constants';
import type { Algorithm } from './types';

const App: React.FC = () => {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<Algorithm>(ALGORITHMS[0]);

  return (
    <div className="flex h-screen bg-gray-900 text-gray-200">
      <Sidebar
        selectedAlgorithm={selectedAlgorithm}
        onSelectAlgorithm={setSelectedAlgorithm}
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <MethodViewer algorithm={selectedAlgorithm} />
      </main>
    </div>
  );
};

export default App;
