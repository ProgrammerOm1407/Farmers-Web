// Main JavaScript file for Farmers Web

document.addEventListener('DOMContentLoaded', function() {
    // Mobile Menu Toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const nav = document.querySelector('nav');
    const overlay = document.getElementById('overlay');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            nav.classList.toggle('active');
            overlay.classList.toggle('active');
            document.body.style.overflow = nav.classList.contains('active') ? 'hidden' : '';
        });
        
        // Close menu when clicking on a menu item
        const navLinks = nav.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                nav.classList.remove('active');
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
        
        // Close menu when clicking on overlay or close button
        overlay.addEventListener('click', function() {
            nav.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        });
        
        // Close menu when clicking on the close button (::before pseudo-element)
        nav.addEventListener('click', function(event) {
            const rect = nav.getBoundingClientRect();
            const closeButtonArea = {
                left: rect.right - 60,
                right: rect.right - 10,
                top: rect.top + 10,
                bottom: rect.top + 70
            };
            
            if (event.clientX >= closeButtonArea.left && 
                event.clientX <= closeButtonArea.right && 
                event.clientY >= closeButtonArea.top && 
                event.clientY <= closeButtonArea.bottom) {
                nav.classList.remove('active');
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
        
        // Handle touch events for better mobile experience
        let touchStartX = 0;
        let touchStartY = 0;
        
        nav.addEventListener('touchstart', function(event) {
            touchStartX = event.touches[0].clientX;
            touchStartY = event.touches[0].clientY;
        });
        
        nav.addEventListener('touchend', function(event) {
            const touchEndX = event.changedTouches[0].clientX;
            const touchEndY = event.changedTouches[0].clientY;
            const deltaX = touchStartX - touchEndX;
            const deltaY = Math.abs(touchStartY - touchEndY);
            
            // Swipe left to close menu (only if swipe is more horizontal than vertical)
            if (deltaX > 50 && deltaY < 100) {
                nav.classList.remove('active');
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            if (nav.classList.contains('active') && 
                !nav.contains(event.target) && 
                !mobileMenuBtn.contains(event.target) &&
                !overlay.contains(event.target)) {
                nav.classList.remove('active');
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
        
        // Close menu on escape key
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && nav.classList.contains('active')) {
                nav.classList.remove('active');
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
    
    // Newsletter Form Submission
    const newsletterForm = document.getElementById('newsletter-form');
    
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = this.querySelector('input[type="email"]').value;
            
            // Here you would typically send this to your backend
            // For now, we'll just show an alert
            alert(`Thank you for subscribing with ${email}! You'll receive our updates soon.`);
            this.reset();
        });
    }
    
    // Load Featured Products
    loadFeaturedProducts();
    
    // Mobile-specific optimizations
    initializeMobileOptimizations();
});

// Mobile optimization functions
function initializeMobileOptimizations() {
    // Prevent zoom on input focus for iOS
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            if (window.innerWidth < 768) {
                const viewport = document.querySelector('meta[name="viewport"]');
                viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
            }
        });
        
        input.addEventListener('blur', function() {
            if (window.innerWidth < 768) {
                const viewport = document.querySelector('meta[name="viewport"]');
                viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
            }
        });
    });
    
    // Improve touch scrolling on iOS
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        document.body.style.webkitOverflowScrolling = 'touch';
    }
    
    // Handle orientation change
    window.addEventListener('orientationchange', function() {
        setTimeout(function() {
            // Force a repaint to fix layout issues
            document.body.style.display = 'none';
            document.body.offsetHeight; // Trigger reflow
            document.body.style.display = '';
            
            // Close mobile menu on orientation change
            const nav = document.querySelector('nav');
            const overlay = document.getElementById('overlay');
            if (nav && nav.classList.contains('active')) {
                nav.classList.remove('active');
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        }, 100);
    });
    
    // Add touch feedback to buttons
    const touchElements = document.querySelectorAll('.btn, .cart-icon, .mobile-menu-btn, .product-card');
    touchElements.forEach(element => {
        element.addEventListener('touchstart', function() {
            this.style.opacity = '0.8';
        });
        
        element.addEventListener('touchend', function() {
            this.style.opacity = '';
        });
        
        element.addEventListener('touchcancel', function() {
            this.style.opacity = '';
        });
    });
    
    // Optimize images for mobile
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.addEventListener('load', function() {
            this.style.opacity = '1';
        });
        
        // Add loading placeholder
        if (!img.complete) {
            img.style.opacity = '0.5';
            img.style.transition = 'opacity 0.3s ease';
        }
    });
}

// Function to load featured products
function loadFeaturedProducts() {

    const featuredProductsContainer = document.getElementById('featured-products-container');
    
    if (!featuredProductsContainer) return;
    
    // Sample product data - in a real application, this would come from a database
    const featuredProducts = [
        {
            id: 1,
            name: 'Organic Basmati Rice',
            price: 199,
            oldPrice: 249,
            image: 'images/products/basmati-rice.jpg',
            unit: '1 kg'
        },
        {
            id: 2,
            name: 'Premium Wheat Flour',
            price: 89,
            oldPrice: 110,
            image: 'images/products/wheat-flour.jpg',
            unit: '1 kg'
        },
        {
            id: 3,
            name: 'Organic Brown Rice',
            price: 159,
            oldPrice: 189,
            image: 'images/products/brown-rice.jpg',
            unit: '1 kg'
        },
        {
            id: 4,
            name: 'Organic Quinoa',
            price: 299,
            oldPrice: 349,
            image: 'images/products/quinoa.jpg',
            unit: '500 g'
        }
    ];
    
    // Create HTML for each product
    featuredProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        
        // Handle image path for better error handling
        const imagePath = product.image;
        
        productCard.innerHTML = `
            <div class="product-image">
                <img src="${imagePath}" alt="${product.name}" onerror="this.src='images/product-placeholder.jpg'">
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <div class="product-price">
                    <span class="price">₹${product.price} <small>/ ${product.unit}</small></span>
                    <span class="old-price">₹${product.oldPrice}</span>
                </div>
                <button class="btn primary-btn add-to-cart" data-id="${product.id}" data-name="${product.name}" data-price="${product.price}" data-image="${imagePath}">
                    Add to Cart
                </button>
            </div>
        `;
        
        featuredProductsContainer.appendChild(productCard);
    });
    
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