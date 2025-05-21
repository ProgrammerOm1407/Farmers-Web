// Cart functionality for Farmers Web

document.addEventListener('DOMContentLoaded', function() {
    // Cart toggle functionality
    const cartBtn = document.getElementById('cart-btn');
    const closeCartBtn = document.getElementById('close-cart');
    const cartSidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('overlay');
    
    if (cartBtn && closeCartBtn && cartSidebar && overlay) {
        cartBtn.addEventListener('click', function(e) {
            e.preventDefault();
            cartSidebar.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
        
        closeCartBtn.addEventListener('click', function() {
            cartSidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        });
        
        overlay.addEventListener('click', function() {
            cartSidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    
    // Load cart from localStorage
    loadCart();
});

// Cart array to store items
let cart = [];

// Function to add item to cart
function addToCart(product) {
    // Check if product already exists in cart
    const existingProductIndex = cart.findIndex(item => item.id === product.id);
    
    if (existingProductIndex > -1) {
        // Product exists, increase quantity
        cart[existingProductIndex].quantity += 1;
    } else {
        // Product doesn't exist, add to cart
        cart.push(product);
    }
    
    // Save cart to localStorage
    saveCart();
    
    // Update cart UI
    updateCartUI();
}

// Function to remove item from cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    
    // Save cart to localStorage
    saveCart();
    
    // Update cart UI
    updateCartUI();
}

// Function to update item quantity
function updateQuantity(productId, newQuantity) {
    const productIndex = cart.findIndex(item => item.id === productId);
    
    if (productIndex > -1) {
        if (newQuantity <= 0) {
            // Remove item if quantity is 0 or less
            removeFromCart(productId);
        } else {
            // Update quantity
            cart[productIndex].quantity = newQuantity;
            
            // Save cart to localStorage
            saveCart();
            
            // Update cart UI
            updateCartUI();
        }
    }
}

// Function to save cart to localStorage
function saveCart() {
    localStorage.setItem('farmersWebCart', JSON.stringify(cart));
    
    // Update cart count in header
    updateCartCount();
}

// Function to load cart from localStorage
function loadCart() {
    const savedCart = localStorage.getItem('farmersWebCart');
    
    if (savedCart) {
        cart = JSON.parse(savedCart);
        
        // Update cart UI
        updateCartUI();
    }
}

// Function to update cart count in header
function updateCartCount() {
    const cartCountElement = document.querySelector('.cart-count');
    
    if (cartCountElement) {
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        cartCountElement.textContent = totalItems;
    }
}

// Function to update cart UI
function updateCartUI() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total-price');
    
    if (!cartItemsContainer || !cartTotalElement) return;
    
    // Clear cart items container
    cartItemsContainer.innerHTML = '';
    
    if (cart.length === 0) {
        // Cart is empty
        cartItemsContainer.innerHTML = '<div class="empty-cart"><p>Your cart is empty</p><a href="pages/products.html" class="btn secondary-btn">Continue Shopping</a></div>';
        cartTotalElement.textContent = '₹0.00';
    } else {
        // Calculate total price
        const totalPrice = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        
        // Update total price
        cartTotalElement.textContent = `₹${totalPrice.toFixed(2)}`;
        
        // Add each item to cart
        cart.forEach(item => {
            const cartItemElement = document.createElement('div');
            cartItemElement.className = 'cart-item';
            
            cartItemElement.innerHTML = `
                <div class="cart-item-image">
                    <img src="${item.image}" alt="${item.name}" onerror="this.src='images/product-placeholder.jpg'">
                </div>
                <div class="cart-item-details">
                    <h4 class="cart-item-title">${item.name}</h4>
                    <div class="cart-item-price">₹${item.price} × ${item.quantity} = ₹${(item.price * item.quantity).toFixed(2)}</div>
                    <div class="cart-item-controls">
                        <div class="quantity-control">
                            <button class="quantity-btn decrease" data-id="${item.id}">-</button>
                            <span class="quantity">${item.quantity}</span>
                            <button class="quantity-btn increase" data-id="${item.id}">+</button>
                        </div>
                        <button class="remove-item" data-id="${item.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
            
            cartItemsContainer.appendChild(cartItemElement);
        });
        
        // Add event listeners to cart item controls
        const decreaseButtons = document.querySelectorAll('.quantity-btn.decrease');
        const increaseButtons = document.querySelectorAll('.quantity-btn.increase');
        const removeButtons = document.querySelectorAll('.remove-item');
        
        decreaseButtons.forEach(button => {
            button.addEventListener('click', function() {
                const productId = this.getAttribute('data-id');
                const product = cart.find(item => item.id === productId);
                
                if (product) {
                    updateQuantity(productId, product.quantity - 1);
                }
            });
        });
        
        increaseButtons.forEach(button => {
            button.addEventListener('click', function() {
                const productId = this.getAttribute('data-id');
                const product = cart.find(item => item.id === productId);
                
                if (product) {
                    updateQuantity(productId, product.quantity + 1);
                }
            });
        });
        
        removeButtons.forEach(button => {
            button.addEventListener('click', function() {
                const productId = this.getAttribute('data-id');
                removeFromCart(productId);
            });
        });
    }
    
    // Update cart count in header
    updateCartCount();
}

// Function to clear cart
function clearCart() {
    cart = [];
    saveCart();
    updateCartUI();
}