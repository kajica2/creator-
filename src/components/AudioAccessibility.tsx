/**
 * Audio accessibility components for visual feedback and audio descriptions
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAccessibility } from '../hooks/useAccessibility';

// Audio Player with Visual Feedback
export interface AudioPlayerProps {
  src: string;
  title: string;
  description?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  showVisualFeedback?: boolean;
  enableCaptions?: boolean;
}

export const AccessibleAudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  title,
  description,
  onPlay,
  onPause,
  onEnded,
  showVisualFeedback = true,
  enableCaptions = true
}) => {
  const { preferences, announceMessage } = useAccessibility();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadStart = () => setLoading(true);
    const handleLoadedData = () => {
      setLoading(false);
      setDuration(audio.duration);
    };
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handlePlay = () => {
      setIsPlaying(true);
      onPlay?.();
      announceMessage(`Playing ${title}`);
    };
    const handlePause = () => {
      setIsPlaying(false);
      onPause?.();
      announceMessage(`Paused ${title}`);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
      announceMessage(`Finished playing ${title}`);
    };

    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [title, onPlay, onPause, onEnded, announceMessage]);

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  }, [isPlaying]);

  const handleSeek = useCallback((newTime: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = newTime;
    setCurrentTime(newTime);
    announceMessage(`Seeking to ${Math.round(newTime)} seconds`);
  }, [announceMessage]);

  const handleVolumeChange = useCallback((newVolume: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = newVolume;
    setVolume(newVolume);
    announceMessage(`Volume changed to ${Math.round(newVolume * 100)}%`);
  }, [announceMessage]);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const newMuted = !isMuted;
    audio.muted = newMuted;
    setIsMuted(newMuted);
    announceMessage(newMuted ? 'Audio muted' : 'Audio unmuted');
  }, [isMuted, announceMessage]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`bg-gray-800 rounded-lg p-4 space-y-4 ${
        showVisualFeedback
          ? `audio-visual-feedback ${isPlaying ? 'playing' : loading ? 'loading' : 'paused'}`
          : ''
      }`}
      role="region"
      aria-label={`Audio player for ${title}`}
    >
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        className="sr-only"
      />

      {/* Title and Description */}
      <div>
        <h3 className="text-white font-medium">{title}</h3>
        {description && (
          <p className="text-gray-400 text-sm mt-1">{description}</p>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center space-x-3">
        <button
          onClick={togglePlayPause}
          disabled={loading}
          className="flex items-center justify-center w-12 h-12 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded-full text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          aria-label={loading ? 'Loading' : isPlaying ? `Pause ${title}` : `Play ${title}`}
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Time Display */}
        <div className="text-gray-400 text-sm min-w-0 flex-shrink-0">
          <span aria-label={`Current time ${formatTime(currentTime)}`}>
            {formatTime(currentTime)}
          </span>
          <span className="mx-1" aria-hidden="true">/</span>
          <span aria-label={`Total duration ${formatTime(duration)}`}>
            {formatTime(duration)}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="flex-1 px-2">
          <label htmlFor="audio-progress" className="sr-only">
            Seek audio position
          </label>
          <input
            id="audio-progress"
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={(e) => handleSeek(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500"
            style={{
              background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${(currentTime / duration) * 100}%, #374151 ${(currentTime / duration) * 100}%, #374151 100%)`
            }}
            aria-valuetext={`${Math.round((currentTime / duration) * 100)}% played`}
          />
        </div>

        {/* Volume Control */}
        <button
          onClick={toggleMute}
          className="p-2 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 rounded"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted || volume === 0 ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </svg>
          )}
        </button>

        <div className="w-20">
          <label htmlFor="volume-control" className="sr-only">
            Volume control
          </label>
          <input
            id="volume-control"
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              const newVolume = parseFloat(e.target.value);
              if (isMuted && newVolume > 0) {
                setIsMuted(false);
              }
              handleVolumeChange(newVolume);
            }}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500"
            aria-valuetext={`Volume ${Math.round(volume * 100)}%`}
          />
        </div>
      </div>

      {/* Audio Descriptions */}
      {preferences.audioDescriptions && description && (
        <div className="text-sm text-gray-400 border-t border-gray-700 pt-3">
          <strong>Audio Description:</strong> {description}
        </div>
      )}

      {/* Live Status for Screen Readers */}
      <div className="sr-only" aria-live="polite">
        {loading && 'Loading audio...'}
        {isPlaying && `Playing: ${Math.round((currentTime / duration) * 100)}% complete`}
      </div>
    </div>
  );
};

// Audio Visualizer Component
export interface AudioVisualizerProps {
  audioElement: HTMLAudioElement;
  width?: number;
  height?: number;
  showFrequencyBars?: boolean;
  showWaveform?: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  audioElement,
  width = 300,
  height = 100,
  showFrequencyBars = true,
  showWaveform = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode>();
  const dataArrayRef = useRef<Uint8Array>();

  useEffect(() => {
    if (!audioElement) return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaElementSource(audioElement);
      const analyser = audioContext.createAnalyser();

      analyser.fftSize = 256;
      source.connect(analyser);
      analyser.connect(audioContext.destination);

      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

      const draw = () => {
        const canvas = canvasRef.current;
        const analyser = analyserRef.current;
        const dataArray = dataArrayRef.current;

        if (!canvas || !analyser || !dataArray) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        analyser.getByteFrequencyData(dataArray);

        ctx.fillStyle = '#1f2937';
        ctx.fillRect(0, 0, width, height);

        if (showFrequencyBars) {
          const barWidth = width / dataArray.length * 2.5;
          let barHeight;
          let x = 0;

          for (let i = 0; i < dataArray.length; i++) {
            barHeight = (dataArray[i] / 255) * height;

            const r = barHeight + 25 * (i / dataArray.length);
            const g = 250 * (i / dataArray.length);
            const b = 50;

            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fillRect(x, height - barHeight, barWidth, barHeight);

            x += barWidth + 1;
          }
        }

        animationRef.current = requestAnimationFrame(draw);
      };

      draw();
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioElement, width, height, showFrequencyBars, showWaveform]);

  return (
    <div className="audio-visualizer">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-gray-600 rounded"
        aria-hidden="true"
      />
      <div className="sr-only">
        Audio visualization showing frequency data
      </div>
    </div>
  );
};

// Caption Display Component
export interface CaptionDisplayProps {
  captions: Array<{
    startTime: number;
    endTime: number;
    text: string;
  }>;
  currentTime: number;
  visible?: boolean;
}

export const CaptionDisplay: React.FC<CaptionDisplayProps> = ({
  captions,
  currentTime,
  visible = true
}) => {
  const currentCaption = captions.find(
    caption => currentTime >= caption.startTime && currentTime <= caption.endTime
  );

  if (!visible || !currentCaption) return null;

  return (
    <div
      className="bg-black/80 text-white p-2 rounded text-center text-sm"
      role="img"
      aria-label="Caption"
    >
      {currentCaption.text}
    </div>
  );
};

// Audio Description Component
export interface AudioDescriptionProps {
  descriptions: Array<{
    startTime: number;
    endTime: number;
    description: string;
  }>;
  currentTime: number;
  enabled?: boolean;
}

export const AudioDescription: React.FC<AudioDescriptionProps> = ({
  descriptions,
  currentTime,
  enabled = false
}) => {
  const { announceMessage } = useAccessibility();
  const [lastDescription, setLastDescription] = useState('');

  useEffect(() => {
    if (!enabled) return;

    const currentDescription = descriptions.find(
      desc => currentTime >= desc.startTime && currentTime <= desc.endTime
    );

    if (currentDescription && currentDescription.description !== lastDescription) {
      announceMessage(currentDescription.description, 'polite');
      setLastDescription(currentDescription.description);
    }
  }, [currentTime, descriptions, enabled, lastDescription, announceMessage]);

  return null; // This component only announces, doesn't render
};

// Export all components
export default {
  AccessibleAudioPlayer,
  AudioVisualizer,
  CaptionDisplay,
  AudioDescription
};