/**
 * Point4Brand Products API
 * Provides search, filtering, and recommendation services for merchandise
 */

class Point4BrandAPI {
    constructor() {
        this.catalog = null;
        this.taxonomy = null;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        try {
            // Load catalog and taxonomy data
            const [catalogResponse, taxonomyResponse] = await Promise.all([
                fetch('/point4brand/catalog.json'),
                fetch('/point4brand/keywords/taxonomy.json')
            ]);

            this.catalog = await catalogResponse.json();
            this.taxonomy = await taxonomyResponse.json();
            this.initialized = true;

            console.log('Point4Brand API initialized');
        } catch (error) {
            console.error('Failed to initialize Point4Brand API:', error);
        }
    }

    // Get all products with optional filtering
    getProducts(filters = {}) {
        if (!this.initialized) throw new Error('API not initialized');

        let allProducts = [];

        // Flatten all products from collections
        Object.keys(this.catalog.collections).forEach(collectionKey => {
            const collection = this.catalog.collections[collectionKey];
            collection.items.forEach(product => {
                allProducts.push({
                    ...product,
                    collection: collectionKey,
                    collectionName: collection.name
                });
            });
        });

        // Apply filters
        if (filters.category) {
            allProducts = allProducts.filter(p => p.category === filters.category);
        }

        if (filters.collection) {
            allProducts = allProducts.filter(p => p.collection === filters.collection);
        }

        if (filters.priceMin !== undefined) {
            allProducts = allProducts.filter(p => p.price >= filters.priceMin);
        }

        if (filters.priceMax !== undefined) {
            allProducts = allProducts.filter(p => p.price <= filters.priceMax);
        }

        if (filters.keywords && filters.keywords.length > 0) {
            allProducts = allProducts.filter(product => {
                return filters.keywords.some(keyword =>
                    product.keywords && product.keywords.includes(keyword)
                );
            });
        }

        if (filters.badges && filters.badges.length > 0) {
            allProducts = allProducts.filter(product => {
                return filters.badges.some(badge =>
                    product.badges && product.badges.includes(badge)
                );
            });
        }

        return allProducts;
    }

    // Search products by text query
    searchProducts(query, filters = {}) {
        if (!this.initialized) throw new Error('API not initialized');

        const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
        let allProducts = this.getProducts(filters);

        if (searchTerms.length === 0) return allProducts;

        return allProducts.filter(product => {
            const searchText = [
                product.name,
                product.description,
                ...(product.keywords || []),
                product.collection,
                product.collectionName,
                product.category
            ].join(' ').toLowerCase();

            return searchTerms.every(term => searchText.includes(term));
        });
    }

    // Get product by ID
    getProduct(productId) {
        if (!this.initialized) throw new Error('API not initialized');

        const products = this.getProducts();
        return products.find(p => p.id === productId);
    }

    // Get recommendations based on user keywords
    getRecommendations(userKeywords = [], currentProductId = null) {
        if (!this.initialized) throw new Error('API not initialized');

        const products = this.getProducts();
        const recommendations = [];

        products.forEach(product => {
            if (currentProductId && product.id === currentProductId) return;

            let score = 0;
            let matchedKeywords = [];

            // Score based on keyword matching
            if (product.keywords) {
                product.keywords.forEach(productKeyword => {
                    if (userKeywords.includes(productKeyword)) {
                        score += 10;
                        matchedKeywords.push(productKeyword);
                    }

                    // Check for related concepts in taxonomy
                    const categoryKey = this.findKeywordCategory(productKeyword);
                    if (categoryKey) {
                        const keywordData = this.taxonomy.categories[categoryKey].keywords[productKeyword];
                        if (keywordData && keywordData.relatedConcepts) {
                            keywordData.relatedConcepts.forEach(relatedConcept => {
                                if (userKeywords.includes(relatedConcept)) {
                                    score += 5;
                                    matchedKeywords.push(relatedConcept);
                                }
                            });
                        }
                    }
                });
            }

            // Boost popular products
            if (product.badges && product.badges.includes('bestseller')) {
                score += 3;
            }

            // Boost new products slightly
            if (product.badges && product.badges.includes('new')) {
                score += 2;
            }

            if (score > 0) {
                recommendations.push({
                    product,
                    score,
                    matchedKeywords: [...new Set(matchedKeywords)],
                    matchPercentage: Math.min(100, Math.round((score / 20) * 100))
                });
            }
        });

        // Sort by score descending
        recommendations.sort((a, b) => b.score - a.score);

        return recommendations.slice(0, 6); // Return top 6 recommendations
    }

    // Find which category a keyword belongs to
    findKeywordCategory(keyword) {
        for (const [categoryKey, categoryData] of Object.entries(this.taxonomy.categories)) {
            if (categoryData.keywords && categoryData.keywords[keyword]) {
                return categoryKey;
            }
        }
        return null;
    }

    // Get keyword suggestions for search
    getKeywordSuggestions(query) {
        if (!this.initialized) throw new Error('API not initialized');

        const suggestions = [];
        const queryLower = query.toLowerCase();

        // Search through taxonomy keywords
        Object.values(this.taxonomy.categories).forEach(category => {
            if (category.keywords) {
                Object.entries(category.keywords).forEach(([keyword, data]) => {
                    if (keyword.toLowerCase().includes(queryLower)) {
                        suggestions.push({
                            keyword,
                            definition: data.definition,
                            category: category.displayName,
                            popularityScore: data.popularityScore || 50
                        });
                    }

                    // Also search in related concepts
                    if (data.relatedConcepts) {
                        data.relatedConcepts.forEach(concept => {
                            if (concept.toLowerCase().includes(queryLower)) {
                                suggestions.push({
                                    keyword: concept,
                                    definition: `Related to ${keyword}`,
                                    category: category.displayName,
                                    popularityScore: (data.popularityScore || 50) - 10
                                });
                            }
                        });
                    }
                });
            }
        });

        // Remove duplicates and sort by popularity
        const unique = suggestions.filter((item, index, arr) =>
            arr.findIndex(other => other.keyword === item.keyword) === index
        );

        return unique.sort((a, b) => b.popularityScore - a.popularityScore);
    }

    // Get statistics
    getStats() {
        if (!this.initialized) throw new Error('API not initialized');

        const products = this.getProducts();
        const collections = Object.keys(this.catalog.collections);
        const categories = [...new Set(products.map(p => p.category))];
        const keywords = [...new Set(products.flatMap(p => p.keywords || []))];

        return {
            totalProducts: products.length,
            totalCollections: collections.length,
            totalCategories: categories.length,
            totalKeywords: keywords.length,
            averagePrice: products.reduce((sum, p) => sum + p.price, 0) / products.length,
            priceRange: {
                min: Math.min(...products.map(p => p.price)),
                max: Math.max(...products.map(p => p.price))
            }
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Point4BrandAPI;
}

// Global instance for browser use
if (typeof window !== 'undefined') {
    window.Point4BrandAPI = Point4BrandAPI;
}