import React, { useState } from 'react';
import { Brain, Copy, Download, ArrowLeft, Sparkles } from 'lucide-react';

interface AISkillGeneratorProps {
  onBack?: () => void;
  onNavigate?: (page: string) => void;
}

export function AISkillGenerator({ onBack }: AISkillGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [skills, setSkills] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      // TODO: Integrate with Gemini API for skill recommendations
      // For now, provide a placeholder response
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call

      const mockSkills = `🧠 AI-Powered Skill Development Plan for: "${prompt}"

═══════════════════════════════════════════════════════════════

📈 SKILL ASSESSMENT & RECOMMENDATIONS

🎯 PRIMARY SKILLS TO DEVELOP
Based on your interest in "${prompt.toLowerCase()}", here are key skills to focus on:

🔥 IMMEDIATE FOCUS (Next 3 Months)
┌─────────────────────────────────────────────────────────────┐
│ 1. FOUNDATIONAL KNOWLEDGE                                   │
│    • Core concepts and terminology                          │
│    • Industry standards and best practices                  │
│    • Basic tools and technologies                           │
│    • Theoretical understanding                              │
│                                                             │
│    Learning Time: 40-60 hours                               │
│    Difficulty: ⭐⭐⭐                                        │
│    Priority: HIGH                                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 2. PRACTICAL APPLICATION                                    │
│    • Hands-on projects and exercises                        │
│    • Real-world problem solving                             │
│    • Tool proficiency and workflow                          │
│    • Implementation experience                              │
│                                                             │
│    Learning Time: 60-80 hours                               │
│    Difficulty: ⭐⭐⭐⭐                                      │
│    Priority: HIGH                                            │
└─────────────────────────────────────────────────────────────┘

🚀 INTERMEDIATE DEVELOPMENT (Months 4-6)
┌─────────────────────────────────────────────────────────────┐
│ 3. SPECIALIZED TECHNIQUES                                   │
│    • Advanced methodologies                                 │
│    • Optimization strategies                                │
│    • Integration approaches                                 │
│    • Performance enhancement                                │
│                                                             │
│    Learning Time: 80-100 hours                              │
│    Difficulty: ⭐⭐⭐⭐                                      │
│    Priority: MEDIUM                                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 4. COLLABORATION & COMMUNICATION                            │
│    • Team collaboration skills                              │
│    • Technical communication                                │
│    • Project management                                     │
│    • Stakeholder engagement                                 │
│                                                             │
│    Learning Time: 30-50 hours                               │
│    Difficulty: ⭐⭐⭐                                        │
│    Priority: MEDIUM                                          │
└─────────────────────────────────────────────────────────────┘

💎 ADVANCED MASTERY (Months 7-12)
┌─────────────────────────────────────────────────────────────┐
│ 5. INNOVATION & LEADERSHIP                                  │
│    • Creative problem solving                               │
│    • Industry innovation                                    │
│    • Thought leadership                                     │
│    • Strategic thinking                                     │
│                                                             │
│    Learning Time: 100+ hours                                │
│    Difficulty: ⭐⭐⭐⭐⭐                                    │
│    Priority: LOW                                             │
└─────────────────────────────────────────────────────────────┘

📚 RECOMMENDED LEARNING RESOURCES

Free Resources:
• Online tutorials and documentation
• Open-source projects and repositories
• Community forums and discussions
• YouTube educational channels
• Podcast series and webinars

Paid Resources:
• Professional certification programs
• Online course platforms
• Industry conferences and workshops
• Mentorship programs
• Specialized training bootcamps

🛠️ PRACTICAL PROJECTS
Beginner Level:
• Personal portfolio projects
• Tutorial-based implementations
• Simple automation scripts
• Basic problem-solving exercises

Intermediate Level:
• Real client/business projects
• Open-source contributions
• Team collaboration projects
• Technology integration challenges

Advanced Level:
• Innovation and research projects
• Industry consultation work
• Teaching and mentoring others
• Publishing and thought leadership

📊 SKILL TRACKING METRICS
Progress Indicators:
✓ Conceptual understanding (0-100%)
✓ Practical application ability (0-100%)
✓ Problem-solving efficiency (0-100%)
✓ Teaching/explaining capability (0-100%)
✓ Innovation and creativity (0-100%)

Milestone Checkpoints:
□ Month 1: Basic competency
□ Month 3: Practical proficiency
□ Month 6: Advanced application
□ Month 12: Expert-level mastery

🎯 PERSONALIZED LEARNING PATH
Your customized journey based on current interests and goals.

This AI-generated skill development plan provides a structured approach to mastering your chosen field with measurable progress indicators.`;

      setSkills(mockSkills);
    } catch (error) {
      console.error('Skills generation error:', error);
      setSkills('Error generating skill recommendations. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(skills);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([skills], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `skill-plan-${Date.now()}.txt`;
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
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">AI Skill Generator</h1>
              <p className="text-slate-400">Generate personalized skill development plans</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Learning Goals
              </h2>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what you want to learn, your current skill level, career goals, or areas of interest..."
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
                    Generating Skills...
                  </>
                ) : (
                  <>
                    <Brain className="w-5 h-5" />
                    Generate Skill Plan
                  </>
                )}
              </button>
            </div>

            {/* Skills Tips */}
            <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Planning Tips</h3>
              <ul className="text-slate-400 space-y-2">
                <li>• Specify your current experience level</li>
                <li>• Include career goals and timeline</li>
                <li>• Mention preferred learning styles</li>
                <li>• Add any specific technologies or domains</li>
              </ul>
            </div>
          </div>

          {/* Output Section */}
          <div className="space-y-6">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Skill Development Plan</h2>
                {skills && (
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
                {skills ? (
                  <div className="p-4 bg-slate-900/50 border border-slate-600 rounded-lg">
                    <pre className="text-slate-300 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                      {skills}
                    </pre>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-600 rounded-lg">
                    <div className="text-center">
                      <Brain className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                      <p className="text-slate-400">Your personalized skill plan will appear here</p>
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
            Full Gemini integration for advanced skill assessment, personalized learning paths,
            progress tracking, and career guidance recommendations.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AISkillGenerator;