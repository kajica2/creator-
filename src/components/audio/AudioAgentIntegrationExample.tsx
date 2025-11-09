import React, { useState, useEffect } from 'react';
import {
  AudioAgentCoordinator,
  AudioAgents,
  ClaudeFlowIntegration,
  createSupabaseAudioIntegration,
  createClaudeFlowHooks,
  AudioProject,
  GeneratedComposition,
  VoiceOutput,
  BeatPattern,
  ComposerConfig,
  TextToSpeechRequest,
  AudioAgentDefaults
} from '../../services/agents/audio';

interface AudioAgentIntegrationExampleProps {
  userId?: string;
}

const AudioAgentIntegrationExample: React.FC<AudioAgentIntegrationExampleProps> = ({ userId }) => {
  // State management
  const [coordinator, setCoordinator] = useState<AudioAgentCoordinator | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentProject, setCurrentProject] = useState<AudioProject | null>(null);
  const [recentCompositions, setRecentCompositions] = useState<GeneratedComposition[]>([]);
  const [agentStatuses, setAgentStatuses] = useState<Record<string, string>>({});

  // Generation options
  const [selectedStyle, setSelectedStyle] = useState('fusion');
  const [tempo, setTempo] = useState(120);
  const [includeBeats, setIncludeBeats] = useState(true);
  const [includeVoice, setIncludeVoice] = useState(false);
  const [voiceText, setVoiceText] = useState('This is a test of the AI voice synthesis system.');
  const [selectedVoicePreset, setSelectedVoicePreset] = useState('narrator-female');

  // Social media optimization
  const [socialPlatform, setSocialPlatform] = useState<'instagram' | 'tiktok' | 'youtube'>('instagram');

  useEffect(() => {
    initializeAudioAgents();
    return () => {
      if (coordinator) {
        coordinator.dispose();
      }
    };
  }, []);

  const initializeAudioAgents = async () => {
    try {
      setIsLoading(true);

      // Initialize audio agent coordinator with callbacks
      const callbacks = {
        onCompositionGenerated: (composition: GeneratedComposition) => {
          console.log('🎵 Composition generated:', composition.title);
          setRecentCompositions(prev => [composition, ...prev.slice(0, 4)]);
        },
        onProjectUpdated: (project: AudioProject) => {
          console.log('📝 Project updated:', project.name);
          setCurrentProject(project);
        },
        onAgentStatusChange: (agentId: string, status: string) => {
          setAgentStatuses(prev => ({ ...prev, [agentId]: status }));
        },
        onVoiceGenerated: (voice: VoiceOutput) => {
          console.log('🎤 Voice generated:', voice.text.substring(0, 50));
        },
        onBeatGenerated: (beat: BeatPattern) => {
          console.log('🥁 Beat generated:', beat.name);
        }
      };

      // Initialize the complete audio agent suite
      const audioCoordinator = await AudioAgents.initializeComplete(callbacks);

      // Set up Claude-Flow hooks
      if (audioCoordinator) {
        const hooks = await createClaudeFlowHooks(audioCoordinator);
        await hooks.initialize();
      }

      // Set up Supabase integration if user ID is provided
      if (userId) {
        const supabaseIntegration = createSupabaseAudioIntegration(userId);
        await supabaseIntegration.initialize();
      }

      setCoordinator(audioCoordinator);
      setIsInitialized(true);
      console.log('✅ Audio Agent Integration Example initialized');
    } catch (error) {
      console.error('❌ Failed to initialize audio agents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createFullComposition = async () => {
    if (!coordinator || !isInitialized) {
      alert('Audio agents not initialized yet');
      return;
    }

    try {
      setIsLoading(true);

      // Execute pre-generation hook
      await ClaudeFlowIntegration.executePreTaskHook(
        `Creating ${selectedStyle} composition at ${tempo} BPM`
      );

      // Create full composition with optional voice
      const voiceOptions = includeVoice ? {
        text: voiceText,
        voice: selectedVoicePreset
      } : undefined;

      const project = await coordinator.createFullComposition(
        selectedStyle,
        tempo,
        includeBeats,
        voiceOptions
      );

      setCurrentProject(project);

      // Execute post-generation hook
      await ClaudeFlowIntegration.executePostTaskHook(project.id);
      await ClaudeFlowIntegration.notifyProgress(
        `Created composition: ${project.name}`
      );

      console.log('🎼 Full composition created:', project);
    } catch (error) {
      console.error('❌ Failed to create composition:', error);
      alert(`Failed to create composition: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const generateComposition = async () => {
    if (!coordinator) return;

    try {
      setIsLoading(true);

      const config: Partial<ComposerConfig> = {
        style: selectedStyle as any,
        tempo,
        duration: 32,
        useNeuralGeneration: true
      };

      const composition = await coordinator.generateComposition(config);
      console.log('🎵 Composition generated:', composition);
    } catch (error) {
      console.error('❌ Failed to generate composition:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateVoice = async () => {
    if (!coordinator) return;

    try {
      setIsLoading(true);

      const voiceRequest: TextToSpeechRequest = {
        text: voiceText,
        voice: AudioAgentDefaults.voiceConfig,
        format: AudioAgentDefaults.audioFormat
      };

      const voice = await coordinator.generateVoice(voiceRequest);
      console.log('🎤 Voice generated:', voice);
    } catch (error) {
      console.error('❌ Failed to generate voice:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateBeat = async () => {
    if (!coordinator) return;

    try {
      setIsLoading(true);

      const beat = await coordinator.generateBeat(selectedStyle, tempo, 16, 'moderate');
      console.log('🥁 Beat generated:', beat);
    } catch (error) {
      console.error('❌ Failed to generate beat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const optimizeForSocial = async () => {
    if (!coordinator || !currentProject) {
      alert('No project available for optimization');
      return;
    }

    try {
      setIsLoading(true);

      const optimizedAudio = await AudioAgents.optimizeForSocial(
        coordinator,
        currentProject,
        socialPlatform
      );

      console.log(`📱 Audio optimized for ${socialPlatform}:`, optimizedAudio);

      // In a real app, you would save or download the optimized audio
      alert(`Audio optimized for ${socialPlatform}! Check console for details.`);
    } catch (error) {
      console.error('❌ Failed to optimize for social media:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const musicStyles = ['fusion', 'hip-hop', 'edm', 'rock', 'jazz', 'latin', 'trap', 'afrobeat'];
  const voicePresets = ['narrator-female', 'narrator-male', 'child-voice', 'robotic', 'ethereal'];

  if (!isInitialized && isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing Audio Agent Suite...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
          Audio Agent Integration Suite
        </h1>
        <p className="text-gray-600 max-w-3xl mx-auto">
          Complete AI audio generation system with neural composition, voice synthesis, beat generation,
          mixing, and social media optimization powered by specialized agent coordination.
        </p>
      </div>

      {/* Status Dashboard */}
      <div className="bg-gray-900 text-white p-6 rounded-xl">
        <h2 className="text-xl font-semibold mb-4">Agent Status Dashboard</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(agentStatuses).map(([agentId, status]) => (
            <div key={agentId} className="bg-gray-800 p-3 rounded-lg">
              <div className="text-sm text-gray-400 truncate">{agentId}</div>
              <div className={`text-sm font-medium ${
                status === 'ready' ? 'text-green-400' :
                status === 'processing' ? 'text-yellow-400' :
                status === 'error' ? 'text-red-400' : 'text-gray-400'
              }`}>
                {status}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-sm text-gray-400">
          Initialization Status: {isInitialized ? '✅ Ready' : '⏳ Initializing'}
        </div>
      </div>

      {/* Composition Generation */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-4">🎼 Full Composition Generation</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Style Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Music Style</label>
            <select
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              {musicStyles.map(style => (
                <option key={style} value={style}>{style.charAt(0).toUpperCase() + style.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Tempo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tempo: {tempo} BPM
            </label>
            <input
              type="range"
              min="60"
              max="180"
              value={tempo}
              onChange={(e) => setTempo(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Options */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Options</label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeBeats}
                  onChange={(e) => setIncludeBeats(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Include Beats</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeVoice}
                  onChange={(e) => setIncludeVoice(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Include Voice</span>
              </label>
            </div>
          </div>

          {/* Voice Settings */}
          {includeVoice && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Voice Preset</label>
              <select
                value={selectedVoicePreset}
                onChange={(e) => setSelectedVoicePreset(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                {voicePresets.map(preset => (
                  <option key={preset} value={preset}>{preset.replace('-', ' ')}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Voice Text */}
        {includeVoice && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Voice Text</label>
            <textarea
              value={voiceText}
              onChange={(e) => setVoiceText(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg h-20"
              placeholder="Enter text for voice synthesis..."
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4">
          <button
            onClick={createFullComposition}
            disabled={!isInitialized || isLoading}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
          >
            {isLoading ? 'Generating...' : '🎼 Create Full Composition'}
          </button>

          <button
            onClick={generateComposition}
            disabled={!isInitialized || isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
          >
            🎵 Composition Only
          </button>

          <button
            onClick={generateVoice}
            disabled={!isInitialized || isLoading}
            className="px-4 py-2 bg-green-500 text-white rounded-lg disabled:opacity-50"
          >
            🎤 Voice Only
          </button>

          <button
            onClick={generateBeat}
            disabled={!isInitialized || isLoading}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg disabled:opacity-50"
          >
            🥁 Beat Only
          </button>
        </div>
      </div>

      {/* Current Project Display */}
      {currentProject && (
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-4">📂 Current Project</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg">{currentProject.name}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
              <div>
                <span className="text-gray-600">Tempo:</span> {currentProject.tempo} BPM
              </div>
              <div>
                <span className="text-gray-600">Key:</span> {currentProject.key}
              </div>
              <div>
                <span className="text-gray-600">Tracks:</span> {currentProject.tracks.length}
              </div>
              <div>
                <span className="text-gray-600">Duration:</span> {currentProject.metadata.duration}s
              </div>
            </div>

            {/* Track List */}
            <div className="mt-4">
              <h4 className="font-medium mb-2">Tracks:</h4>
              <div className="space-y-1">
                {currentProject.tracks.map(track => (
                  <div key={track.id} className="text-sm bg-white p-2 rounded flex justify-between">
                    <span>{track.name}</span>
                    <span className="text-gray-500">{track.type}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Social Media Optimization */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium mb-3">📱 Social Media Optimization</h4>
            <div className="flex items-center space-x-4 mb-3">
              <label className="text-sm font-medium text-gray-700">Platform:</label>
              <select
                value={socialPlatform}
                onChange={(e) => setSocialPlatform(e.target.value as any)}
                className="p-2 border border-gray-300 rounded"
              >
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="youtube">YouTube</option>
              </select>
              <button
                onClick={optimizeForSocial}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
              >
                {isLoading ? 'Optimizing...' : 'Optimize for Platform'}
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Optimizes audio format, compression, and length for the selected social media platform.
            </p>
          </div>
        </div>
      )}

      {/* Recent Compositions */}
      {recentCompositions.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-4">🎵 Recent Compositions</h2>
          <div className="space-y-3">
            {recentCompositions.map(composition => (
              <div key={composition.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{composition.title}</h3>
                    <p className="text-sm text-gray-600">
                      {composition.metadata.style} • {composition.metadata.tempo} BPM • {composition.metadata.key}
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {composition.metadata.generatedAt.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Integration Info */}
      <div className="bg-gradient-to-r from-purple-50 to-cyan-50 p-6 rounded-xl">
        <h2 className="text-2xl font-bold mb-4">🔗 Integration Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">🎼 Audio Agents</h3>
            <ul className="text-sm space-y-1 text-gray-700">
              <li>• AudioComposer - Neural melody generation</li>
              <li>• SoundEffects - Real-time audio processing</li>
              <li>• VoiceSynthesizer - Text-to-speech with multiple voices</li>
              <li>• AudioMixer - Professional mixing and mastering</li>
              <li>• BeatGenerator - Rhythm patterns for multiple genres</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">🔧 Integrations</h3>
            <ul className="text-sm space-y-1 text-gray-700">
              <li>• Claude-Flow hooks for task tracking</li>
              <li>• Supabase for project persistence</li>
              <li>• Tone.js for audio synthesis</li>
              <li>• Magenta.js for neural music AI</li>
              <li>• Social media format optimization</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioAgentIntegrationExample;