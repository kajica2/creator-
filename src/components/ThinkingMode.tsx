import React, { useState } from 'react';
import { Brain, ArrowLeft, Sparkles, MessageSquare, Lightbulb, Target, Zap, Clock, ChevronDown, ChevronRight, Copy, Download } from 'lucide-react';

interface ThinkingModeProps {
  onBack?: () => void;
  onNavigate?: (page: string) => void;
}

interface ThoughtStep {
  id: string;
  type: 'analysis' | 'reasoning' | 'conclusion' | 'question';
  content: string;
  confidence: number;
  timestamp: string;
}

interface ThinkingSession {
  id: string;
  query: string;
  steps: ThoughtStep[];
  finalAnswer: string;
  status: 'thinking' | 'completed' | 'failed';
  startTime: string;
  duration?: number;
}

export function ThinkingMode({ onBack }: ThinkingModeProps) {
  const [query, setQuery] = useState('');
  const [currentSession, setCurrentSession] = useState<ThinkingSession | null>(null);
  const [sessions, setSessions] = useState<ThinkingSession[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [thinkingDepth, setThinkingDepth] = useState(3);
  const [focusArea, setFocusArea] = useState('general');

  const focusAreas = [
    { id: 'general', name: 'General Reasoning', desc: 'Broad analytical thinking' },
    { id: 'creative', name: 'Creative Problem Solving', desc: 'Innovative and artistic approaches' },
    { id: 'logical', name: 'Logical Analysis', desc: 'Step-by-step logical reasoning' },
    { id: 'strategic', name: 'Strategic Planning', desc: 'Long-term planning and strategy' },
    { id: 'technical', name: 'Technical Analysis', desc: 'Technical and scientific reasoning' },
    { id: 'ethical', name: 'Ethical Reasoning', desc: 'Moral and ethical considerations' }
  ];

  const startThinking = async () => {
    if (!query.trim()) return;

    const newSession: ThinkingSession = {
      id: Date.now().toString(),
      query: query.trim(),
      steps: [],
      finalAnswer: '',
      status: 'thinking',
      startTime: new Date().toLocaleTimeString()
    };

    setCurrentSession(newSession);
    setSessions(prev => [newSession, ...prev]);
    setIsThinking(true);

    try {
      // Simulate thinking process with steps
      const thinkingSteps = await simulateThinkingProcess(query.trim(), thinkingDepth, focusArea);

      const updatedSession: ThinkingSession = {
        ...newSession,
        steps: thinkingSteps,
        finalAnswer: generateFinalAnswer(thinkingSteps, query.trim()),
        status: 'completed',
        duration: Math.floor(Math.random() * 15000 + 5000) // 5-20 seconds
      };

      setCurrentSession(updatedSession);
      setSessions(prev => prev.map(s => s.id === newSession.id ? updatedSession : s));

    } catch (error) {
      console.error('Thinking error:', error);
      const failedSession = { ...newSession, status: 'failed' as const };
      setCurrentSession(failedSession);
      setSessions(prev => prev.map(s => s.id === newSession.id ? failedSession : s));
    } finally {
      setIsThinking(false);
    }
  };

  const simulateThinkingProcess = async (question: string, depth: number, area: string): Promise<ThoughtStep[]> => {
    const steps: ThoughtStep[] = [];
    const stepTypes = ['analysis', 'reasoning', 'conclusion', 'question'] as const;

    // Initial analysis
    await new Promise(resolve => setTimeout(resolve, 1000));
    steps.push({
      id: `step_${Date.now()}_1`,
      type: 'analysis',
      content: `Let me break down this question: "${question}". I need to consider multiple angles and approaches to provide a comprehensive response.`,
      confidence: 85,
      timestamp: new Date().toLocaleTimeString()
    });

    // Generate thinking steps based on depth
    for (let i = 2; i <= depth + 1; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));

      const stepType = stepTypes[Math.floor(Math.random() * stepTypes.length)];
      let content = '';
      let confidence = Math.floor(Math.random() * 30 + 70);

      switch (stepType) {
        case 'analysis':
          content = getAnalysisStep(question, area, i);
          break;
        case 'reasoning':
          content = getReasoningStep(question, area, i);
          break;
        case 'conclusion':
          content = getConclusionStep(question, area, i);
          break;
        case 'question':
          content = getQuestionStep(question, area, i);
          confidence -= 10; // Questions show uncertainty
          break;
      }

      steps.push({
        id: `step_${Date.now()}_${i}`,
        type: stepType,
        content,
        confidence,
        timestamp: new Date().toLocaleTimeString()
      });
    }

    // Final synthesis
    await new Promise(resolve => setTimeout(resolve, 1200));
    steps.push({
      id: `step_${Date.now()}_final`,
      type: 'conclusion',
      content: `Synthesizing all the above considerations, I can now formulate a comprehensive response that addresses the core question while acknowledging the complexity and nuances involved.`,
      confidence: 90,
      timestamp: new Date().toLocaleTimeString()
    });

    return steps;
  };

  const getAnalysisStep = (question: string, area: string, step: number): string => {
    const analysisTemplates = [
      `Analyzing the key components of this question, I identify several important factors that need consideration...`,
      `Breaking down the problem into smaller, manageable parts reveals underlying patterns and relationships...`,
      `Examining this from multiple perspectives helps uncover assumptions and potential biases in my reasoning...`,
      `The context and background of this question suggest there are both immediate and long-term implications to consider...`
    ];
    return analysisTemplates[step % analysisTemplates.length];
  };

  const getReasoningStep = (question: string, area: string, step: number): string => {
    const reasoningTemplates = [
      `Following a logical progression, if we accept the initial premises, then several conclusions naturally follow...`,
      `Using ${area === 'technical' ? 'technical principles' : area === 'creative' ? 'creative thinking methods' : 'logical reasoning'}, I can establish connections between different elements...`,
      `The evidence suggests a pattern that, when extended, leads to some interesting implications...`,
      `By applying systematic thinking, I can evaluate the strengths and weaknesses of different approaches...`
    ];
    return reasoningTemplates[step % reasoningTemplates.length];
  };

  const getConclusionStep = (question: string, area: string, step: number): string => {
    const conclusionTemplates = [
      `Based on the analysis so far, a preliminary conclusion emerges that addresses the core question...`,
      `The evidence points toward a solution that balances multiple competing factors and constraints...`,
      `Integrating all the considerations leads to an approach that is both practical and theoretically sound...`,
      `The most robust conclusion appears to be one that acknowledges uncertainty while providing actionable insights...`
    ];
    return conclusionTemplates[step % conclusionTemplates.length];
  };

  const getQuestionStep = (question: string, area: string, step: number): string => {
    const questionTemplates = [
      `But wait - should I also consider the potential unintended consequences of this approach?`,
      `This raises an important question: Are there alternative frameworks I should be applying here?`,
      `I wonder if there are cultural, ethical, or contextual factors I haven't fully explored yet?`,
      `Could there be a simpler solution that I'm overlooking due to overthinking the complexity?`
    ];
    return questionTemplates[step % questionTemplates.length];
  };

  const generateFinalAnswer = (steps: ThoughtStep[], question: string): string => {
    return `After careful consideration and analysis through ${steps.length} thinking steps, here's my comprehensive response:

The question "${question}" requires a multi-faceted approach that considers various dimensions and implications.

Key insights from my reasoning process:
• Complex problems benefit from systematic breakdown and analysis
• Multiple perspectives reveal hidden assumptions and biases
• The most robust solutions balance competing factors and constraints
• Acknowledging uncertainty is often more honest than false confidence

Final recommendation: ${getFinalRecommendation(question)}

This conclusion synthesizes the analytical steps while remaining adaptable to new information and changing circumstances.`;
  };

  const getFinalRecommendation = (question: string): string => {
    const recommendations = [
      "Consider a phased approach that allows for learning and adjustment along the way",
      "Focus on building robust frameworks that can adapt to changing conditions",
      "Prioritize solutions that address root causes rather than just symptoms",
      "Seek input from diverse perspectives to strengthen the final approach",
      "Design solutions with built-in feedback mechanisms for continuous improvement"
    ];
    return recommendations[Math.floor(Math.random() * recommendations.length)];
  };

  const toggleStepExpansion = (stepId: string) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };

  const copyThinkingProcess = () => {
    if (!currentSession) return;

    const content = `Thinking Process for: "${currentSession.query}"
Duration: ${currentSession.duration ? `${Math.floor(currentSession.duration / 1000)}s` : 'In progress'}
Started: ${currentSession.startTime}

Thinking Steps:
${currentSession.steps.map((step, index) =>
  `${index + 1}. [${step.type.toUpperCase()}] (${step.confidence}% confidence)
${step.content}
`).join('\n')}

Final Answer:
${currentSession.finalAnswer}`;

    navigator.clipboard.writeText(content);
  };

  const exportSession = () => {
    if (!currentSession) return;

    const content = `AI Thinking Session Export
Generated: ${new Date().toLocaleString()}
Query: "${currentSession.query}"
Status: ${currentSession.status}
Duration: ${currentSession.duration ? `${Math.floor(currentSession.duration / 1000)} seconds` : 'In progress'}

=== THINKING PROCESS ===

${currentSession.steps.map((step, index) =>
  `Step ${index + 1}: ${step.type.toUpperCase()}
Time: ${step.timestamp}
Confidence: ${step.confidence}%
Content: ${step.content}

`).join('')}

=== FINAL ANSWER ===

${currentSession.finalAnswer}

Generated by Viral Hashtag & Image AI - Thinking Mode`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `thinking-session-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'analysis': return <Target className="w-4 h-4 text-blue-400" />;
      case 'reasoning': return <Lightbulb className="w-4 h-4 text-yellow-400" />;
      case 'conclusion': return <Zap className="w-4 h-4 text-green-400" />;
      case 'question': return <MessageSquare className="w-4 h-4 text-orange-400" />;
      default: return <Brain className="w-4 h-4 text-purple-400" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-400';
    if (confidence >= 60) return 'text-yellow-400';
    return 'text-orange-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 p-6">
      <div className="max-w-6xl mx-auto">
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
              <h1 className="text-3xl font-bold text-white">Thinking Mode</h1>
              <p className="text-slate-400">Advanced AI reasoning and analysis</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Panel */}
          <div className="space-y-6">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Ask Me Anything
              </h2>

              <div className="space-y-4">
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask a complex question that requires deep thinking and analysis..."
                  className="w-full h-32 p-4 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Focus Area
                  </label>
                  <select
                    value={focusArea}
                    onChange={(e) => setFocusArea(e.target.value)}
                    className="w-full p-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                  >
                    {focusAreas.map(area => (
                      <option key={area.id} value={area.id}>
                        {area.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-400 mt-1">
                    {focusAreas.find(a => a.id === focusArea)?.desc}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Thinking Depth: {thinkingDepth}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={thinkingDepth}
                    onChange={(e) => setThinkingDepth(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>Quick</span>
                    <span>Deep</span>
                  </div>
                </div>

                <button
                  onClick={startThinking}
                  disabled={!query.trim() || isThinking}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
                >
                  {isThinking ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Thinking...
                    </>
                  ) : (
                    <>
                      <Brain className="w-5 h-5" />
                      Start Thinking
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Session History */}
            {sessions.length > 0 && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Sessions</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {sessions.slice(0, 5).map(session => (
                    <button
                      key={session.id}
                      onClick={() => setCurrentSession(session)}
                      className={`w-full p-3 border rounded-lg text-left transition-colors ${
                        currentSession?.id === session.id
                          ? 'bg-purple-600/20 border-purple-500'
                          : 'bg-slate-900/50 border-slate-600 hover:bg-slate-700/50'
                      }`}
                    >
                      <p className="text-white text-sm line-clamp-1 mb-1">{session.query}</p>
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>{session.startTime}</span>
                        <span className={`px-1 py-0.5 rounded ${
                          session.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          session.status === 'thinking' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {session.status}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Thinking Process Display */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">
                  {currentSession ? 'Thinking Process' : 'No Active Session'}
                </h2>
                {currentSession && (
                  <div className="flex gap-2">
                    <button
                      onClick={copyThinkingProcess}
                      className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg transition-colors"
                      title="Copy thinking process"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={exportSession}
                      className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg transition-colors"
                      title="Export session"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {currentSession ? (
                <div className="space-y-6">
                  {/* Query Display */}
                  <div className="bg-slate-900/50 border border-slate-600 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-5 h-5 text-blue-400" />
                      <span className="font-medium text-white">Query</span>
                    </div>
                    <p className="text-slate-300">{currentSession.query}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Started: {currentSession.startTime}
                      </span>
                      {currentSession.duration && (
                        <span>Duration: {Math.floor(currentSession.duration / 1000)}s</span>
                      )}
                      <span className={`px-2 py-1 rounded ${
                        currentSession.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        currentSession.status === 'thinking' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {currentSession.status}
                      </span>
                    </div>
                  </div>

                  {/* Thinking Steps */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-yellow-400" />
                      Reasoning Steps ({currentSession.steps.length})
                    </h3>

                    {currentSession.steps.map((step, index) => (
                      <div
                        key={step.id}
                        className="bg-slate-900/50 border border-slate-600 rounded-lg overflow-hidden"
                      >
                        <button
                          onClick={() => toggleStepExpansion(step.id)}
                          className="w-full p-4 text-left hover:bg-slate-800/50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {expandedSteps.has(step.id) ?
                                <ChevronDown className="w-4 h-4 text-slate-400" /> :
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                              }
                              {getStepIcon(step.type)}
                              <span className="font-medium text-white capitalize">
                                Step {index + 1}: {step.type}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-sm ${getConfidenceColor(step.confidence)}`}>
                                {step.confidence}%
                              </span>
                              <span className="text-xs text-slate-400">{step.timestamp}</span>
                            </div>
                          </div>
                        </button>

                        {expandedSteps.has(step.id) && (
                          <div className="px-4 pb-4 border-t border-slate-600">
                            <p className="text-slate-300 leading-relaxed mt-3">{step.content}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Final Answer */}
                  {currentSession.finalAnswer && (
                    <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-lg p-6">
                      <h3 className="font-semibold text-white flex items-center gap-2 mb-4">
                        <Zap className="w-5 h-5 text-green-400" />
                        Final Answer
                      </h3>
                      <div className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {currentSession.finalAnswer}
                      </div>
                    </div>
                  )}

                  {/* Thinking in Progress */}
                  {isThinking && (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
                      <p className="text-slate-400">Deep thinking in progress...</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-96 flex items-center justify-center border-2 border-dashed border-slate-600 rounded-lg">
                  <div className="text-center">
                    <Brain className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-400 text-lg mb-2">Ready to think</p>
                    <p className="text-slate-500">Enter a question to start the AI reasoning process</p>
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
            Advanced reasoning models, collaborative thinking sessions, thought visualization,
            knowledge graph integration, and specialized reasoning for different domains.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ThinkingMode;