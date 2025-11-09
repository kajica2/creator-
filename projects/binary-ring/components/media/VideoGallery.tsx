import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Search,
  Filter,
  Grid,
  List
} from 'lucide-react';

interface Video {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnail: string;
  duration: string;
  category: string;
  tags: string[];
  uploadDate: string;
  views: number;
}

interface VideoGalleryProps {
  videos: Video[];
  className?: string;
}

export function VideoGallery({ videos, className = '' }: VideoGalleryProps) {
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const videoRef = useRef<HTMLVideoElement>(null);

  const categories = ['all', ...Array.from(new Set(videos.map(v => v.category)))];

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         video.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         video.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || video.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handlePlayVideo = (video: Video) => {
    setCurrentVideo(video);
    setIsPlaying(true);
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  useEffect(() => {
    if (videoRef.current && currentVideo) {
      videoRef.current.load();
    }
  }, [currentVideo]);

  return (
    <div className={`video-gallery ${className}`}>
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectItem key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Video Player */}
      {currentVideo && (
        <Card className="mb-6">
          <CardContent className="p-0">
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full aspect-video bg-black"
                poster={currentVideo.thumbnail}
                onLoadedData={() => {
                  if (videoRef.current && isPlaying) {
                    videoRef.current.play();
                  }
                }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              >
                <source src={currentVideo.url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>

              {/* Video Controls Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-white hover:text-white hover:bg-white/20"
                      onClick={handlePlayPause}
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-white hover:text-white hover:bg-white/20"
                      onClick={handleMuteToggle}
                    >
                      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>

                    <span className="text-sm">{currentVideo.duration}</span>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:text-white hover:bg-white/20"
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.requestFullscreen();
                      }
                    }}
                  >
                    <Maximize className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-4">
              <h2 className="text-xl font-bold mb-2">{currentVideo.title}</h2>
              <p className="text-gray-600 mb-4">{currentVideo.description}</p>

              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge variant="outline">{currentVideo.category}</Badge>
                <span className="text-sm text-gray-500">
                  {formatViews(currentVideo.views)} views
                </span>
                <span className="text-sm text-gray-500">
                  {formatDate(currentVideo.uploadDate)}
                </span>
              </div>

              <div className="flex flex-wrap gap-1">
                {currentVideo.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Video Grid/List */}
      <div className={`
        ${viewMode === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
          : 'space-y-4'
        }
      `}>
        {filteredVideos.map(video => (
          <Card
            key={video.id}
            className={`cursor-pointer transition-all hover:scale-105 hover:shadow-lg ${
              currentVideo?.id === video.id ? 'ring-2 ring-blue-500' : ''
            } ${viewMode === 'list' ? 'flex flex-row' : ''}`}
            onClick={() => handlePlayVideo(video)}
          >
            <div className={`relative ${viewMode === 'list' ? 'w-48 flex-shrink-0' : ''}`}>
              <img
                src={video.thumbnail}
                alt={video.title}
                className={`${
                  viewMode === 'list'
                    ? 'w-full h-28 object-cover rounded-l-lg'
                    : 'w-full aspect-video object-cover rounded-t-lg'
                }`}
              />

              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <Play className="h-8 w-8 text-white" />
              </div>

              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {video.duration}
              </div>
            </div>

            <CardContent className={`${viewMode === 'list' ? 'p-4 flex-1' : 'p-3'}`}>
              <CardTitle className={`${viewMode === 'list' ? 'text-lg' : 'text-sm'} mb-2 line-clamp-2`}>
                {video.title}
              </CardTitle>

              {viewMode === 'list' && (
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                  {video.description}
                </p>
              )}

              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  {video.category}
                </Badge>
                <span className="text-xs text-gray-500">
                  {formatViews(video.views)}
                </span>
              </div>

              <div className="mt-2 text-xs text-gray-500">
                {formatDate(video.uploadDate)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredVideos.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="h-12 w-12 mx-auto mb-4" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No videos found</h3>
          <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </div>
  );
}