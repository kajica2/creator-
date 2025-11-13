import React, { useState } from 'react';
import { Globe, ArrowLeft, Sparkles, Download, Eye, Code, Palette, Layout, Zap, Copy, Settings, Monitor, Smartphone, Tablet } from 'lucide-react';

interface AIWebsiteGeneratorProps {
  onBack?: () => void;
  onNavigate?: (page: string) => void;
}

interface WebsiteSection {
  id: string;
  name: string;
  type: 'hero' | 'about' | 'services' | 'contact' | 'gallery' | 'testimonials' | 'footer';
  content: string;
  included: boolean;
}

interface GeneratedWebsite {
  id: string;
  name: string;
  description: string;
  theme: string;
  style: string;
  sections: WebsiteSection[];
  html: string;
  css: string;
  timestamp: string;
  status: 'generating' | 'completed' | 'failed';
  progress?: number;
}

export function AIWebsiteGenerator({ onBack }: AIWebsiteGeneratorProps) {
  const [websiteName, setWebsiteName] = useState('');
  const [websiteDescription, setWebsiteDescription] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('modern');
  const [selectedStyle, setSelectedStyle] = useState('business');
  const [selectedSections, setSelectedSections] = useState<string[]>(['hero', 'about', 'services', 'contact']);
  const [colorScheme, setColorScheme] = useState('blue');
  const [layout, setLayout] = useState('standard');
  const [currentWebsite, setCurrentWebsite] = useState<GeneratedWebsite | null>(null);
  const [websites, setWebsites] = useState<GeneratedWebsite[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showCode, setShowCode] = useState(false);

  const themes = [
    { id: 'modern', name: 'Modern', desc: 'Clean, minimalist design' },
    { id: 'creative', name: 'Creative', desc: 'Bold, artistic layouts' },
    { id: 'classic', name: 'Classic', desc: 'Traditional, elegant style' },
    { id: 'tech', name: 'Tech', desc: 'Futuristic, high-tech feel' },
    { id: 'organic', name: 'Organic', desc: 'Natural, flowing designs' }
  ];

  const styles = [
    { id: 'business', name: 'Business', desc: 'Professional corporate site' },
    { id: 'portfolio', name: 'Portfolio', desc: 'Creative showcase' },
    { id: 'blog', name: 'Blog', desc: 'Content-focused layout' },
    { id: 'ecommerce', name: 'E-commerce', desc: 'Online store design' },
    { id: 'landing', name: 'Landing Page', desc: 'Single-page conversion focus' },
    { id: 'agency', name: 'Agency', desc: 'Creative agency showcase' }
  ];

  const availableSections: WebsiteSection[] = [
    { id: 'hero', name: 'Hero Section', type: 'hero', content: 'Main banner with call-to-action', included: true },
    { id: 'about', name: 'About Us', type: 'about', content: 'Company/personal information', included: true },
    { id: 'services', name: 'Services', type: 'services', content: 'What you offer', included: true },
    { id: 'gallery', name: 'Gallery', type: 'gallery', content: 'Image showcase', included: false },
    { id: 'testimonials', name: 'Testimonials', type: 'testimonials', content: 'Customer reviews', included: false },
    { id: 'contact', name: 'Contact', type: 'contact', content: 'Contact form and information', included: true },
    { id: 'footer', name: 'Footer', type: 'footer', content: 'Site footer with links', included: true }
  ];

  const colorSchemes = [
    { id: 'blue', name: 'Ocean Blue', primary: '#3B82F6', secondary: '#1E40AF' },
    { id: 'purple', name: 'Royal Purple', primary: '#8B5CF6', secondary: '#7C3AED' },
    { id: 'green', name: 'Forest Green', primary: '#10B981', secondary: '#059669' },
    { id: 'orange', name: 'Sunset Orange', primary: '#F59E0B', secondary: '#D97706' },
    { id: 'pink', name: 'Rose Pink', primary: '#EC4899', secondary: '#DB2777' },
    { id: 'gray', name: 'Elegant Gray', primary: '#6B7280', secondary: '#374151' }
  ];

  const layouts = [
    { id: 'standard', name: 'Standard', desc: 'Traditional top-to-bottom flow' },
    { id: 'sidebar', name: 'Sidebar', desc: 'Content with side navigation' },
    { id: 'split', name: 'Split Screen', desc: 'Divided layout sections' },
    { id: 'grid', name: 'Grid', desc: 'Card-based grid layout' }
  ];

  const toggleSection = (sectionId: string) => {
    setSelectedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const generateWebsite = async () => {
    if (!websiteName.trim() || !websiteDescription.trim()) return;

    const newWebsite: GeneratedWebsite = {
      id: Date.now().toString(),
      name: websiteName.trim(),
      description: websiteDescription.trim(),
      theme: selectedTheme,
      style: selectedStyle,
      sections: availableSections.filter(section => selectedSections.includes(section.id)),
      html: '',
      css: '',
      timestamp: new Date().toLocaleString(),
      status: 'generating',
      progress: 0
    };

    setCurrentWebsite(newWebsite);
    setWebsites(prev => [newWebsite, ...prev]);
    setIsGenerating(true);

    try {
      // Simulate generation process
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 300));

        const updatedWebsite = {
          ...newWebsite,
          progress
        };

        setWebsites(prev =>
          prev.map(w => w.id === newWebsite.id ? updatedWebsite : w)
        );
        setCurrentWebsite(updatedWebsite);
      }

      // Generate mock HTML and CSS
      const { html, css } = generateMockWebsite(newWebsite);

      const completedWebsite: GeneratedWebsite = {
        ...newWebsite,
        html,
        css,
        status: 'completed',
        progress: 100
      };

      setWebsites(prev =>
        prev.map(w => w.id === newWebsite.id ? completedWebsite : w)
      );
      setCurrentWebsite(completedWebsite);

    } catch (error) {
      console.error('Website generation error:', error);

      const failedWebsite = {
        ...newWebsite,
        status: 'failed' as const
      };

      setWebsites(prev =>
        prev.map(w => w.id === newWebsite.id ? failedWebsite : w)
      );
      setCurrentWebsite(failedWebsite);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMockWebsite = (website: GeneratedWebsite) => {
    const colorSchemeObj = colorSchemes.find(c => c.id === colorScheme);
    const primary = colorSchemeObj?.primary || '#3B82F6';
    const secondary = colorSchemeObj?.secondary || '#1E40AF';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${website.name}</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    ${website.sections.map(section => generateSectionHTML(section, website, primary)).join('\n')}
</body>
</html>`;

    const css = `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Arial', sans-serif;
    line-height: 1.6;
    color: #333;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

/* Hero Section */
.hero {
    background: linear-gradient(135deg, ${primary}, ${secondary});
    color: white;
    padding: 100px 0;
    text-align: center;
}

.hero h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.hero p {
    font-size: 1.2rem;
    margin-bottom: 2rem;
}

.btn {
    display: inline-block;
    background: white;
    color: ${primary};
    padding: 12px 30px;
    text-decoration: none;
    border-radius: 5px;
    font-weight: bold;
    transition: transform 0.3s ease;
}

.btn:hover {
    transform: translateY(-2px);
}

/* Sections */
.section {
    padding: 80px 0;
}

.section:nth-child(even) {
    background: #f8f9fa;
}

.section h2 {
    text-align: center;
    margin-bottom: 3rem;
    color: ${primary};
}

/* Services Grid */
.services-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
}

.service-card {
    background: white;
    padding: 2rem;
    border-radius: 10px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    text-align: center;
}

/* Contact Form */
.contact-form {
    max-width: 600px;
    margin: 0 auto;
}

.form-group {
    margin-bottom: 1rem;
}

.form-group input,
.form-group textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 5px;
}

/* Footer */
.footer {
    background: #333;
    color: white;
    text-align: center;
    padding: 40px 0;
}`;

    return { html, css };
  };

  const generateSectionHTML = (section: WebsiteSection, website: GeneratedWebsite, primary: string) => {
    switch (section.type) {
      case 'hero':
        return `
    <section class="hero">
        <div class="container">
            <h1>${website.name}</h1>
            <p>${website.description}</p>
            <a href="#contact" class="btn">Get Started</a>
        </div>
    </section>`;

      case 'about':
        return `
    <section class="section" id="about">
        <div class="container">
            <h2>About Us</h2>
            <p>We are passionate about delivering exceptional results and building lasting relationships with our clients. Our team combines creativity with technical expertise to bring your vision to life.</p>
        </div>
    </section>`;

      case 'services':
        return `
    <section class="section" id="services">
        <div class="container">
            <h2>Our Services</h2>
            <div class="services-grid">
                <div class="service-card">
                    <h3>Service One</h3>
                    <p>Professional service description highlighting key benefits and value proposition.</p>
                </div>
                <div class="service-card">
                    <h3>Service Two</h3>
                    <p>Professional service description highlighting key benefits and value proposition.</p>
                </div>
                <div class="service-card">
                    <h3>Service Three</h3>
                    <p>Professional service description highlighting key benefits and value proposition.</p>
                </div>
            </div>
        </div>
    </section>`;

      case 'contact':
        return `
    <section class="section" id="contact">
        <div class="container">
            <h2>Contact Us</h2>
            <div class="contact-form">
                <form>
                    <div class="form-group">
                        <input type="text" placeholder="Your Name" required>
                    </div>
                    <div class="form-group">
                        <input type="email" placeholder="Your Email" required>
                    </div>
                    <div class="form-group">
                        <textarea rows="5" placeholder="Your Message" required></textarea>
                    </div>
                    <button type="submit" class="btn">Send Message</button>
                </form>
            </div>
        </div>
    </section>`;

      case 'footer':
        return `
    <footer class="footer">
        <div class="container">
            <p>&copy; 2024 ${website.name}. All rights reserved.</p>
        </div>
    </footer>`;

      default:
        return `<section class="section"><div class="container"><h2>${section.name}</h2><p>${section.content}</p></div></section>`;
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  const downloadWebsite = () => {
    if (!currentWebsite || currentWebsite.status !== 'completed') return;

    // Create HTML file
    const htmlBlob = new Blob([currentWebsite.html], { type: 'text/html' });
    const cssBlob = new Blob([currentWebsite.css], { type: 'text/css' });

    // Download HTML
    const htmlUrl = URL.createObjectURL(htmlBlob);
    const htmlLink = document.createElement('a');
    htmlLink.href = htmlUrl;
    htmlLink.download = `${currentWebsite.name.toLowerCase().replace(/\s+/g, '-')}.html`;
    document.body.appendChild(htmlLink);
    htmlLink.click();
    document.body.removeChild(htmlLink);
    URL.revokeObjectURL(htmlUrl);

    // Download CSS
    setTimeout(() => {
      const cssUrl = URL.createObjectURL(cssBlob);
      const cssLink = document.createElement('a');
      cssLink.href = cssUrl;
      cssLink.download = 'styles.css';
      document.body.appendChild(cssLink);
      cssLink.click();
      document.body.removeChild(cssLink);
      URL.revokeObjectURL(cssUrl);
    }, 100);
  };

  const getPreviewScale = () => {
    switch (previewMode) {
      case 'tablet': return 'scale-75';
      case 'mobile': return 'scale-50';
      default: return 'scale-100';
    }
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
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">AI Website Generator</h1>
              <p className="text-slate-400">Create complete websites with AI assistance</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="space-y-6">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-400" />
                Website Configuration
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Website Name
                  </label>
                  <input
                    type="text"
                    value={websiteName}
                    onChange={(e) => setWebsiteName(e.target.value)}
                    placeholder="My Awesome Website"
                    className="w-full p-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={websiteDescription}
                    onChange={(e) => setWebsiteDescription(e.target.value)}
                    placeholder="Describe what your website is about..."
                    className="w-full h-20 p-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Theme
                    </label>
                    <select
                      value={selectedTheme}
                      onChange={(e) => setSelectedTheme(e.target.value)}
                      className="w-full p-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                    >
                      {themes.map(theme => (
                        <option key={theme.id} value={theme.id}>{theme.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Style
                    </label>
                    <select
                      value={selectedStyle}
                      onChange={(e) => setSelectedStyle(e.target.value)}
                      className="w-full p-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                    >
                      {styles.map(style => (
                        <option key={style.id} value={style.id}>{style.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Color Scheme
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {colorSchemes.map(scheme => (
                      <button
                        key={scheme.id}
                        onClick={() => setColorScheme(scheme.id)}
                        className={`p-2 rounded border transition-colors ${
                          colorScheme === scheme.id
                            ? 'border-purple-500 bg-purple-500/20'
                            : 'border-slate-600 hover:border-slate-500'
                        }`}
                      >
                        <div className="flex gap-1 mb-1">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: scheme.primary }}
                          ></div>
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: scheme.secondary }}
                          ></div>
                        </div>
                        <span className="text-xs text-slate-300">{scheme.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Layout Style
                  </label>
                  <select
                    value={layout}
                    onChange={(e) => setLayout(e.target.value)}
                    className="w-full p-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                  >
                    {layouts.map(layout => (
                      <option key={layout.id} value={layout.id}>
                        {layout.name} - {layout.desc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Sections Selection */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Layout className="w-5 h-5 text-blue-400" />
                Website Sections
              </h3>

              <div className="space-y-2">
                {availableSections.map(section => (
                  <label key={section.id} className="flex items-start p-3 bg-slate-900/30 rounded-lg hover:bg-slate-900/50 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedSections.includes(section.id)}
                      onChange={() => toggleSection(section.id)}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <span className="text-white font-medium">{section.name}</span>
                      <p className="text-slate-400 text-sm">{section.content}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateWebsite}
              disabled={!websiteName.trim() || !websiteDescription.trim() || isGenerating}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Generate Website
                </>
              )}
            </button>

            {/* Previous Websites */}
            {websites.length > 0 && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Generated Websites</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {websites.slice(0, 5).map(website => (
                    <button
                      key={website.id}
                      onClick={() => setCurrentWebsite(website)}
                      className={`w-full p-3 border rounded-lg text-left transition-colors ${
                        currentWebsite?.id === website.id
                          ? 'bg-purple-600/20 border-purple-500'
                          : 'bg-slate-900/50 border-slate-600 hover:bg-slate-700/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white font-medium">{website.name}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          website.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          website.status === 'generating' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {website.status}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm line-clamp-1">{website.description}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        <span>{website.theme}</span>
                        <span>•</span>
                        <span>{website.style}</span>
                        <span>•</span>
                        <span>{website.timestamp}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">
                  {currentWebsite ? `Preview: ${currentWebsite.name}` : 'Website Preview'}
                </h2>

                {currentWebsite && currentWebsite.status === 'completed' && (
                  <div className="flex gap-2">
                    {/* Preview Mode Buttons */}
                    <div className="flex border border-slate-600 rounded overflow-hidden">
                      <button
                        onClick={() => setPreviewMode('desktop')}
                        className={`p-2 ${previewMode === 'desktop' ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300'} transition-colors`}
                        title="Desktop view"
                      >
                        <Monitor className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setPreviewMode('tablet')}
                        className={`p-2 ${previewMode === 'tablet' ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300'} transition-colors`}
                        title="Tablet view"
                      >
                        <Tablet className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setPreviewMode('mobile')}
                        className={`p-2 ${previewMode === 'mobile' ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300'} transition-colors`}
                        title="Mobile view"
                      >
                        <Smartphone className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Action Buttons */}
                    <button
                      onClick={() => setShowCode(!showCode)}
                      className={`p-2 rounded transition-colors ${showCode ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300 hover:text-white'}`}
                      title="View code"
                    >
                      <Code className="w-4 h-4" />
                    </button>
                    <button
                      onClick={downloadWebsite}
                      className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded transition-colors"
                      title="Download website"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {currentWebsite ? (
                <div className="space-y-6">
                  {/* Generation Progress */}
                  {currentWebsite.status === 'generating' && (
                    <div className="bg-slate-900/50 border border-slate-600 rounded-lg p-6">
                      <div className="flex justify-between text-sm text-slate-400 mb-2">
                        <span>Generating website...</span>
                        <span>{currentWebsite.progress || 0}%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${currentWebsite.progress || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Website Preview */}
                  {currentWebsite.status === 'completed' && !showCode && (
                    <div className={`bg-white rounded-lg overflow-hidden transition-transform origin-top-left ${getPreviewScale()}`}>
                      <iframe
                        srcDoc={currentWebsite.html.replace('<link rel="stylesheet" href="styles.css">', `<style>${currentWebsite.css}</style>`)}
                        className="w-full h-96 border-0"
                        title="Website Preview"
                      />
                    </div>
                  )}

                  {/* Code View */}
                  {currentWebsite.status === 'completed' && showCode && (
                    <div className="space-y-4">
                      <div className="bg-slate-900/50 border border-slate-600 rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between p-3 bg-slate-800 border-b border-slate-600">
                          <span className="text-white font-medium">HTML</span>
                          <button
                            onClick={() => copyCode(currentWebsite.html)}
                            className="p-1 text-slate-400 hover:text-white transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                        <pre className="p-4 text-slate-300 text-sm overflow-x-auto max-h-48 overflow-y-auto">
                          <code>{currentWebsite.html}</code>
                        </pre>
                      </div>

                      <div className="bg-slate-900/50 border border-slate-600 rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between p-3 bg-slate-800 border-b border-slate-600">
                          <span className="text-white font-medium">CSS</span>
                          <button
                            onClick={() => copyCode(currentWebsite.css)}
                            className="p-1 text-slate-400 hover:text-white transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                        <pre className="p-4 text-slate-300 text-sm overflow-x-auto max-h-48 overflow-y-auto">
                          <code>{currentWebsite.css}</code>
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Error State */}
                  {currentWebsite.status === 'failed' && (
                    <div className="text-center py-8">
                      <p className="text-red-400 mb-2">Website generation failed</p>
                      <p className="text-slate-500 text-sm">Please try again with different settings</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-96 flex items-center justify-center border-2 border-dashed border-slate-600 rounded-lg">
                  <div className="text-center">
                    <Globe className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-400 text-lg mb-2">No website generated yet</p>
                    <p className="text-slate-500">Configure your website and click generate to start</p>
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
            Advanced template library, CMS integration, e-commerce functionality, SEO optimization,
            hosting deployment, custom domain setup, and collaborative editing features.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AIWebsiteGenerator;