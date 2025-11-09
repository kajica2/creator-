import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search,
  Filter,
  Download,
  Share,
  Heart,
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Grid,
  List,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Image as ImageIcon
} from 'lucide-react';

interface Photo {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnail: string;
  category: string;
  tags: string[];
  uploadDate: string;
  likes: number;
  width: number;
  height: number;
  photographer?: string;
  camera?: string;
  settings?: {
    aperture?: string;
    shutter?: string;
    iso?: string;
    focal?: string;
  };
}

interface PhotoGalleryProps {
  photos: Photo[];
  className?: string;
}

export function PhotoGallery({ photos, className = '' }: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'masonry'>('grid');
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const categories = ['all', ...Array.from(new Set(photos.map(p => p.category)))];

  const filteredPhotos = photos.filter(photo => {
    const matchesSearch =
      photo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      photo.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      photo.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || photo.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const openLightbox = (photo: Photo, index: number) => {
    setSelectedPhoto(photo);
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    setSelectedPhoto(null);
    setLightboxIndex(-1);
  };

  const navigateLightbox = (direction: 'prev' | 'next') => {
    let newIndex = lightboxIndex;

    if (direction === 'prev') {
      newIndex = lightboxIndex > 0 ? lightboxIndex - 1 : filteredPhotos.length - 1;
    } else {
      newIndex = lightboxIndex < filteredPhotos.length - 1 ? lightboxIndex + 1 : 0;
    }

    setLightboxIndex(newIndex);
    setSelectedPhoto(filteredPhotos[newIndex]);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLightboxOpen) return;

      switch (e.key) {
        case 'Escape':
          closeLightbox();
          break;
        case 'ArrowLeft':
          navigateLightbox('prev');
          break;
        case 'ArrowRight':
          navigateLightbox('next');
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, lightboxIndex]);

  return (
    <div className={`photo-gallery ${className}`}>
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search photos..."
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
            variant={viewMode === 'masonry' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('masonry')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Photo Grid */}
      <div className={`
        ${viewMode === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
          : 'columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4'
        }
      `}>
        {filteredPhotos.map((photo, index) => (
          <div
            key={photo.id}
            className={`group relative cursor-pointer transition-all duration-300 hover:scale-105 ${
              viewMode === 'masonry' ? 'break-inside-avoid' : ''
            }`}
            onClick={() => openLightbox(photo, index)}
          >
            <div className="relative overflow-hidden rounded-lg bg-gray-100">
              <img
                src={photo.thumbnail || photo.url}
                alt={photo.title}
                className={`w-full object-cover transition-transform duration-300 group-hover:scale-110 ${
                  viewMode === 'grid' ? 'aspect-square' : 'h-auto'
                }`}
                loading="lazy"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute inset-0 flex items-center justify-center">
                  <ZoomIn className="h-8 w-8 text-white" />
                </div>

                {/* Top overlay with actions */}
                <div className="absolute top-2 right-2 flex gap-2">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 bg-white/20 hover:bg-white/30">
                    <Heart className="h-4 w-4 text-white" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 bg-white/20 hover:bg-white/30">
                    <Download className="h-4 w-4 text-white" />
                  </Button>
                </div>

                {/* Bottom overlay with info */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                  <h3 className="text-white font-medium text-sm truncate">{photo.title}</h3>
                  {photo.photographer && (
                    <p className="text-white/80 text-xs truncate">by {photo.photographer}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {photo.category}
                    </Badge>
                    <span className="text-white/80 text-xs">{photo.likes} ♥</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredPhotos.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <ImageIcon className="h-12 w-12 mx-auto mb-4" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No photos found</h3>
          <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
        </div>
      )}

      {/* Lightbox Modal */}
      {isLightboxOpen && selectedPhoto && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
            onClick={closeLightbox}
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Navigation Buttons */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 z-10"
            onClick={() => navigateLightbox('prev')}
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 z-10"
            onClick={() => navigateLightbox('next')}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>

          {/* Main Image */}
          <div className="max-w-[90vw] max-h-[90vh] flex items-center justify-center">
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.title}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          {/* Photo Info Panel */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white mb-2">{selectedPhoto.title}</h2>
                  <p className="text-gray-300 mb-3">{selectedPhoto.description}</p>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedPhoto.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>{selectedPhoto.width} × {selectedPhoto.height}</span>
                    <span>{formatDate(selectedPhoto.uploadDate)}</span>
                    <span>{selectedPhoto.likes} likes</span>
                  </div>
                </div>

                {/* Camera Info */}
                {selectedPhoto.settings && (
                  <div className="sm:w-64 bg-white/10 rounded-lg p-4">
                    <h3 className="text-white font-medium mb-2">Camera Settings</h3>
                    {selectedPhoto.camera && (
                      <p className="text-gray-300 text-sm mb-2">{selectedPhoto.camera}</p>
                    )}
                    <div className="space-y-1 text-sm">
                      {selectedPhoto.settings.aperture && (
                        <div className="flex justify-between text-gray-300">
                          <span>Aperture:</span>
                          <span>{selectedPhoto.settings.aperture}</span>
                        </div>
                      )}
                      {selectedPhoto.settings.shutter && (
                        <div className="flex justify-between text-gray-300">
                          <span>Shutter:</span>
                          <span>{selectedPhoto.settings.shutter}</span>
                        </div>
                      )}
                      {selectedPhoto.settings.iso && (
                        <div className="flex justify-between text-gray-300">
                          <span>ISO:</span>
                          <span>{selectedPhoto.settings.iso}</span>
                        </div>
                      )}
                      {selectedPhoto.settings.focal && (
                        <div className="flex justify-between text-gray-300">
                          <span>Focal:</span>
                          <span>{selectedPhoto.settings.focal}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="secondary">
                  <Heart className="h-4 w-4 mr-2" />
                  Like
                </Button>
                <Button size="sm" variant="secondary">
                  <Share className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button size="sm" variant="secondary">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </div>

          {/* Image Counter */}
          <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
            {lightboxIndex + 1} of {filteredPhotos.length}
          </div>
        </div>
      )}
    </div>
  );
}