/**
 * Point4Brand Integration Module
 * Connects the unified point4brand system with the keyword collection system
 */

class Point4BrandIntegration {
    constructor() {
        this.keywordCollectionAPI = null;
        this.point4brandAPI = null;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        try {
            // Load both APIs
            this.point4brandAPI = new Point4BrandAPI();
            await this.point4brandAPI.initialize();

            // Check if keyword collection system is available
            if (typeof MockKeywordService !== 'undefined') {
                this.keywordCollectionAPI = new MockKeywordService();
            }

            this.initialized = true;
            console.log('Point4Brand Integration initialized');
        } catch (error) {
            console.error('Failed to initialize Point4Brand Integration:', error);
        }
    }

    // Get personalized product recommendations based on collected keywords
    async getPersonalizedRecommendations(userKeywords = []) {
        if (!this.initialized) await this.initialize();

        // Get user keywords from the collection system if available
        if (this.keywordCollectionAPI && userKeywords.length === 0) {
            const userCollectedKeywords = this.keywordCollectionAPI.getUserKeywords();
            userKeywords = userCollectedKeywords.map(uk => uk.keyword.keyword);
        }

        if (userKeywords.length === 0) {
            // If no keywords, return popular products
            return this.point4brandAPI.getProducts()
                .filter(p => p.badges && p.badges.includes('bestseller'))
                .slice(0, 3);
        }

        // Get recommendations from Point4Brand API
        const recommendations = this.point4brandAPI.getRecommendations(userKeywords);

        return recommendations.map(rec => ({
            ...rec.product,
            matchPercentage: rec.matchPercentage,
            matchedKeywords: rec.matchedKeywords,
            recommendationReason: this.generateRecommendationReason(rec.matchedKeywords, rec.product)
        }));
    }

    // Automatically tag products based on user's collected keywords
    autoTagProducts(products, userKeywords = []) {
        return products.map(product => {
            const relevanceScore = this.calculateRelevanceScore(product, userKeywords);
            const matchedConcepts = this.findMatchedConcepts(product, userKeywords);

            return {
                ...product,
                personalRelevance: {
                    score: relevanceScore,
                    matchedConcepts: matchedConcepts,
                    recommended: relevanceScore > 50
                }
            };
        });
    }

    // Find related keywords for cross-promotion
    findRelatedKeywords(keyword) {
        const categoryKey = this.point4brandAPI.findKeywordCategory(keyword);
        if (!categoryKey) return [];

        const category = this.point4brandAPI.taxonomy.categories[categoryKey];
        const keywordData = category.keywords[keyword];

        if (!keywordData || !keywordData.relatedConcepts) return [];

        return keywordData.relatedConcepts.map(concept => ({
            keyword: concept,
            category: category.displayName,
            relation: 'related'
        }));
    }

    // Suggest keywords based on product views/interests
    suggestKeywordsFromProducts(productIds) {
        const suggestions = new Set();

        productIds.forEach(productId => {
            const product = this.point4brandAPI.getProduct(productId);
            if (product && product.keywords) {
                product.keywords.forEach(keyword => suggestions.add(keyword));
            }
        });

        return Array.from(suggestions).map(keyword => ({
            keyword,
            source: 'product-interest',
            definition: this.getKeywordDefinition(keyword),
            category: this.getKeywordCategory(keyword)
        }));
    }

    // Cross-promote products in the keyword collection interface
    getProductPromotions(selectedKeywords) {
        if (selectedKeywords.length === 0) return [];

        const recommendations = this.point4brandAPI.getRecommendations(selectedKeywords);

        return recommendations.slice(0, 3).map(rec => ({
            id: rec.product.id,
            name: rec.product.name,
            price: rec.product.price,
            matchPercentage: rec.matchPercentage,
            image: rec.product.assets?.primary || null,
            quickDescription: `${rec.matchPercentage}% match • ${rec.matchedKeywords.slice(0, 2).join(', ')}`,
            cta: 'View in Store'
        }));
    }

    // Sync keyword collection with product preferences
    syncWithKeywordCollection(productInteractions) {
        if (!this.keywordCollectionAPI) return;

        productInteractions.forEach(interaction => {
            const product = this.point4brandAPI.getProduct(interaction.productId);
            if (product && product.keywords) {
                product.keywords.forEach(keyword => {
                    // Add keyword to collection with context
                    this.keywordCollectionAPI.addKeyword(keyword, {
                        source: 'product-interaction',
                        context: `Interested in ${product.name}`,
                        strength: interaction.strength || 5
                    });
                });
            }
        });
    }

    // Private helper methods
    calculateRelevanceScore(product, userKeywords) {
        if (!product.keywords || userKeywords.length === 0) return 0;

        const matches = product.keywords.filter(keyword => userKeywords.includes(keyword));
        const relatedMatches = product.keywords.filter(keyword => {
            const related = this.findRelatedKeywords(keyword);
            return related.some(rel => userKeywords.includes(rel.keyword));
        });

        const directScore = (matches.length / product.keywords.length) * 70;
        const relatedScore = (relatedMatches.length / product.keywords.length) * 30;

        return Math.min(100, Math.round(directScore + relatedScore));
    }

    findMatchedConcepts(product, userKeywords) {
        if (!product.keywords) return [];

        const matched = [];

        product.keywords.forEach(keyword => {
            if (userKeywords.includes(keyword)) {
                matched.push({
                    keyword,
                    type: 'direct',
                    strength: 'high'
                });
            } else {
                const related = this.findRelatedKeywords(keyword);
                const relatedMatch = related.find(rel => userKeywords.includes(rel.keyword));
                if (relatedMatch) {
                    matched.push({
                        keyword,
                        type: 'related',
                        strength: 'medium',
                        through: relatedMatch.keyword
                    });
                }
            }
        });

        return matched;
    }

    generateRecommendationReason(matchedKeywords, product) {
        if (matchedKeywords.length === 0) return 'Popular product';

        if (matchedKeywords.length === 1) {
            return `Matches your interest in ${matchedKeywords[0]}`;
        }

        if (matchedKeywords.length === 2) {
            return `Combines ${matchedKeywords[0]} and ${matchedKeywords[1]}`;
        }

        return `Matches ${matchedKeywords.slice(0, 2).join(', ')} and ${matchedKeywords.length - 2} more interests`;
    }

    getKeywordDefinition(keyword) {
        const categoryKey = this.point4brandAPI.findKeywordCategory(keyword);
        if (!categoryKey) return 'Related to Binary Ring projects';

        const category = this.point4brandAPI.taxonomy.categories[categoryKey];
        const keywordData = category.keywords[keyword];

        return keywordData ? keywordData.definition : 'Part of the Binary Ring ecosystem';
    }

    getKeywordCategory(keyword) {
        const categoryKey = this.point4brandAPI.findKeywordCategory(keyword);
        if (!categoryKey) return 'General';

        return this.point4brandAPI.taxonomy.categories[categoryKey].displayName;
    }

    // Widget for embedding recommendations
    createRecommendationWidget(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const widget = document.createElement('div');
        widget.className = 'p4b-recommendation-widget';
        widget.innerHTML = `
            <div class="p4b-widget-header">
                <h3>🏷️ Recommended for You</h3>
                <p>Based on your keyword interests</p>
            </div>
            <div class="p4b-widget-content" id="${containerId}-content">
                <div class="loading">Loading recommendations...</div>
            </div>
            <div class="p4b-widget-footer">
                <a href="../point4brand/search-interface.html">View all products →</a>
            </div>
        `;

        container.appendChild(widget);

        // Load recommendations asynchronously
        this.loadWidgetRecommendations(`${containerId}-content`, options);
    }

    async loadWidgetRecommendations(contentId, options) {
        const contentElement = document.getElementById(contentId);
        if (!contentElement) return;

        try {
            const userKeywords = options.userKeywords || [];
            const recommendations = await this.getPersonalizedRecommendations(userKeywords);

            if (recommendations.length === 0) {
                contentElement.innerHTML = '<p>No recommendations available</p>';
                return;
            }

            const html = recommendations.slice(0, 3).map(product => `
                <div class="p4b-recommendation-item">
                    <div class="p4b-product-info">
                        <h4>${product.name}</h4>
                        <p class="p4b-brand">by point4brand</p>
                        <p class="p4b-price">$${product.price.toFixed(2)}</p>
                        ${product.matchPercentage ? `<p class="p4b-match">${product.matchPercentage}% match</p>` : ''}
                    </div>
                    <button onclick="window.open('../store/index.html#${product.id}', '_blank')" class="p4b-view-btn">
                        View Product
                    </button>
                </div>
            `).join('');

            contentElement.innerHTML = html;

        } catch (error) {
            console.error('Error loading recommendations:', error);
            contentElement.innerHTML = '<p>Error loading recommendations</p>';
        }
    }
}

// CSS for widgets
const widgetStyles = `
.p4b-recommendation-widget {
    background: rgba(26, 26, 26, 0.8);
    border: 1px solid #333;
    border-radius: 12px;
    padding: 1.5rem;
    margin: 1rem 0;
    font-family: system-ui, sans-serif;
}

.p4b-widget-header h3 {
    margin: 0 0 0.5rem 0;
    color: #e0e0e0;
}

.p4b-widget-header p {
    margin: 0 0 1rem 0;
    color: #b0b0b0;
    font-size: 0.9rem;
}

.p4b-recommendation-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: rgba(42, 42, 42, 0.5);
    border-radius: 8px;
    margin: 0.5rem 0;
}

.p4b-product-info h4 {
    margin: 0 0 0.25rem 0;
    color: #fff;
    font-size: 1rem;
}

.p4b-brand {
    margin: 0;
    color: #4f46e5;
    font-size: 0.8rem;
}

.p4b-price {
    margin: 0;
    color: #10b981;
    font-weight: bold;
}

.p4b-match {
    margin: 0;
    color: #f59e0b;
    font-size: 0.8rem;
}

.p4b-view-btn {
    background: #4f46e5;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.8rem;
}

.p4b-view-btn:hover {
    background: #3730a3;
}

.p4b-widget-footer {
    margin-top: 1rem;
    text-align: center;
}

.p4b-widget-footer a {
    color: #4f46e5;
    text-decoration: none;
    font-size: 0.9rem;
}
`;

// Inject styles
if (typeof document !== 'undefined' && !document.getElementById('p4b-widget-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'p4b-widget-styles';
    styleSheet.textContent = widgetStyles;
    document.head.appendChild(styleSheet);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Point4BrandIntegration;
}

// Global instance for browser use
if (typeof window !== 'undefined') {
    window.Point4BrandIntegration = Point4BrandIntegration;
}