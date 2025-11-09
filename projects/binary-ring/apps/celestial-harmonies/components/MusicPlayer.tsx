
import React, { useRef, useEffect } from 'react';
import { MusicSequence } from '../types';
import { PlayIcon, PauseIcon } from './icons/PlayerIcons';

interface MusicPlayerProps {
  musicSequence: MusicSequence;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({ musicSequence, isPlaying, setIsPlaying }) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorNodesRef = useRef<OscillatorNode[]>([]);
  
  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      oscillatorNodesRef.current.forEach(osc => osc.disconnect());
    };
  }, []);

  const stopMusic = () => {
     if (audioContextRef.current) {
      oscillatorNodesRef.current.forEach(osc => {
        try {
          osc.stop();
        } catch (e) {
          // Ignore errors if already stopped
        }
        osc.disconnect();
      });
      oscillatorNodesRef.current = [];
      if (audioContextRef.current.state === 'running') {
        audioContextRef.current.close().then(() => {
          audioContextRef.current = null;
        });
      }
    }
  }

  const playMusic = () => {
    if (musicSequence.notes.length === 0) return;

    stopMusic(); // Stop any previous playback

    const context = new AudioContext();
    audioContextRef.current = context;
    const masterGain = context.createGain();
    masterGain.gain.setValueAtTime(0.3, context.currentTime); // Master volume
    masterGain.connect(context.destination);

    const activeNodes: OscillatorNode[] = [];

    musicSequence.notes.forEach(note => {
      const osc = context.createOscillator();
      const gainNode = context.createGain();
      
      osc.type = note.waveform || 'sine';
      osc.frequency.setValueAtTime(note.freq, context.currentTime);

      // Simple ADSR-like envelope
      const attackTime = 0.01;
      const decayTime = 0.1;
      const sustainLevel = 0.7;
      const releaseTime = 0.2;

      const noteStartTime = context.currentTime + note.startTime;
      const noteEndTime = noteStartTime + note.duration;

      gainNode.gain.setValueAtTime(0, noteStartTime);
      gainNode.gain.linearRampToValueAtTime(1, noteStartTime + attackTime);
      gainNode.gain.linearRampToValueAtTime(sustainLevel, noteStartTime + attackTime + decayTime);
      gainNode.gain.setValueAtTime(sustainLevel, noteEndTime - releaseTime);
      gainNode.gain.linearRampToValueAtTime(0, noteEndTime);

      osc.connect(gainNode);
      gainNode.connect(masterGain);
      
      osc.start(noteStartTime);
      osc.stop(noteEndTime);
      
      activeNodes.push(osc);
    });

    oscillatorNodesRef.current = activeNodes;

    // Set timeout to update playing state when finished
    setTimeout(() => {
        setIsPlaying(false);
    }, musicSequence.totalDuration * 1000);
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopMusic();
      setIsPlaying(false);
    } else {
      playMusic();
      setIsPlaying(true);
    }
  };
  
  // Ensure music stops if the component is re-rendered while playing
  useEffect(() => {
      return () => {
          stopMusic();
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [musicSequence]);

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 border border-slate-700 rounded-lg bg-slate-900/50">
      <h3 className="text-xl font-semibold text-slate-300 mb-4">Celestial Sonification</h3>
      <button
        onClick={togglePlay}
        className="w-24 h-24 rounded-full bg-yellow-400 text-slate-900 flex items-center justify-center shadow-lg hover:bg-yellow-300 transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-yellow-400/50"
        aria-label={isPlaying ? 'Pause music' : 'Play music'}
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>
      <p className="text-slate-400 mt-4 text-sm">
        {isPlaying ? 'Playing...' : 'Press play to hear the cosmos'}
      </p>
    </div>
  );
};
