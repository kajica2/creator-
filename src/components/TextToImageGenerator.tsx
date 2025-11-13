import React, { useState } from 'react';
import { Image, Copy, Download, ArrowLeft, Sparkles, Settings, Palette, Wand2, Zap } from 'lucide-react';

interface TextToImageGeneratorProps {
  onBack?: () => void;
  onNavigate?: (page: string) => void;
}

interface ImageResult {
  id: string;
  url: string;
  prompt: string;
  style: string;
  dimensions: string;
  timestamp: string;
}

export function TextToImageGenerator({ onBack }: TextToImageGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('realistic');
  const [dimensions, setDimensions] = useState('1024x1024');
  const [quality, setQuality] = useState('standard');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<ImageResult[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const styles = [
    { id: 'realistic', name: 'Realistic', desc: 'Photorealistic images' },
    { id: 'artistic', name: 'Artistic', desc: 'Creative and stylized' },
    { id: 'digital-art', name: 'Digital Art', desc: 'Modern digital artwork' },
    { id: 'oil-painting', name: 'Oil Painting', desc: 'Classic oil painting style' },
    { id: 'watercolor', name: 'Watercolor', desc: 'Soft watercolor effects' },
    { id: 'anime', name: 'Anime', desc: 'Japanese anime style' },
    { id: 'cartoon', name: 'Cartoon', desc: 'Fun cartoon illustrations' },
    { id: 'abstract', name: 'Abstract', desc: 'Abstract art style' }
  ];

  const dimensionOptions = [
    '1024x1024', '1024x1792', '1792x1024', '512x512', '768x768'
  ];

  const qualityOptions = [
    { id: 'standard', name: 'Standard', desc: 'Good quality, fast generation' },
    { id: 'hd', name: 'HD', desc: 'High quality, slower generation' }
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Create mock image result
      const newImage: ImageResult = {
        id: Date.now().toString(),
        url: `https://picsum.photos/${dimensions.split('x')[0]}/${dimensions.split('x')[1]}?random=${Date.now()}`,
        prompt: prompt,
        style: style,
        dimensions: dimensions,
        timestamp: new Date().toLocaleString()
      };

      setGeneratedImages(prev => [newImage, ...prev]);
    } catch (error) {
      console.error('Image generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
  };

  const handleDownloadImage = (image: ImageResult) => {
    const link = document.createElement('a');
    link.href = image.url;
    link.download = `generated-image-${image.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const promptSuggestions = [
    "A majestic mountain landscape at sunset",
    "Futuristic city with flying cars",
    "Cute robot playing with a cat",
    "Abstract cosmic nebula in space",
    "Vintage coffee shop on a rainy day"
  ];

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
              <Image className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Text to Image Generator</h1>
              <p className="text-slate-400">Create stunning images from text descriptions</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Generation Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Create Image
              </h2>

              {/* Prompt Input */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Image Description
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the image you want to generate..."
                    className="w-full h-32 p-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Quick Suggestions */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Quick Suggestions
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {promptSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => setPrompt(suggestion)}
                        className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Style Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Art Style
                  </label>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="w-full p-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                  >
                    {styles.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} - {s.desc}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Advanced Settings Toggle */}
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
                </button>

                {/* Advanced Settings */}
                {showAdvanced && (
                  <div className="space-y-4 pt-4 border-t border-slate-600">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Dimensions
                      </label>
                      <select
                        value={dimensions}
                        onChange={(e) => setDimensions(e.target.value)}
                        className="w-full p-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                      >
                        {dimensionOptions.map(dim => (
                          <option key={dim} value={dim}>{dim}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Quality
                      </label>
                      <select
                        value={quality}
                        onChange={(e) => setQuality(e.target.value)}
                        className="w-full p-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                      >
                        {qualityOptions.map(q => (
                          <option key={q.id} value={q.id}>
                            {q.name} - {q.desc}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || isGenerating}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5" />
                      Generate Image
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Palette className="w-5 h-5 text-blue-400" />
                Pro Tips
              </h3>
              <ul className="text-slate-400 space-y-2 text-sm">
                <li>• Be specific about details, colors, and lighting</li>
                <li>• Include artistic style references</li>
                <li>• Mention camera angles or composition</li>
                <li>• Add mood descriptors (dramatic, serene, vibrant)</li>
                <li>• Use negative prompts to exclude unwanted elements</li>
              </ul>
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Generated Images</h2>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Zap className="w-4 h-4" />
                  {generatedImages.length} images created
                </div>
              </div>

              {generatedImages.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {generatedImages.map((image) => (
                    <div key={image.id} className="bg-slate-900/50 border border-slate-600 rounded-lg overflow-hidden">
                      {/* Image */}
                      <div className="aspect-square bg-slate-800">
                        <img
                          src={image.url}
                          alt={image.prompt}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Image Info */}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <p className="text-sm text-slate-300 line-clamp-2">{image.prompt}</p>
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              onClick={() => handleCopyPrompt(image.prompt)}
                              className="p-1 text-slate-400 hover:text-white transition-colors"
                              title="Copy prompt"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDownloadImage(image)}
                              className="p-1 text-slate-400 hover:text-white transition-colors"
                              title="Download image"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span className="capitalize">{image.style.replace('-', ' ')}</span>
                          <span>{image.dimensions}</span>
                          <span>{image.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-96 flex items-center justify-center border-2 border-dashed border-slate-600 rounded-lg">
                  <div className="text-center">
                    <Image className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-400 text-lg mb-2">No images generated yet</p>
                    <p className="text-slate-500">Enter a prompt and click generate to create your first image</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Coming Soon Notice */}
        <div className="mt-8 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-2">🚀 Coming Soon</h3>
          <p className="text-slate-300">
            Integration with DALL-E 3, Midjourney, and Stable Diffusion APIs. Advanced editing tools,
            style transfer, image upscaling, and batch generation capabilities.
          </p>
        </div>
      </div>
    </div>
  );
}

export default TextToImageGenerator;