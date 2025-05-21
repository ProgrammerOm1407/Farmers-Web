// Checkout functionality for Farmers Web

document.addEventListener('DOMContentLoaded', function() {
    // Load cart items
    loadCheckoutItems();
    
    // Calculate totals
    calculateTotals();
    
    // Shipping form submission
    const shippingForm = document.getElementById('shipping-form');
    const shippingFormContainer = document.getElementById('shipping-form-container');
    const paymentFormContainer = document.getElementById('payment-form-container');
    
    if (shippingForm) {
        shippingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validate form
            if (this.checkValidity()) {
                // Save shipping information
                saveShippingInfo();
                
                // Hide shipping form and show payment form
                shippingFormContainer.classList.remove('active');
                paymentFormContainer.classList.add('active');
                
                // Update checkout steps
                updateCheckoutSteps(2);
            } else {
                // Show validation messages
                this.reportValidity();
            }
        });
    }
    
    // Back to shipping button
    const backToShippingBtn = document.getElementById('back-to-shipping');
    
    if (backToShippingBtn) {
        backToShippingBtn.addEventListener('click', function() {
            // Hide payment form and show shipping form
            paymentFormContainer.classList.remove('active');
            shippingFormContainer.classList.add('active');
            
            // Update checkout steps
            updateCheckoutSteps(1);
        });
    }
    
    // Payment method selection
    const paymentMethods = document.querySelectorAll('.payment-method');
    
    if (paymentMethods.length > 0) {
        paymentMethods.forEach(method => {
            method.addEventListener('click', function() {
                // Remove active class from all payment methods
                paymentMethods.forEach(m => m.classList.remove('active'));
                
                // Add active class to clicked payment method
                this.classList.add('active');
                
                // Check the radio button
                const radio = this.querySelector('input[type="radio"]');
                radio.checked = true;
            });
        });
    }
    
    // Place order button
    const placeOrderBtn = document.getElementById('place-order-btn');
    const confirmationContainer = document.getElementById('confirmation-container');
    
    if (placeOrderBtn) {
        placeOrderBtn.addEventListener('click', function() {
            // Get selected payment method
            const selectedMethod = document.querySelector('.payment-method.active').getAttribute('data-method');
            
            if (selectedMethod === 'razorpay') {
                // Process Razorpay payment
                processRazorpayPayment();
            } else if (selectedMethod === 'cod') {
                // Process Cash on Delivery order
                processOrder('Cash on Delivery');
            }
        });
    }
    
    // Apply coupon button
    const applyCouponBtn = document.getElementById('apply-coupon');
    
    if (applyCouponBtn) {
        applyCouponBtn.addEventListener('click', function() {
            const couponCode = document.getElementById('coupon-input').value.trim();
            
            if (couponCode === '') {
                showNotification('Please enter a coupon code', 'error');
                return;
            }
            
            // Check if coupon is valid
            if (couponCode.toUpperCase() === 'FIRST10') {
                // Apply 10% discount
                applyDiscount(10);
                showNotification('Coupon applied successfully! 10% discount');
            } else {
                showNotification('Invalid coupon code', 'error');
            }
        });
    }
});

// Function to load checkout items
function loadCheckoutItems() {
    const checkoutCartItems = document.getElementById('checkout-cart-items');
    
    if (!checkoutCartItems) return;
    
    // Get cart from localStorage
    const cart = JSON.parse(localStorage.getItem('farmersWebCart')) || [];
    
    if (cart.length === 0) {
        // Redirect to products page if cart is empty
        window.location.href = 'products.html';
        return;
    }
    
    // Clear container
    checkoutCartItems.innerHTML = '';
    
    // Add each item to checkout
    cart.forEach(item => {
        const cartItemElement = document.createElement('div');
        cartItemElement.className = 'cart-item';
        
        cartItemElement.innerHTML = `
            <div class="cart-item-image">
                <img src="${item.image}" alt="${item.name}" onerror="this.src='../images/product-placeholder.jpg'">
            </div>
            <div class="cart-item-details">
                <h4 class="cart-item-title">${item.name}</h4>
                <div class="cart-item-price">₹${item.price}</div>
                <div class="cart-item-quantity">Quantity: ${item.quantity}</div>
            </div>
        `;
        
        checkoutCartItems.appendChild(cartItemElement);
    });
}

// Function to calculate totals
function calculateTotals() {
    // Get cart from localStorage
    const cart = JSON.parse(localStorage.getItem('farmersWebCart')) || [];
    
    // Calculate subtotal
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    // Set shipping cost
    const shippingCost = subtotal > 500 ? 0 : 40;
    
    // Calculate tax (5%)
    const tax = subtotal * 0.05;
    
    // Calculate total
    const total = subtotal + shippingCost + tax;
    
    // Update UI
    document.getElementById('subtotal').textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById('shipping-cost').textContent = shippingCost === 0 ? 'Free' : `₹${shippingCost.toFixed(2)}`;
    document.getElementById('tax').textContent = `₹${tax.toFixed(2)}`;
    document.getElementById('total').textContent = `₹${total.toFixed(2)}`;
    
    // Store totals in localStorage
    localStorage.setItem('farmersWebCheckoutTotals', JSON.stringify({
        subtotal,
        shippingCost,
        tax,
        total,
        discount: 0
    }));
}

// Function to apply discount
function applyDiscount(percentage) {
    // Get totals from localStorage
    const totals = JSON.parse(localStorage.getItem('farmersWebCheckoutTotals'));
    
    if (!totals) return;
    
    // Calculate discount amount
    const discountAmount = (totals.subtotal * percentage) / 100;
    
    // Update total
    totals.discount = discountAmount;
    totals.total = totals.subtotal + totals.shippingCost + totals.tax - discountAmount;
    
    // Update localStorage
    localStorage.setItem('farmersWebCheckoutTotals', JSON.stringify(totals));
    
    // Update UI
    const totalElement = document.getElementById('total');
    totalElement.textContent = `₹${totals.total.toFixed(2)}`;
    
    // Add discount row if it doesn't exist
    let discountRow = document.querySelector('.discount-row');
    
    if (!discountRow) {
        const summaryTotals = document.querySelector('.summary-totals');
        const totalRow = document.querySelector('.summary-row.total');
        
        discountRow = document.createElement('div');
        discountRow.className = 'summary-row discount-row';
        discountRow.innerHTML = `
            <span>Discount (${percentage}%)</span>
            <span id="discount">-₹${discountAmount.toFixed(2)}</span>
        `;
        
        summaryTotals.insertBefore(discountRow, totalRow);
    } else {
        // Update existing discount row
        const discountElement = document.getElementById('discount');
        discountElement.textContent = `-₹${discountAmount.toFixed(2)}`;
    }
}

// Function to save shipping information
function saveShippingInfo() {
    const shippingInfo = {
        firstName: document.getElementById('first-name').value,
        lastName: document.getElementById('last-name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value,
        city: document.getElementById('city').value,
        state: document.getElementById('state').value,
        pincode: document.getElementById('pincode').value,
        deliveryInstructions: document.getElementById('delivery-instructions').value
    };
    
    // Store shipping info in localStorage
    localStorage.setItem('farmersWebShippingInfo', JSON.stringify(shippingInfo));
}

// Function to update checkout steps
function updateCheckoutSteps(activeStep) {
    const steps = document.querySelectorAll('.step');
    const stepLines = document.querySelectorAll('.step-line');
    
    steps.forEach((step, index) => {
        if (index + 1 < activeStep) {
            step.classList.remove('active');
            step.classList.add('completed');
        } else if (index + 1 === activeStep) {
            step.classList.add('active');
            step.classList.remove('completed');
        } else {
            step.classList.remove('active', 'completed');
        }
    });
    
    stepLines.forEach((line, index) => {
        if (index + 1 < activeStep) {
            line.classList.add('active');
        } else {
            line.classList.remove('active');
        }
    });
}

// Function to process Razorpay payment
function processRazorpayPayment() {
    // Get totals from localStorage
    const totals = JSON.parse(localStorage.getItem('farmersWebCheckoutTotals'));
    const shippingInfo = JSON.parse(localStorage.getItem('farmersWebShippingInfo'));
    
    if (!totals || !shippingInfo) return;
    
    // Convert total to paise (Razorpay requires amount in smallest currency unit)
    const amountInPaise = Math.round(totals.total * 100);
    
    // Razorpay options
    const options = {
        key: 'rzp_test_YourRazorpayKeyHere', // Replace with your Razorpay key
        amount: amountInPaise,
        currency: 'INR',
        name: 'Farmers Web',
        description: 'Purchase of Grain Products',
        image: '../images/logo.png',
        handler: function(response) {
            // Payment successful
            // In a real application, you would verify the payment on your server
            
            // Process order
            processOrder('Razorpay', response.razorpay_payment_id);
        },
        prefill: {
            name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
            email: shippingInfo.email,
            contact: `+91${shippingInfo.phone}`
        },
        theme: {
            color: '#4CAF50'
        }
    };
    
    // Create Razorpay instance
    const rzp = new Razorpay(options);
    
    // Open Razorpay checkout
    rzp.open();
    
    // Handle payment failure
    rzp.on('payment.failed', function(response) {
        showNotification('Payment failed. Please try again.', 'error');
    });
}

// Function to process order
function processOrder(paymentMethod, paymentId = null) {
    // Get shipping info and totals
    const shippingInfo = JSON.parse(localStorage.getItem('farmersWebShippingInfo'));
    const totals = JSON.parse(localStorage.getItem('farmersWebCheckoutTotals'));
    const cart = JSON.parse(localStorage.getItem('farmersWebCart'));
    
    if (!shippingInfo || !totals || !cart) return;
    
    // Generate order number
    const orderNumber = 'FW' + Date.now().toString().slice(-6);
    
    // Get current date
    const orderDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Create order object
    const order = {
        orderNumber,
        orderDate,
        paymentMethod,
        paymentId,
        shippingInfo,
        totals,
        items: cart,
        status: 'Processing'
    };
    
    // In a real application, you would send this to your server
    // For now, we'll just store it in localStorage
    
    // Get existing orders or create empty array
    const orders = JSON.parse(localStorage.getItem('farmersWebOrders')) || [];
    
    // Add new order
    orders.push(order);
    
    // Save orders
    localStorage.setItem('farmersWebOrders', JSON.stringify(orders));
    
    // Update order confirmation UI
    document.getElementById('order-number').textContent = `#${orderNumber}`;
    document.getElementById('order-date').textContent = orderDate;
    document.getElementById('payment-method').textContent = paymentMethod;
    document.getElementById('shipping-address').textContent = `${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.state}, ${shippingInfo.pincode}`;
    
    // Show confirmation
    const paymentFormContainer = document.getElementById('payment-form-container');
    const confirmationContainer = document.getElementById('confirmation-container');
    
    paymentFormContainer.classList.remove('active');
    confirmationContainer.classList.add('active');
    
    // Update checkout steps
    updateCheckoutSteps(3);
    
    // Clear cart
    clearCart();
}

// Function to show notification
function showNotification(message, type = 'success') {
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
    notification.className = `notification glass-effect ${type}`;
    
    // Set icon based on type
    let icon = 'check-circle';
    if (type === 'error') icon = 'times-circle';
    if (type === 'warning') icon = 'exclamation-circle';
    
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${icon}"></i>
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
    
    // Add color based on type
    if (type === 'error') {
        notification.style.borderLeft = '4px solid #ff6b6b';
    } else if (type === 'warning') {
        notification.style.borderLeft = '4px solid #ffbb55';
    } else {
        notification.style.borderLeft = '4px solid #4CAF50';
    }
    
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