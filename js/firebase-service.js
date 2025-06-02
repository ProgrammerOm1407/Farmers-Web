// Firebase Service for Farmers Web
// This file handles all Firebase database operations

import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

import { db, auth } from './firebase-config.js';

// ==================== ORDER OPERATIONS ====================

/**
 * Save order to Firebase
 * @param {Object} orderData - Order data object
 * @returns {Promise<string>} - Order ID
 */
export async function saveOrder(orderData) {
  try {
    // Add timestamp and status
    const orderWithTimestamp = {
      ...orderData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: orderData.status || 'pending'
    };

    // Add order to Firestore
    const docRef = await addDoc(collection(db, 'orders'), orderWithTimestamp);
    
    console.log('Order saved with ID: ', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error saving order: ', error);
    throw new Error('Failed to save order: ' + error.message);
  }
}

/**
 * Get orders for a specific user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of orders
 */
export async function getUserOrders(userId) {
  try {
    console.log('Querying orders for userId:', userId);
    
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const orders = [];
    
    console.log('Query snapshot size:', querySnapshot.size);
    
    querySnapshot.forEach((doc) => {
      const orderData = doc.data();
      console.log('Order data:', orderData);
      orders.push({
        id: doc.id,
        ...orderData
      });
    });
    
    console.log('Final orders array:', orders);
    return orders;
  } catch (error) {
    console.error('Error getting user orders: ', error);
    
    // If the error is due to missing index, try without orderBy
    if (error.code === 'failed-precondition' || error.message.includes('index')) {
      console.log('Retrying without orderBy due to index issue...');
      try {
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', userId)
        );
        
        const querySnapshot = await getDocs(q);
        const orders = [];
        
        querySnapshot.forEach((doc) => {
          orders.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        // Sort manually by date
        orders.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(a.orderDate);
          const dateB = b.createdAt?.toDate?.() || new Date(b.orderDate);
          return dateB - dateA;
        });
        
        return orders;
      } catch (retryError) {
        console.error('Retry also failed:', retryError);
        throw new Error('Failed to get orders: ' + retryError.message);
      }
    }
    
    throw new Error('Failed to get orders: ' + error.message);
  }
}

/**
 * Get a specific order by ID
 * @param {string} orderId - Order ID
 * @returns {Promise<Object>} - Order data
 */
export async function getOrder(orderId) {
  try {
    const docRef = doc(db, 'orders', orderId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } else {
      throw new Error('Order not found');
    }
  } catch (error) {
    console.error('Error getting order: ', error);
    throw new Error('Failed to get order: ' + error.message);
  }
}

/**
 * Update order status
 * @param {string} orderId - Order ID
 * @param {string} status - New status
 * @returns {Promise<void>}
 */
export async function updateOrderStatus(orderId, status) {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      status: status,
      updatedAt: serverTimestamp()
    });
    
    console.log('Order status updated successfully');
  } catch (error) {
    console.error('Error updating order status: ', error);
    throw new Error('Failed to update order status: ' + error.message);
  }
}

// ==================== USER OPERATIONS ====================

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} - User data
 */
export async function registerUser(userData) {
  try {
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      userData.email, 
      userData.password
    );
    
    const user = userCredential.user;
    
    // Update user profile
    await updateProfile(user, {
      displayName: userData.fullname
    });
    
    // Save additional user data to Firestore
    const userDocData = {
      uid: user.uid,
      fullname: userData.fullname,
      email: userData.email,
      phone: userData.phone,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await addDoc(collection(db, 'users'), userDocData);
    
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName
    };
  } catch (error) {
    console.error('Error registering user: ', error);
    throw new Error('Failed to register user: ' + error.message);
  }
}

/**
 * Sign in user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} - User data
 */
export async function signInUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName
    };
  } catch (error) {
    console.error('Error signing in: ', error);
    throw new Error('Failed to sign in: ' + error.message);
  }
}

/**
 * Sign out user
 * @returns {Promise<void>}
 */
export async function signOutUser() {
  try {
    await signOut(auth);
    console.log('User signed out successfully');
  } catch (error) {
    console.error('Error signing out: ', error);
    throw new Error('Failed to sign out: ' + error.message);
  }
}

/**
 * Get current user
 * @returns {Object|null} - Current user or null
 */
export function getCurrentUser() {
  return auth.currentUser;
}

/**
 * Listen to authentication state changes
 * @param {Function} callback - Callback function
 * @returns {Function} - Unsubscribe function
 */
export function onAuthStateChange(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Send password reset email
 * @param {string} email - User email
 * @returns {Promise<void>}
 */
export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log('Password reset email sent');
  } catch (error) {
    console.error('Error sending password reset email: ', error);
    throw new Error('Failed to send password reset email: ' + error.message);
  }
}

// ==================== CUSTOMER OPERATIONS ====================

/**
 * Save customer information
 * @param {Object} customerData - Customer data
 * @returns {Promise<string>} - Customer ID
 */
export async function saveCustomer(customerData) {
  try {
    const customerWithTimestamp = {
      ...customerData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'customers'), customerWithTimestamp);
    
    console.log('Customer saved with ID: ', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error saving customer: ', error);
    throw new Error('Failed to save customer: ' + error.message);
  }
}

/**
 * Get customer by email
 * @param {string} email - Customer email
 * @returns {Promise<Object|null>} - Customer data or null
 */
export async function getCustomerByEmail(email) {
  try {
    const q = query(
      collection(db, 'customers'),
      where('email', '==', email),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting customer: ', error);
    throw new Error('Failed to get customer: ' + error.message);
  }
}

// ==================== PRODUCT OPERATIONS ====================

/**
 * Get all active products for customers
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} - Array of products
 */
export async function getProducts(filters = {}) {
  try {
    let q = collection(db, 'products');
    
    // Only show active products to customers
    q = query(q, where('status', '==', 'active'));
    
    // Apply category filter if provided
    if (filters.category) {
      q = query(q, where('category', '==', filters.category));
    }
    
    // Apply sorting
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'price-low':
          q = query(q, orderBy('price', 'asc'));
          break;
        case 'price-high':
          q = query(q, orderBy('price', 'desc'));
          break;
        case 'newest':
          q = query(q, orderBy('createdAt', 'desc'));
          break;
        case 'popular':
          q = query(q, orderBy('sales', 'desc'));
          break;
        default:
          q = query(q, orderBy('createdAt', 'desc'));
      }
    } else {
      q = query(q, orderBy('createdAt', 'desc'));
    }
    
    const querySnapshot = await getDocs(q);
    const products = [];
    
    querySnapshot.forEach((doc) => {
      const productData = doc.data();
      products.push({
        id: doc.id,
        ...productData,
        // Ensure backward compatibility with existing UI
        oldPrice: productData.originalPrice || null,
        unit: productData.unit || 'kg',
        organic: productData.organic || false,
        popularity: productData.rating || 0
      });
    });
    
    return products;
  } catch (error) {
    console.error('Error getting products: ', error);
    throw new Error('Failed to get products: ' + error.message);
  }
}

/**
 * Get a single product by ID
 * @param {string} productId - Product ID
 * @returns {Promise<Object>} - Product data
 */
export async function getProduct(productId) {
  try {
    const docRef = doc(db, 'products', productId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const productData = docSnap.data();
      return {
        id: docSnap.id,
        ...productData,
        // Ensure backward compatibility
        oldPrice: productData.originalPrice || null,
        unit: productData.unit || 'kg',
        organic: productData.organic || false,
        popularity: productData.rating || 0
      };
    } else {
      throw new Error('Product not found');
    }
  } catch (error) {
    console.error('Error getting product: ', error);
    throw new Error('Failed to get product: ' + error.message);
  }
}

/**
 * Search products
 * @param {string} searchTerm - Search term
 * @param {Object} filters - Additional filters
 * @returns {Promise<Array>} - Array of matching products
 */
export async function searchProducts(searchTerm, filters = {}) {
  try {
    // Get all active products first (Firestore doesn't support full-text search natively)
    const products = await getProducts(filters);
    
    if (!searchTerm) {
      return products;
    }
    
    const term = searchTerm.toLowerCase();
    return products.filter(product => 
      product.name.toLowerCase().includes(term) ||
      product.description?.toLowerCase().includes(term) ||
      product.category.toLowerCase().includes(term)
    );
  } catch (error) {
    console.error('Error searching products: ', error);
    throw new Error('Failed to search products: ' + error.message);
  }
}

/**
 * Get featured products
 * @returns {Promise<Array>} - Array of featured products
 */
export async function getFeaturedProducts() {
  try {
    const q = query(
      collection(db, 'products'),
      where('status', '==', 'active'),
      where('featured', '==', true),
      orderBy('createdAt', 'desc'),
      limit(6)
    );
    
    const querySnapshot = await getDocs(q);
    const products = [];
    
    querySnapshot.forEach((doc) => {
      const productData = doc.data();
      products.push({
        id: doc.id,
        ...productData,
        oldPrice: productData.originalPrice || null,
        unit: productData.unit || 'kg',
        organic: productData.organic || false,
        popularity: productData.rating || 0
      });
    });
    
    return products;
  } catch (error) {
    console.error('Error getting featured products: ', error);
    throw new Error('Failed to get featured products: ' + error.message);
  }
}

/**
 * Get product categories
 * @returns {Promise<Array>} - Array of categories
 */
export async function getProductCategories() {
  try {
    const products = await getProducts();
    const categories = [...new Set(products.map(p => p.category))];
    return categories.sort();
  } catch (error) {
    console.error('Error getting categories: ', error);
    throw new Error('Failed to get categories: ' + error.message);
  }
}

/**
 * Update product view count
 * @param {string} productId - Product ID
 * @returns {Promise<void>}
 */
export async function incrementProductViews(productId) {
  try {
    const productRef = doc(db, 'products', productId);
    await updateDoc(productRef, {
      views: increment(1),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating product views: ', error);
    // Don't throw error for analytics to avoid breaking user experience
  }
}

// ==================== ANALYTICS OPERATIONS ====================

/**
 * Save analytics event
 * @param {Object} eventData - Event data
 * @returns {Promise<string>} - Event ID
 */
export async function saveAnalyticsEvent(eventData) {
  try {
    const eventWithTimestamp = {
      ...eventData,
      timestamp: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'analytics'), eventWithTimestamp);
    
    return docRef.id;
  } catch (error) {
    console.error('Error saving analytics event: ', error);
    // Don't throw error for analytics to avoid breaking user experience
    return null;
  }
}

// ==================== REAL-TIME LISTENERS ====================

/**
 * Listen to order updates
 * @param {string} orderId - Order ID
 * @param {Function} callback - Callback function
 * @returns {Function} - Unsubscribe function
 */
export function listenToOrderUpdates(orderId, callback) {
  const orderRef = doc(db, 'orders', orderId);
  return onSnapshot(orderRef, (doc) => {
    if (doc.exists()) {
      callback({
        id: doc.id,
        ...doc.data()
      });
    }
  });
}

/**
 * Listen to user orders
 * @param {string} userId - User ID
 * @param {Function} callback - Callback function
 * @returns {Function} - Unsubscribe function
 */
export function listenToUserOrders(userId, callback) {
  const q = query(
    collection(db, 'orders'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const orders = [];
    querySnapshot.forEach((doc) => {
      orders.push({
        id: doc.id,
        ...doc.data()
      });
    });
    callback(orders);
  });
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Generate order number
 * @returns {string} - Unique order number
 */
export function generateOrderNumber() {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substr(2, 5).toUpperCase();
  return `FW${timestamp.slice(-6)}${random}`;
}

/**
 * Format Firebase timestamp
 * @param {Object} timestamp - Firebase timestamp
 * @returns {string} - Formatted date string
 */
export function formatFirebaseTimestamp(timestamp) {
  if (!timestamp) return '';
  
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// ==================== UI UTILITY FUNCTIONS ====================

/**
 * Show alert message
 * @param {string} message - Alert message
 */
export function showAlert(message) {
  // Create a custom alert modal instead of browser alert
  const alertModal = document.createElement('div');
  alertModal.className = 'alert-modal';
  alertModal.innerHTML = `
      <div class="alert-content">
          <div class="alert-icon">
              <i class="fas fa-exclamation-triangle"></i>
          </div>
          <div class="alert-message">${message}</div>
          <button class="alert-close-btn">OK</button>
      </div>
  `;
  
  // Add styles
  alertModal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
  `;
  
  const alertContent = alertModal.querySelector('.alert-content');
  alertContent.style.cssText = `
      background: white;
      padding: 30px;
      border-radius: 10px;
      text-align: center;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  `;
  
  const alertIcon = alertModal.querySelector('.alert-icon');
  alertIcon.style.cssText = `
      font-size: 48px;
      color: #ff6b6b;
      margin-bottom: 20px;
  `;
  
  const alertMessage = alertModal.querySelector('.alert-message');
  alertMessage.style.cssText = `
      font-size: 16px;
      color: #333;
      margin-bottom: 25px;
      line-height: 1.5;
  `;
  
  const alertCloseBtn = alertModal.querySelector('.alert-close-btn');
  alertCloseBtn.style.cssText = `
      background: #4CAF50;
      color: white;
      border: none;
      padding: 10px 25px;
      border-radius: 5px;
      font-size: 16px;
      cursor: pointer;
      transition: background 0.3s ease;
  `;
  
  alertCloseBtn.addEventListener('mouseover', () => {
      alertCloseBtn.style.background = '#45a049';
  });
  
  alertCloseBtn.addEventListener('mouseout', () => {
      alertCloseBtn.style.background = '#4CAF50';
  });
  
  // Close modal when clicking the button
  alertCloseBtn.addEventListener('click', () => {
      document.body.removeChild(alertModal);
  });
  
  // Close modal when clicking outside
  alertModal.addEventListener('click', (e) => {
      if (e.target === alertModal) {
          document.body.removeChild(alertModal);
      }
  });
  
  document.body.appendChild(alertModal);
}

/**
 * Show notification message
 * @param {string} message - Notification message
 */
export function showNotification(message) {
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
  notification.style.backgroundColor = 'rgba(76, 175, 80, 0.9)';
  notification.style.color = 'white';
  notification.style.backdropFilter = 'blur(10px)';
  notification.style.padding = '15px 20px';
  notification.style.borderRadius = '10px';
  notification.style.marginTop = '10px';
  notification.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
  notification.style.display = 'flex';
  notification.style.alignItems = 'center';
  notification.style.justifyContent = 'space-between';
  notification.style.animation = 'slideIn 0.3s forwards';
  
  // Add animation keyframes if not already added
  if (!document.querySelector('#notification-styles')) {
      const style = document.createElement('style');
      style.id = 'notification-styles';
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
  }
  
  // Add to container
  notificationContainer.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s forwards';
      setTimeout(() => {
          if (notification.parentNode) {
              notification.remove();
          }
      }, 300);
  }, 3000);
}