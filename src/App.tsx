import React from 'react';
import { EntranceHub } from './components/EntranceHub';
import { MainApplication } from './components/MainApplication';

function App(): JSX.Element {
  // Simple routing based on URL hash or query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const hash = window.location.hash;
  const showApp = urlParams.get('app') === 'true' || hash === '#app';

  if (showApp) {
    return <MainApplication />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <EntranceHub />
    </div>
  );
}

export default App;

