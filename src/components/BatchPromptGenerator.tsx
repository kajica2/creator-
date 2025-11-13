import React, { useState } from 'react';
import { Grid3x3, ArrowLeft, Sparkles, Upload, Download, Play, Plus, Trash2, Copy, Settings, Shuffle, Target } from 'lucide-react';

interface BatchPromptGeneratorProps {
  onBack?: () => void;
  onNavigate?: (page: string) => void;
}

interface PromptTemplate {
  id: string;
  name: string;
  template: string;
  variables: string[];
  category: string;
}

interface GeneratedPrompt {
  id: string;
  prompt: string;
  template: string;
  variables: Record<string, string>;
  timestamp: string;
}

interface BatchSession {
  id: string;
  name: string;
  prompts: GeneratedPrompt[];
  settings: {
    template: string;
    variationCount: number;
    creativity: number;
    includeStyle: boolean;
    includeMood: boolean;
    includeComposition: boolean;
  };
}

export function BatchPromptGenerator({ onBack }: BatchPromptGeneratorProps) {
  const [sessions, setSessions] = useState<BatchSession[]>([]);
  const [currentSession, setCurrentSession] = useState<BatchSession | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [variationCount, setVariationCount] = useState(10);
  const [creativity, setCreativity] = useState(5);
  const [includeStyle, setIncludeStyle] = useState(true);
  const [includeMood, setIncludeMood] = useState(true);
  const [includeComposition, setIncludeComposition] = useState(false);
  const [customTemplate, setCustomTemplate] = useState('');
  const [baseKeywords, setBaseKeywords] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const promptTemplates: PromptTemplate[] = [
    {
      id: 'portrait',
      name: 'Portrait Photography',
      template: 'A {adjective} portrait of a {subject} {action}, {lighting} lighting, {composition} shot, {style} style',
      variables: ['adjective', 'subject', 'action', 'lighting', 'composition', 'style'],
      category: 'Photography'
    },
    {
      id: 'landscape',
      name: 'Landscape Scene',
      template: 'A {time} view of {location} with {weather}, {mood} atmosphere, {camera_angle} angle, {art_style}',
      variables: ['time', 'location', 'weather', 'mood', 'camera_angle', 'art_style'],
      category: 'Nature'
    },
    {
      id: 'fantasy',
      name: 'Fantasy Art',
      template: 'A {magical_creature} in {fantasy_location}, {magical_effect}, {art_medium} art style, {color_palette} colors',
      variables: ['magical_creature', 'fantasy_location', 'magical_effect', 'art_medium', 'color_palette'],
      category: 'Fantasy'
    },
    {
      id: 'architecture',
      name: 'Architecture',
      template: '{building_type} with {architectural_style} design, {material} materials, {time_period} era, {perspective} perspective',
      variables: ['building_type', 'architectural_style', 'material', 'time_period', 'perspective'],
      category: 'Architecture'
    },
    {
      id: 'abstract',
      name: 'Abstract Art',
      template: '{abstract_concept} represented through {art_technique}, {color_scheme} color palette, {texture} textures, {composition_type}',
      variables: ['abstract_concept', 'art_technique', 'color_scheme', 'texture', 'composition_type'],
      category: 'Abstract'
    }
  ];

  const variableOptions: Record<string, string[]> = {
    adjective: ['stunning', 'dramatic', 'elegant', 'mysterious', 'vibrant', 'serene', 'bold', 'ethereal'],
    subject: ['person', 'woman', 'man', 'child', 'elder', 'artist', 'warrior', 'dancer'],
    action: ['looking into camera', 'gazing away', 'smiling gently', 'in contemplation', 'laughing', 'reading'],
    lighting: ['golden hour', 'studio', 'natural', 'dramatic', 'soft', 'backlit', 'rim', 'chiaroscuro'],
    composition: ['close-up', 'medium', 'wide', 'low angle', 'high angle', 'profile', 'three-quarter'],
    style: ['photorealistic', 'cinematic', 'fashion photography', 'street photography', 'fine art'],
    time: ['sunrise', 'sunset', 'golden hour', 'blue hour', 'midday', 'dawn', 'dusk', 'night'],
    location: ['mountain range', 'ocean shore', 'forest clearing', 'desert landscape', 'rolling hills', 'lake'],
    weather: ['clear skies', 'dramatic clouds', 'misty fog', 'stormy weather', 'rainbow', 'snow'],
    mood: ['peaceful', 'dramatic', 'mysterious', 'romantic', 'epic', 'melancholic', 'energetic'],
    camera_angle: ['wide', 'aerial', 'ground level', 'bird\'s eye', 'worm\'s eye', 'panoramic'],
    art_style: ['oil painting', 'watercolor', 'digital art', 'photography', 'impressionist', 'realistic'],
    magical_creature: ['dragon', 'phoenix', 'unicorn', 'fairy', 'griffin', 'pegasus', 'mermaid'],
    fantasy_location: ['enchanted forest', 'floating island', 'crystal cave', 'ancient temple', 'mystical realm'],
    magical_effect: ['glowing aura', 'sparkles of light', 'floating objects', 'energy beams', 'magical mist'],
    art_medium: ['oil painting', 'digital illustration', 'concept art', 'fantasy art', 'watercolor'],
    color_palette: ['vibrant rainbow', 'earth tones', 'cool blues', 'warm oranges', 'monochromatic'],
    building_type: ['skyscraper', 'cathedral', 'modern house', 'castle', 'bridge', 'museum', 'library'],
    architectural_style: ['modern', 'gothic', 'art deco', 'minimalist', 'baroque', 'futuristic', 'traditional'],
    material: ['glass and steel', 'stone and wood', 'concrete', 'brick', 'marble', 'bamboo'],
    time_period: ['contemporary', 'ancient', 'medieval', 'futuristic', 'renaissance', 'industrial'],
    perspective: ['exterior', 'interior', 'aerial', 'street level', 'detail', 'panoramic'],
    abstract_concept: ['emotions', 'time', 'music', 'growth', 'transformation', 'energy', 'balance'],
    art_technique: ['geometric shapes', 'fluid forms', 'fractal patterns', 'color blending', 'texture layering'],
    color_scheme: ['monochromatic', 'complementary', 'analogous', 'triadic', 'split-complementary'],
    texture: ['smooth gradients', 'rough brushstrokes', 'metallic', 'organic', 'crystalline'],
    composition_type: ['symmetrical', 'asymmetrical', 'radial', 'spiral', 'grid-based', 'flowing']
  };

  const createNewSession = () => {
    const newSession: BatchSession = {
      id: Date.now().toString(),
      name: `Prompt Session ${sessions.length + 1}`,
      prompts: [],
      settings: {
        template: selectedTemplate,
        variationCount,
        creativity,
        includeStyle,
        includeMood,
        includeComposition
      }
    };
    setSessions(prev => [...prev, newSession]);
    setCurrentSession(newSession);
  };

  const generatePrompts = async () => {
    if (!currentSession) return;

    setIsGenerating(true);
    const template = promptTemplates.find(t => t.id === selectedTemplate);

    if (!template) {
      setIsGenerating(false);
      return;
    }

    try {
      const newPrompts: GeneratedPrompt[] = [];

      for (let i = 0; i < variationCount; i++) {
        // Simulate generation delay
        await new Promise(resolve => setTimeout(resolve, 100));

        const variables: Record<string, string> = {};
        let generatedPrompt = template.template;

        // Fill in template variables
        template.variables.forEach(variable => {
          const options = variableOptions[variable] || ['default'];
          const randomOption = options[Math.floor(Math.random() * options.length)];
          variables[variable] = randomOption;
          generatedPrompt = generatedPrompt.replace(`{${variable}}`, randomOption);
        });

        // Add style modifiers if enabled
        if (includeStyle && Math.random() > 0.3) {
          const styles = ['highly detailed', 'award winning', 'professional', 'masterpiece', '8k resolution'];
          const style = styles[Math.floor(Math.random() * styles.length)];
          generatedPrompt = `${generatedPrompt}, ${style}`;
        }

        // Add mood modifiers if enabled
        if (includeMood && Math.random() > 0.4) {
          const moods = ['dramatic lighting', 'soft lighting', 'vibrant colors', 'muted colors', 'high contrast'];
          const mood = moods[Math.floor(Math.random() * moods.length)];
          generatedPrompt = `${generatedPrompt}, ${mood}`;
        }

        // Add composition modifiers if enabled
        if (includeComposition && Math.random() > 0.5) {
          const compositions = ['rule of thirds', 'centered composition', 'leading lines', 'symmetrical', 'asymmetrical'];
          const composition = compositions[Math.floor(Math.random() * compositions.length)];
          generatedPrompt = `${generatedPrompt}, ${composition}`;
        }

        // Add base keywords if provided
        if (baseKeywords.trim()) {
          generatedPrompt = `${baseKeywords.trim()}, ${generatedPrompt}`;
        }

        const prompt: GeneratedPrompt = {
          id: `${Date.now()}_${i}`,
          prompt: generatedPrompt,
          template: template.name,
          variables,
          timestamp: new Date().toLocaleTimeString()
        };

        newPrompts.push(prompt);
      }

      const updatedSession = {
        ...currentSession,
        prompts: [...currentSession.prompts, ...newPrompts]
      };

      setSessions(prev => prev.map(s => s.id === currentSession.id ? updatedSession : s));
      setCurrentSession(updatedSession);

    } catch (error) {
      console.error('Error generating prompts:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
  };

  const copyAllPrompts = () => {
    if (!currentSession) return;

    const allPrompts = currentSession.prompts.map(p => p.prompt).join('\n\n');
    navigator.clipboard.writeText(allPrompts);
  };

  const exportPrompts = () => {
    if (!currentSession) return;

    const content = `Batch Prompt Generation - ${currentSession.name}
Generated: ${new Date().toLocaleString()}
Template: ${selectedTemplate}
Total Prompts: ${currentSession.prompts.length}

${currentSession.prompts.map((p, index) =>
  `${index + 1}. ${p.prompt}`
).join('\n\n')}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `batch-prompts-${currentSession.name.toLowerCase().replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const removePrompt = (promptId: string) => {
    if (!currentSession) return;

    const updatedSession = {
      ...currentSession,
      prompts: currentSession.prompts.filter(p => p.id !== promptId)
    };

    setSessions(prev => prev.map(s => s.id === currentSession.id ? updatedSession : s));
    setCurrentSession(updatedSession);
  };

  const duplicatePrompt = (prompt: GeneratedPrompt) => {
    if (!currentSession) return;

    const duplicatedPrompt: GeneratedPrompt = {
      ...prompt,
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString()
    };

    const updatedSession = {
      ...currentSession,
      prompts: [...currentSession.prompts, duplicatedPrompt]
    };

    setSessions(prev => prev.map(s => s.id === currentSession.id ? updatedSession : s));
    setCurrentSession(updatedSession);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500">
              <Grid3x3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Batch Prompt Generator</h1>
              <p className="text-slate-400">Generate multiple AI prompts for creative projects</p>
            </div>
          </div>

          {/* Header Actions */}
          <div className="ml-auto flex gap-2">
            {!currentSession ? (
              <button
                onClick={createNewSession}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all"
              >
                <Plus className="w-4 h-4" />
                New Session
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={copyAllPrompts}
                  disabled={currentSession.prompts.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Copy All
                </button>
                <button
                  onClick={exportPrompts}
                  disabled={currentSession.prompts.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export ({currentSession.prompts.length})
                </button>
              </div>
            )}
          </div>
        </div>

        {currentSession ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Settings Panel */}
            <div className="space-y-6">
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-400" />
                  Generation Settings
                </h2>

                <div className="space-y-4">
                  {/* Template Selection */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Prompt Template
                    </label>
                    <select
                      value={selectedTemplate}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                      className="w-full p-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select a template...</option>
                      {promptTemplates.map(template => (
                        <option key={template.id} value={template.id}>
                          {template.name} - {template.category}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Base Keywords */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Base Keywords (optional)
                    </label>
                    <input
                      type="text"
                      value={baseKeywords}
                      onChange={(e) => setBaseKeywords(e.target.value)}
                      placeholder="e.g., professional photography, high quality"
                      className="w-full p-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Variation Count */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Number of Variations: {variationCount}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="50"
                      value={variationCount}
                      onChange={(e) => setVariationCount(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  {/* Creativity Level */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Creativity Level: {creativity}/10
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={creativity}
                      onChange={(e) => setCreativity(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  {/* Modifiers */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-300">
                      Include Modifiers
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={includeStyle}
                        onChange={(e) => setIncludeStyle(e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-slate-300">Style enhancers</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={includeMood}
                        onChange={(e) => setIncludeMood(e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-slate-300">Mood descriptors</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={includeComposition}
                        onChange={(e) => setIncludeComposition(e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-slate-300">Composition rules</span>
                    </label>
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={generatePrompts}
                    disabled={!selectedTemplate || isGenerating}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generate Prompts
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Template Preview */}
              {selectedTemplate && (
                <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-400" />
                    Template Preview
                  </h3>
                  {(() => {
                    const template = promptTemplates.find(t => t.id === selectedTemplate);
                    return template ? (
                      <div>
                        <p className="text-slate-300 text-sm mb-2">{template.template}</p>
                        <div className="flex flex-wrap gap-1">
                          {template.variables.map(variable => (
                            <span
                              key={variable}
                              className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded"
                            >
                              {variable}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}

              {/* Session History */}
              {sessions.length > 1 && (
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Previous Sessions</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {sessions.filter(s => s.id !== currentSession.id).map(session => (
                      <button
                        key={session.id}
                        onClick={() => setCurrentSession(session)}
                        className="w-full p-3 bg-slate-900/50 border border-slate-600 rounded-lg text-left hover:bg-slate-700/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-white font-medium">{session.name}</span>
                          <span className="text-slate-400 text-sm">{session.prompts.length}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Generated Prompts */}
            <div className="lg:col-span-2">
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">
                    {currentSession.name}
                  </h3>
                  <div className="text-sm text-slate-400">
                    {currentSession.prompts.length} prompts generated
                  </div>
                </div>

                {currentSession.prompts.length > 0 ? (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {currentSession.prompts.map((prompt, index) => (
                      <div
                        key={prompt.id}
                        className="bg-slate-900/50 border border-slate-600 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
                                #{index + 1}
                              </span>
                              <span className="text-xs text-slate-400">{prompt.template}</span>
                              <span className="text-xs text-slate-500">{prompt.timestamp}</span>
                            </div>
                            <p className="text-slate-300 leading-relaxed">{prompt.prompt}</p>
                          </div>

                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              onClick={() => copyPrompt(prompt.prompt)}
                              className="p-1 text-slate-400 hover:text-white transition-colors"
                              title="Copy prompt"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => duplicatePrompt(prompt)}
                              className="p-1 text-slate-400 hover:text-white transition-colors"
                              title="Duplicate"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removePrompt(prompt.id)}
                              className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                              title="Remove"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-600 rounded-lg">
                    <div className="text-center">
                      <Sparkles className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                      <p className="text-slate-400">No prompts generated yet</p>
                      <p className="text-slate-500 text-sm">Configure settings and click generate to start</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <Grid3x3 className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No Session Active</h2>
            <p className="text-slate-400 mb-6">Create a new session to start generating prompts</p>
            <button
              onClick={createNewSession}
              className="flex items-center gap-2 mx-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Create Session
            </button>
          </div>
        )}

        {/* Coming Soon Notice */}
        <div className="mt-8 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-2">🚀 Coming Soon</h3>
          <p className="text-slate-300">
            AI-powered prompt optimization, custom template builder, prompt quality scoring,
            integration with image generation tools, and collaborative prompt libraries.
          </p>
        </div>
      </div>
    </div>
  );
}

export default BatchPromptGenerator;