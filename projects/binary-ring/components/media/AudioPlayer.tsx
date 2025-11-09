import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Shuffle,
  Download,
  Share,
  Heart,
  MoreHorizontal,
  Music,
  Search
} from 'lucide-react';

interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  url: string;
  cover?: string;
  genre: string;
  tags: string[];
  uploadDate: string;
  plays: number;
  likes: number;
}

interface AudioPlayerProps {
  tracks: AudioTrack[];
  className?: string;
}

export function AudioPlayer({ tracks, className = '' }: AudioPlayerProps) {
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(tracks[0] || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [playbackRate, setPlaybackRate] = useState(1);

  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const genres = ['all', ...Array.from(new Set(tracks.map(t => t.genre)))];

  const filteredTracks = tracks.filter(track => {
    const matchesSearch =
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesGenre = selectedGenre === 'all' || track.genre === selectedGenre;

    return matchesSearch && matchesGenre;
  });

  // Format time helper
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Play/pause toggle
  const handlePlayPause = () => {
    if (!audioRef.current || !currentTrack) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Track navigation
  const handlePrevTrack = () => {
    if (!currentTrack) return;

    const currentIndex = filteredTracks.findIndex(t => t.id === currentTrack.id);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : filteredTracks.length - 1;
    setCurrentTrack(filteredTracks[prevIndex]);
  };

  const handleNextTrack = () => {
    if (!currentTrack) return;

    const currentIndex = filteredTracks.findIndex(t => t.id === currentTrack.id);
    let nextIndex;

    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * filteredTracks.length);
    } else {
      nextIndex = currentIndex < filteredTracks.length - 1 ? currentIndex + 1 : 0;
    }

    setCurrentTrack(filteredTracks[nextIndex]);
  };

  // Volume control
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const handleMuteToggle = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  // Progress bar control
  const handleProgressChange = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressBarRef.current) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * audioRef.current.duration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      if (isRepeat) {
        audio.currentTime = 0;
        audio.play();
      } else {
        handleNextTrack();
      }
    };

    const handleLoadedData = () => {
      if (isPlaying) {
        audio.play();
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadeddata', handleLoadedData);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadeddata', handleLoadedData);
    };
  }, [isPlaying, isRepeat, currentTrack]);

  // Update audio source when track changes
  useEffect(() => {
    if (audioRef.current && currentTrack) {
      audioRef.current.src = currentTrack.url;
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.load();
    }
  }, [currentTrack, playbackRate]);

  return (
    <div className={`audio-player ${className}`}>
      <audio ref={audioRef} preload="metadata" />

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search tracks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={selectedGenre} onValueChange={setSelectedGenre}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Genre" />
          </SelectTrigger>
          <SelectContent>
            {genres.map(genre => (
              <SelectItem key={genre} value={genre}>
                {genre === 'all' ? 'All Genres' : genre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Main Player */}
      <Card className="mb-6">
        <CardContent className="p-6">
          {currentTrack ? (
            <div>
              {/* Track Info */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  {currentTrack.cover ? (
                    <img
                      src={currentTrack.cover}
                      alt={currentTrack.album}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Music className="h-8 w-8 text-gray-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate">{currentTrack.title}</h3>
                  <p className="text-gray-600 truncate">{currentTrack.artist}</p>
                  {currentTrack.album && (
                    <p className="text-sm text-gray-500 truncate">{currentTrack.album}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline">
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Share className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div
                  ref={progressBarRef}
                  className="w-full h-2 bg-gray-200 rounded-full cursor-pointer group"
                  onClick={handleProgressChange}
                >
                  <div
                    className="h-full bg-blue-500 rounded-full relative group-hover:bg-blue-600 transition-colors"
                    style={{
                      width: `${currentTrack.duration ? (currentTime / currentTrack.duration) * 100 : 0}%`
                    }}
                  >
                    <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(currentTrack.duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4 mb-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsShuffle(!isShuffle)}
                  className={isShuffle ? 'bg-blue-100 text-blue-600' : ''}
                >
                  <Shuffle className="h-4 w-4" />
                </Button>

                <Button size="sm" onClick={handlePrevTrack}>
                  <SkipBack className="h-4 w-4" />
                </Button>

                <Button size="lg" onClick={handlePlayPause}>
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>

                <Button size="sm" onClick={handleNextTrack}>
                  <SkipForward className="h-4 w-4" />
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsRepeat(!isRepeat)}
                  className={isRepeat ? 'bg-blue-100 text-blue-600' : ''}
                >
                  <Repeat className="h-4 w-4" />
                </Button>
              </div>

              {/* Volume and Additional Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={handleMuteToggle}>
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>

                  <div className="w-20">
                    <Slider
                      value={[isMuted ? 0 : volume]}
                      max={1}
                      step={0.01}
                      onValueChange={handleVolumeChange}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Speed:</span>
                  <Select value={playbackRate.toString()} onValueChange={(value) => setPlaybackRate(parseFloat(value))}>
                    <SelectTrigger className="w-20 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.5">0.5x</SelectItem>
                      <SelectItem value="0.75">0.75x</SelectItem>
                      <SelectItem value="1">1x</SelectItem>
                      <SelectItem value="1.25">1.25x</SelectItem>
                      <SelectItem value="1.5">1.5x</SelectItem>
                      <SelectItem value="2">2x</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Track Tags */}
              <div className="flex flex-wrap gap-1 mt-4">
                {currentTrack.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Music className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No track selected</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Playlist */}
      <Card>
        <CardHeader>
          <CardTitle>Playlist ({filteredTracks.length} tracks)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredTracks.map((track, index) => (
              <div
                key={track.id}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  currentTrack?.id === track.id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setCurrentTrack(track)}
              >
                <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center flex-shrink-0 text-sm">
                  {currentTrack?.id === track.id && isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{track.title}</p>
                  <p className="text-sm text-gray-600 truncate">{track.artist}</p>
                </div>

                <div className="text-right">
                  <Badge variant="outline" className="text-xs mb-1">
                    {track.genre}
                  </Badge>
                  <p className="text-sm text-gray-500">
                    {formatTime(track.duration)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {filteredTracks.length === 0 && (
            <div className="text-center py-8">
              <Search className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No tracks found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}