import React, { useState } from 'react';
import { Globe, Copy, Download, ArrowLeft, Sparkles } from 'lucide-react';

interface WebsiteStrategyGeneratorProps {
  onBack?: () => void;
  onNavigate?: (page: string) => void;
}

export function WebsiteStrategyGenerator({ onBack }: WebsiteStrategyGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [strategy, setStrategy] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      // TODO: Integrate with Gemini API for strategy generation
      // For now, provide a placeholder response
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call

      const mockStrategy = `🌐 Website Strategy Plan for: "${prompt}"

═══════════════════════════════════════════════════════════════

📊 EXECUTIVE SUMMARY
This comprehensive strategy addresses: ${prompt.toLowerCase()}

🎯 TARGET AUDIENCE ANALYSIS
Primary Demographics:
• Age range: 25-45
• Tech-savvy professionals
• Mobile-first users
• Value-driven consumers

Secondary Markets:
• Early adopters
• Industry influencers
• B2B decision makers

🏗️ WEBSITE ARCHITECTURE
Homepage Structure:
✓ Hero section with clear value proposition
✓ Feature highlights and benefits
✓ Social proof and testimonials
✓ Clear call-to-action buttons

Navigation Strategy:
✓ Intuitive menu structure
✓ Search functionality
✓ Breadcrumb navigation
✓ Mobile-responsive design

💡 CONTENT STRATEGY
Content Pillars:
• Educational resources
• Product demonstrations
• Customer success stories
• Industry insights

SEO Optimization:
• Keyword research and targeting
• On-page optimization
• Technical SEO implementation
• Content marketing calendar

📱 USER EXPERIENCE (UX)
Design Principles:
• Clean, modern interface
• Fast loading times (<3 seconds)
• Accessibility compliance
• Cross-browser compatibility

Conversion Optimization:
• A/B testing framework
• Heat mapping analysis
• User journey optimization
• Form optimization

📈 GROWTH STRATEGY
Marketing Channels:
• Organic search (SEO)
• Social media marketing
• Email campaigns
• Content marketing
• Paid advertising (PPC)

Analytics & KPIs:
• Website traffic growth
• Conversion rate optimization
• User engagement metrics
• Customer acquisition cost

🔧 TECHNICAL REQUIREMENTS
Platform Recommendations:
• Modern CMS solution
• Cloud hosting infrastructure
• SSL certificate implementation
• CDN for global performance

Security Measures:
• Regular security audits
• Data protection compliance
• Backup and recovery systems
• User authentication protocols

📅 IMPLEMENTATION TIMELINE
Phase 1 (Weeks 1-4): Foundation
• Domain and hosting setup
• Basic site structure
• Core content creation

Phase 2 (Weeks 5-8): Development
• Design implementation
• Feature development
• Content management system

Phase 3 (Weeks 9-12): Optimization
• Testing and refinement
• SEO optimization
• Performance tuning

Phase 4 (Ongoing): Growth
• Marketing implementation
• Analytics monitoring
• Continuous improvement

💰 BUDGET CONSIDERATIONS
Development Costs:
• Design and development
• Content creation
• Technical infrastructure
• Marketing launch

Ongoing Expenses:
• Hosting and maintenance
• Marketing campaigns
• Content updates
• Performance monitoring

🚀 SUCCESS METRICS
Key Performance Indicators:
• Monthly unique visitors
• Conversion rate percentage
• Average session duration
• Bounce rate reduction
• Lead generation numbers

This strategic plan provides a comprehensive roadmap for building and growing a successful web presence.`;

      setStrategy(mockStrategy);
    } catch (error) {
      console.error('Strategy generation error:', error);
      setStrategy('Error generating strategy. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(strategy);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([strategy], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `website-strategy-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
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
              <h1 className="text-3xl font-bold text-white">Website Strategy Generator</h1>
              <p className="text-slate-400">Create comprehensive website strategies with AI</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Project Brief
              </h2>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your website project, business goals, target audience, and key requirements..."
                className="w-full h-32 p-4 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Generating Strategy...
                  </>
                ) : (
                  <>
                    <Globe className="w-5 h-5" />
                    Generate Strategy
                  </>
                )}
              </button>
            </div>

            {/* Strategy Tips */}
            <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Strategy Tips</h3>
              <ul className="text-slate-400 space-y-2">
                <li>• Define your business model and objectives</li>
                <li>• Specify target audience and demographics</li>
                <li>• Include budget and timeline constraints</li>
                <li>• Mention specific features or functionality needed</li>
              </ul>
            </div>
          </div>

          {/* Output Section */}
          <div className="space-y-6">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Generated Strategy</h2>
                {strategy && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopy}
                      className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg transition-colors"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleDownload}
                      className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg transition-colors"
                      title="Download as file"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="min-h-64 max-h-96 overflow-y-auto">
                {strategy ? (
                  <div className="p-4 bg-slate-900/50 border border-slate-600 rounded-lg">
                    <pre className="text-slate-300 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                      {strategy}
                    </pre>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-600 rounded-lg">
                    <div className="text-center">
                      <Globe className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                      <p className="text-slate-400">Your generated strategy will appear here</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Coming Soon Notice */}
        <div className="mt-8 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-2">🚀 Coming Soon</h3>
          <p className="text-slate-300">
            Full Gemini integration for advanced website strategy planning, competitive analysis,
            conversion optimization, and performance forecasting.
          </p>
        </div>
      </div>
    </div>
  );
}

export default WebsiteStrategyGenerator;