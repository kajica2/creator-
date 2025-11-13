import React, { useState } from 'react';
import { Wand2, Copy, Download, ArrowLeft, Sparkles } from 'lucide-react';

interface AIStoryGeneratorProps {
  onBack?: () => void;
  onNavigate?: (page: string) => void;
}

export function AIStoryGenerator({ onBack }: AIStoryGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [story, setStory] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      // TODO: Integrate with Gemini API for story generation
      // For now, provide a placeholder response
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call

      const mockStory = `Once upon a time, ${prompt.toLowerCase()}...

This is a placeholder story generated from your prompt: "${prompt}"

The AI Story Generator will be fully implemented with Gemini integration to create engaging, creative stories based on your prompts.

Story elements that could be developed:
• Character development
• Plot progression
• Descriptive narratives
• Dialogue
• Creative endings

This tool will help you generate:
- Short stories
- Story outlines
- Creative writing prompts
- Narrative structures
- Character backgrounds`;

      setStory(mockStory);
    } catch (error) {
      console.error('Story generation error:', error);
      setStory('Error generating story. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(story);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([story], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `story-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
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
              <Wand2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">AI Story Generator</h1>
              <p className="text-slate-400">Create engaging stories with AI assistance</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Story Prompt
              </h2>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your story idea, theme, or prompt here..."
                className="w-full h-32 p-4 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Generating Story...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    Generate Story
                  </>
                )}
              </button>
            </div>

            {/* Story Tips */}
            <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Story Tips</h3>
              <ul className="text-slate-400 space-y-2">
                <li>• Be specific about genre, setting, or character details</li>
                <li>• Include mood or tone preferences (dark, funny, mysterious)</li>
                <li>• Mention desired story length or structure</li>
                <li>• Add any specific elements you want included</li>
              </ul>
            </div>
          </div>

          {/* Output Section */}
          <div className="space-y-6">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Generated Story</h2>
                {story && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopy}
                      className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg transition-colors"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleDownload}
                      className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg transition-colors"
                      title="Download as file"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="min-h-64 max-h-96 overflow-y-auto">
                {story ? (
                  <div className="p-4 bg-slate-900/50 border border-slate-600 rounded-lg">
                    <pre className="text-slate-300 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                      {story}
                    </pre>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-600 rounded-lg">
                    <div className="text-center">
                      <Wand2 className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                      <p className="text-slate-400">Your generated story will appear here</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Coming Soon Notice */}
        <div className="mt-8 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-2">🚀 Coming Soon</h3>
          <p className="text-slate-300">
            Full Gemini integration for advanced story generation, character development,
            plot structuring, and creative writing assistance.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AIStoryGenerator;