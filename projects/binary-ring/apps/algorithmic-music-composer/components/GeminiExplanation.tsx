
import React, { useState, useEffect } from 'react';
import { getExplanationForMethod } from '../services/geminiService';

interface GeminiExplanationProps {
  methodName: string;
}

// Simple markdown to HTML renderer
const Markdown: React.FC<{ content: string }> = ({ content }) => {
    const htmlContent = content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
        .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
        .replace(/`([^`]+)`/g, '<code class="bg-gray-700 rounded-sm px-1 py-0.5 font-mono text-sm">$1</code>') // Inline code
        .replace(/^- (.*$)/gm, '<li class="ml-4">$1</li>') // List items
        .replace(/(<li.*>[\s\S]*?<\/li>)/g, '<ul>$1</ul>') // Wrap lists
        .replace(/\n/g, '<br />'); // Newlines

    return <div className="prose-invert prose-p:text-gray-300 prose-strong:text-white" dangerouslySetInnerHTML={{ __html: htmlContent }} />;
};


export const GeminiExplanation: React.FC<GeminiExplanationProps> = ({ methodName }) => {
  const [explanation, setExplanation] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchExplanation = async () => {
      setIsLoading(true);
      setExplanation('');
      const result = await getExplanationForMethod(methodName);
      setExplanation(result);
      setIsLoading(false);
    };

    fetchExplanation();
  }, [methodName]);

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 h-full">
      <h3 className="text-lg font-semibold text-white mb-4">What is {methodName}?</h3>
      <div className="text-gray-300 space-y-4">
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-700 rounded w-5/6"></div>
            <div className="h-4 bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
          </div>
        ) : (
          <Markdown content={explanation} />
        )}
      </div>
    </div>
  );
};
