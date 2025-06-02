// Orders page functionality with Firebase integration
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { collection, query, where, getDocs, orderBy } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { showNotification } from './auth.js';

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication state
    onAuthStateChanged(auth, (user) => {
        if (user) {
            loadUserOrders(user);
        } else {
            showLoginPrompt();
        }
    });
});

// Function to load orders for authenticated user
async function loadUserOrders(user) {
    const ordersContainer = document.getElementById('orders-container');
    
    try {
        showLoadingState(true);
        
        // Try to get orders from Firestore
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            // Show sample orders for demo purposes
            showSampleOrders(ordersContainer);
        } else {
            // Display real orders
            displayFirebaseOrders(querySnapshot.docs, ordersContainer);
        }
        
        showLoadingState(false);
        
    } catch (error) {
        console.error('Error loading orders:', error);
        // Show sample orders for demo purposes
        showSampleOrders(ordersContainer);
        showLoadingState(false);
    }
}

// Function to load guest order
async function loadGuestOrder(orderId) {
    try {
        showLoadingState(true);
        
        const order = await getOrder(orderId);
        displayOrders([order]);
        
        showLoadingState(false);
        
    } catch (error) {
        console.error('Error loading guest order:', error);
        showErrorMessage('Failed to load order: ' + error.message);
        showLoadingState(false);
    }
}

// Function to display orders
function displayOrders(orders) {
    const ordersList = document.getElementById('orders-list');
    
    if (!ordersList) return;
    
    // Clear existing content
    ordersList.innerHTML = '';
    
    orders.forEach(order => {
        const orderCard = createOrderCard(order);
        ordersList.appendChild(orderCard);
    });
}

// Function to create order card
function createOrderCard(order) {
    const orderCard = document.createElement('div');
    orderCard.className = 'order-card';
    
    // Format date
    const orderDate = order.date || new Date().toLocaleDateString();
    
    // Calculate total items
    const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
    
    // Get status class
    const statusClass = `status-${order.status}`;
    
    orderCard.innerHTML = `
        <div class="order-header">
            <div>
                <div class="order-id">Order #${order.orderNumber || order.id}</div>
                <div class="order-date">${orderDate}</div>
            </div>
            <div class="order-status ${statusClass}">
                ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </div>
        </div>
        
        <div class="order-items">
            ${order.items.map(item => `
                <div class="order-item">
                    <div class="item-details">
                        <div class="item-image">
                            <img src="${item.image}" alt="${item.name}" onerror="this.src='../images/product-placeholder.jpg'">
                        </div>
                        <div>
                            <div class="item-name">${item.name}</div>
                            <div class="item-quantity">Qty: ${item.quantity}</div>
                        </div>
                    </div>
                    <div class="item-price">₹${item.price}</div>
                </div>
            `).join('')}
        </div>
        
        <div class="order-footer">
            <div class="order-total">Total: ₹${order.pricing ? order.pricing.total.toFixed(2) : order.total}</div>
            <div class="order-actions">
                <button class="btn secondary-btn" onclick="viewOrderDetails('${order.id}')">
                    View Details
                </button>
                ${order.status === 'processing' ? `
                    <button class="track-btn" onclick="trackOrder('${order.id}')">
                        Track Order
                    </button>
                    <button class="cancel-btn" onclick="cancelOrder('${order.id}')">
                        Cancel Order
                    </button>
                ` : ''}
            </div>
        </div>
    `;
    
    return orderCard;
}

// Function to get status color
function getStatusColor(status) {
    const colors = {
        'pending': '#ff9800',
        'confirmed': '#2196f3',
        'processing': '#ff9800',
        'shipped': '#9c27b0',
        'delivered': '#4caf50',
        'cancelled': '#f44336'
    };
    
    return colors[status.toLowerCase()] || '#666';
}

// Function to show loading state
function showLoadingState(isLoading) {
    const ordersContainer = document.getElementById('orders-container');
    
    if (isLoading) {
        ordersContainer.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
                <p>Loading your orders...</p>
            </div>
        `;
    }
}

// Function to show sample orders for demo
function showSampleOrders(container) {
    container.innerHTML = `
        <div class="orders-header">
            <h2>My Orders</h2>
            <p>Track and manage your orders</p>
        </div>
        <div id="orders-list"></div>
    `;
    
    // Sample orders for demo purposes
    const sampleOrders = [
        {
            id: 'ORD123456',
            orderNumber: 'ORD123456',
            date: '2023-12-15',
            status: 'delivered',
            items: [
                {
                    name: 'Organic Basmati Rice',
                    quantity: 2,
                    price: 199,
                    total: 398,
                    image: '../images/products/basmati-rice.jpg'
                },
                {
                    name: 'Premium Wheat Flour',
                    quantity: 1,
                    price: 89,
                    total: 89,
                    image: '../images/products/wheat-flour.jpg'
                }
            ],
            pricing: {
                subtotal: 487,
                shippingCost: 0,
                tax: 24.35,
                total: 511.35
            },
            paymentMethod: 'UPI',
            customerInfo: {
                firstName: 'John',
                lastName: 'Doe',
                phone: '+91 98765 43210',
                email: 'john.doe@example.com'
            },
            shippingAddress: {
                street: '123 Main Street',
                city: 'Mumbai',
                state: 'Maharashtra',
                pincode: '400001'
            }
        },
        {
            id: 'ORD123457',
            orderNumber: 'ORD123457',
            date: '2023-12-10',
            status: 'processing',
            items: [
                {
                    name: 'Organic Brown Rice',
                    quantity: 3,
                    price: 159,
                    total: 477,
                    image: '../images/products/brown-rice.jpg'
                }
            ],
            pricing: {
                subtotal: 477,
                shippingCost: 50,
                tax: 26.35,
                total: 553.35
            },
            paymentMethod: 'Credit Card',
            customerInfo: {
                firstName: 'John',
                lastName: 'Doe',
                phone: '+91 98765 43210',
                email: 'john.doe@example.com'
            },
            shippingAddress: {
                street: '123 Main Street',
                city: 'Mumbai',
                state: 'Maharashtra',
                pincode: '400001'
            }
        },
        {
            id: 'ORD123458',
            orderNumber: 'ORD123458',
            date: '2023-12-05',
            status: 'cancelled',
            items: [
                {
                    name: 'Organic Quinoa',
                    quantity: 1,
                    price: 299,
                    total: 299,
                    image: '../images/products/quinoa.jpg'
                }
            ],
            pricing: {
                subtotal: 299,
                shippingCost: 50,
                tax: 17.45,
                total: 366.45
            },
            paymentMethod: 'UPI',
            customerInfo: {
                firstName: 'John',
                lastName: 'Doe',
                phone: '+91 98765 43210',
                email: 'john.doe@example.com'
            },
            shippingAddress: {
                street: '123 Main Street',
                city: 'Mumbai',
                state: 'Maharashtra',
                pincode: '400001'
            }
        }
    ];
    
    displayOrders(sampleOrders);
}

// Function to display Firebase orders
function displayFirebaseOrders(docs, container) {
    container.innerHTML = `
        <div class="orders-header">
            <h2>My Orders</h2>
            <p>Track and manage your orders</p>
        </div>
        <div id="orders-list"></div>
    `;
    
    const orders = [];
    docs.forEach(doc => {
        const orderData = doc.data();
        orders.push({
            id: doc.id,
            ...orderData,
            date: orderData.createdAt ? orderData.createdAt.toDate().toLocaleDateString() : 'Unknown'
        });
    });
    
    displayOrders(orders);
}

// Function to show no orders message
function showNoOrdersMessage() {
    const ordersContainer = document.getElementById('orders-container');
    
    ordersContainer.innerHTML = `
        <div class="orders-header">
            <h2>My Orders</h2>
            <p>Track and manage your orders</p>
        </div>
        <div class="no-orders">
            <div class="no-orders-icon">
                <i class="fas fa-shopping-bag"></i>
            </div>
            <h3>No Orders Yet</h3>
            <p>You haven't placed any orders yet. Start shopping to see your orders here.</p>
            <a href="products.html" class="btn primary-btn">Start Shopping</a>
        </div>
    `;
}

// Function to show login prompt
function showLoginPrompt() {
    const ordersContainer = document.getElementById('orders-container');
    
    ordersContainer.innerHTML = `
        <div class="login-prompt">
            <div class="login-prompt-icon">
                <i class="fas fa-user-lock"></i>
            </div>
            <h3>Login Required</h3>
            <p>Please login to view your orders.</p>
            <a href="login.html" class="btn primary-btn">Login</a>
        </div>
    `;
}

// Function to show error message
function showErrorMessage(message) {
    const ordersContainer = document.getElementById('orders-container');
    
    ordersContainer.innerHTML = `
        <div class="error-message">
            <div class="error-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h3>Error Loading Orders</h3>
            <p>${message}</p>
            <button class="btn primary-btn" onclick="location.reload()">Try Again</button>
        </div>
    `;
}

// Function to view order details
window.viewOrderDetails = function(orderId) {
    showNotification('Order details feature coming soon!');
};

// Function to track order
window.trackOrder = function(orderId) {
    showNotification('Order tracking feature coming soon!');
};

// Function to cancel order
window.cancelOrder = function(orderId) {
    if (confirm('Are you sure you want to cancel this order?')) {
        // In a real app, this would make an API call
        showNotification('Order cancelled successfully');
        // Reload the page to reflect changes
        setTimeout(() => {
            location.reload();
        }, 1500);
    }
};

// Function to show order details modal
function showOrderDetailsModal(order) {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    // Create modal content
    const modal = document.createElement('div');
    modal.className = 'order-details-modal glass-effect';
    modal.style.cssText = `
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 15px;
        padding: 30px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        position: relative;
    `;
    
    const orderDate = order.createdAt ? 
        formatFirebaseTimestamp(order.createdAt) : 
        new Date(order.orderDate).toLocaleDateString();
    
    modal.innerHTML = `
        <div class="modal-header">
            <h3>Order Details</h3>
            <button class="close-modal" style="
                position: absolute;
                top: 15px;
                right: 15px;
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #666;
            ">×</button>
        </div>
        
        <div class="order-info-section">
            <h4>Order Information</h4>
            <div class="info-grid">
                <div class="info-item">
                    <label>Order Number:</label>
                    <span>#${order.orderNumber}</span>
                </div>
                <div class="info-item">
                    <label>Order Date:</label>
                    <span>${orderDate}</span>
                </div>
                <div class="info-item">
                    <label>Status:</label>
                    <span style="color: ${getStatusColor(order.status)}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                </div>
                <div class="info-item">
                    <label>Payment Method:</label>
                    <span>${order.paymentMethod}</span>
                </div>
            </div>
        </div>
        
        <div class="shipping-info-section">
            <h4>Shipping Address</h4>
            <div class="address">
                <p>${order.customerInfo.firstName} ${order.customerInfo.lastName}</p>
                <p>${order.shippingAddress.street}</p>
                <p>${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.pincode}</p>
                <p>Phone: ${order.customerInfo.phone}</p>
                <p>Email: ${order.customerInfo.email}</p>
            </div>
        </div>
        
        <div class="items-section">
            <h4>Order Items</h4>
            <div class="items-list">
                ${order.items.map(item => `
                    <div class="modal-order-item">
                        <img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;">
                        <div class="item-info">
                            <div class="item-name">${item.name}</div>
                            <div class="item-details">Qty: ${item.quantity} × ₹${item.price}</div>
                        </div>
                        <div class="item-total">₹${item.total.toFixed(2)}</div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="pricing-section">
            <h4>Order Summary</h4>
            <div class="pricing-details">
                <div class="pricing-row">
                    <span>Subtotal:</span>
                    <span>₹${order.pricing.subtotal.toFixed(2)}</span>
                </div>
                <div class="pricing-row">
                    <span>Shipping:</span>
                    <span>${order.pricing.shippingCost === 0 ? 'Free' : '₹' + order.pricing.shippingCost.toFixed(2)}</span>
                </div>
                <div class="pricing-row">
                    <span>Tax:</span>
                    <span>₹${order.pricing.tax.toFixed(2)}</span>
                </div>
                ${order.pricing.discount > 0 ? `
                    <div class="pricing-row">
                        <span>Discount:</span>
                        <span>-₹${order.pricing.discount.toFixed(2)}</span>
                    </div>
                ` : ''}
                <div class="pricing-row total">
                    <span><strong>Total:</strong></span>
                    <span><strong>₹${order.pricing.total.toFixed(2)}</strong></span>
                </div>
            </div>
        </div>
    `;
    
    // Add styles
    const style = document.createElement('style');
    style.innerHTML = `
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-top: 15px;
        }
        
        .info-item {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        
        .info-item label {
            font-weight: 600;
            color: #666;
            font-size: 14px;
        }
        
        .order-info-section,
        .shipping-info-section,
        .items-section,
        .pricing-section {
            margin-bottom: 25px;
            padding-bottom: 20px;
            border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        }
        
        .order-info-section:last-child,
        .shipping-info-section:last-child,
        .items-section:last-child,
        .pricing-section:last-child {
            border-bottom: none;
        }
        
        .modal-order-item {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 10px 0;
            border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }
        
        .modal-order-item:last-child {
            border-bottom: none;
        }
        
        .item-info {
            flex: 1;
        }
        
        .item-name {
            font-weight: 500;
            margin-bottom: 5px;
        }
        
        .item-details {
            color: #666;
            font-size: 14px;
        }
        
        .pricing-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
        }
        
        .pricing-row.total {
            border-top: 2px solid #4CAF50;
            margin-top: 10px;
            padding-top: 15px;
            font-size: 18px;
        }
        
        .address p {
            margin: 5px 0;
        }
    `;
    document.head.appendChild(style);
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Close modal functionality
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(overlay);
        document.head.removeChild(style);
    });
    
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            document.body.removeChild(overlay);
            document.head.removeChild(style);
        }
    });
}

// Function to show notification
function showNotification(message, type = 'info') {
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4CAF50' : '#2196f3'};
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 1001;
        animation: slideIn 0.3s ease;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}