// Products page functionality for Farmers Web

document.addEventListener('DOMContentLoaded', function() {
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
            priceValue.textContent = `₹0 - ₹${this.value}`;
        });
    }
    
    // Load products
    loadProducts();
    
    // Search functionality
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    
    if (searchInput && searchBtn) {
        searchBtn.addEventListener('click', function() {
            filterProducts();
        });
        
        searchInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                filterProducts();
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
    const paginationButtons = document.querySelectorAll('.pagination-btn');
    
    if (paginationButtons.length > 0) {
        paginationButtons.forEach(button => {
            button.addEventListener('click', function() {
                const page = this.getAttribute('data-page');
                
                if (page === 'prev') {
                    const activePage = document.querySelector('.pagination-btn.active');
                    const prevPage = activePage.previousElementSibling;
                    
                    if (prevPage && prevPage.getAttribute('data-page') !== 'prev') {
                        changePage(prevPage.getAttribute('data-page'));
                    }
                } else if (page === 'next') {
                    const activePage = document.querySelector('.pagination-btn.active');
                    const nextPage = activePage.nextElementSibling;
                    
                    if (nextPage && nextPage.getAttribute('data-page') !== 'next') {
                        changePage(nextPage.getAttribute('data-page'));
                    }
                } else {
                    changePage(page);
                }
            });
        });
    }
});

// Function to load products
function loadProducts() {
    const productsContainer = document.getElementById('products-container');
    
    if (!productsContainer) return;
    
    // Sample product data - in a real application, this would come from a database
    const allProducts = [
        {
            id: 1,
            name: 'Organic Basmati Rice',
            price: 199,
            oldPrice: 249,
            image: '../images/products/basmati-rice.jpg',
            unit: '1 kg',
            category: 'rice',
            organic: true,
            popularity: 5,
            date: '2023-01-15'
        },
        {
            id: 2,
            name: 'Premium Wheat Flour',
            price: 89,
            oldPrice: 110,
            image: '../images/products/wheat-flour.jpg',
            unit: '1 kg',
            category: 'wheat',
            organic: false,
            popularity: 4,
            date: '2023-02-20'
        },
        {
            id: 3,
            name: 'Organic Brown Rice',
            price: 159,
            oldPrice: 189,
            image: '../images/products/brown-rice.jpg',
            unit: '1 kg',
            category: 'rice',
            organic: true,
            popularity: 4.5,
            date: '2023-03-10'
        },
        {
            id: 4,
            name: 'Organic Quinoa',
            price: 299,
            oldPrice: 349,
            image: '../images/products/quinoa.jpg',
            unit: '500 g',
            category: 'millets',
            organic: true,
            popularity: 4.8,
            date: '2023-01-05'
        },
        {
            id: 5,
            name: 'Toor Dal',
            price: 129,
            oldPrice: 149,
            image: '../images/products/toor-dal.jpg',
            unit: '1 kg',
            category: 'pulses',
            organic: false,
            popularity: 4.2,
            date: '2023-04-15'
        },
        {
            id: 6,
            name: 'Moong Dal',
            price: 139,
            oldPrice: 159,
            image: '../images/products/moong-dal.jpg',
            unit: '1 kg',
            category: 'pulses',
            organic: false,
            popularity: 4.3,
            date: '2023-03-25'
        },
        {
            id: 7,
            name: 'Organic Ragi Flour',
            price: 119,
            oldPrice: 139,
            image: '../images/products/ragi-flour.jpg',
            unit: '1 kg',
            category: 'millets',
            organic: true,
            popularity: 4.6,
            date: '2023-02-10'
        },
        {
            id: 8,
            name: 'Sona Masoori Rice',
            price: 149,
            oldPrice: 179,
            image: '../images/products/sona-masoori.jpg',
            unit: '1 kg',
            category: 'rice',
            organic: false,
            popularity: 4.4,
            date: '2023-05-05'
        },
        {
            id: 9,
            name: 'Organic Chana Dal',
            price: 119,
            oldPrice: 139,
            image: '../images/products/chana-dal.jpg',
            unit: '1 kg',
            category: 'pulses',
            organic: true,
            popularity: 4.1,
            date: '2023-04-20'
        },
        {
            id: 10,
            name: 'Atta Whole Wheat Flour',
            price: 79,
            oldPrice: 99,
            image: '../images/products/atta.jpg',
            unit: '1 kg',
            category: 'wheat',
            organic: false,
            popularity: 4.7,
            date: '2023-05-15'
        },
        {
            id: 11,
            name: 'Organic Jowar Flour',
            price: 109,
            oldPrice: 129,
            image: '../images/products/jowar-flour.jpg',
            unit: '1 kg',
            category: 'millets',
            organic: true,
            popularity: 4.0,
            date: '2023-03-15'
        },
        {
            id: 12,
            name: 'Urad Dal',
            price: 149,
            oldPrice: 169,
            image: '../images/products/urad-dal.jpg',
            unit: '1 kg',
            category: 'pulses',
            organic: false,
            popularity: 4.2,
            date: '2023-04-10'
        }
    ];
    
    // Store products in localStorage for filtering
    localStorage.setItem('allProducts', JSON.stringify(allProducts));
    
    // Display products (first page)
    displayProducts(allProducts, 1);
}

// Function to display products
function displayProducts(products, page) {
    const productsContainer = document.getElementById('products-container');
    
    if (!productsContainer) return;
    
    // Clear container
    productsContainer.innerHTML = '';
    
    // Pagination
    const productsPerPage = 6;
    const startIndex = (page - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const paginatedProducts = products.slice(startIndex, endIndex);
    
    if (paginatedProducts.length === 0) {
        productsContainer.innerHTML = '<div class="no-products"><p>No products found matching your criteria.</p></div>';
        return;
    }
    
    // Create HTML for each product
    paginatedProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        
        productCard.innerHTML = `
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" onerror="this.src='../images/product-placeholder.jpg'">
                ${product.organic ? '<span class="organic-badge">Organic</span>' : ''}
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <div class="product-price">
                    <span class="price">₹${product.price} <small>/ ${product.unit}</small></span>
                    <span class="old-price">₹${product.oldPrice}</span>
                </div>
                <button class="btn primary-btn add-to-cart" data-id="${product.id}" data-name="${product.name}" data-price="${product.price}" data-image="${product.image}">
                    Add to Cart
                </button>
            </div>
        `;
        
        productsContainer.appendChild(productCard);
    });
    
    // Update pagination UI
    updatePagination(products.length, productsPerPage, page);
    
    // Add event listeners to the "Add to Cart" buttons
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            const productName = this.getAttribute('data-name');
            const productPrice = this.getAttribute('data-price');
            const productImage = this.getAttribute('data-image');
            
            addToCart({
                id: productId,
                name: productName,
                price: productPrice,
                image: productImage,
                quantity: 1
            });
            
            // Show a notification
            showNotification(`${productName} added to cart!`);
        });
    });
}

// Function to update pagination UI
function updatePagination(totalProducts, productsPerPage, currentPage) {
    const pagination = document.getElementById('pagination');
    
    if (!pagination) return;
    
    const totalPages = Math.ceil(totalProducts / productsPerPage);
    
    // Hide pagination if only one page
    if (totalPages <= 1) {
        pagination.style.display = 'none';
        return;
    } else {
        pagination.style.display = 'flex';
    }
    
    // Update pagination numbers
    const paginationNumbers = pagination.querySelector('.pagination-numbers');
    paginationNumbers.innerHTML = '';
    
    // Determine which page numbers to show
    let startPage = Math.max(1, currentPage - 1);
    let endPage = Math.min(totalPages, startPage + 2);
    
    // Adjust if we're at the end
    if (endPage - startPage < 2) {
        startPage = Math.max(1, endPage - 2);
    }
    
    // Create page buttons
    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.className = `pagination-btn ${i == currentPage ? 'active' : ''}`;
        pageButton.setAttribute('data-page', i);
        pageButton.textContent = i;
        
        pageButton.addEventListener('click', function() {
            changePage(i);
        });
        
        paginationNumbers.appendChild(pageButton);
    }
    
    // Update prev/next buttons
    const prevButton = pagination.querySelector('[data-page="prev"]');
    const nextButton = pagination.querySelector('[data-page="next"]');
    
    prevButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage === totalPages;
}

// Function to change page
function changePage(page) {
    // Get filtered products from localStorage
    const filteredProducts = JSON.parse(localStorage.getItem('filteredProducts')) || JSON.parse(localStorage.getItem('allProducts'));
    
    // Display products for the selected page
    displayProducts(filteredProducts, parseInt(page));
    
    // Scroll to top of products section
    document.querySelector('.products-section').scrollIntoView({ behavior: 'smooth' });
}

// Function to filter products
function filterProducts() {
    // Get filter values
    const searchValue = document.getElementById('search-input').value.toLowerCase();
    const categoryValue = document.getElementById('category-filter').value;
    const sortValue = document.getElementById('sort-filter').value;
    const priceValue = parseInt(document.getElementById('price-range').value);
    
    // Get all products from localStorage
    const allProducts = JSON.parse(localStorage.getItem('allProducts'));
    
    // Filter products
    let filteredProducts = allProducts.filter(product => {
        // Search filter
        const matchesSearch = searchValue === '' || product.name.toLowerCase().includes(searchValue);
        
        // Category filter
        const matchesCategory = categoryValue === 'all' || 
                               (categoryValue === 'organic' && product.organic) || 
                               product.category === categoryValue;
        
        // Price filter
        const matchesPrice = product.price <= priceValue;
        
        return matchesSearch && matchesCategory && matchesPrice;
    });
    
    // Sort products
    switch (sortValue) {
        case 'price-low':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
        case 'newest':
            filteredProducts.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        default: // popularity
            filteredProducts.sort((a, b) => b.popularity - a.popularity);
    }
    
    // Store filtered products in localStorage
    localStorage.setItem('filteredProducts', JSON.stringify(filteredProducts));
    
    // Display filtered products (first page)
    displayProducts(filteredProducts, 1);
}

// Function to show notification
function showNotification(message) {
    // Check if a notification container already exists
    let notificationContainer = document.querySelector('.notification-container');
    
    // If not, create one
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
        
        // Add styles
        notificationContainer.style.position = 'fixed';
        notificationContainer.style.bottom = '20px';
        notificationContainer.style.right = '20px';
        notificationContainer.style.zIndex = '1000';
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = 'notification glass-effect';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add styles
    notification.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
    notification.style.backdropFilter = 'blur(10px)';
    notification.style.padding = '15px 20px';
    notification.style.borderRadius = '10px';
    notification.style.marginTop = '10px';
    notification.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    notification.style.display = 'flex';
    notification.style.alignItems = 'center';
    notification.style.justifyContent = 'space-between';
    notification.style.animation = 'slideIn 0.3s forwards';
    
    // Add animation keyframes
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s forwards';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}