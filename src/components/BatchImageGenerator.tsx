import React, { useState } from 'react';
import { Grid3x3, ArrowLeft, Sparkles, Upload, Download, Play, Pause, Plus, Trash2, Copy, Settings } from 'lucide-react';

interface BatchImageGeneratorProps {
  onBack?: () => void;
  onNavigate?: (page: string) => void;
}

interface BatchPrompt {
  id: string;
  prompt: string;
  style: string;
  dimensions: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  imageUrl?: string;
  progress?: number;
}

interface BatchJob {
  id: string;
  name: string;
  prompts: BatchPrompt[];
  status: 'idle' | 'running' | 'paused' | 'completed';
  progress: number;
  startTime?: string;
  completedCount: number;
}

export function BatchImageGenerator({ onBack }: BatchImageGeneratorProps) {
  const [batchJobs, setBatchJobs] = useState<BatchJob[]>([]);
  const [currentJob, setCurrentJob] = useState<BatchJob | null>(null);
  const [newPrompt, setNewPrompt] = useState('');
  const [batchStyle, setBatchStyle] = useState('realistic');
  const [batchDimensions, setBatchDimensions] = useState('1024x1024');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [maxConcurrent, setMaxConcurrent] = useState(2);
  const [delayBetween, setDelayBetween] = useState(1);

  const styles = [
    'realistic', 'artistic', 'digital-art', 'oil-painting', 'watercolor', 'anime', 'cartoon', 'abstract'
  ];

  const dimensionOptions = [
    '1024x1024', '1024x1792', '1792x1024', '512x512', '768x768'
  ];

  const createNewJob = () => {
    const newJob: BatchJob = {
      id: Date.now().toString(),
      name: `Batch Job ${batchJobs.length + 1}`,
      prompts: [],
      status: 'idle',
      progress: 0,
      completedCount: 0
    };
    setBatchJobs(prev => [...prev, newJob]);
    setCurrentJob(newJob);
  };

  const addPromptToJob = () => {
    if (!newPrompt.trim() || !currentJob) return;

    const newBatchPrompt: BatchPrompt = {
      id: Date.now().toString(),
      prompt: newPrompt.trim(),
      style: batchStyle,
      dimensions: batchDimensions,
      status: 'pending'
    };

    const updatedJob = {
      ...currentJob,
      prompts: [...currentJob.prompts, newBatchPrompt]
    };

    setBatchJobs(prev => prev.map(job => job.id === currentJob.id ? updatedJob : job));
    setCurrentJob(updatedJob);
    setNewPrompt('');
  };

  const removePrompt = (promptId: string) => {
    if (!currentJob) return;

    const updatedJob = {
      ...currentJob,
      prompts: currentJob.prompts.filter(p => p.id !== promptId)
    };

    setBatchJobs(prev => prev.map(job => job.id === currentJob.id ? updatedJob : job));
    setCurrentJob(updatedJob);
  };

  const duplicatePrompt = (prompt: BatchPrompt) => {
    if (!currentJob) return;

    const duplicatedPrompt: BatchPrompt = {
      ...prompt,
      id: Date.now().toString(),
      status: 'pending',
      imageUrl: undefined,
      progress: undefined
    };

    const updatedJob = {
      ...currentJob,
      prompts: [...currentJob.prompts, duplicatedPrompt]
    };

    setBatchJobs(prev => prev.map(job => job.id === currentJob.id ? updatedJob : job));
    setCurrentJob(updatedJob);
  };

  const startBatchGeneration = async () => {
    if (!currentJob || currentJob.prompts.length === 0) return;

    setIsGenerating(true);

    const updatedJob = {
      ...currentJob,
      status: 'running' as const,
      startTime: new Date().toLocaleTimeString()
    };

    setBatchJobs(prev => prev.map(job => job.id === currentJob.id ? updatedJob : job));
    setCurrentJob(updatedJob);

    // Simulate batch generation
    for (let i = 0; i < currentJob.prompts.length; i++) {
      const prompt = currentJob.prompts[i];

      // Update prompt status to generating
      const generatingUpdate = {
        ...updatedJob,
        prompts: updatedJob.prompts.map(p =>
          p.id === prompt.id ? { ...p, status: 'generating' as const, progress: 0 } : p
        )
      };
      setBatchJobs(prev => prev.map(job => job.id === currentJob.id ? generatingUpdate : job));
      setCurrentJob(generatingUpdate);

      // Simulate progress
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise(resolve => setTimeout(resolve, 200));

        const progressUpdate = {
          ...generatingUpdate,
          prompts: generatingUpdate.prompts.map(p =>
            p.id === prompt.id ? { ...p, progress } : p
          )
        };
        setBatchJobs(prev => prev.map(job => job.id === currentJob.id ? progressUpdate : job));
        setCurrentJob(progressUpdate);
      }

      // Complete the prompt
      const completedUpdate = {
        ...generatingUpdate,
        prompts: generatingUpdate.prompts.map(p =>
          p.id === prompt.id
            ? { ...p, status: 'completed' as const, progress: 100, imageUrl: `https://picsum.photos/${p.dimensions.split('x')[0]}/${p.dimensions.split('x')[1]}?random=${Date.now() + i}` }
            : p
        ),
        completedCount: generatingUpdate.completedCount + 1,
        progress: Math.round(((i + 1) / currentJob.prompts.length) * 100)
      };

      setBatchJobs(prev => prev.map(job => job.id === currentJob.id ? completedUpdate : job));
      setCurrentJob(completedUpdate);
      updatedJob.prompts = completedUpdate.prompts;
      updatedJob.completedCount = completedUpdate.completedCount;
      updatedJob.progress = completedUpdate.progress;

      // Delay between generations
      if (i < currentJob.prompts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayBetween * 1000));
      }
    }

    // Mark job as completed
    const finalUpdate = {
      ...updatedJob,
      status: 'completed' as const
    };
    setBatchJobs(prev => prev.map(job => job.id === currentJob.id ? finalUpdate : job));
    setCurrentJob(finalUpdate);
    setIsGenerating(false);
  };

  const downloadAllImages = () => {
    if (!currentJob) return;

    currentJob.prompts
      .filter(p => p.status === 'completed' && p.imageUrl)
      .forEach((prompt, index) => {
        setTimeout(() => {
          const link = document.createElement('a');
          link.href = prompt.imageUrl!;
          link.download = `batch-image-${index + 1}-${prompt.id}.jpg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }, index * 100);
      });
  };

  const importPromptsFromFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentJob) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const lines = content.split('\n').filter(line => line.trim());

        const importedPrompts: BatchPrompt[] = lines.map((line, index) => ({
          id: `${Date.now()}_${index}`,
          prompt: line.trim(),
          style: batchStyle,
          dimensions: batchDimensions,
          status: 'pending'
        }));

        const updatedJob = {
          ...currentJob,
          prompts: [...currentJob.prompts, ...importedPrompts]
        };

        setBatchJobs(prev => prev.map(job => job.id === currentJob.id ? updatedJob : job));
        setCurrentJob(updatedJob);
      } catch (error) {
        console.error('Error importing prompts:', error);
      }
    };
    reader.readAsText(file);
  };

  const exportPrompts = () => {
    if (!currentJob) return;

    const content = currentJob.prompts.map(p => p.prompt).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `batch-prompts-${currentJob.name.toLowerCase().replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
              <h1 className="text-3xl font-bold text-white">Batch Image Generator</h1>
              <p className="text-slate-400">Generate multiple images simultaneously</p>
            </div>
          </div>

          {/* Header Actions */}
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
            {!currentJob ? (
              <button
                onClick={createNewJob}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all"
              >
                <Plus className="w-4 h-4" />
                New Batch Job
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={downloadAllImages}
                  disabled={currentJob.completedCount === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download All ({currentJob.completedCount})
                </button>
                <button
                  onClick={startBatchGeneration}
                  disabled={isGenerating || currentJob.prompts.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white rounded-lg transition-all"
                >
                  {isGenerating ? (
                    <>
                      <Pause className="w-4 h-4" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Start Batch
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mb-6 bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Batch Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Max Concurrent
                </label>
                <select
                  value={maxConcurrent}
                  onChange={(e) => setMaxConcurrent(parseInt(e.target.value))}
                  className="w-full p-2 bg-slate-900/50 border border-slate-600 rounded text-white"
                >
                  {[1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n}>{n} at a time</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Delay Between (seconds)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={delayBetween}
                  onChange={(e) => setDelayBetween(parseFloat(e.target.value))}
                  className="w-full p-2 bg-slate-900/50 border border-slate-600 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Default Style
                </label>
                <select
                  value={batchStyle}
                  onChange={(e) => setBatchStyle(e.target.value)}
                  className="w-full p-2 bg-slate-900/50 border border-slate-600 rounded text-white"
                >
                  {styles.map(style => (
                    <option key={style} value={style}>
                      {style.charAt(0).toUpperCase() + style.slice(1).replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Default Dimensions
                </label>
                <select
                  value={batchDimensions}
                  onChange={(e) => setBatchDimensions(e.target.value)}
                  className="w-full p-2 bg-slate-900/50 border border-slate-600 rounded text-white"
                >
                  {dimensionOptions.map(dim => (
                    <option key={dim} value={dim}>{dim}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {currentJob ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Prompt Management */}
            <div className="space-y-6">
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white">
                    {currentJob.name}
                  </h2>
                  <span className="text-sm text-slate-400">
                    {currentJob.prompts.length} prompts
                  </span>
                </div>

                {/* Progress Bar */}
                {currentJob.status === 'running' && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-slate-400 mb-1">
                      <span>Progress</span>
                      <span>{currentJob.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                        style={{ width: `${currentJob.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Add Prompt Form */}
                <div className="space-y-3">
                  <textarea
                    value={newPrompt}
                    onChange={(e) => setNewPrompt(e.target.value)}
                    placeholder="Enter prompt for batch generation..."
                    className="w-full h-20 p-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                  <button
                    onClick={addPromptToJob}
                    disabled={!newPrompt.trim() || isGenerating}
                    className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add to Batch
                  </button>
                </div>

                {/* Import/Export */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-slate-600">
                  <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" />
                    Import
                    <input
                      type="file"
                      accept=".txt"
                      onChange={importPromptsFromFile}
                      className="hidden"
                    />
                  </label>
                  <button
                    onClick={exportPrompts}
                    disabled={currentJob.prompts.length === 0}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-300 hover:text-white rounded transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                </div>
              </div>

              {/* Batch Jobs List */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Previous Jobs</h3>
                {batchJobs.length > 1 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {batchJobs.filter(job => job.id !== currentJob.id).map(job => (
                      <button
                        key={job.id}
                        onClick={() => setCurrentJob(job)}
                        className="w-full p-3 bg-slate-900/50 border border-slate-600 rounded-lg text-left hover:bg-slate-700/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-white font-medium">{job.name}</span>
                          <span className="text-slate-400 text-sm">{job.prompts.length}</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {job.status} • {job.completedCount}/{job.prompts.length} completed
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm">No other jobs yet</p>
                )}
              </div>
            </div>

            {/* Prompt List */}
            <div className="lg:col-span-2">
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Batch Queue</h3>
                  <div className="text-sm text-slate-400">
                    {currentJob.completedCount}/{currentJob.prompts.length} completed
                  </div>
                </div>

                {currentJob.prompts.length > 0 ? (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {currentJob.prompts.map((prompt, index) => (
                      <div
                        key={prompt.id}
                        className="bg-slate-900/50 border border-slate-600 rounded-lg p-4"
                      >
                        <div className="flex items-start gap-4">
                          {/* Preview/Status */}
                          <div className="w-16 h-16 bg-slate-800 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                            {prompt.imageUrl ? (
                              <img
                                src={prompt.imageUrl}
                                alt="Generated"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className={`w-8 h-8 rounded-full ${
                                prompt.status === 'pending' ? 'bg-slate-600' :
                                prompt.status === 'generating' ? 'bg-purple-500 animate-pulse' :
                                prompt.status === 'completed' ? 'bg-green-500' : 'bg-red-500'
                              }`}>
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p className="text-slate-300 line-clamp-2 mb-2">{prompt.prompt}</p>
                            <div className="flex items-center gap-4 text-xs text-slate-400">
                              <span>#{index + 1}</span>
                              <span className="capitalize">{prompt.style.replace('-', ' ')}</span>
                              <span>{prompt.dimensions}</span>
                              <span className="capitalize">{prompt.status}</span>
                            </div>

                            {/* Progress bar for generating */}
                            {prompt.status === 'generating' && prompt.progress !== undefined && (
                              <div className="mt-2">
                                <div className="w-full bg-slate-700 rounded-full h-1">
                                  <div
                                    className="bg-purple-500 h-1 rounded-full transition-all"
                                    style={{ width: `${prompt.progress}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex gap-1">
                            <button
                              onClick={() => duplicatePrompt(prompt)}
                              className="p-1 text-slate-400 hover:text-white transition-colors"
                              title="Duplicate"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removePrompt(prompt.id)}
                              disabled={isGenerating}
                              className="p-1 text-slate-400 hover:text-red-400 disabled:opacity-50 transition-colors"
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
                      <Grid3x3 className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                      <p className="text-slate-400">No prompts in batch yet</p>
                      <p className="text-slate-500 text-sm">Add prompts to start your batch generation</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <Grid3x3 className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No Batch Job Selected</h2>
            <p className="text-slate-400 mb-6">Create a new batch job to start generating multiple images</p>
            <button
              onClick={createNewJob}
              className="flex items-center gap-2 mx-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Create Batch Job
            </button>
          </div>
        )}

        {/* Coming Soon Notice */}
        <div className="mt-8 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-2">🚀 Coming Soon</h3>
          <p className="text-slate-300">
            Advanced batch processing with queue management, priority settings, template systems,
            automatic retries, progress notifications, and integration with multiple AI image models.
          </p>
        </div>
      </div>
    </div>
  );
}

export default BatchImageGenerator;