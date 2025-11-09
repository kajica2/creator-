/**
 * Binary Ring Store - E-commerce Functionality
 * Handles shopping cart, product filters, checkout flow, and payment processing
 */

class BinaryRingStore {
    constructor() {
        this.cart = this.loadCart();
        this.products = new Map();
        this.filters = {};
        this.isLoading = false;
        this.checkoutStep = 'cart';
        this.paymentMethods = ['stripe', 'paypal', 'crypto'];

        this.currency = {
            symbol: '$',
            code: 'USD',
            rate: 1
        };

        this.init();
    }

    async init() {
        try {
            await this.loadProducts();
            await this.initCart();
            await this.initProductGrid();
            await this.initFilters();
            await this.initCheckout();
            await this.initPaymentProcessing();
            await this.initWishlist();
            await this.initReviews();

            console.log('Binary Ring Store initialized successfully');
            this.emit('store:initialized');
        } catch (error) {
            console.error('Store initialization failed:', error);
            this.handleError(error);
        }
    }

    // Product Management
    async loadProducts() {
        this.showLoading('Loading products...');

        try {
            // In a real app, this would fetch from API/Supabase
            const products = await this.fetchProducts();

            products.forEach(product => {
                this.products.set(product.id, this.processProduct(product));
            });

            this.hideLoading();
            this.renderProducts();
        } catch (error) {
            this.hideLoading();
            throw error;
        }
    }

    async fetchProducts() {
        // Mock product data - replace with actual API call
        return [
            {
                id: 'buddhabrot-digital',
                name: 'Buddhabrot Digital Print',
                description: 'High-resolution digital download of the Buddhabrot fractal visualization',
                price: 25,
                originalPrice: 35,
                category: 'digital',
                type: 'fractal',
                difficulty: 'advanced',
                tags: ['fractal', 'mandelbrot', 'buddha', 'mathematical'],
                images: ['/assets/products/buddhabrot-1.jpg', '/assets/products/buddhabrot-2.jpg'],
                formats: ['PNG', 'SVG', 'PDF'],
                resolutions: ['4K', '8K', '16K'],
                licensing: ['personal', 'commercial'],
                featured: true,
                inStock: true,
                rating: 4.8,
                reviews: 124,
                downloadCount: 1250
            },
            {
                id: 'substrate-print',
                name: 'Substrate Physical Print',
                description: 'Museum-quality archival print of organic crack growth patterns',
                price: 145,
                category: 'physical',
                type: 'organic',
                difficulty: 'intermediate',
                tags: ['organic', 'growth', 'patterns', 'nature'],
                images: ['/assets/products/substrate-1.jpg'],
                sizes: ['12x18', '18x24', '24x36'],
                materials: ['canvas', 'paper', 'metal'],
                editions: ['limited', 'open'],
                featured: false,
                inStock: true,
                rating: 4.9,
                reviews: 78,
                shippingTime: '2-3 weeks'
            },
            {
                id: 'node-garden-interactive',
                name: 'Node Garden Interactive License',
                description: 'Commercial license for Node Garden algorithm with source code',
                price: 450,
                category: 'license',
                type: 'network',
                difficulty: 'expert',
                tags: ['network', 'interactive', 'algorithm', 'commercial'],
                images: ['/assets/products/node-garden-1.jpg'],
                includes: ['source-code', 'documentation', 'support'],
                licensing: ['commercial', 'redistribution'],
                featured: true,
                inStock: true,
                rating: 5.0,
                reviews: 12,
                complexity: 'high'
            }
        ];
    }

    processProduct(product) {
        return {
            ...product,
            priceFormatted: this.formatPrice(product.price),
            originalPriceFormatted: product.originalPrice ? this.formatPrice(product.originalPrice) : null,
            discount: product.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : 0,
            slug: this.generateSlug(product.name),
            availability: this.getAvailability(product),
            estimatedDelivery: this.getEstimatedDelivery(product)
        };
    }

    generateSlug(name) {
        return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    getAvailability(product) {
        if (!product.inStock) return 'out-of-stock';
        if (product.category === 'digital') return 'instant-download';
        if (product.shippingTime) return `ships-in-${product.shippingTime.replace(/[^0-9]/g, '')}-weeks`;
        return 'in-stock';
    }

    getEstimatedDelivery(product) {
        if (product.category === 'digital') return 'Instant download';
        if (product.shippingTime) return `Ships in ${product.shippingTime}`;
        return 'Ships in 1-2 weeks';
    }

    // Product Display
    renderProducts(filteredProducts = null) {
        const productGrid = document.querySelector('[data-product-grid]');
        if (!productGrid) return;

        const products = filteredProducts || Array.from(this.products.values());

        productGrid.innerHTML = products.map(product => this.createProductCard(product)).join('');

        // Initialize product interactions
        this.initProductInteractions();

        // Update product count
        this.updateProductCount(products.length);
    }

    createProductCard(product) {
        const discountBadge = product.discount > 0 ?
            `<div class="product-discount">-${product.discount}%</div>` : '';

        const featuredBadge = product.featured ?
            '<div class="product-featured">Featured</div>' : '';

        const availabilityClass = product.availability.replace(/[^a-z]/g, '-');

        return `
            <article class="product-card" data-product-id="${product.id}" data-product-card>
                <div class="product-image-container">
                    <img src="${product.images[0]}"
                         alt="${product.name}"
                         data-src="${product.images[0]}"
                         class="product-image"
                         loading="lazy">
                    ${discountBadge}
                    ${featuredBadge}

                    <div class="product-actions">
                        <button class="btn-icon wishlist-btn"
                                data-wishlist-toggle="${product.id}"
                                aria-label="Add to wishlist">
                            <svg>...</svg>
                        </button>
                        <button class="btn-icon quick-view-btn"
                                data-quick-view="${product.id}"
                                aria-label="Quick view">
                            <svg>...</svg>
                        </button>
                    </div>

                    <div class="product-gallery-indicators">
                        ${product.images.map((_, i) =>
                            `<button class="indicator ${i === 0 ? 'active' : ''}"
                                     data-image-index="${i}"></button>`
                        ).join('')}
                    </div>
                </div>

                <div class="product-info">
                    <div class="product-category">${product.category}</div>

                    <h3 class="product-title">
                        <a href="/product/${product.slug}" class="product-link">
                            ${product.name}
                        </a>
                    </h3>

                    <p class="product-description">${product.description}</p>

                    <div class="product-tags">
                        ${product.tags.slice(0, 3).map(tag =>
                            `<span class="tag" data-filter-tag="${tag}">${tag}</span>`
                        ).join('')}
                    </div>

                    <div class="product-rating">
                        <div class="rating-stars"
                             style="--rating: ${product.rating}">
                        </div>
                        <span class="rating-text">${product.rating} (${product.reviews})</span>
                    </div>

                    <div class="product-pricing">
                        ${product.originalPriceFormatted ?
                            `<span class="price-original">${product.originalPriceFormatted}</span>` :
                            ''
                        }
                        <span class="price-current">${product.priceFormatted}</span>
                    </div>

                    <div class="product-availability ${availabilityClass}">
                        ${product.estimatedDelivery}
                    </div>

                    <div class="product-actions-footer">
                        <button class="btn btn-primary add-to-cart-btn"
                                data-add-to-cart="${product.id}"
                                ${!product.inStock ? 'disabled' : ''}>
                            ${product.inStock ? 'Add to Cart' : 'Out of Stock'}
                        </button>

                        ${product.category === 'digital' ?
                            '<button class="btn btn-secondary preview-btn" data-preview="' + product.id + '">Preview</button>' :
                            '<button class="btn btn-secondary customize-btn" data-customize="' + product.id + '">Customize</button>'
                        }
                    </div>
                </div>
            </article>
        `;
    }

    initProductInteractions() {
        // Add to cart
        document.querySelectorAll('[data-add-to-cart]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.getAttribute('data-add-to-cart');
                this.addToCart(productId);
            });
        });

        // Wishlist toggle
        document.querySelectorAll('[data-wishlist-toggle]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = e.target.getAttribute('data-wishlist-toggle');
                this.toggleWishlist(productId);
            });
        });

        // Quick view
        document.querySelectorAll('[data-quick-view]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = e.target.getAttribute('data-quick-view');
                this.openQuickView(productId);
            });
        });

        // Image gallery
        this.initProductImageGallery();

        // Preview functionality
        document.querySelectorAll('[data-preview]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.getAttribute('data-preview');
                this.openPreview(productId);
            });
        });
    }

    initProductImageGallery() {
        document.querySelectorAll('.product-card').forEach(card => {
            const indicators = card.querySelectorAll('.indicator');
            const image = card.querySelector('.product-image');
            const productId = card.getAttribute('data-product-id');
            const product = this.products.get(productId);

            indicators.forEach((indicator, index) => {
                indicator.addEventListener('click', () => {
                    // Update active indicator
                    indicators.forEach(ind => ind.classList.remove('active'));
                    indicator.classList.add('active');

                    // Update image with fade effect
                    image.style.opacity = '0';
                    setTimeout(() => {
                        image.src = product.images[index];
                        image.style.opacity = '1';
                    }, 150);
                });
            });
        });
    }

    // Shopping Cart
    initCart() {
        this.updateCartUI();
        this.initCartEvents();
    }

    loadCart() {
        const saved = localStorage.getItem('br-cart');
        return saved ? JSON.parse(saved) : [];
    }

    saveCart() {
        localStorage.setItem('br-cart', JSON.stringify(this.cart));
        this.emit('cart:updated', { cart: this.cart });
    }

    addToCart(productId, options = {}) {
        const product = this.products.get(productId);
        if (!product || !product.inStock) return;

        const existingItem = this.cart.find(item =>
            item.productId === productId &&
            JSON.stringify(item.options) === JSON.stringify(options)
        );

        if (existingItem) {
            existingItem.quantity += options.quantity || 1;
        } else {
            this.cart.push({
                id: this.generateCartItemId(),
                productId,
                product,
                quantity: options.quantity || 1,
                options,
                addedAt: Date.now()
            });
        }

        this.saveCart();
        this.updateCartUI();
        this.showAddToCartFeedback(product);
        this.trackEvent('cart', 'add_item', { productId, price: product.price });
    }

    removeFromCart(itemId) {
        this.cart = this.cart.filter(item => item.id !== itemId);
        this.saveCart();
        this.updateCartUI();
        this.trackEvent('cart', 'remove_item', { itemId });
    }

    updateCartItemQuantity(itemId, quantity) {
        const item = this.cart.find(item => item.id === itemId);
        if (item) {
            if (quantity <= 0) {
                this.removeFromCart(itemId);
            } else {
                item.quantity = quantity;
                this.saveCart();
                this.updateCartUI();
            }
        }
    }

    getCartTotal() {
        return this.cart.reduce((total, item) => {
            return total + (item.product.price * item.quantity);
        }, 0);
    }

    getCartCount() {
        return this.cart.reduce((count, item) => count + item.quantity, 0);
    }

    updateCartUI() {
        this.updateCartCount();
        this.updateCartSidebar();
        this.updateCartPage();
    }

    updateCartCount() {
        const countElements = document.querySelectorAll('[data-cart-count]');
        const count = this.getCartCount();

        countElements.forEach(element => {
            element.textContent = count;
            element.style.display = count > 0 ? 'block' : 'none';
        });
    }

    updateCartSidebar() {
        const sidebar = document.querySelector('[data-cart-sidebar]');
        if (!sidebar) return;

        const itemsContainer = sidebar.querySelector('[data-cart-items]');
        const totalElement = sidebar.querySelector('[data-cart-total]');
        const emptyState = sidebar.querySelector('[data-cart-empty]');

        if (this.cart.length === 0) {
            itemsContainer.style.display = 'none';
            emptyState.style.display = 'block';
            totalElement.textContent = this.formatPrice(0);
            return;
        }

        itemsContainer.style.display = 'block';
        emptyState.style.display = 'none';

        itemsContainer.innerHTML = this.cart.map(item => this.createCartItemHTML(item)).join('');
        totalElement.textContent = this.formatPrice(this.getCartTotal());

        this.initCartItemEvents();
    }

    createCartItemHTML(item) {
        const optionsText = Object.entries(item.options)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');

        return `
            <div class="cart-item" data-cart-item="${item.id}">
                <div class="cart-item-image">
                    <img src="${item.product.images[0]}"
                         alt="${item.product.name}"
                         loading="lazy">
                </div>

                <div class="cart-item-info">
                    <h4 class="cart-item-title">${item.product.name}</h4>
                    ${optionsText ? `<div class="cart-item-options">${optionsText}</div>` : ''}

                    <div class="cart-item-controls">
                        <div class="quantity-control">
                            <button class="quantity-btn"
                                    data-quantity-decrease="${item.id}"
                                    aria-label="Decrease quantity">-</button>
                            <input type="number"
                                   class="quantity-input"
                                   value="${item.quantity}"
                                   min="1"
                                   data-quantity-input="${item.id}">
                            <button class="quantity-btn"
                                    data-quantity-increase="${item.id}"
                                    aria-label="Increase quantity">+</button>
                        </div>

                        <button class="remove-btn"
                                data-remove-item="${item.id}"
                                aria-label="Remove item">
                            Remove
                        </button>
                    </div>
                </div>

                <div class="cart-item-price">
                    ${this.formatPrice(item.product.price * item.quantity)}
                </div>
            </div>
        `;
    }

    initCartEvents() {
        // Cart toggle
        document.querySelectorAll('[data-cart-toggle]').forEach(toggle => {
            toggle.addEventListener('click', () => this.toggleCartSidebar());
        });

        // Cart sidebar overlay
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-cart-overlay]')) {
                this.closeCartSidebar();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeCartSidebar();
            }
        });
    }

    initCartItemEvents() {
        // Quantity controls
        document.querySelectorAll('[data-quantity-increase]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = e.target.getAttribute('data-quantity-increase');
                const item = this.cart.find(item => item.id === itemId);
                if (item) {
                    this.updateCartItemQuantity(itemId, item.quantity + 1);
                }
            });
        });

        document.querySelectorAll('[data-quantity-decrease]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = e.target.getAttribute('data-quantity-decrease');
                const item = this.cart.find(item => item.id === itemId);
                if (item) {
                    this.updateCartItemQuantity(itemId, item.quantity - 1);
                }
            });
        });

        document.querySelectorAll('[data-quantity-input]').forEach(input => {
            input.addEventListener('change', (e) => {
                const itemId = e.target.getAttribute('data-quantity-input');
                const quantity = parseInt(e.target.value) || 1;
                this.updateCartItemQuantity(itemId, quantity);
            });
        });

        // Remove items
        document.querySelectorAll('[data-remove-item]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = e.target.getAttribute('data-remove-item');
                this.removeFromCart(itemId);
            });
        });
    }

    toggleCartSidebar() {
        const sidebar = document.querySelector('[data-cart-sidebar]');
        if (sidebar) {
            const isOpen = sidebar.getAttribute('data-open') === 'true';
            sidebar.setAttribute('data-open', !isOpen);
            document.body.classList.toggle('cart-open', !isOpen);

            if (!isOpen) {
                this.trackEvent('cart', 'sidebar_open');
            }
        }
    }

    closeCartSidebar() {
        const sidebar = document.querySelector('[data-cart-sidebar]');
        if (sidebar) {
            sidebar.setAttribute('data-open', 'false');
            document.body.classList.remove('cart-open');
        }
    }

    showAddToCartFeedback(product) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'cart-toast';
        toast.innerHTML = `
            <div class="toast-content">
                <img src="${product.images[0]}" alt="${product.name}">
                <div>
                    <strong>${product.name}</strong>
                    <p>Added to cart</p>
                </div>
            </div>
            <button class="toast-close" aria-label="Close">×</button>
        `;

        document.body.appendChild(toast);

        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 300);
        }, 3000);

        // Manual close
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 300);
        });
    }

    // Product Filtering
    initFilters() {
        this.initFilterUI();
        this.initSearchFilter();
        this.initSortOptions();
        this.initPriceFilter();
    }

    initFilterUI() {
        // Category filters
        document.querySelectorAll('[data-filter-category]').forEach(filter => {
            filter.addEventListener('click', (e) => {
                const category = e.target.getAttribute('data-filter-category');
                this.toggleCategoryFilter(category);
                this.applyFilters();
            });
        });

        // Tag filters
        document.querySelectorAll('[data-filter-tag]').forEach(filter => {
            filter.addEventListener('click', (e) => {
                const tag = e.target.getAttribute('data-filter-tag');
                this.toggleTagFilter(tag);
                this.applyFilters();
            });
        });

        // Clear filters
        document.querySelectorAll('[data-clear-filters]').forEach(btn => {
            btn.addEventListener('click', () => this.clearFilters());
        });
    }

    toggleCategoryFilter(category) {
        if (!this.filters.categories) this.filters.categories = new Set();

        if (this.filters.categories.has(category)) {
            this.filters.categories.delete(category);
        } else {
            this.filters.categories.add(category);
        }

        this.updateFilterUI();
    }

    toggleTagFilter(tag) {
        if (!this.filters.tags) this.filters.tags = new Set();

        if (this.filters.tags.has(tag)) {
            this.filters.tags.delete(tag);
        } else {
            this.filters.tags.add(tag);
        }

        this.updateFilterUI();
    }

    updateFilterUI() {
        // Update active filter states
        document.querySelectorAll('[data-filter-category]').forEach(filter => {
            const category = filter.getAttribute('data-filter-category');
            const isActive = this.filters.categories?.has(category);
            filter.classList.toggle('active', isActive);
        });

        document.querySelectorAll('[data-filter-tag]').forEach(filter => {
            const tag = filter.getAttribute('data-filter-tag');
            const isActive = this.filters.tags?.has(tag);
            filter.classList.toggle('active', isActive);
        });

        // Update filter count
        const activeFilters = this.getActiveFilterCount();
        document.querySelectorAll('[data-filter-count]').forEach(element => {
            element.textContent = activeFilters;
            element.style.display = activeFilters > 0 ? 'block' : 'none';
        });
    }

    getActiveFilterCount() {
        let count = 0;
        if (this.filters.categories) count += this.filters.categories.size;
        if (this.filters.tags) count += this.filters.tags.size;
        if (this.filters.search) count += 1;
        if (this.filters.priceRange) count += 1;
        return count;
    }

    clearFilters() {
        this.filters = {};
        this.updateFilterUI();
        this.applyFilters();
        this.clearSearchInput();
        this.clearPriceFilter();
    }

    applyFilters() {
        let filtered = Array.from(this.products.values());

        // Apply category filter
        if (this.filters.categories && this.filters.categories.size > 0) {
            filtered = filtered.filter(product =>
                this.filters.categories.has(product.category)
            );
        }

        // Apply tag filter
        if (this.filters.tags && this.filters.tags.size > 0) {
            filtered = filtered.filter(product =>
                product.tags.some(tag => this.filters.tags.has(tag))
            );
        }

        // Apply search filter
        if (this.filters.search) {
            const searchTerm = this.filters.search.toLowerCase();
            filtered = filtered.filter(product =>
                product.name.toLowerCase().includes(searchTerm) ||
                product.description.toLowerCase().includes(searchTerm) ||
                product.tags.some(tag => tag.toLowerCase().includes(searchTerm))
            );
        }

        // Apply price filter
        if (this.filters.priceRange) {
            const { min, max } = this.filters.priceRange;
            filtered = filtered.filter(product =>
                product.price >= min && product.price <= max
            );
        }

        // Apply sorting
        if (this.filters.sort) {
            filtered = this.sortProducts(filtered, this.filters.sort);
        }

        this.renderProducts(filtered);
        this.trackEvent('store', 'filter_applied', {
            filters: this.filters,
            resultCount: filtered.length
        });
    }

    // Checkout Process
    initCheckout() {
        this.initCheckoutSteps();
        this.initShippingForm();
        this.initPaymentForm();
        this.initOrderSummary();
    }

    initCheckoutSteps() {
        document.querySelectorAll('[data-checkout-step]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const step = e.target.getAttribute('data-checkout-step');
                this.setCheckoutStep(step);
            });
        });
    }

    setCheckoutStep(step) {
        this.checkoutStep = step;

        // Update step indicators
        document.querySelectorAll('[data-checkout-step]').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-checkout-step') === step);
            btn.classList.toggle('completed', this.isStepCompleted(btn.getAttribute('data-checkout-step')));
        });

        // Show/hide step content
        document.querySelectorAll('[data-checkout-content]').forEach(content => {
            const contentStep = content.getAttribute('data-checkout-content');
            content.style.display = contentStep === step ? 'block' : 'none';
        });

        this.emit('checkout:step_changed', { step });
    }

    isStepCompleted(step) {
        // Logic to determine if a step is completed
        return false; // Implement based on form validation
    }

    // Payment Processing
    async initPaymentProcessing() {
        // Initialize Stripe
        if (window.Stripe && this.paymentMethods.includes('stripe')) {
            this.stripe = window.Stripe(process.env.STRIPE_PUBLIC_KEY);
            this.initStripeElements();
        }

        // Initialize PayPal
        if (window.paypal && this.paymentMethods.includes('paypal')) {
            this.initPayPal();
        }

        // Initialize crypto payments
        if (this.paymentMethods.includes('crypto')) {
            this.initCryptoPayments();
        }
    }

    async processPayment(paymentData) {
        this.showLoading('Processing payment...');

        try {
            const response = await fetch('/api/payments/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...paymentData,
                    cart: this.cart,
                    total: this.getCartTotal()
                })
            });

            const result = await response.json();

            if (result.success) {
                this.handlePaymentSuccess(result);
            } else {
                this.handlePaymentError(result.error);
            }
        } catch (error) {
            this.handlePaymentError(error.message);
        } finally {
            this.hideLoading();
        }
    }

    handlePaymentSuccess(result) {
        // Clear cart
        this.cart = [];
        this.saveCart();

        // Redirect to success page or show success message
        window.location.href = `/order/success?id=${result.orderId}`;

        this.trackEvent('purchase', 'completed', {
            orderId: result.orderId,
            total: result.total,
            items: result.items
        });
    }

    handlePaymentError(error) {
        console.error('Payment error:', error);
        this.showError('Payment failed. Please try again.');

        this.trackEvent('purchase', 'failed', {
            error: error,
            total: this.getCartTotal()
        });
    }

    // Wishlist
    async toggleWishlist(productId) {
        // Implementation would depend on authentication system
        console.log('Toggle wishlist for product:', productId);
        this.trackEvent('wishlist', 'toggle', { productId });
    }

    // Utility Methods
    formatPrice(price) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: this.currency.code
        }).format(price * this.currency.rate);
    }

    generateCartItemId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    updateProductCount(count) {
        document.querySelectorAll('[data-product-count]').forEach(element => {
            element.textContent = count;
        });
    }

    showLoading(message = 'Loading...') {
        this.isLoading = true;
        // Implement loading UI
        console.log('Loading:', message);
    }

    hideLoading() {
        this.isLoading = false;
        // Hide loading UI
    }

    showError(message) {
        // Implement error display
        console.error('Store Error:', message);
    }

    trackEvent(category, action, data = {}) {
        // Analytics tracking - integrate with your analytics service
        if (window.gtag) {
            window.gtag('event', action, {
                event_category: category,
                event_label: JSON.stringify(data)
            });
        }
        console.log('Store Event:', { category, action, data });
    }

    // Event system
    on(event, callback) {
        if (!this.events) this.events = {};
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(callback);
    }

    emit(event, data) {
        if (!this.events || !this.events[event]) return;
        this.events[event].forEach(callback => callback(data));
    }

    handleError(error) {
        console.error('Binary Ring Store Error:', error);
        this.showError('An error occurred. Please try again.');
    }
}

// Initialize store when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.BinaryRingStore = new BinaryRingStore();
    });
} else {
    window.BinaryRingStore = new BinaryRingStore();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BinaryRingStore;
}