import React, { useState } from 'react';
import { Music, Copy, Download, ArrowLeft, Sparkles } from 'lucide-react';

interface SunoLyricsGeneratorProps {
  onBack?: () => void;
  onNavigate?: (page: string) => void;
}

export function SunoLyricsGenerator({ onBack }: SunoLyricsGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      // TODO: Integrate with Gemini API for lyrics generation
      // For now, provide a placeholder response
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call

      const mockLyrics = `🎵 Generated Song: "${prompt}"

[Verse 1]
This is a placeholder song generated from your prompt
Creating lyrics about "${prompt.toLowerCase()}"
AI-powered creativity flows through every line
Making music that's uniquely divine

[Chorus]
Songs that capture your vision
Words that paint emotion
Melodies born from AI precision
Setting hearts in motion

[Verse 2]
The Suno Lyrics Generator will create
Professional lyrics that truly resonate
From concept to completion, verse by verse
Making your musical dreams come first

[Bridge]
Every word carefully chosen
Every rhythm precisely timed
Your creative vision has awoken
In these AI-crafted rhymes

[Outro]
This tool will help you generate:
• Song lyrics for any genre
• Rhyme schemes and structures
• Emotional storytelling
• Professional songwriting formats
• Hooks and memorable choruses

Coming soon with full Gemini integration!`;

      setLyrics(mockLyrics);
    } catch (error) {
      console.error('Lyrics generation error:', error);
      setLyrics('Error generating lyrics. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(lyrics);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([lyrics], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `lyrics-${Date.now()}.txt`;
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
              <Music className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Suno Lyrics Generator</h1>
              <p className="text-slate-400">Create captivating song lyrics with AI</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Song Concept
              </h2>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your song concept, theme, mood, or genre here..."
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
                    Generating Lyrics...
                  </>
                ) : (
                  <>
                    <Music className="w-5 h-5" />
                    Generate Lyrics
                  </>
                )}
              </button>
            </div>

            {/* Lyrics Tips */}
            <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Songwriting Tips</h3>
              <ul className="text-slate-400 space-y-2">
                <li>• Specify genre (pop, rock, country, hip-hop, etc.)</li>
                <li>• Include mood or emotion (uplifting, melancholy, energetic)</li>
                <li>• Mention song structure preferences (verse-chorus, bridge)</li>
                <li>• Add specific themes or stories you want to tell</li>
              </ul>
            </div>
          </div>

          {/* Output Section */}
          <div className="space-y-6">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Generated Lyrics</h2>
                {lyrics && (
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
                {lyrics ? (
                  <div className="p-4 bg-slate-900/50 border border-slate-600 rounded-lg">
                    <pre className="text-slate-300 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                      {lyrics}
                    </pre>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-600 rounded-lg">
                    <div className="text-center">
                      <Music className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                      <p className="text-slate-400">Your generated lyrics will appear here</p>
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
            Full Gemini integration for advanced lyrics generation, rhyme schemes,
            song structure optimization, and genre-specific styling.
          </p>
        </div>
      </div>
    </div>
  );
}

export default SunoLyricsGenerator;