// Products page functionality for Farmers Web
import { 
    getProducts, 
    searchProducts, 
    getProductCategories,
    incrementProductViews 
} from './firebase-service.js';

// Global variables
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
let itemsPerPage = 12;

document.addEventListener('DOMContentLoaded', function() {
    console.log('Products page loaded');
    
    // Filter toggle for mobile
    const filterToggle = document.getElementById('filter-toggle');
    const filterOptions = document.querySelector('.filter-options');
    
    if (filterToggle && filterOptions) {
        filterToggle.addEventListener('click', function() {
            filterOptions.classList.toggle('active');
        });
    }
    
    // Price range slider
    const priceRange = document.getElementById('price-range');
    const priceValue = document.getElementById('price-value');
    
    if (priceRange && priceValue) {
        priceRange.addEventListener('input', function() {
            priceValue.textContent = `$0 - $${this.value}`;
        });
    }
    
    // Load products and categories
    loadProducts();
    loadCategories();
    
    // Search functionality
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    
    if (searchInput && searchBtn) {
        searchBtn.addEventListener('click', function() {
            performSearch();
        });
        
        searchInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
    
    // Category filter
    const categoryFilter = document.getElementById('category-filter');
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            filterProducts();
        });
    }
    
    // Sort filter
    const sortFilter = document.getElementById('sort-filter');
    
    if (sortFilter) {
        sortFilter.addEventListener('change', function() {
            filterProducts();
        });
    }
    
    // Price filter
    if (priceRange) {
        priceRange.addEventListener('change', function() {
            filterProducts();
        });
    }
    
    // Pagination
    initializePagination();
});

// Function to load products from Firebase
async function loadProducts() {
    const productsContainer = document.getElementById('products-container');
    
    if (!productsContainer) return;
    
    try {
        // Show loading state
        showLoadingState();
        
        // Get products from Firebase
        allProducts = await getProducts();
        filteredProducts = [...allProducts];
        
        console.log('Products loaded:', allProducts);
        
        // Render products
        renderProducts();
        updateProductCount();
        
    } catch (error) {
        console.error('Error loading products:', error);
        showErrorState('Failed to load products. Please try again.');
    }
}

// Function to load categories
async function loadCategories() {
    const categoryFilter = document.getElementById('category-filter');
    
    if (!categoryFilter) return;
    
    try {
        const categories = await getProductCategories();
        
        // Clear existing options (except "All Categories")
        const firstOption = categoryFilter.firstElementChild;
        categoryFilter.innerHTML = '';
        categoryFilter.appendChild(firstOption);
        
        // Add category options
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            categoryFilter.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Function to perform search
async function performSearch() {
    const searchInput = document.getElementById('search-input');
    const searchTerm = searchInput ? searchInput.value.trim() : '';
    
    try {
        showLoadingState();
        
        const filters = getCurrentFilters();
        filteredProducts = await searchProducts(searchTerm, filters);
        
        currentPage = 1;
        renderProducts();
        updateProductCount();
        
    } catch (error) {
        console.error('Error searching products:', error);
        showErrorState('Search failed. Please try again.');
    }
}

// Function to get current filter values
function getCurrentFilters() {
    const categoryFilter = document.getElementById('category-filter');
    const sortFilter = document.getElementById('sort-filter');
    
    return {
        category: categoryFilter ? categoryFilter.value : '',
        sortBy: sortFilter ? sortFilter.value : 'newest'
    };
}

// Function to filter products
async function filterProducts() {
    try {
        showLoadingState();
        
        const filters = getCurrentFilters();
        const priceRange = document.getElementById('price-range');
        const maxPrice = priceRange ? parseInt(priceRange.value) : 1000;
        
        // Start with all products
        let filtered = [...allProducts];
        
        // Apply category filter
        if (filters.category) {
            filtered = filtered.filter(product => product.category === filters.category);
        }
        
        // Apply price filter
        filtered = filtered.filter(product => product.price <= maxPrice);
        
        // Apply sorting
        filtered = sortProducts(filtered, filters.sortBy);
        
        filteredProducts = filtered;
        currentPage = 1;
        
        renderProducts();
        updateProductCount();
        
    } catch (error) {
        console.error('Error filtering products:', error);
        showErrorState('Filter failed. Please try again.');
    }
}

// Function to sort products
function sortProducts(products, sortBy) {
    const sorted = [...products];
    
    switch (sortBy) {
        case 'price-low':
            return sorted.sort((a, b) => a.price - b.price);
        case 'price-high':
            return sorted.sort((a, b) => b.price - a.price);
        case 'name-asc':
            return sorted.sort((a, b) => a.name.localeCompare(b.name));
        case 'name-desc':
            return sorted.sort((a, b) => b.name.localeCompare(a.name));
        case 'popular':
            return sorted.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        case 'newest':
        default:
            return sorted.sort((a, b) => {
                const dateA = a.createdAt?.toDate?.() || new Date(a.date || 0);
                const dateB = b.createdAt?.toDate?.() || new Date(b.date || 0);
                return dateB - dateA;
            });
    }
}

// Function to render products
function renderProducts() {
    const productsContainer = document.getElementById('products-container');
    
    if (!productsContainer) return;
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageProducts = filteredProducts.slice(startIndex, endIndex);
    
    if (pageProducts.length === 0) {
        productsContainer.innerHTML = `
            <div class="no-products">
                <i class="fas fa-search"></i>
                <h3>No products found</h3>
                <p>Try adjusting your search or filter criteria</p>
            </div>
        `;
        return;
    }
    
    // Generate product HTML
    const productsHTML = pageProducts.map(product => createProductHTML(product)).join('');
    productsContainer.innerHTML = productsHTML;
    
    // Update pagination
    updatePagination();
    
    // Add click handlers for product cards
    addProductClickHandlers();
}

// Function to create product HTML
function createProductHTML(product) {
    const discountPercentage = product.oldPrice ? 
        Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0;
    
    const ratingStars = generateStarRating(product.popularity || 0);
    
    return `
        <div class="product-card" data-product-id="${product.id}">
            <div class="product-image">
                <img src="${product.imageUrl || product.image || '../images/products/placeholder.jpg'}" 
                     alt="${product.name}" 
                     onerror="this.src='../images/products/placeholder.jpg'">
                ${product.organic ? '<span class="organic-badge">Organic</span>' : ''}
                ${discountPercentage > 0 ? `<span class="discount-badge">${discountPercentage}% OFF</span>` : ''}
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <div class="product-rating">
                    ${ratingStars}
                    <span class="rating-count">(${product.reviewCount || 0})</span>
                </div>
                <div class="product-price">
                    <span class="current-price">$${product.price}</span>
                    ${product.oldPrice ? `<span class="old-price">$${product.oldPrice}</span>` : ''}
                </div>
                <div class="product-unit">${product.unit}</div>
                <div class="product-actions">
                    <button class="btn btn-primary add-to-cart" data-product-id="${product.id}">
                        <i class="fas fa-shopping-cart"></i>
                        Add to Cart
                    </button>
                    <button class="btn btn-outline view-product" data-product-id="${product.id}">
                        <i class="fas fa-eye"></i>
                        View
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Function to generate star rating HTML
function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let starsHTML = '';
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<i class="fas fa-star"></i>';
    }
    
    // Half star
    if (hasHalfStar) {
        starsHTML += '<i class="fas fa-star-half-alt"></i>';
    }
    
    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<i class="far fa-star"></i>';
    }
    
    return starsHTML;
}

// Function to add click handlers to product cards
function addProductClickHandlers() {
    // Add to cart buttons
    const addToCartBtns = document.querySelectorAll('.add-to-cart');
    addToCartBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const productId = this.dataset.productId;
            addToCart(productId);
        });
    });
    
    // View product buttons
    const viewProductBtns = document.querySelectorAll('.view-product');
    viewProductBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const productId = this.dataset.productId;
            viewProduct(productId);
        });
    });
    
    // Product card click (view product)
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
        card.addEventListener('click', function() {
            const productId = this.dataset.productId;
            viewProduct(productId);
        });
    });
}

// Function to add product to cart
function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    
    if (!product) {
        showNotification('Product not found', 'error');
        return;
    }
    
    // Get existing cart from localStorage
    let cart = JSON.parse(localStorage.getItem('farmersWebCart') || '[]');
    
    // Check if product already in cart
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.imageUrl || product.image,
            unit: product.unit,
            quantity: 1
        });
    }
    
    // Save cart to localStorage
    localStorage.setItem('farmersWebCart', JSON.stringify(cart));
    
    // Update cart UI
    updateCartUI();
    
    // Show notification
    showNotification(`${product.name} added to cart`, 'success');
}

// Function to view product details
function viewProduct(productId) {
    // Increment view count
    incrementProductViews(productId);
    
    // Redirect to product detail page (you can implement this)
    console.log('View product:', productId);
    showNotification('Product detail page to be implemented', 'info');
}

// Function to update cart UI
function updateCartUI() {
    const cart = JSON.parse(localStorage.getItem('farmersWebCart') || '[]');
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    
    const cartCountElement = document.querySelector('.cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = cartCount;
    }
}

// Function to show loading state
function showLoadingState() {
    const productsContainer = document.getElementById('products-container');
    if (productsContainer) {
        productsContainer.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading products...</p>
            </div>
        `;
    }
}

// Function to show error state
function showErrorState(message) {
    const productsContainer = document.getElementById('products-container');
    if (productsContainer) {
        productsContainer.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Oops! Something went wrong</h3>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="loadProducts()">Try Again</button>
            </div>
        `;
    }
}

// Function to update product count
function updateProductCount() {
    const productCount = document.getElementById('product-count');
    if (productCount) {
        productCount.textContent = `${filteredProducts.length} products found`;
    }
}

// Function to initialize pagination
function initializePagination() {
    // This will be called when pagination buttons are clicked
    window.changePage = function(page) {
        currentPage = page;
        renderProducts();
        
        // Scroll to top of products
        const productsSection = document.querySelector('.products-section');
        if (productsSection) {
            productsSection.scrollIntoView({ behavior: 'smooth' });
        }
    };
}

// Function to update pagination
function updatePagination() {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const paginationContainer = document.querySelector('.pagination');
    
    if (!paginationContainer || totalPages <= 1) {
        if (paginationContainer) {
            paginationContainer.style.display = 'none';
        }
        return;
    }
    
    paginationContainer.style.display = 'flex';
    
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
        <button class="pagination-btn ${currentPage === 1 ? 'disabled' : ''}" 
                data-page="prev" ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button class="pagination-btn ${i === currentPage ? 'active' : ''}" 
                    data-page="${i}" onclick="changePage(${i})">
                ${i}
            </button>
        `;
    }
    
    // Next button
    paginationHTML += `
        <button class="pagination-btn ${currentPage === totalPages ? 'disabled' : ''}" 
                data-page="next" ${currentPage === totalPages ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    paginationContainer.innerHTML = paginationHTML;
    
    // Add event listeners for prev/next buttons
    const prevBtn = paginationContainer.querySelector('[data-page="prev"]');
    const nextBtn = paginationContainer.querySelector('[data-page="next"]');
    
    if (prevBtn && !prevBtn.disabled) {
        prevBtn.addEventListener('click', () => changePage(currentPage - 1));
    }
    
    if (nextBtn && !nextBtn.disabled) {
        nextBtn.addEventListener('click', () => changePage(currentPage + 1));
    }
}

// Function to show notifications
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
    
    // Remove on click
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    });
}

// Initialize cart UI on page load
document.addEventListener('DOMContentLoaded', function() {
    updateCartUI();
});