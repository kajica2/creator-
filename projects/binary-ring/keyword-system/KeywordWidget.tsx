import React, { useState, useEffect } from 'react';
import { keywordService } from './KeywordService';

interface KeywordWidgetProps {
  contentType?: string;
  contentId?: string;
  extractedKeywords?: string[];
  showRecommendations?: boolean;
  compact?: boolean;
  onKeywordCollect?: (keyword: string) => void;
}

const KeywordWidget: React.FC<KeywordWidgetProps> = ({
  contentType = 'page',
  contentId = 'unknown',
  extractedKeywords = [],
  showRecommendations = true,
  compact = false,
  onKeywordCollect
}) => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [userKeywords, setUserKeywords] = useState<Set<string>>(new Set());
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!compact);

  useEffect(() => {
    loadUserKeywords();
    if (extractedKeywords.length > 0) {
      loadSuggestions();
    }
    if (showRecommendations) {
      loadRecommendations();
    }
  }, [extractedKeywords]);

  const loadUserKeywords = async () => {
    try {
      const keywords = await keywordService.getUserKeywords();
      const keywordSet = new Set(keywords.map(uk => uk.keyword.keyword));
      setUserKeywords(keywordSet);
    } catch (error) {
      console.error('Error loading user keywords:', error);
    }
  };

  const loadSuggestions = async () => {
    try {
      const suggestions = [];

      for (const keyword of extractedKeywords.slice(0, 5)) {
        const results = await keywordService.searchKeywords(keyword, 1);
        if (results.length > 0) {
          suggestions.push(results[0]);
        }
      }

      setSuggestions(suggestions);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const loadRecommendations = async () => {
    try {
      const recs = await keywordService.getRecommendations(contentType, 3);
      setRecommendations(recs);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  };

  const handleCollectKeyword = async (keyword: string) => {
    setIsLoading(true);
    try {
      await keywordService.collectKeyword(
        keyword,
        `${contentType}:${contentId}`,
        `Collected from ${contentType}`,
        5
      );

      setUserKeywords(prev => new Set([...prev, keyword]));

      if (onKeywordCollect) {
        onKeywordCollect(keyword);
      }

      // Track interaction
      await keywordService.trackInteraction(contentType, contentId, 'keyword_collect', {
        keyword,
        source: 'widget'
      });

      // Refresh recommendations
      if (showRecommendations) {
        loadRecommendations();
      }
    } catch (error) {
      console.error('Error collecting keyword:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  if (compact && !isExpanded) {
    return (
      <div className="keyword-widget compact">
        <button onClick={toggleExpanded} className="expand-btn">
          🏷️ Keywords ({suggestions.length})
        </button>
      </div>
    );
  }

  return (
    <div className={`keyword-widget ${compact ? 'compact' : 'full'}`}>
      {compact && (
        <div className="widget-header">
          <span className="widget-title">🏷️ Keywords</span>
          <button onClick={toggleExpanded} className="collapse-btn">×</button>
        </div>
      )}

      {/* Keyword Suggestions */}
      {suggestions.length > 0 && (
        <div className="keyword-suggestions">
          <h4>Suggested Keywords</h4>
          <div className="keyword-list">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="keyword-suggestion">
                <div className="keyword-info">
                  <span className="keyword-name">{suggestion.keyword}</span>
                  {suggestion.category_name && (
                    <span className="keyword-category">{suggestion.category_name}</span>
                  )}
                </div>
                <button
                  onClick={() => handleCollectKeyword(suggestion.keyword)}
                  disabled={userKeywords.has(suggestion.keyword) || isLoading}
                  className={`collect-btn ${userKeywords.has(suggestion.keyword) ? 'collected' : ''}`}
                >
                  {userKeywords.has(suggestion.keyword) ? '✓' : '+'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="quick-actions">
        <button
          onClick={() => window.open('/keyword-collector', '_blank')}
          className="action-btn"
        >
          📚 View My Collection
        </button>
        <button
          onClick={loadRecommendations}
          className="action-btn"
        >
          🔍 Get Recommendations
        </button>
      </div>

      {/* Recommendations */}
      {showRecommendations && recommendations.length > 0 && (
        <div className="recommendations-preview">
          <h4>Recommended for You</h4>
          <div className="rec-list">
            {recommendations.map((rec, index) => (
              <div key={index} className="rec-item">
                <div className="rec-content">
                  <span className="rec-type">{rec.content_type}</span>
                  <span className="rec-title">{rec.title}</span>
                  <span className="rec-score">{Math.round(rec.match_score * 100)}%</span>
                </div>
                <button
                  onClick={() => window.open(rec.url, '_blank')}
                  className="view-btn"
                >
                  View
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .keyword-widget {
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 8px;
          padding: 1rem;
          color: #fff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          max-width: 350px;
        }

        .keyword-widget.compact {
          padding: 0.5rem;
        }

        .expand-btn {
          background: none;
          border: 1px solid #555;
          color: #ccc;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.3s;
        }

        .expand-btn:hover {
          border-color: #4f46e5;
          color: #4f46e5;
        }

        .widget-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #333;
        }

        .widget-title {
          font-weight: 600;
          color: #e0e0e0;
        }

        .collapse-btn {
          background: none;
          border: none;
          color: #888;
          font-size: 1.2rem;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
        }

        .keyword-suggestions {
          margin-bottom: 1rem;
        }

        .keyword-suggestions h4 {
          margin: 0 0 0.5rem 0;
          color: #e0e0e0;
          font-size: 0.9rem;
        }

        .keyword-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .keyword-suggestion {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem;
          background: #2a2a2a;
          border-radius: 6px;
        }

        .keyword-info {
          flex: 1;
        }

        .keyword-name {
          font-weight: 500;
          color: #fff;
          font-size: 0.9rem;
        }

        .keyword-category {
          display: block;
          color: #888;
          font-size: 0.7rem;
          margin-top: 0.2rem;
        }

        .collect-btn {
          background: #10b981;
          border: none;
          color: white;
          width: 28px;
          height: 28px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.8rem;
          transition: all 0.3s;
        }

        .collect-btn:hover:not(:disabled) {
          background: #059669;
        }

        .collect-btn:disabled {
          background: #555;
          cursor: not-allowed;
        }

        .collect-btn.collected {
          background: #4f46e5;
        }

        .quick-actions {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .action-btn {
          flex: 1;
          background: #333;
          border: 1px solid #555;
          color: #ccc;
          padding: 0.5rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.8rem;
          transition: all 0.3s;
        }

        .action-btn:hover {
          background: #444;
          border-color: #666;
        }

        .recommendations-preview {
          border-top: 1px solid #333;
          padding-top: 1rem;
        }

        .recommendations-preview h4 {
          margin: 0 0 0.5rem 0;
          color: #e0e0e0;
          font-size: 0.9rem;
        }

        .rec-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .rec-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem;
          background: #2a2a2a;
          border-radius: 6px;
        }

        .rec-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .rec-type {
          background: #7c3aed;
          color: white;
          padding: 0.1rem 0.4rem;
          border-radius: 10px;
          font-size: 0.7rem;
          font-weight: 500;
          align-self: flex-start;
        }

        .rec-title {
          font-weight: 500;
          color: #fff;
          font-size: 0.8rem;
        }

        .rec-score {
          color: #10b981;
          font-size: 0.7rem;
          font-weight: 500;
        }

        .view-btn {
          background: #4f46e5;
          border: none;
          color: white;
          padding: 0.4rem 0.8rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.8rem;
          transition: all 0.3s;
        }

        .view-btn:hover {
          background: #3730a3;
        }

        @media (max-width: 768px) {
          .keyword-widget {
            max-width: 100%;
          }

          .quick-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default KeywordWidget;