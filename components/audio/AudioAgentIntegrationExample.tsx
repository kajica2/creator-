import React, { useState, useEffect } from 'react';
import AgentOrchestrator from '../../api/core/AgentOrchestrator';

interface AudioAgentIntegrationExampleProps {
  userId?: string;
}

const AudioAgentIntegrationExample: React.FC<AudioAgentIntegrationExampleProps> = ({ userId }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState<string>('');

  useEffect(() => {
    const orchestrator = AgentOrchestrator.getInstance();

    // Listen to pipeline progress
    orchestrator.on('pipeline:progress', (data) => {
      setCurrentStep(`Processing ${data.agent}: ${data.progress.toFixed(0)}%`);
    });

    orchestrator.on('pipeline:complete', (data) => {
      setResults(data.results);
      setIsProcessing(false);
    });

    return () => {
      orchestrator.removeAllListeners();
    };
  }, []);

  const handleGenerateMedia = async () => {
    setIsProcessing(true);
    setResults([]);

    try {
      const orchestrator = AgentOrchestrator.getInstance();
      await orchestrator.executePipeline(
        'media-generation',
        {
          birthDate: new Date('1990-01-01'),
          birthTime: '12:00',
          birthPlace: {
            latitude: 40.7128,
            longitude: -74.0060,
            timezone: 'America/New_York'
          }
        },
        userId
      );
    } catch (error) {
      console.error('Pipeline execution failed:', error);
      setIsProcessing(false);
    }
  };

  const handleGenerateKaraoke = async () => {
    setIsProcessing(true);
    setResults([]);

    try {
      const orchestrator = AgentOrchestrator.getInstance();
      await orchestrator.executePipeline(
        'karaoke-generation',
        {
          title: 'AI Generated Song',
          lyrics: 'This is an AI generated song\nWith neural networks singing along\nSynaptic symphony in the air\nMusic created everywhere',
          bpm: 120,
          key: 'C',
          genre: 'pop'
        },
        userId
      );
    } catch (error) {
      console.error('Karaoke generation failed:', error);
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-white mb-4">Audio Agent Integration</h2>
        <p className="text-gray-300 mb-6">
          Test the integrated audio pipeline that transforms astrological data into music and karaoke tracks.
        </p>

        <div className="flex gap-4 mb-6">
          <button
            onClick={handleGenerateMedia}
            disabled={isProcessing}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Generate Media Pipeline
          </button>
          <button
            onClick={handleGenerateKaraoke}
            disabled={isProcessing}
            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Generate Karaoke Track
          </button>
        </div>

        {isProcessing && (
          <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent mr-3" />
              <span className="text-blue-300">{currentStep || 'Processing...'}</span>
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Pipeline Results:</h3>
            {results.map((result, index) => (
              <div key={index} className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-purple-300 mb-2">
                  {result.agent}
                </h4>
                <pre className="text-xs text-gray-300 overflow-x-auto">
                  {JSON.stringify(result.result, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-3">Pipeline Flow</h3>
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center mr-3">1</div>
              <span className="text-gray-300">Astrology → Sound Parameters</span>
            </div>
            <div className="flex items-center text-sm">
              <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center mr-3">2</div>
              <span className="text-gray-300">Sound → Song Structure</span>
            </div>
            <div className="flex items-center text-sm">
              <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center mr-3">3</div>
              <span className="text-gray-300">Song → Visual Image</span>
            </div>
            <div className="flex items-center text-sm">
              <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center mr-3">4</div>
              <span className="text-gray-300">Image → Subscription Package</span>
            </div>
            <div className="flex items-center text-sm">
              <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center mr-3">5</div>
              <span className="text-gray-300">Package → Karaoke Track</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-3">Agent Capabilities</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Astrology Agent</span>
              <span className="text-green-400">✓ Ready</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Sound Agent</span>
              <span className="text-yellow-400">⏳ Initializing</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Song Agent</span>
              <span className="text-yellow-400">⏳ Initializing</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Image Agent</span>
              <span className="text-yellow-400">⏳ Initializing</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Karaoke Agent</span>
              <span className="text-green-400">✓ Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioAgentIntegrationExample;