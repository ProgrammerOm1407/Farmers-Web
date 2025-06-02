// Admin Dashboard JavaScript
import { 
    getDashboardAnalytics,
    getOrders,
    getProducts,
    formatCurrency,
    formatDate,
    USER_ROLES
} from './admin-firebase-service.js';

// Global variables
let currentUserData = null;
let dashboardData = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin Dashboard loaded');
    
    // Initialize mobile navigation
    initializeMobileNavigation();
    
    // Wait for auth to be ready
    setTimeout(() => {
        initializeDashboard();
    }, 1000);
});

// Mobile Navigation
function initializeMobileNavigation() {
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const mobileSidebarToggle = document.getElementById('mobile-sidebar-toggle');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    
    // Mobile sidebar toggle
    if (mobileSidebarToggle) {
        mobileSidebarToggle.addEventListener('click', function() {
            toggleSidebar();
        });
    }
    
    // Desktop sidebar toggle
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            if (window.innerWidth > 992) {
                sidebar.classList.toggle('collapsed');
            } else {
                toggleSidebar();
            }
        });
    }
    
    // Sidebar overlay click
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', function() {
            closeSidebar();
        });
    }
    
    // Close sidebar when clicking nav links on mobile
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 992) {
                closeSidebar();
            }
        });
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 992) {
            closeSidebar();
            sidebar.classList.remove('collapsed');
        }
    });
    
    // Handle escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && sidebar.classList.contains('active')) {
            closeSidebar();
        }
    });
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    
    sidebar.classList.toggle('active');
    if (sidebarOverlay) {
        sidebarOverlay.classList.toggle('active');
    }
    
    // Prevent body scroll when sidebar is open on mobile
    if (sidebar.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    
    sidebar.classList.remove('active');
    if (sidebarOverlay) {
        sidebarOverlay.classList.remove('active');
    }
    
    document.body.style.overflow = '';
}

async function initializeDashboard() {
    try {
        // Get current user data
        const storedUser = localStorage.getItem('adminUser');
        if (!storedUser) {
            window.location.href = 'login.html';
            return;
        }
        
        currentUserData = JSON.parse(storedUser);
        
        // Load dashboard data
        await loadDashboardData();
        
        // Update UI
        updateStatsCards();
        updateRecentOrders();
        updateTopProducts();
        
        // Initialize real-time updates
        initializeRealTimeUpdates();
        
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        window.adminAuth.showNotification('Failed to load dashboard data', 'error');
    }
}

async function loadDashboardData() {
    try {
        window.adminAuth.showLoadingOverlay('Loading dashboard data...');
        
        // Get analytics data
        dashboardData = await getDashboardAnalytics(currentUserData.uid);
        
        console.log('Dashboard data loaded:', dashboardData);
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        throw error;
    } finally {
        window.adminAuth.hideLoadingOverlay();
    }
}

function updateStatsCards() {
    if (!dashboardData) return;
    
    // Update total products
    const totalProductsElement = document.getElementById('total-products');
    if (totalProductsElement) {
        totalProductsElement.textContent = dashboardData.totalProducts.toLocaleString();
    }
    
    // Update total orders
    const totalOrdersElement = document.getElementById('total-orders');
    if (totalOrdersElement) {
        totalOrdersElement.textContent = dashboardData.totalOrders.toLocaleString();
    }
    
    // Update total customers (only for admin/manager)
    const totalCustomersElement = document.getElementById('total-customers');
    if (totalCustomersElement) {
        if (currentUserData.role === USER_ROLES.ADMIN || currentUserData.role === USER_ROLES.MANAGER) {
            totalCustomersElement.textContent = dashboardData.totalCustomers.toLocaleString();
        } else {
            // Hide customer stat for sellers
            const customerCard = totalCustomersElement.closest('.stat-card');
            if (customerCard) {
                customerCard.style.display = 'none';
            }
        }
    }
    
    // Update total revenue
    const totalRevenueElement = document.getElementById('total-revenue');
    if (totalRevenueElement) {
        totalRevenueElement.textContent = formatCurrency(dashboardData.totalRevenue);
    }
}

function updateRecentOrders() {
    const tableBody = document.getElementById('recent-orders-table');
    if (!tableBody || !dashboardData.recentOrders) return;
    
    if (dashboardData.recentOrders.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="no-data">No recent orders found</td></tr>';
        return;
    }
    
    const ordersHTML = dashboardData.recentOrders.map(order => {
        const statusClass = getStatusClass(order.status);
        const customerName = order.customerInfo ? 
            `${order.customerInfo.firstName} ${order.customerInfo.lastName}` : 
            order.customerEmail || 'Unknown';
        
        return `
            <tr onclick="viewOrder('${order.id}')" style="cursor: pointer;">
                <td><strong>#${order.orderNumber || order.id.substring(0, 8)}</strong></td>
                <td>${customerName}</td>
                <td>${formatCurrency(order.total)}</td>
                <td><span class="status-badge ${statusClass}">${order.status}</span></td>
                <td>${formatDate(order.createdAt)}</td>
            </tr>
        `;
    }).join('');
    
    tableBody.innerHTML = ordersHTML;
}

function updateTopProducts() {
    const productsList = document.getElementById('top-products-list');
    if (!productsList || !dashboardData.topProducts) return;
    
    if (dashboardData.topProducts.length === 0) {
        productsList.innerHTML = '<div class="no-data">No products found</div>';
        return;
    }
    
    const productsHTML = dashboardData.topProducts.map(product => {
        return `
            <div class="product-item" onclick="viewProduct('${product.id}')" style="cursor: pointer;">
                <img src="${product.imageUrl || 'images/placeholder-product.jpg'}" 
                     alt="${product.name}" class="product-image">
                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-price">${formatCurrency(product.price)}</div>
                    <div class="product-sales">${product.sales || 0} sold</div>
                </div>
            </div>
        `;
    }).join('');
    
    productsList.innerHTML = productsHTML;
}

function getStatusClass(status) {
    const statusClasses = {
        'pending': 'pending',
        'processing': 'processing',
        'shipped': 'shipped',
        'delivered': 'delivered',
        'cancelled': 'cancelled'
    };
    
    return statusClasses[status] || 'pending';
}

function initializeRealTimeUpdates() {
    // Refresh dashboard data every 5 minutes
    setInterval(async () => {
        try {
            await loadDashboardData();
            updateStatsCards();
            updateRecentOrders();
            updateTopProducts();
        } catch (error) {
            console.error('Error refreshing dashboard:', error);
        }
    }, 5 * 60 * 1000); // 5 minutes
}

// Navigation functions
function viewOrder(orderId) {
    window.location.href = `orders.html?id=${orderId}`;
}

function viewProduct(productId) {
    window.location.href = `products.html?id=${productId}`;
}

// Search functionality
function initializeSearch() {
    const searchInput = document.querySelector('.search-box input');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase().trim();
            
            if (searchTerm.length > 2) {
                performSearch(searchTerm);
            }
        });
    }
}

async function performSearch(searchTerm) {
    try {
        // Search in products and orders
        const [products, orders] = await Promise.all([
            getProducts(currentUserData.uid),
            getOrders(currentUserData.uid)
        ]);
        
        // Filter products
        const matchingProducts = products.filter(product => 
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm)
        );
        
        // Filter orders
        const matchingOrders = orders.filter(order => 
            order.orderNumber?.toLowerCase().includes(searchTerm) ||
            order.customerEmail?.toLowerCase().includes(searchTerm) ||
            order.customerInfo?.firstName?.toLowerCase().includes(searchTerm) ||
            order.customerInfo?.lastName?.toLowerCase().includes(searchTerm)
        );
        
        // Show search results (you can implement a dropdown or modal here)
        console.log('Search results:', { products: matchingProducts, orders: matchingOrders });
        
    } catch (error) {
        console.error('Error performing search:', error);
    }
}

// Notification handling
function initializeNotifications() {
    const notificationBtn = document.querySelector('.notification-btn');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', function() {
            // Toggle notifications dropdown (implement as needed)
            console.log('Show notifications');
        });
    }
}

// User menu handling
function initializeUserMenu() {
    const userMenuBtn = document.querySelector('.user-menu-btn');
    if (userMenuBtn) {
        userMenuBtn.addEventListener('click', function() {
            // Toggle user menu dropdown (implement as needed)
            console.log('Show user menu');
        });
    }
}

// Quick actions
function initializeQuickActions() {
    const actionButtons = document.querySelectorAll('.action-btn');
    actionButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            
            const href = this.getAttribute('onclick');
            if (href) {
                // Extract the URL from onclick attribute
                const match = href.match(/window\.location\.href='([^']+)'/);
                if (match) {
                    window.location.href = match[1];
                }
            }
        });
    });
}

// Chart initialization (if you want to add charts later)
function initializeCharts() {
    // Placeholder for chart initialization
    // You can integrate Chart.js or other charting libraries here
    console.log('Charts would be initialized here');
}

// Export functions for global access
window.dashboard = {
    loadDashboardData,
    updateStatsCards,
    updateRecentOrders,
    updateTopProducts,
    viewOrder,
    viewProduct
};

// Initialize additional features when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        initializeSearch();
        initializeNotifications();
        initializeUserMenu();
        initializeQuickActions();
        initializeCharts();
    }, 1500);
});