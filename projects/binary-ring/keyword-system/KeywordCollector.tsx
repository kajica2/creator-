import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Types
interface Keyword {
  id: string;
  keyword: string;
  category_name?: string;
  definition?: string;
  popularity_score: number;
  related_concepts: string[];
}

interface UserKeyword {
  id: string;
  keyword: Keyword;
  source: string;
  context?: string;
  strength: number;
  collected_at: string;
  last_accessed: string;
}

interface RecommendedContent {
  content_type: string;
  content_id: string;
  title: string;
  description: string;
  keywords: string[];
  match_score: number;
  recommendation_reason: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const KeywordCollector: React.FC = () => {
  const [userKeywords, setUserKeywords] = useState<UserKeyword[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Keyword[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendedContent[]>([]);
  const [userProfileId, setUserProfileId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Initialize user profile
  useEffect(() => {
    initializeUserProfile();
  }, []);

  // Load user keywords when profile is set
  useEffect(() => {
    if (userProfileId) {
      loadUserKeywords();
      loadRecommendations();
    }
  }, [userProfileId]);

  const initializeUserProfile = async () => {
    // Get or create user profile (session-based for now)
    let sessionId = localStorage.getItem('br_session_id');
    if (!sessionId) {
      sessionId = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('br_session_id', sessionId);
    }

    try {
      let { data: profile, error } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', sessionId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create it
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert([{ user_id: sessionId }])
          .select('id')
          .single();

        if (createError) throw createError;
        profile = newProfile;
      }

      if (profile) {
        setUserProfileId(profile.id);
      }
    } catch (error) {
      console.error('Error initializing user profile:', error);
    }
  };

  const loadUserKeywords = async () => {
    if (!userProfileId) return;

    try {
      const { data, error } = await supabase
        .from('user_keywords')
        .select(`
          *,
          keyword:keywords (
            id,
            keyword,
            definition,
            popularity_score,
            related_concepts,
            category:keyword_categories (name)
          )
        `)
        .eq('user_profile_id', userProfileId)
        .order('last_accessed', { ascending: false });

      if (error) throw error;
      setUserKeywords(data || []);
    } catch (error) {
      console.error('Error loading user keywords:', error);
    }
  };

  const searchKeywords = async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('search_keywords', { p_search_term: term, p_limit: 10 });

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching keywords:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addKeyword = async (keyword: Keyword, source: string = 'manual', context?: string) => {
    if (!userProfileId) return;

    try {
      const { error } = await supabase
        .rpc('add_user_keyword', {
          p_user_profile_id: userProfileId,
          p_keyword: keyword.keyword,
          p_source: source,
          p_context: context,
          p_strength: 5
        });

      if (error) throw error;

      // Refresh user keywords and recommendations
      loadUserKeywords();
      loadRecommendations();
    } catch (error) {
      console.error('Error adding keyword:', error);
    }
  };

  const removeKeyword = async (userKeywordId: string) => {
    try {
      const { error } = await supabase
        .from('user_keywords')
        .delete()
        .eq('id', userKeywordId);

      if (error) throw error;

      loadUserKeywords();
      loadRecommendations();
    } catch (error) {
      console.error('Error removing keyword:', error);
    }
  };

  const loadRecommendations = async () => {
    if (!userProfileId) return;

    try {
      const { data, error } = await supabase
        .rpc('get_user_recommendations', {
          p_user_profile_id: userProfileId,
          p_limit: 5
        });

      if (error) throw error;
      setRecommendations(data || []);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    searchKeywords(value);
  };

  const getKeywordsByCategory = () => {
    if (selectedCategory === 'all') return userKeywords;
    return userKeywords.filter(uk =>
      uk.keyword.category_name === selectedCategory
    );
  };

  const categories = Array.from(new Set(
    userKeywords.map(uk => uk.keyword.category_name).filter(Boolean)
  ));

  return (
    <div className="keyword-collector">
      <div className="collector-header">
        <h2>🏷️ My Keywords</h2>
        <p>Collect keywords that interest you and get personalized content recommendations</p>
      </div>

      {/* Search & Add Keywords */}
      <div className="search-section">
        <div className="search-input">
          <input
            type="text"
            placeholder="Search for keywords to add..."
            value={searchTerm}
            onChange={handleSearch}
            className="keyword-search"
          />
          {isLoading && <div className="search-spinner">🔍</div>}
        </div>

        {searchResults.length > 0 && (
          <div className="search-results">
            <h3>Found Keywords:</h3>
            {searchResults.map((keyword) => (
              <div key={keyword.id} className="keyword-result">
                <div className="keyword-info">
                  <span className="keyword-text">{keyword.keyword}</span>
                  {keyword.category_name && (
                    <span className="keyword-category">{keyword.category_name}</span>
                  )}
                  {keyword.definition && (
                    <p className="keyword-definition">{keyword.definition}</p>
                  )}
                </div>
                <button
                  onClick={() => addKeyword(keyword)}
                  className="add-keyword-btn"
                  disabled={userKeywords.some(uk => uk.keyword.id === keyword.id)}
                >
                  {userKeywords.some(uk => uk.keyword.id === keyword.id) ? '✓ Collected' : '+ Add'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category Filter */}
      <div className="category-filter">
        <button
          onClick={() => setSelectedCategory('all')}
          className={selectedCategory === 'all' ? 'active' : ''}
        >
          All ({userKeywords.length})
        </button>
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={selectedCategory === category ? 'active' : ''}
          >
            {category} ({userKeywords.filter(uk => uk.keyword.category_name === category).length})
          </button>
        ))}
      </div>

      {/* User's Keywords */}
      <div className="collected-keywords">
        <h3>Your Keywords ({getKeywordsByCategory().length})</h3>
        <div className="keywords-grid">
          {getKeywordsByCategory().map((userKeyword) => (
            <div key={userKeyword.id} className="user-keyword-card">
              <div className="keyword-header">
                <span className="keyword-name">{userKeyword.keyword.keyword}</span>
                <button
                  onClick={() => removeKeyword(userKeyword.id)}
                  className="remove-btn"
                  title="Remove keyword"
                >
                  ×
                </button>
              </div>

              {userKeyword.keyword.category_name && (
                <span className="keyword-category">
                  {userKeyword.keyword.category_name}
                </span>
              )}

              {userKeyword.source && (
                <div className="keyword-source">
                  Found in: <strong>{userKeyword.source}</strong>
                </div>
              )}

              {userKeyword.context && (
                <div className="keyword-context">{userKeyword.context}</div>
              )}

              <div className="keyword-strength">
                Interest: {'★'.repeat(Math.min(userKeyword.strength, 5))}
              </div>

              {userKeyword.keyword.related_concepts && userKeyword.keyword.related_concepts.length > 0 && (
                <div className="related-concepts">
                  Related: {userKeyword.keyword.related_concepts.slice(0, 3).join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Personalized Recommendations */}
      {recommendations.length > 0 && (
        <div className="recommendations">
          <h3>🎯 Recommended for You</h3>
          <div className="recommendations-list">
            {recommendations.map((rec, index) => (
              <div key={index} className="recommendation-card">
                <div className="rec-header">
                  <span className="rec-type">{rec.content_type}</span>
                  <span className="rec-score">
                    {Math.round(rec.match_score * 100)}% match
                  </span>
                </div>
                <h4 className="rec-title">{rec.title}</h4>
                <p className="rec-description">{rec.description}</p>
                <div className="rec-keywords">
                  {rec.keywords.map((keyword, i) => (
                    <span key={i} className="rec-keyword">{keyword}</span>
                  ))}
                </div>
                <p className="rec-reason">{rec.recommendation_reason}</p>
                <div className="rec-actions">
                  <button className="view-content-btn">
                    View {rec.content_type}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {userKeywords.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🏷️</div>
          <h3>Start Collecting Keywords</h3>
          <p>Search for keywords related to your interests and add them to your collection.
             We'll use them to recommend relevant content across the Binary Ring ecosystem.</p>
        </div>
      )}
    </div>
  );
};

export default KeywordCollector;