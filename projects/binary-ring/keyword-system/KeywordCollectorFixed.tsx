import React, { useState, useEffect } from 'react';

// Simple types for debugging
interface Keyword {
  id: string;
  keyword: string;
  category_name?: string;
  definition?: string;
  popularity_score?: number;
  related_concepts?: string[];
}

interface UserKeyword {
  id: string;
  keyword: Keyword;
  source?: string;
  context?: string;
  strength: number;
  collected_at: string;
}

// Mock service for debugging without Supabase
class MockKeywordService {
  private userKeywords: Set<string>;
  private mockKeywords: Keyword[];

  constructor() {
    this.userKeywords = new Set(JSON.parse(localStorage.getItem('br_keywords') || '[]'));
    this.mockKeywords = [
      {
        id: '1',
        keyword: 'audio-reactive',
        category_name: 'Audio',
        definition: 'Visual elements that respond to sound input',
        popularity_score: 85
      },
      {
        id: '2',
        keyword: 'particle-systems',
        category_name: 'Visual',
        definition: 'Simulation of many small objects for visual effects',
        popularity_score: 72
      },
      {
        id: '3',
        keyword: 'generative-art',
        category_name: 'Creative',
        definition: 'Art created through algorithmic processes',
        popularity_score: 90
      },
      {
        id: '4',
        keyword: 'real-time',
        category_name: 'Interactive',
        definition: 'Processing that happens without noticeable delay',
        popularity_score: 78
      },
      {
        id: '5',
        keyword: 'mindfulness',
        category_name: 'Wellness',
        definition: 'Present-moment awareness practice',
        popularity_score: 65
      }
    ];
  }

  async searchKeywords(term: string): Promise<Keyword[]> {
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay

    return this.mockKeywords.filter(k =>
      k.keyword.toLowerCase().includes(term.toLowerCase()) ||
      (k.definition && k.definition.toLowerCase().includes(term.toLowerCase()))
    );
  }

  async addKeyword(keyword: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200));

    this.userKeywords.add(keyword);
    localStorage.setItem('br_keywords', JSON.stringify([...this.userKeywords]));
  }

  async removeKeyword(keyword: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200));

    this.userKeywords.delete(keyword);
    localStorage.setItem('br_keywords', JSON.stringify([...this.userKeywords]));
  }

  getUserKeywords(): UserKeyword[] {
    return [...this.userKeywords].map(keyword => ({
      id: keyword,
      keyword: this.mockKeywords.find(k => k.keyword === keyword) || {
        id: keyword,
        keyword,
        category_name: 'Unknown'
      },
      source: 'manual',
      strength: 5,
      collected_at: new Date().toISOString()
    }));
  }

  hasKeyword(keyword: string): boolean {
    return this.userKeywords.has(keyword);
  }

  getRecommendations(): Array<{title: string, description: string, match: number}> {
    const keywords = [...this.userKeywords];
    const recs = [];

    if (keywords.includes('audio-reactive') || keywords.includes('particle-systems')) {
      recs.push({
        title: 'Sonic Sculptor',
        description: 'Real-time audio-visual particle effects',
        match: 95
      });
    }

    if (keywords.includes('generative-art')) {
      recs.push({
        title: 'AI Art Generator',
        description: 'Create algorithmic art with AI assistance',
        match: 87
      });
    }

    if (keywords.includes('mindfulness')) {
      recs.push({
        title: 'Kosmos Journey',
        description: 'Mindful exploration through cosmic visualization',
        match: 82
      });
    }

    return recs;
  }
}

const KeywordCollectorFixed: React.FC = () => {
  const [userKeywords, setUserKeywords] = useState<UserKeyword[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Keyword[]>([]);
  const [recommendations, setRecommendations] = useState<Array<{title: string, description: string, match: number}>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [service] = useState(() => new MockKeywordService());

  // Load initial data
  useEffect(() => {
    try {
      setUserKeywords(service.getUserKeywords());
      setRecommendations(service.getRecommendations());
      setError(null);
    } catch (err) {
      setError(`Failed to load keywords: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [service]);

  // Update recommendations when keywords change
  useEffect(() => {
    setRecommendations(service.getRecommendations());
  }, [userKeywords, service]);

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (!value.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await service.searchKeywords(value);
      setSearchResults(results);
    } catch (err) {
      setError(`Search failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addKeyword = async (keyword: Keyword) => {
    if (service.hasKeyword(keyword.keyword)) {
      return; // Already collected
    }

    setIsLoading(true);
    setError(null);

    try {
      await service.addKeyword(keyword.keyword);
      setUserKeywords(service.getUserKeywords());
      setSearchTerm('');
      setSearchResults([]);
    } catch (err) {
      setError(`Failed to add keyword: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const removeKeyword = async (keyword: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await service.removeKeyword(keyword);
      setUserKeywords(service.getUserKeywords());
    } catch (err) {
      setError(`Failed to remove keyword: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '2rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: '#0a0a0a',
      color: '#ffffff',
      minHeight: '100vh'
    }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{
          fontSize: '2.5rem',
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '1rem'
        }}>
          🏷️ Keyword Collection System
        </h1>
        <p style={{ color: '#b0b0b0', fontSize: '1.2rem' }}>
          Collect keywords that interest you and get personalized recommendations
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid #ef4444',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '2rem',
          color: '#ef4444'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Search Section */}
      <div style={{
        background: '#1a1a1a',
        borderRadius: '12px',
        padding: '2rem',
        marginBottom: '2rem',
        border: '1px solid #333'
      }}>
        <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
          <input
            type="text"
            placeholder="Search for keywords to add..."
            value={searchTerm}
            onChange={handleSearch}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '1rem 1.5rem',
              background: '#2a2a2a',
              border: '1px solid #404040',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '1.1rem',
              outline: 'none'
            }}
          />
          {isLoading && (
            <div style={{
              position: 'absolute',
              right: '1rem',
              top: '50%',
              transform: 'translateY(-50%)'
            }}>
              🔍
            </div>
          )}
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div style={{ borderTop: '1px solid #333', paddingTop: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', color: '#e0e0e0' }}>Found Keywords:</h3>
            {searchResults.map((keyword) => (
              <div key={keyword.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                background: '#2a2a2a',
                borderRadius: '8px',
                marginBottom: '0.5rem'
              }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                    {keyword.keyword}
                  </span>
                  {keyword.category_name && (
                    <span style={{
                      background: '#4f46e5',
                      color: 'white',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      marginLeft: '1rem'
                    }}>
                      {keyword.category_name}
                    </span>
                  )}
                  {keyword.definition && (
                    <p style={{ color: '#b0b0b0', fontSize: '0.9rem', margin: '0.5rem 0 0 0' }}>
                      {keyword.definition}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => addKeyword(keyword)}
                  disabled={service.hasKeyword(keyword.keyword) || isLoading}
                  style={{
                    background: service.hasKeyword(keyword.keyword) ? '#555' : '#10b981',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    cursor: service.hasKeyword(keyword.keyword) ? 'not-allowed' : 'pointer',
                    fontWeight: '500'
                  }}
                >
                  {service.hasKeyword(keyword.keyword) ? '✓ Collected' : '+ Add'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Collected Keywords */}
      <div style={{
        background: '#1a1a1a',
        borderRadius: '12px',
        padding: '2rem',
        marginBottom: '2rem',
        border: '1px solid #333'
      }}>
        <h3 style={{ marginBottom: '1.5rem', color: '#e0e0e0' }}>
          Your Keywords ({userKeywords.length})
        </h3>

        {userKeywords.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏷️</div>
            <h4 style={{ color: '#b0b0b0', marginBottom: '1rem' }}>No keywords collected yet</h4>
            <p>Search for keywords above to start building your interest profile.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '1rem'
          }}>
            {userKeywords.map((userKeyword) => (
              <div key={userKeyword.id} style={{
                background: '#2a2a2a',
                border: '1px solid #404040',
                borderRadius: '8px',
                padding: '1rem'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.5rem'
                }}>
                  <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                    {userKeyword.keyword.keyword}
                  </span>
                  <button
                    onClick={() => removeKeyword(userKeyword.keyword.keyword)}
                    disabled={isLoading}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      fontSize: '1.2rem',
                      cursor: 'pointer',
                      padding: '0.25rem'
                    }}
                  >
                    ×
                  </button>
                </div>

                {userKeyword.keyword.category_name && (
                  <span style={{
                    background: '#4f46e5',
                    color: 'white',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '12px',
                    fontSize: '0.8rem'
                  }}>
                    {userKeyword.keyword.category_name}
                  </span>
                )}

                {userKeyword.source && (
                  <div style={{ color: '#888', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                    Source: {userKeyword.source}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div style={{
          background: '#1a1a1a',
          borderRadius: '12px',
          padding: '2rem',
          border: '1px solid #333'
        }}>
          <h3 style={{ marginBottom: '1.5rem', color: '#e0e0e0' }}>
            🎯 Recommended for You
          </h3>

          <div style={{ display: 'grid', gap: '1rem' }}>
            {recommendations.map((rec, index) => (
              <div key={index} style={{
                background: '#2a2a2a',
                border: '1px solid #404040',
                borderRadius: '8px',
                padding: '1.5rem'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.5rem'
                }}>
                  <h4 style={{ margin: 0, color: '#fff' }}>{rec.title}</h4>
                  <span style={{
                    background: '#10b981',
                    color: 'white',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '8px',
                    fontSize: '0.8rem'
                  }}>
                    {rec.match}% match
                  </span>
                </div>
                <p style={{ color: '#b0b0b0', margin: '0.5rem 0 1rem 0' }}>
                  {rec.description}
                </p>
                <button style={{
                  background: '#4f46e5',
                  color: 'white',
                  border: 'none',
                  padding: '0.6rem 1.2rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}>
                  View Project
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default KeywordCollectorFixed;