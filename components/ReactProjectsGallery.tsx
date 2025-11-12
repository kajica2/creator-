import React, { useState, useRef, useEffect } from 'react';

interface ReactProject {
  id: string;
  name: string;
  description: string;
  category: string;
  path: string;
  url?: string;
  technologies: string[];
  status: 'active' | 'experimental' | 'archived';
}

const REACT_PROJECTS: ReactProject[] = [
  // Main Applications
  {
    id: 'main-app',
    name: 'Viral Hashtag & Image AI',
    description: 'Main AI-powered content creation platform with hashtag generation and image tools',
    category: 'Main Application',
    path: '/',
    technologies: ['React', 'TypeScript', 'Supabase', 'Tailwind'],
    status: 'active'
  },

  // Binary Ring Apps
  {
    id: 'algorithmic-composer',
    name: 'Algorithmic Music Composer',
    description: 'AI-powered music composition with algorithmic generation',
    category: 'Music & Audio',
    path: '/projects/binary-ring/apps/algorithmic-music-composer',
    technologies: ['React 19', 'TypeScript', 'Vite', 'Google GenAI'],
    status: 'active'
  },
  {
    id: 'celestial-harmonies',
    name: 'Celestial Harmonies',
    description: 'Ambient music creation inspired by astronomical phenomena',
    category: 'Music & Audio',
    path: '/projects/binary-ring/apps/celestial-harmonies',
    technologies: ['React 19', 'TypeScript', 'Web Audio API'],
    status: 'active'
  },
  {
    id: 'kosmos-journey',
    name: 'Kosmos Mindful Journey',
    description: 'Mindfulness and meditation platform with interactive experiences',
    category: 'Wellness & Mindfulness',
    path: '/projects/binary-ring/apps/kosmos-mindful-journey',
    technologies: ['React 19', 'TypeScript', 'Vite'],
    status: 'active'
  },
  {
    id: 'ai-video-director',
    name: 'AI Music Video Director',
    description: 'AI-powered music video creation and editing platform',
    category: 'Video & Media',
    path: '/projects/binary-ring/apps/ai-music-video-director',
    technologies: ['React 19', 'TypeScript', 'AI Integration'],
    status: 'active'
  },
  {
    id: 'sonic-sculptor',
    name: 'Sonic Sculptor',
    description: 'Advanced audio manipulation and sound design toolkit',
    category: 'Music & Audio',
    path: '/projects/binary-ring/apps/sonic-sculptor',
    technologies: ['React 19', 'Web Audio API', 'TypeScript'],
    status: 'active'
  },
  {
    id: 'path-of-spheres',
    name: 'Path of Spheres',
    description: '3D interactive experience with physics-based sphere navigation',
    category: 'Interactive & Games',
    path: '/projects/binary-ring/apps/path-of-spheres',
    technologies: ['React 19', 'Three.js', 'WebGL'],
    status: 'active'
  },
  {
    id: 'image-to-code',
    name: 'Image to Code',
    description: 'AI-powered tool to convert images and designs into code',
    category: 'AI & Development',
    path: '/projects/binary-ring/apps/image-to-code',
    technologies: ['React 19', 'AI Vision', 'Code Generation'],
    status: 'active'
  },

  // Experiments
  {
    id: 'social-content-generator',
    name: 'Cross-Platform Social Content Generator',
    description: 'Generate optimized content for multiple social media platforms',
    category: 'Social Media & Marketing',
    path: '/projects/binary-ring/experiments/cross-platform-social-content-generator',
    technologies: ['React 19', 'Google GenAI', 'TypeScript'],
    status: 'experimental'
  },
  {
    id: 'narrative-generator',
    name: 'Interactive Narrative Generator',
    description: 'AI-powered interactive storytelling with branching narratives',
    category: 'AI & Content Creation',
    path: '/projects/binary-ring/experiments/interactive-narrative-generator',
    technologies: ['React 19', 'AI Storytelling', 'TypeScript'],
    status: 'experimental'
  },
  {
    id: 'gembooth',
    name: 'GemBooth',
    description: 'AI photo booth with real-time image generation and effects',
    category: 'AI & Media',
    path: '/projects/binary-ring/experiments/gembooth',
    technologies: ['React 19', 'AI Vision', 'Real-time Processing'],
    status: 'experimental'
  },

  // Generative Art Projects
  {
    id: 'substrate',
    name: 'Substrate',
    description: 'Algorithmic art generation with substrate growth simulation',
    category: 'Generative Art',
    path: '/projects/binary-ring/substrate',
    technologies: ['React', 'Canvas API', 'Algorithm Visualization'],
    status: 'active'
  },
  {
    id: 'buddhabrot',
    name: 'Buddhabrot',
    description: 'Fractal visualization of the Mandelbrot set using probability distribution',
    category: 'Generative Art',
    path: '/projects/binary-ring/buddhabrot',
    technologies: ['React', 'Mathematical Visualization', 'Canvas'],
    status: 'active'
  },
  {
    id: 'bubble-chamber',
    name: 'Bubble Chamber',
    description: 'Physics simulation inspired by particle physics detectors',
    category: 'Generative Art',
    path: '/projects/binary-ring/bubble.chamber',
    technologies: ['React', 'Physics Simulation', 'WebGL'],
    status: 'active'
  },
  {
    id: 'node-garden',
    name: 'Node Garden',
    description: 'Interactive network visualization with organic growth patterns',
    category: 'Generative Art',
    path: '/projects/binary-ring/node.garden',
    technologies: ['React', 'Graph Algorithms', 'Interactive Visualization'],
    status: 'active'
  },
  {
    id: 'sand-stroke',
    name: 'Sand Stroke',
    description: 'Digital sand painting with natural brush dynamics',
    category: 'Generative Art',
    path: '/projects/binary-ring/sand.stroke',
    technologies: ['React', 'Canvas Painting', 'Physics'],
    status: 'active'
  }
];

const CATEGORIES = [
  'All',
  'Main Application',
  'Music & Audio',
  'Video & Media',
  'AI & Development',
  'AI & Content Creation',
  'Social Media & Marketing',
  'Wellness & Mindfulness',
  'Interactive & Games',
  'Generative Art',
  'AI & Media'
];

export const ReactProjectsGallery: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<ReactProject | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isIframeLoading, setIsIframeLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const filteredProjects = REACT_PROJECTS.filter(project => {
    const matchesCategory = selectedCategory === 'All' || project.category === selectedCategory;
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.technologies.some(tech => tech.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleProjectSelect = (project: ReactProject) => {
    setSelectedProject(project);
    setIsIframeLoading(true);
  };

  const handleIframeLoad = () => {
    setIsIframeLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'experimental': return 'bg-yellow-500';
      case 'archived': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Music & Audio': return '🎵';
      case 'Video & Media': return '🎬';
      case 'AI & Development': return '🤖';
      case 'AI & Content Creation': return '✨';
      case 'Social Media & Marketing': return '📱';
      case 'Wellness & Mindfulness': return '🧘';
      case 'Interactive & Games': return '🎮';
      case 'Generative Art': return '🎨';
      case 'AI & Media': return '🖼️';
      case 'Main Application': return '🚀';
      default: return '📄';
    }
  };

  const openInNewTab = (project: ReactProject) => {
    const baseUrl = window.location.origin;
    const fullUrl = project.path === '/' ? baseUrl : `${baseUrl}${project.path}`;
    window.open(fullUrl, '_blank');
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-gray-700">
        <h1 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
          React Projects Gallery
        </h1>
        <p className="text-gray-400 mb-4">
          Explore {REACT_PROJECTS.length} React applications in the ecosystem
        </p>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search projects, technologies, or descriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Project List */}
        <div className="w-1/3 border-r border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <div className="text-sm text-gray-400">
              Showing {filteredProjects.length} of {REACT_PROJECTS.length} projects
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="space-y-2 p-4">
              {filteredProjects.map(project => (
                <div
                  key={project.id}
                  onClick={() => handleProjectSelect(project)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all hover:scale-[1.02] ${
                    selectedProject?.id === project.id
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-gray-600 bg-gray-800 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getCategoryIcon(project.category)}</span>
                      <h3 className="font-semibold text-white">{project.name}</h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(project.status)}`} />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openInNewTab(project);
                        }}
                        className="text-gray-400 hover:text-white"
                        title="Open in new tab"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-300 mb-3">{project.description}</p>

                  <div className="text-xs text-gray-400 mb-2">
                    {project.category} • {project.status}
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {project.technologies.slice(0, 3).map(tech => (
                      <span
                        key={tech}
                        className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300"
                      >
                        {tech}
                      </span>
                    ))}
                    {project.technologies.length > 3 && (
                      <span className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-400">
                        +{project.technologies.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Project Preview */}
        <div className="flex-1 flex flex-col bg-gray-800">
          {selectedProject ? (
            <>
              {/* Preview Header */}
              <div className="p-4 border-b border-gray-700 bg-gray-900">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getCategoryIcon(selectedProject.category)}</span>
                    <div>
                      <h2 className="text-xl font-bold text-white">{selectedProject.name}</h2>
                      <p className="text-gray-400">{selectedProject.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(selectedProject.status)}`} />
                    <span className="text-sm text-gray-400 capitalize">{selectedProject.status}</span>
                    <button
                      onClick={() => openInNewTab(selectedProject)}
                      className="ml-4 px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm font-medium transition-colors"
                    >
                      Open Full Screen
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <p className="text-gray-300 mb-2">{selectedProject.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.technologies.map(tech => (
                      <span
                        key={tech}
                        className="px-2 py-1 bg-purple-600/20 border border-purple-500/30 rounded text-xs text-purple-300"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Preview Content */}
              <div className="flex-1 relative">
                {isIframeLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                      <p className="text-gray-400">Loading {selectedProject.name}...</p>
                    </div>
                  </div>
                )}

                <iframe
                  ref={iframeRef}
                  src={selectedProject.path === '/' ? window.location.origin : `${window.location.origin}${selectedProject.path}`}
                  className="w-full h-full border-0"
                  onLoad={handleIframeLoad}
                  title={selectedProject.name}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🚀</div>
                <h3 className="text-xl font-semibold text-white mb-2">Select a Project</h3>
                <p className="text-gray-400 max-w-md">
                  Choose a React project from the list to preview it in this window, or open it in a new tab for full functionality.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReactProjectsGallery;