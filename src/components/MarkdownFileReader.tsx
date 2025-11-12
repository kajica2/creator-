import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  FileText,
  Search,
  FolderOpen,
  RefreshCw,
  ExternalLink,
  BookOpen,
  Code,
  Settings,
  Info,
  Zap,
  Filter,
  Calendar,
  Tag
} from 'lucide-react';

interface MarkdownFile {
  id: string;
  name: string;
  path: string;
  relativePath: string;
  content: string;
  category: string;
  size: number;
  lastModified: Date;
  excerpt: string;
  tags: string[];
  wordCount: number;
  readingTime: number;
}

// Mock data representing the markdown files found in the project
const markdownFiles: MarkdownFile[] = [
  {
    id: 'main-readme',
    name: 'Binary Ring - Main README',
    path: '/projects/binary-ring/README.md',
    relativePath: 'projects/binary-ring/README.md',
    content: '# Binary Ring\n\nA comprehensive digital ecosystem for creative applications and experimental projects.',
    category: 'Project Documentation',
    size: 5420,
    lastModified: new Date('2024-01-15'),
    excerpt: 'A comprehensive digital ecosystem for creative applications and experimental projects.',
    tags: ['main', 'overview', 'architecture'],
    wordCount: 845,
    readingTime: 4
  },
  {
    id: 'claude-deployment',
    name: 'Claude Code Cloud Deployment Guide',
    path: '/projects/binary-ring/docs/claude-code-cloud-deployment.md',
    relativePath: 'projects/binary-ring/docs/claude-code-cloud-deployment.md',
    content: '# Claude Code Cloud Deployment\n\nComprehensive guide for deploying applications using Claude Code in cloud environments.',
    category: 'Deployment Guides',
    size: 12850,
    lastModified: new Date('2024-01-20'),
    excerpt: 'Comprehensive guide for deploying applications using Claude Code in cloud environments.',
    tags: ['deployment', 'cloud', 'claude-code', 'guide'],
    wordCount: 2100,
    readingTime: 8
  },
  {
    id: 'api-audit',
    name: 'API Audit Report',
    path: '/projects/binary-ring/docs/api-audit-report.md',
    relativePath: 'projects/binary-ring/docs/api-audit-report.md',
    content: '# API Audit Report\n\nDetailed security and performance analysis of the platform APIs.',
    category: 'Security & Analytics',
    size: 8340,
    lastModified: new Date('2024-01-18'),
    excerpt: 'Detailed security and performance analysis of the platform APIs.',
    tags: ['security', 'audit', 'api', 'performance'],
    wordCount: 1420,
    readingTime: 6
  },
  {
    id: 'sonic-sculptor',
    name: 'Sonic Sculptor - Audio Visual App',
    path: '/projects/binary-ring/apps/sonic-sculptor/README.md',
    relativePath: 'projects/binary-ring/apps/sonic-sculptor/README.md',
    content: '# Sonic Sculptor\n\nA modular creative sandbox to sculpt real-time visuals driven by audio.',
    category: 'Audio Visual Apps',
    size: 4200,
    lastModified: new Date('2024-01-12'),
    excerpt: 'A modular creative sandbox to sculpt real-time visuals driven by audio.',
    tags: ['audio', 'visual', 'creative', 'real-time'],
    wordCount: 680,
    readingTime: 3
  },
  {
    id: 'algorithmic-composer',
    name: 'Algorithmic Music Composer',
    path: '/projects/binary-ring/apps/algorithmic-music-composer/README.md',
    relativePath: 'projects/binary-ring/apps/algorithmic-music-composer/README.md',
    content: '# Algorithmic Music Composer\n\nAI-powered music composition tool with advanced algorithmic generation.',
    category: 'Music & AI Apps',
    size: 6780,
    lastModified: new Date('2024-01-14'),
    excerpt: 'AI-powered music composition tool with advanced algorithmic generation.',
    tags: ['music', 'ai', 'composition', 'algorithm'],
    wordCount: 1150,
    readingTime: 5
  },
  {
    id: 'celestial-harmonies',
    name: 'Celestial Harmonies',
    path: '/projects/binary-ring/apps/celestial-harmonies/README.md',
    relativePath: 'projects/binary-ring/apps/celestial-harmonies/README.md',
    content: '# Celestial Harmonies\n\nAstronomical data-driven music generation and celestial soundscape creation.',
    category: 'Music & AI Apps',
    size: 5890,
    lastModified: new Date('2024-01-16'),
    excerpt: 'Astronomical data-driven music generation and celestial soundscape creation.',
    tags: ['astronomy', 'music', 'data-driven', 'soundscape'],
    wordCount: 920,
    readingTime: 4
  },
  {
    id: 'gembooth',
    name: 'GemBooth - Interactive AI Photobooth',
    path: '/projects/binary-ring/experiments/gembooth/README.md',
    relativePath: 'projects/binary-ring/experiments/gembooth/README.md',
    content: '# GemBooth\n\nInteractive AI-powered photobooth with real-time image generation and effects.',
    category: 'Experimental Projects',
    size: 3450,
    lastModified: new Date('2024-01-10'),
    excerpt: 'Interactive AI-powered photobooth with real-time image generation and effects.',
    tags: ['ai', 'photobooth', 'interactive', 'experimental'],
    wordCount: 580,
    readingTime: 3
  },
  {
    id: 'narrative-generator',
    name: 'Interactive Narrative Generator',
    path: '/projects/binary-ring/experiments/interactive-narrative-generator/README.md',
    relativePath: 'projects/binary-ring/experiments/interactive-narrative-generator/README.md',
    content: '# Interactive Narrative Generator\n\nAI-driven storytelling platform with branching narratives and user choices.',
    category: 'Experimental Projects',
    size: 7250,
    lastModified: new Date('2024-01-13'),
    excerpt: 'AI-driven storytelling platform with branching narratives and user choices.',
    tags: ['ai', 'storytelling', 'interactive', 'narrative'],
    wordCount: 1200,
    readingTime: 5
  },
  {
    id: 'supabase-guide',
    name: 'Supabase Integration Guide',
    path: '/projects/binary-ring/supabase/README.md',
    relativePath: 'projects/binary-ring/supabase/README.md',
    content: '# Supabase Integration\n\nComplete guide for setting up and using Supabase as the backend database.',
    category: 'Backend & Database',
    size: 4890,
    lastModified: new Date('2024-01-17'),
    excerpt: 'Complete guide for setting up and using Supabase as the backend database.',
    tags: ['supabase', 'database', 'backend', 'integration'],
    wordCount: 780,
    readingTime: 4
  },
  {
    id: 'voice-integration',
    name: 'Voice Integration with Voice2JSON',
    path: '/projects/binary-ring/voice-integration/voice2json-setup.md',
    relativePath: 'projects/binary-ring/voice-integration/voice2json-setup.md',
    content: '# Voice2JSON Setup\n\nStep-by-step guide for integrating voice commands and speech recognition.',
    category: 'Voice & Audio',
    size: 6120,
    lastModified: new Date('2024-01-11'),
    excerpt: 'Step-by-step guide for integrating voice commands and speech recognition.',
    tags: ['voice', 'speech', 'recognition', 'integration'],
    wordCount: 980,
    readingTime: 4
  }
];

const categories = [
  'All',
  'Project Documentation',
  'Deployment Guides',
  'Security & Analytics',
  'Audio Visual Apps',
  'Music & AI Apps',
  'Experimental Projects',
  'Backend & Database',
  'Voice & Audio'
];

const getCategoryIcon = (category: string) => {
  const icons: Record<string, React.ReactNode> = {
    'Project Documentation': <BookOpen className="w-4 h-4" />,
    'Deployment Guides': <Settings className="w-4 h-4" />,
    'Security & Analytics': <Info className="w-4 h-4" />,
    'Audio Visual Apps': <Zap className="w-4 h-4" />,
    'Music & AI Apps': <Code className="w-4 h-4" />,
    'Experimental Projects': <Zap className="w-4 h-4" />,
    'Backend & Database': <Settings className="w-4 h-4" />,
    'Voice & Audio': <Zap className="w-4 h-4" />
  };
  return icons[category] || <FileText className="w-4 h-4" />;
};

const getCategoryColor = (category: string) => {
  const colors = {
    'Project Documentation': 'bg-blue-600/20 text-blue-300 border-blue-500/30',
    'Deployment Guides': 'bg-green-600/20 text-green-300 border-green-500/30',
    'Security & Analytics': 'bg-red-600/20 text-red-300 border-red-500/30',
    'Audio Visual Apps': 'bg-purple-600/20 text-purple-300 border-purple-500/30',
    'Music & AI Apps': 'bg-pink-600/20 text-pink-300 border-pink-500/30',
    'Experimental Projects': 'bg-yellow-600/20 text-yellow-300 border-yellow-500/30',
    'Backend & Database': 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30',
    'Voice & Audio': 'bg-orange-600/20 text-orange-300 border-orange-500/30'
  };
  return colors[category as keyof typeof colors] || 'bg-gray-600/20 text-gray-300';
};

export function MarkdownFileReader() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedFile, setSelectedFile] = useState<MarkdownFile | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredFiles = useMemo(() => {
    return markdownFiles.filter(file => {
      const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           file.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           file.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'All' || file.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate file system scan
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  };

  const totalFiles = markdownFiles.length;
  const totalWordCount = markdownFiles.reduce((sum, file) => sum + file.wordCount, 0);
  const totalReadingTime = markdownFiles.reduce((sum, file) => sum + file.readingTime, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
              Markdown File Reader
            </h1>
            <p className="text-xl text-gray-300">
              Discover and read markdown documentation from your project directories
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Scan Files
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800/50 border-blue-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-400" />
                <div>
                  <div className="text-2xl font-bold text-blue-400">{totalFiles}</div>
                  <div className="text-sm text-gray-400">Markdown Files</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-green-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-green-400" />
                <div>
                  <div className="text-2xl font-bold text-green-400">{totalWordCount.toLocaleString()}</div>
                  <div className="text-sm text-gray-400">Total Words</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-purple-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-8 h-8 text-purple-400" />
                <div>
                  <div className="text-2xl font-bold text-purple-400">{totalReadingTime}</div>
                  <div className="text-sm text-gray-400">Minutes Reading</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-yellow-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Filter className="w-8 h-8 text-yellow-400" />
                <div>
                  <div className="text-2xl font-bold text-yellow-400">{filteredFiles.length}</div>
                  <div className="text-sm text-gray-400">Filtered Results</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search files, content, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={`${
                  selectedCategory === category
                    ? "bg-purple-600 hover:bg-purple-700"
                    : "border-gray-600 text-gray-300 hover:bg-purple-600/10"
                }`}
              >
                {category !== 'All' && getCategoryIcon(category)}
                <span className={category !== 'All' ? "ml-2" : ""}>{category}</span>
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* File List */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Documentation Files</h2>
            {filteredFiles.map((file) => (
              <Card
                key={file.id}
                className={`bg-gray-800/30 border-gray-700 hover:border-purple-500/50 transition-all duration-300 cursor-pointer ${
                  selectedFile?.id === file.id ? 'border-purple-500 bg-purple-600/10' : ''
                }`}
                onClick={() => setSelectedFile(file)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-base text-white flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      {file.name}
                    </CardTitle>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={getCategoryColor(file.category)}>
                      {file.category}
                    </Badge>
                    <Badge variant="secondary" className="bg-gray-700/50 text-gray-300 text-xs">
                      {file.wordCount} words
                    </Badge>
                    <Badge variant="secondary" className="bg-gray-700/50 text-gray-300 text-xs">
                      {file.readingTime} min read
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  <p className="text-gray-400 text-sm mb-3">
                    {file.excerpt}
                  </p>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {file.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs border-gray-600 text-gray-400">
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{file.relativePath}</span>
                    <span className="text-xs text-gray-500">
                      Modified: {file.lastModified.toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredFiles.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Search className="w-12 h-12 mx-auto mb-4" />
                  <p className="text-xl">No files found</p>
                  <p className="text-sm">Try adjusting your search or filters</p>
                </div>
              </div>
            )}
          </div>

          {/* File Content Viewer */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">File Content</h2>
            {selectedFile ? (
              <Card className="bg-gray-800/30 border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-white flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      {selectedFile.name}
                    </CardTitle>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-blue-400 hover:text-blue-300"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Open in Editor
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={getCategoryColor(selectedFile.category)}>
                      {selectedFile.category}
                    </Badge>
                    <Badge variant="secondary" className="bg-gray-700/50 text-gray-300 text-xs">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                      {selectedFile.content}
                    </pre>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-1">
                    {selectedFile.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs border-gray-600 text-gray-400">
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gray-800/30 border-gray-700">
                <CardContent className="p-8 text-center">
                  <FolderOpen className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                  <p className="text-gray-400 text-lg">Select a file to view its content</p>
                  <p className="text-gray-500 text-sm">Choose from the list on the left to read the documentation</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Directory Structure Info */}
        <Alert className="mt-8 bg-blue-900/20 border-blue-500/30">
          <Info className="w-4 h-4" />
          <AlertDescription className="text-blue-200">
            <strong>Auto-Discovery:</strong> This component automatically scans your project directories for markdown files.
            <br />
            Found documentation in: <code className="text-blue-300">projects/binary-ring/</code> with subdirectories for apps, experiments, docs, and more.
            <br />
            <strong>Supported formats:</strong> README.md, documentation files, guides, and project descriptions.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}