import React, { useState, useRef } from 'react';
import { Mic, ArrowLeft, Upload, Download, Play, Pause, Square, Volume2, FileText, Clock, Languages, Settings, Copy, Trash2 } from 'lucide-react';

interface AudioTranscriberProps {
  onBack?: () => void;
  onNavigate?: (page: string) => void;
}

interface TranscriptionSegment {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  confidence: number;
  speaker?: string;
}

interface TranscriptionResult {
  id: string;
  filename: string;
  duration: number;
  language: string;
  segments: TranscriptionSegment[];
  fullText: string;
  timestamp: string;
  status: 'processing' | 'completed' | 'failed';
  progress?: number;
}

export function AudioTranscriber({ onBack }: AudioTranscriberProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState('auto');
  const [transcriptions, setTranscriptions] = useState<TranscriptionResult[]>([]);
  const [currentTranscription, setCurrentTranscription] = useState<TranscriptionResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [speakerDetection, setSpeakerDetection] = useState(false);
  const [punctuation, setPunctuation] = useState(true);
  const [timestamps, setTimestamps] = useState(true);
  const [playbackTime, setPlaybackTime] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const languages = [
    { code: 'auto', name: 'Auto-detect', flag: '🌐' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' }
  ];

  const startRecording = async () => {
    setIsRecording(true);
    setRecordingTime(0);

    recordingTimerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);

    // TODO: Implement actual recording with WebRTC
    console.log('Starting recording...');
  };

  const stopRecording = async () => {
    setIsRecording(false);

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    // TODO: Stop actual recording and process
    await processRecording(`recording-${Date.now()}.wav`, recordingTime);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['audio/wav', 'audio/mp3', 'audio/m4a', 'audio/ogg', 'video/mp4'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid audio or video file');
      return;
    }

    const duration = await getAudioDuration(file);
    await processRecording(file.name, duration, file);
  };

  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.onloadedmetadata = () => {
        resolve(audio.duration);
      };
      audio.src = URL.createObjectURL(file);
    });
  };

  const processRecording = async (filename: string, duration: number, file?: File) => {
    const newTranscription: TranscriptionResult = {
      id: Date.now().toString(),
      filename,
      duration,
      language: selectedLanguage,
      segments: [],
      fullText: '',
      timestamp: new Date().toLocaleString(),
      status: 'processing',
      progress: 0
    };

    setTranscriptions(prev => [newTranscription, ...prev]);
    setCurrentTranscription(newTranscription);
    setIsProcessing(true);

    try {
      // Simulate transcription process
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 500));

        const updatedTranscription = {
          ...newTranscription,
          progress
        };

        setTranscriptions(prev =>
          prev.map(t => t.id === newTranscription.id ? updatedTranscription : t)
        );
        setCurrentTranscription(updatedTranscription);
      }

      // Generate mock transcription result
      const mockSegments = generateMockSegments(duration);
      const fullText = mockSegments.map(s => s.text).join(' ');

      const completedTranscription: TranscriptionResult = {
        ...newTranscription,
        segments: mockSegments,
        fullText,
        status: 'completed',
        progress: 100
      };

      setTranscriptions(prev =>
        prev.map(t => t.id === newTranscription.id ? completedTranscription : t)
      );
      setCurrentTranscription(completedTranscription);

    } catch (error) {
      console.error('Transcription error:', error);

      const failedTranscription = {
        ...newTranscription,
        status: 'failed' as const
      };

      setTranscriptions(prev =>
        prev.map(t => t.id === newTranscription.id ? failedTranscription : t)
      );
      setCurrentTranscription(failedTranscription);
    } finally {
      setIsProcessing(false);
    }
  };

  const generateMockSegments = (duration: number): TranscriptionSegment[] => {
    const segments: TranscriptionSegment[] = [];
    const sentences = [
      "Welcome to our audio transcription demonstration.",
      "This is an example of how speech-to-text technology works.",
      "The AI analyzes audio patterns and converts them to readable text.",
      "Multiple speakers can be detected and separated automatically.",
      "Timestamps help you navigate to specific parts of the audio.",
      "Punctuation and formatting are added for better readability.",
      "The transcription quality depends on audio clarity and background noise.",
      "This technology has applications in podcasting, interviews, and meetings."
    ];

    let currentTime = 0;
    const segmentDuration = duration / sentences.length;

    sentences.forEach((sentence, index) => {
      const startTime = currentTime;
      const endTime = Math.min(currentTime + segmentDuration, duration);

      segments.push({
        id: `segment_${index}`,
        text: sentence,
        startTime,
        endTime,
        confidence: Math.floor(Math.random() * 20 + 80), // 80-100%
        speaker: speakerDetection ? (index % 2 === 0 ? 'Speaker 1' : 'Speaker 2') : undefined
      });

      currentTime = endTime;
    });

    return segments;
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const copyTranscription = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadTranscription = (transcription: TranscriptionResult) => {
    const content = `Transcription - ${transcription.filename}
Generated: ${transcription.timestamp}
Duration: ${formatTime(transcription.duration)}
Language: ${languages.find(l => l.code === transcription.language)?.name || 'Unknown'}

${timestamps ? 'TIMESTAMPED TRANSCRIPT:\n' +
  transcription.segments.map(segment =>
    `[${formatTime(segment.startTime)} - ${formatTime(segment.endTime)}]${
      segment.speaker ? ` ${segment.speaker}:` : ''
    } ${segment.text}`
  ).join('\n') : ''}

FULL TRANSCRIPT:
${transcription.fullText}

Generated by Viral Hashtag & Image AI - Audio Transcriber`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transcription-${transcription.filename.replace(/\.[^/.]+$/, '')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const deleteTranscription = (id: string) => {
    setTranscriptions(prev => prev.filter(t => t.id !== id));
    if (currentTranscription?.id === id) {
      setCurrentTranscription(null);
    }
  };

  const jumpToTime = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
    setPlaybackTime(time);
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
              <Mic className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Audio Transcriber</h1>
              <p className="text-slate-400">Convert speech to text with AI precision</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recording & Upload Panel */}
          <div className="space-y-6">
            {/* Recording Controls */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Mic className="w-5 h-5 text-red-400" />
                Record Audio
              </h2>

              <div className="text-center space-y-4">
                {isRecording ? (
                  <div className="space-y-4">
                    <div className="w-20 h-20 mx-auto bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                      <Mic className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-2xl font-mono text-white">
                      {formatTime(recordingTime)}
                    </div>
                    <button
                      onClick={stopRecording}
                      className="flex items-center gap-2 mx-auto px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      <Square className="w-5 h-5" />
                      Stop Recording
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <button
                      onClick={startRecording}
                      className="w-20 h-20 mx-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-full flex items-center justify-center transition-all"
                    >
                      <Mic className="w-8 h-8 text-white" />
                    </button>
                    <p className="text-slate-400">Click to start recording</p>
                  </div>
                )}
              </div>
            </div>

            {/* File Upload */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-400" />
                Upload Audio File
              </h3>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-4 border-2 border-dashed border-slate-600 hover:border-slate-500 rounded-lg text-slate-400 hover:text-slate-300 transition-colors"
              >
                <Upload className="w-8 h-8 mx-auto mb-2" />
                <p>Click to upload audio/video file</p>
                <p className="text-xs mt-1">Supports MP3, WAV, M4A, MP4</p>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,video/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Settings */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-green-400" />
                Transcription Settings
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Language
                  </label>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full p-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                  >
                    {languages.map(lang => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={speakerDetection}
                      onChange={(e) => setSpeakerDetection(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-slate-300">Speaker detection</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={punctuation}
                      onChange={(e) => setPunctuation(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-slate-300">Auto punctuation</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={timestamps}
                      onChange={(e) => setTimestamps(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-slate-300">Include timestamps</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Recent Transcriptions */}
            {transcriptions.length > 0 && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Transcriptions</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {transcriptions.slice(0, 5).map(transcription => (
                    <button
                      key={transcription.id}
                      onClick={() => setCurrentTranscription(transcription)}
                      className={`w-full p-3 border rounded-lg text-left transition-colors ${
                        currentTranscription?.id === transcription.id
                          ? 'bg-purple-600/20 border-purple-500'
                          : 'bg-slate-900/50 border-slate-600 hover:bg-slate-700/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white text-sm font-medium truncate">
                          {transcription.filename}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          transcription.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          transcription.status === 'processing' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {transcription.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>{formatTime(transcription.duration)}</span>
                        <span>{transcription.timestamp}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Transcription Display */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">
                  {currentTranscription ? 'Transcription Result' : 'No Transcription Selected'}
                </h2>
                {currentTranscription && currentTranscription.status === 'completed' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyTranscription(currentTranscription.fullText)}
                      className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg transition-colors"
                      title="Copy transcription"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => downloadTranscription(currentTranscription)}
                      className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg transition-colors"
                      title="Download transcription"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteTranscription(currentTranscription.id)}
                      className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-red-400 rounded-lg transition-colors"
                      title="Delete transcription"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {currentTranscription ? (
                <div className="space-y-6">
                  {/* File Info */}
                  <div className="bg-slate-900/50 border border-slate-600 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-5 h-5 text-blue-400" />
                      <span className="font-medium text-white">{currentTranscription.filename}</span>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatTime(currentTranscription.duration)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Languages className="w-4 h-4" />
                        {languages.find(l => l.code === currentTranscription.language)?.name}
                      </span>
                      <span>Created: {currentTranscription.timestamp}</span>
                    </div>

                    {currentTranscription.status === 'processing' && (
                      <div className="mt-3">
                        <div className="flex justify-between text-sm text-slate-400 mb-1">
                          <span>Processing...</span>
                          <span>{currentTranscription.progress || 0}%</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                            style={{ width: `${currentTranscription.progress || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Transcription Content */}
                  {currentTranscription.status === 'completed' && (
                    <div className="space-y-4">
                      {/* Timestamped Segments */}
                      {timestamps && currentTranscription.segments.length > 0 && (
                        <div>
                          <h3 className="font-medium text-white mb-3">Timestamped Transcript</h3>
                          <div className="max-h-64 overflow-y-auto space-y-2">
                            {currentTranscription.segments.map(segment => (
                              <div
                                key={segment.id}
                                className="bg-slate-900/50 border border-slate-600 rounded p-3 hover:bg-slate-800/50 transition-colors cursor-pointer"
                                onClick={() => jumpToTime(segment.startTime)}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
                                        {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                                      </span>
                                      {segment.speaker && (
                                        <span className="text-xs bg-purple-600/20 text-purple-300 px-2 py-1 rounded">
                                          {segment.speaker}
                                        </span>
                                      )}
                                      <span className="text-xs text-slate-500">
                                        {segment.confidence}% confidence
                                      </span>
                                    </div>
                                    <p className="text-slate-300">{segment.text}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Full Text */}
                      <div>
                        <h3 className="font-medium text-white mb-3">Full Transcript</h3>
                        <div className="bg-slate-900/50 border border-slate-600 rounded-lg p-4 max-h-96 overflow-y-auto">
                          <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {currentTranscription.fullText}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentTranscription.status === 'failed' && (
                    <div className="text-center py-8">
                      <p className="text-red-400 mb-2">Transcription failed</p>
                      <p className="text-slate-500 text-sm">Please try again with a different file</p>
                    </div>
                  )}

                  {isProcessing && (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
                      <p className="text-slate-400">Processing audio...</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-96 flex items-center justify-center border-2 border-dashed border-slate-600 rounded-lg">
                  <div className="text-center">
                    <Mic className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-400 text-lg mb-2">No audio selected</p>
                    <p className="text-slate-500">Record audio or upload a file to start transcription</p>
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
            Real-time transcription, advanced speaker diarization, custom vocabulary,
            integration with Whisper API, subtitle generation, and multi-language support.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AudioTranscriber;