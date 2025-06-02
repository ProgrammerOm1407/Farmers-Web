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
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const orders = [];
    
    querySnapshot.forEach((doc) => {
      orders.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return orders;
  } catch (error) {
    console.error('Error getting user orders: ', error);
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
 * Get all products
 * @returns {Promise<Array>} - Array of products
 */
export async function getProducts() {
  try {
    const querySnapshot = await getDocs(collection(db, 'products'));
    const products = [];
    
    querySnapshot.forEach((doc) => {
      products.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return products;
  } catch (error) {
    console.error('Error getting products: ', error);
    throw new Error('Failed to get products: ' + error.message);
  }
}

/**
 * Add a new product
 * @param {Object} productData - Product data
 * @returns {Promise<string>} - Product ID
 */
export async function addProduct(productData) {
  try {
    const productWithTimestamp = {
      ...productData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'products'), productWithTimestamp);
    
    console.log('Product added with ID: ', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding product: ', error);
    throw new Error('Failed to add product: ' + error.message);
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