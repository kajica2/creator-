// /Users/kajicadjuric/Documents/viral-hashtag-&-image-ai/projects/binary-ring/content/contentIntegration.js
// Content Integration Module - Integrates dynamic content system with existing gallery and community pages
// Used by: Gallery components, community pages, and any component that needs dynamic content with neural connections

import { contentAPI } from './contentAPI.js';

// Performance optimization utilities
class PerformanceOptimizer {
  constructor() {
    this.intersectionObserver = null;
    this.loadQueue = new Set();
    this.batchSize = 10;
    this.loadDelay = 100;
  }

  // Lazy loading with Intersection Observer
  initLazyLoading(container) {
    if (!this.intersectionObserver) {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const element = entry.target;
              const contentId = element.dataset.contentId;

              if (contentId && !element.dataset.loaded) {
                element.dataset.loaded = 'true';
                this.loadQueue.add(contentId);
                this.processBatch();
              }
            }
          });
        },
        {
          root: container,
          rootMargin: '50px',
          threshold: 0.1
        }
      );
    }

    return this.intersectionObserver;
  }

  async processBatch() {
    const batch = Array.from(this.loadQueue).slice(0, this.batchSize);
    this.loadQueue.clear();

    if (batch.length === 0) return;

    try {
      const loadPromises = batch.map(contentId =>
        contentAPI.getContentById(contentId).catch(error => {
          console.warn(`Failed to load content ${contentId}:`, error);
          return null;
        })
      );

      const results = await Promise.all(loadPromises);

      results.forEach((content, index) => {
        if (content) {
          this.renderContentItem(batch[index], content);
        }
      });
    } catch (error) {
      console.error('Batch processing error:', error);
    }
  }

  renderContentItem(contentId, content) {
    const element = document.querySelector(`[data-content-id="${contentId}"]`);
    if (element && element.dataset.loaded === 'true') {
      const event = new CustomEvent('contentLoaded', {
        detail: { contentId, content }
      });
      element.dispatchEvent(event);
    }
  }

  // Debounced search for better performance
  createDebouncedSearch(callback, delay = 300) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => callback.apply(this, args), delay);
    };
  }

  // Virtual scrolling for large lists
  createVirtualScroller(container, itemHeight, renderItem) {
    let scrollTop = 0;
    let containerHeight = container.clientHeight;
    let visibleStart = 0;
    let visibleEnd = 0;

    const updateVisibleRange = () => {
      visibleStart = Math.floor(scrollTop / itemHeight);
      visibleEnd = Math.min(
        visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
        this.totalItems
      );
    };

    const render = () => {
      container.innerHTML = '';

      for (let i = visibleStart; i < visibleEnd; i++) {
        const item = renderItem(i);
        if (item) {
          item.style.transform = `translateY(${i * itemHeight}px)`;
          item.style.position = 'absolute';
          item.style.width = '100%';
          container.appendChild(item);
        }
      }
    };

    container.addEventListener('scroll', () => {
      scrollTop = container.scrollTop;
      updateVisibleRange();
      render();
    });

    window.addEventListener('resize', () => {
      containerHeight = container.clientHeight;
      updateVisibleRange();
      render();
    });

    return { updateVisibleRange, render };
  }
}

// CDN Integration for media files
class CDNManager {
  constructor() {
    this.cdnBaseUrl = 'https://cdn.yourapp.com'; // Configure your CDN
    this.cache = new Map();
    this.optimizationSettings = {
      imageQuality: 85,
      imageFormat: 'webp',
      thumbnailSizes: [150, 300, 600, 1200]
    };
  }

  // Generate optimized image URLs
  getOptimizedImageUrl(originalUrl, options = {}) {
    const {
      width,
      height,
      quality = this.optimizationSettings.imageQuality,
      format = this.optimizationSettings.imageFormat
    } = options;

    const params = new URLSearchParams();
    if (width) params.append('w', width);
    if (height) params.append('h', height);
    params.append('q', quality);
    params.append('f', format);

    return `${this.cdnBaseUrl}/transform?url=${encodeURIComponent(originalUrl)}&${params}`;
  }

  // Generate responsive image set
  generateResponsiveImageSet(originalUrl) {
    return this.optimizationSettings.thumbnailSizes.map(size => ({
      url: this.getOptimizedImageUrl(originalUrl, { width: size }),
      width: size
    }));
  }

  // Preload critical images
  preloadImages(urls, priority = 'low') {
    urls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      link.fetchPriority = priority;
      document.head.appendChild(link);
    });
  }
}

// Real-time content synchronization
class RealTimeSync {
  constructor() {
    this.subscriptions = new Map();
    this.listeners = new Map();
    this.syncQueue = new Set();
    this.syncDelay = 1000; // 1 second delay for batching updates
  }

  // Subscribe to content updates for a specific component
  subscribe(componentId, contentFilters, callback) {
    const subscription = contentAPI.subscribeToContentUpdates((payload) => {
      // Filter updates based on component requirements
      if (this.matchesFilters(payload, contentFilters)) {
        this.syncQueue.add({ componentId, payload });
        this.processSyncQueue();
      }
    }, contentFilters);

    this.subscriptions.set(componentId, subscription);
    this.listeners.set(componentId, callback);

    return () => this.unsubscribe(componentId);
  }

  unsubscribe(componentId) {
    const subscription = this.subscriptions.get(componentId);
    if (subscription) {
      contentAPI.unsubscribeFromUpdates(subscription);
      this.subscriptions.delete(componentId);
      this.listeners.delete(componentId);
    }
  }

  matchesFilters(payload, filters) {
    if (!filters) return true;

    const { tool, personaId, hashtags } = filters;

    if (tool && payload.new?.tool !== tool) return false;
    if (personaId && payload.new?.persona_id !== personaId) return false;
    if (hashtags && !hashtags.some(tag =>
      payload.new?.hashtags?.includes(tag)
    )) return false;

    return true;
  }

  processSyncQueue() {
    setTimeout(() => {
      const updates = Array.from(this.syncQueue);
      this.syncQueue.clear();

      // Group updates by component
      const groupedUpdates = updates.reduce((acc, { componentId, payload }) => {
        if (!acc[componentId]) acc[componentId] = [];
        acc[componentId].push(payload);
        return acc;
      }, {});

      // Notify components
      Object.entries(groupedUpdates).forEach(([componentId, payloads]) => {
        const callback = this.listeners.get(componentId);
        if (callback) {
          callback(payloads);
        }
      });
    }, this.syncDelay);
  }
}

// Main Content Integration Class
export class ContentIntegration {
  constructor() {
    this.optimizer = new PerformanceOptimizer();
    this.cdn = new CDNManager();
    this.realTimeSync = new RealTimeSync();
    this.cache = new Map();
    this.defaultLanguage = 'en';
  }

  // Enhanced Gallery Integration
  async enhanceGallery(galleryElement, options = {}) {
    const {
      personaId = null,
      tools = null,
      tags = [],
      limit = 50,
      enableLazyLoading = true,
      enableRealTime = true,
      layout = 'grid', // 'grid', 'masonry', 'carousel'
      showConnections = true
    } = options;

    try {
      // Load gallery content
      const content = await contentAPI.getAllContent({
        language: this.defaultLanguage,
        includeRelated: showConnections,
        limit: limit * 2 // Load extra for filtering
      });

      // Filter content based on options
      let filteredContent = content;

      if (personaId) {
        filteredContent = filteredContent.filter(item => item.personaId === personaId);
      }

      if (tools) {
        const toolArray = Array.isArray(tools) ? tools : [tools];
        filteredContent = filteredContent.filter(item => toolArray.includes(item.tool));
      }

      if (tags.length > 0) {
        filteredContent = filteredContent.filter(item =>
          tags.some(tag => item.hashtags.includes(tag))
        );
      }

      // Limit results
      filteredContent = filteredContent.slice(0, limit);

      // Setup gallery
      this.setupGalleryLayout(galleryElement, filteredContent, layout, options);

      // Setup lazy loading
      if (enableLazyLoading) {
        this.setupLazyLoading(galleryElement);
      }

      // Setup real-time updates
      if (enableRealTime) {
        this.setupGalleryRealTime(galleryElement, { personaId, tools, tags });
      }

      // Setup neural connections visualization
      if (showConnections) {
        this.setupNeuralConnections(galleryElement, filteredContent);
      }

      return filteredContent;

    } catch (error) {
      console.error('Error enhancing gallery:', error);
      this.showErrorState(galleryElement, 'Failed to load gallery content');
      return [];
    }
  }

  setupGalleryLayout(container, content, layout, options) {
    container.className = `gallery-container gallery-${layout}`;

    // Add CSS for different layouts
    if (!document.getElementById('gallery-styles')) {
      this.injectGalleryStyles();
    }

    switch (layout) {
      case 'grid':
        this.renderGridGallery(container, content, options);
        break;
      case 'masonry':
        this.renderMasonryGallery(container, content, options);
        break;
      case 'carousel':
        this.renderCarouselGallery(container, content, options);
        break;
      default:
        this.renderGridGallery(container, content, options);
    }
  }

  renderGridGallery(container, content, options) {
    const { itemsPerRow = 3, showMetadata = true } = options;

    container.innerHTML = `
      <div class="gallery-grid" style="grid-template-columns: repeat(${itemsPerRow}, 1fr);">
        ${content.map(item => this.renderGalleryItem(item, { showMetadata, layout: 'grid' })).join('')}
      </div>
    `;
  }

  renderMasonryGallery(container, content, options) {
    const { columns = 3, showMetadata = true } = options;

    // Create column containers
    const columnContainers = Array.from({ length: columns }, () => []);

    // Distribute items across columns
    content.forEach((item, index) => {
      const columnIndex = index % columns;
      columnContainers[columnIndex].push(item);
    });

    container.innerHTML = `
      <div class="gallery-masonry">
        ${columnContainers.map(columnItems => `
          <div class="masonry-column">
            ${columnItems.map(item => this.renderGalleryItem(item, { showMetadata, layout: 'masonry' })).join('')}
          </div>
        `).join('')}
      </div>
    `;
  }

  renderCarouselGallery(container, content, options) {
    const { showMetadata = true, autoPlay = false } = options;

    container.innerHTML = `
      <div class="gallery-carousel">
        <div class="carousel-track">
          ${content.map(item => this.renderGalleryItem(item, { showMetadata, layout: 'carousel' })).join('')}
        </div>
        <button class="carousel-btn prev" onclick="this.parentElement.querySelector('.carousel-track').scrollBy({left: -300, behavior: 'smooth'})">&larr;</button>
        <button class="carousel-btn next" onclick="this.parentElement.querySelector('.carousel-track').scrollBy({left: 300, behavior: 'smooth'})">&rarr;</button>
      </div>
    `;

    if (autoPlay) {
      this.setupCarouselAutoPlay(container.querySelector('.carousel-track'));
    }
  }

  renderGalleryItem(item, options = {}) {
    const { showMetadata = true, layout = 'grid' } = options;

    // Extract preview content based on type
    const preview = this.generateContentPreview(item);

    return `
      <div class="gallery-item"
           data-content-id="${item.id}"
           data-persona-id="${item.personaId}"
           data-tool="${item.tool}">
        <div class="item-preview">
          ${preview}
        </div>
        ${showMetadata ? `
          <div class="item-metadata">
            <div class="item-title">${item.personaName} - ${item.tool}</div>
            <div class="item-meta">
              <span class="item-type">${item.type}</span>
              <span class="item-date">${new Date(item.timestamp).toLocaleDateString()}</span>
            </div>
            ${item.hashtags.length > 0 ? `
              <div class="item-tags">
                ${item.hashtags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join('')}
              </div>
            ` : ''}
          </div>
        ` : ''}
        <div class="item-actions">
          <button class="action-btn" onclick="contentIntegration.viewContent('${item.id}')">View</button>
          <button class="action-btn secondary" onclick="contentIntegration.showConnections('${item.id}')">Connections</button>
        </div>
        ${item.relatedContent && item.relatedContent.length > 0 ? `
          <div class="connection-indicator" title="${item.relatedContent.length} connections">
            🧠 ${item.relatedContent.length}
          </div>
        ` : ''}
      </div>
    `;
  }

  generateContentPreview(item) {
    switch (item.type) {
      case 'Text-to-Image':
        // Handle image content
        const imageUrl = typeof item.content === 'object' ? item.content.imageUrl : item.content;
        if (imageUrl) {
          const optimizedUrl = this.cdn.getOptimizedImageUrl(imageUrl, { width: 300 });
          return `<img src="${optimizedUrl}" alt="Generated image" class="preview-image" loading="lazy">`;
        }
        break;

      case 'AI Story':
        const storyContent = typeof item.content === 'object' ? item.content.story : item.content;
        return `<div class="preview-text">${this.truncateText(storyContent, 150)}</div>`;

      case 'Website Strategy':
        const strategy = typeof item.content === 'object' ? item.content.mainGoal : item.content;
        return `<div class="preview-strategy">${this.truncateText(strategy, 100)}</div>`;

      case 'AI Concept':
        const concept = typeof item.content === 'object' ? item.content.concept : item.content;
        return `<div class="preview-concept">${this.truncateText(concept, 120)}</div>`;

      default:
        return `<div class="preview-generic">${this.truncateText(JSON.stringify(item.content), 100)}</div>`;
    }
  }

  truncateText(text, maxLength) {
    if (typeof text !== 'string') text = String(text);
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  // Setup real-time updates for gallery
  setupGalleryRealTime(container, filters) {
    const unsubscribe = this.realTimeSync.subscribe(
      `gallery-${Date.now()}`,
      filters,
      (updates) => {
        this.handleGalleryUpdates(container, updates);
      }
    );

    // Store cleanup function
    container.dataset.cleanup = container.dataset.cleanup || '[]';
    const cleanupFunctions = JSON.parse(container.dataset.cleanup);
    cleanupFunctions.push(unsubscribe);
    container.dataset.cleanup = JSON.stringify(cleanupFunctions);
  }

  handleGalleryUpdates(container, updates) {
    updates.forEach(update => {
      switch (update.eventType) {
        case 'INSERT':
          this.addGalleryItem(container, update.new);
          break;
        case 'UPDATE':
          this.updateGalleryItem(container, update.new);
          break;
        case 'DELETE':
          this.removeGalleryItem(container, update.old.id);
          break;
      }
    });
  }

  addGalleryItem(container, newContent) {
    const galleryGrid = container.querySelector('.gallery-grid, .masonry-column, .carousel-track');
    if (galleryGrid) {
      const itemHtml = this.renderGalleryItem(newContent);
      galleryGrid.insertAdjacentHTML('afterbegin', itemHtml);

      // Animate new item
      const newItem = galleryGrid.firstElementChild;
      newItem.style.opacity = '0';
      newItem.style.transform = 'scale(0.8)';
      setTimeout(() => {
        newItem.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        newItem.style.opacity = '1';
        newItem.style.transform = 'scale(1)';
      }, 10);
    }
  }

  updateGalleryItem(container, updatedContent) {
    const existingItem = container.querySelector(`[data-content-id="${updatedContent.id}"]`);
    if (existingItem) {
      const newItemHtml = this.renderGalleryItem(updatedContent);
      existingItem.outerHTML = newItemHtml;
    }
  }

  removeGalleryItem(container, contentId) {
    const item = container.querySelector(`[data-content-id="${contentId}"]`);
    if (item) {
      item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      item.style.opacity = '0';
      item.style.transform = 'scale(0.8)';
      setTimeout(() => item.remove(), 300);
    }
  }

  // Neural connections visualization
  setupNeuralConnections(container, content) {
    // Create connections overlay
    const overlay = document.createElement('div');
    overlay.className = 'neural-connections-overlay';
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
    `;

    container.style.position = 'relative';
    container.appendChild(overlay);

    // Add hover events to gallery items
    container.querySelectorAll('.gallery-item').forEach(item => {
      item.addEventListener('mouseenter', () => {
        const contentId = item.dataset.contentId;
        this.highlightConnections(overlay, contentId, content);
      });

      item.addEventListener('mouseleave', () => {
        this.clearConnectionHighlights(overlay);
      });
    });
  }

  highlightConnections(overlay, contentId, allContent) {
    const sourceContent = allContent.find(item => item.id === contentId);
    if (!sourceContent || !sourceContent.relatedContent) return;

    overlay.innerHTML = '';

    sourceContent.relatedContent.forEach(connection => {
      const targetElement = document.querySelector(`[data-content-id="${connection.id}"]`);
      const sourceElement = document.querySelector(`[data-content-id="${contentId}"]`);

      if (targetElement && sourceElement) {
        const line = this.createConnectionLine(sourceElement, targetElement, connection);
        overlay.appendChild(line);
      }
    });
  }

  createConnectionLine(sourceElement, targetElement, connection) {
    const sourceRect = sourceElement.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();
    const containerRect = sourceElement.closest('.gallery-container').getBoundingClientRect();

    const line = document.createElement('div');
    line.className = `connection-line connection-${connection.type}`;

    const x1 = sourceRect.left + sourceRect.width / 2 - containerRect.left;
    const y1 = sourceRect.top + sourceRect.height / 2 - containerRect.top;
    const x2 = targetRect.left + targetRect.width / 2 - containerRect.left;
    const y2 = targetRect.top + targetRect.height / 2 - containerRect.top;

    const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

    line.style.cssText = `
      position: absolute;
      left: ${x1}px;
      top: ${y1}px;
      width: ${length}px;
      height: 2px;
      background: linear-gradient(90deg, #667eea, #764ba2);
      transform: rotate(${angle}deg);
      transform-origin: 0 50%;
      opacity: ${connection.weight};
      animation: connectionPulse 2s infinite;
    `;

    return line;
  }

  clearConnectionHighlights(overlay) {
    overlay.innerHTML = '';
  }

  // Enhanced search functionality
  createSearchInterface(container, options = {}) {
    const {
      placeholder = 'Search content...',
      filters = true,
      suggestions = true,
      onResults = null
    } = options;

    const searchHTML = `
      <div class="search-interface">
        <div class="search-box">
          <input type="text" class="search-input" placeholder="${placeholder}">
          <button class="search-btn">🔍</button>
        </div>
        ${filters ? `
          <div class="search-filters">
            <select class="filter-select" data-filter="tool">
              <option value="">All Tools</option>
              <option value="AI Story">AI Story</option>
              <option value="Text-to-Image">Text-to-Image</option>
              <option value="Website Strategy">Website Strategy</option>
              <option value="AI Concept">AI Concept</option>
            </select>
            <select class="filter-select" data-filter="persona">
              <option value="">All Personas</option>
            </select>
            <input type="text" class="filter-input" data-filter="tags" placeholder="Tags...">
          </div>
        ` : ''}
        ${suggestions ? `
          <div class="search-suggestions" style="display: none;"></div>
        ` : ''}
      </div>
    `;

    container.innerHTML = searchHTML;

    // Setup search functionality
    const searchInput = container.querySelector('.search-input');
    const debouncedSearch = this.optimizer.createDebouncedSearch(async (query) => {
      await this.performSearch(container, query, options);
    });

    searchInput.addEventListener('input', (e) => {
      debouncedSearch(e.target.value);
      if (suggestions) {
        this.showSearchSuggestions(container, e.target.value);
      }
    });

    // Setup filter functionality
    if (filters) {
      container.querySelectorAll('.filter-select, .filter-input').forEach(filter => {
        filter.addEventListener('change', () => {
          this.updateSearchFilters(container);
        });
      });
    }

    return container;
  }

  async performSearch(container, query, options) {
    try {
      const filters = this.getSearchFilters(container);
      const results = await contentAPI.searchContent(query, {
        language: this.defaultLanguage,
        ...filters,
        limit: 20
      });

      if (options.onResults) {
        options.onResults(results, query, filters);
      }

      // Update search results UI
      this.displaySearchResults(container, results, query);

    } catch (error) {
      console.error('Search error:', error);
      this.showErrorState(container, 'Search failed');
    }
  }

  getSearchFilters(container) {
    const filters = {};

    container.querySelectorAll('.filter-select').forEach(select => {
      if (select.value) {
        filters[select.dataset.filter] = select.value;
      }
    });

    container.querySelectorAll('.filter-input').forEach(input => {
      if (input.value.trim()) {
        const filterType = input.dataset.filter;
        if (filterType === 'tags') {
          filters.tags = input.value.split(',').map(tag => tag.trim()).filter(Boolean);
        } else {
          filters[filterType] = input.value.trim();
        }
      }
    });

    return filters;
  }

  // Project suggestions integration
  async getProjectSuggestions(personaId, tool, limit = 5) {
    try {
      const suggestions = await contentAPI.getProjectSuggestions(personaId, tool, limit);
      return suggestions;
    } catch (error) {
      console.error('Error getting project suggestions:', error);
      return [];
    }
  }

  renderSuggestions(container, suggestions) {
    const suggestionsHTML = `
      <div class="project-suggestions">
        <h3>Suggested Projects</h3>
        <div class="suggestions-list">
          ${suggestions.map(suggestion => `
            <div class="suggestion-card" data-confidence="${suggestion.confidence}">
              <div class="suggestion-title">${suggestion.title}</div>
              <div class="suggestion-description">${suggestion.description}</div>
              <div class="suggestion-tags">
                ${(suggestion.suggestedTags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
              </div>
              <div class="suggestion-confidence">
                Confidence: ${Math.round((suggestion.confidence || 0) * 100)}%
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    container.innerHTML = suggestionsHTML;
  }

  // Utility methods
  showErrorState(container, message) {
    container.innerHTML = `
      <div class="error-state">
        <div class="error-icon">⚠️</div>
        <div class="error-message">${message}</div>
        <button class="retry-btn" onclick="location.reload()">Retry</button>
      </div>
    `;
  }

  injectGalleryStyles() {
    const styles = `
      <style id="gallery-styles">
        .gallery-container {
          position: relative;
          width: 100%;
          min-height: 200px;
        }

        .gallery-grid {
          display: grid;
          gap: 20px;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        }

        .gallery-masonry {
          display: flex;
          gap: 20px;
        }

        .masonry-column {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .gallery-carousel {
          position: relative;
          overflow: hidden;
        }

        .carousel-track {
          display: flex;
          gap: 20px;
          overflow-x: auto;
          scroll-behavior: smooth;
          padding: 20px 0;
        }

        .carousel-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255, 255, 255, 0.9);
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          cursor: pointer;
          font-size: 18px;
          z-index: 2;
        }

        .carousel-btn.prev { left: 10px; }
        .carousel-btn.next { right: 10px; }

        .gallery-item {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          position: relative;
        }

        .gallery-item:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }

        .item-preview {
          width: 100%;
          height: 200px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f7fafc;
        }

        .preview-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .preview-text, .preview-strategy, .preview-concept, .preview-generic {
          padding: 20px;
          font-size: 14px;
          line-height: 1.5;
          color: #4a5568;
        }

        .item-metadata {
          padding: 16px;
        }

        .item-title {
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 8px;
        }

        .item-meta {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: #718096;
          margin-bottom: 12px;
        }

        .item-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .tag {
          background: #e2e8f0;
          color: #4a5568;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .item-actions {
          padding: 16px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          gap: 8px;
        }

        .action-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .action-btn:not(.secondary) {
          background: #667eea;
          color: white;
        }

        .action-btn.secondary {
          background: #e2e8f0;
          color: #4a5568;
        }

        .action-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .connection-indicator {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(102, 126, 234, 0.9);
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .connection-line {
          pointer-events: none;
        }

        @keyframes connectionPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        .connection-strong { opacity: 0.9; }
        .connection-medium { opacity: 0.7; }
        .connection-weak { opacity: 0.4; }

        .search-interface {
          margin-bottom: 24px;
        }

        .search-box {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
        }

        .search-input {
          flex: 1;
          padding: 12px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
        }

        .search-btn {
          padding: 12px 16px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
        }

        .search-filters {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .filter-select, .filter-input {
          padding: 8px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 14px;
        }

        .error-state {
          text-align: center;
          padding: 40px;
          color: #718096;
        }

        .error-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .error-message {
          margin-bottom: 16px;
          font-size: 16px;
        }

        .retry-btn {
          padding: 10px 20px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }

        .project-suggestions {
          margin-top: 24px;
        }

        .suggestions-list {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        }

        .suggestion-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .suggestion-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .suggestion-title {
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 8px;
        }

        .suggestion-description {
          color: #4a5568;
          font-size: 14px;
          margin-bottom: 12px;
        }

        .suggestion-confidence {
          font-size: 12px;
          color: #718096;
          margin-top: 12px;
        }

        @media (max-width: 768px) {
          .gallery-grid {
            grid-template-columns: 1fr;
          }

          .gallery-masonry {
            flex-direction: column;
          }

          .search-filters {
            flex-direction: column;
          }

          .suggestions-list {
            grid-template-columns: 1fr;
          }
        }
      </style>
    `;

    document.head.insertAdjacentHTML('beforeend', styles);
  }

  // Public methods for external use
  async viewContent(contentId) {
    try {
      const content = await contentAPI.getContentById(contentId, this.defaultLanguage);
      if (content) {
        this.openContentViewer(content);
      }
    } catch (error) {
      console.error('Error viewing content:', error);
    }
  }

  async showConnections(contentId) {
    try {
      const connections = await contentAPI.getRelatedContent(contentId, 10);
      this.openConnectionsViewer(contentId, connections);
    } catch (error) {
      console.error('Error showing connections:', error);
    }
  }

  openContentViewer(content) {
    // Create and show content viewer modal
    const modal = document.createElement('div');
    modal.className = 'content-viewer-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    `;

    modal.innerHTML = `
      <div class="content-viewer" style="background: white; border-radius: 12px; max-width: 800px; max-height: 80vh; overflow-y: auto; padding: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
          <h2>${content.personaName} - ${content.tool}</h2>
          <button onclick="this.closest('.content-viewer-modal').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
        </div>
        <div style="margin-bottom: 16px;">
          <strong>Type:</strong> ${content.type}
        </div>
        <div style="margin-bottom: 16px;">
          <strong>Created:</strong> ${new Date(content.timestamp).toLocaleString()}
        </div>
        ${content.hashtags.length > 0 ? `
          <div style="margin-bottom: 16px;">
            <strong>Tags:</strong> ${content.hashtags.map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
        ` : ''}
        <div style="border-top: 1px solid #e2e8f0; padding-top: 16px;">
          <strong>Content:</strong>
          <div style="margin-top: 8px; padding: 16px; background: #f7fafc; border-radius: 8px;">
            ${typeof content.content === 'string' ? content.content : JSON.stringify(content.content, null, 2)}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  openConnectionsViewer(contentId, connections) {
    // Similar implementation for connections viewer
    console.log(`Showing connections for ${contentId}:`, connections);
  }

  // Cleanup method
  cleanup(container) {
    // Cleanup real-time subscriptions
    if (container.dataset.cleanup) {
      const cleanupFunctions = JSON.parse(container.dataset.cleanup);
      cleanupFunctions.forEach(cleanup => {
        if (typeof cleanup === 'function') cleanup();
      });
    }

    // Cleanup intersection observers
    if (this.optimizer.intersectionObserver) {
      this.optimizer.intersectionObserver.disconnect();
    }
  }
}

// Export singleton instance
export const contentIntegration = new ContentIntegration();

// Make it available globally for onclick handlers
if (typeof window !== 'undefined') {
  window.contentIntegration = contentIntegration;
}

export default contentIntegration;