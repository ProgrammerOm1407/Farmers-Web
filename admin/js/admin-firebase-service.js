// Enhanced Firebase Service for Admin Panel
// This file handles all Firebase database operations with role-based access

import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  onSnapshot,
  writeBatch,
  increment
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  updatePassword
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

import { db, auth, storage } from '../js/firebase-config.js';

// ==================== USER ROLES & PERMISSIONS ====================

export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  SELLER: 'seller',
  CUSTOMER: 'customer'
};

export const PERMISSIONS = {
  // Product permissions
  CREATE_PRODUCT: 'create_product',
  READ_PRODUCT: 'read_product',
  UPDATE_PRODUCT: 'update_product',
  DELETE_PRODUCT: 'delete_product',
  
  // Order permissions
  CREATE_ORDER: 'create_order',
  READ_ORDER: 'read_order',
  UPDATE_ORDER: 'update_order',
  DELETE_ORDER: 'delete_order',
  
  // User permissions
  CREATE_USER: 'create_user',
  READ_USER: 'read_user',
  UPDATE_USER: 'update_user',
  DELETE_USER: 'delete_user',
  
  // Analytics permissions
  READ_ANALYTICS: 'read_analytics',
  
  // System permissions
  MANAGE_SETTINGS: 'manage_settings',
  MANAGE_ROLES: 'manage_roles'
};

const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: Object.values(PERMISSIONS),
  [USER_ROLES.MANAGER]: [
    PERMISSIONS.READ_PRODUCT,
    PERMISSIONS.UPDATE_PRODUCT,
    PERMISSIONS.READ_ORDER,
    PERMISSIONS.UPDATE_ORDER,
    PERMISSIONS.READ_USER,
    PERMISSIONS.UPDATE_USER,
    PERMISSIONS.READ_ANALYTICS
  ],
  [USER_ROLES.SELLER]: [
    PERMISSIONS.CREATE_PRODUCT,
    PERMISSIONS.READ_PRODUCT,
    PERMISSIONS.UPDATE_PRODUCT,
    PERMISSIONS.DELETE_PRODUCT,
    PERMISSIONS.READ_ORDER,
    PERMISSIONS.UPDATE_ORDER
  ],
  [USER_ROLES.CUSTOMER]: [
    PERMISSIONS.CREATE_ORDER,
    PERMISSIONS.READ_ORDER,
    PERMISSIONS.READ_PRODUCT
  ]
};

// ==================== AUTHENTICATION & USER MANAGEMENT ====================

/**
 * Register a new admin/seller user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} - User data
 */
export async function registerAdminUser(userData) {
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
      displayName: `${userData.firstName} ${userData.lastName}`
    });
    
    // Save additional user data to Firestore
    const userDocData = {
      uid: user.uid,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      phone: userData.phone,
      role: userData.role,
      businessName: userData.businessName || '',
      businessType: userData.businessType || '',
      description: userData.description || '',
      status: userData.role === USER_ROLES.ADMIN ? 'pending' : 'active', // Admin requires approval
      permissions: ROLE_PERMISSIONS[userData.role] || [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLogin: null,
      isActive: true
    };
    
    await setDoc(doc(db, 'adminUsers', user.uid), userDocData);
    
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      role: userData.role,
      status: userDocData.status
    };
  } catch (error) {
    console.error('Error registering admin user: ', error);
    throw new Error('Failed to register user: ' + error.message);
  }
}

/**
 * Sign in admin user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} - User data with role and permissions
 */
export async function signInAdminUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get user role and permissions from Firestore
    const userData = await getAdminUserByUid(user.uid);
    
    if (!userData) {
      throw new Error('User not found in admin database');
    }
    
    if (userData.status !== 'active') {
      throw new Error('Account is not active. Please contact administrator.');
    }
    
    // Update last login
    await updateAdminUserLastLogin(user.uid);
    
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      role: userData.role,
      permissions: userData.permissions,
      businessName: userData.businessName,
      status: userData.status
    };
  } catch (error) {
    console.error('Error signing in admin user: ', error);
    throw new Error('Failed to sign in: ' + error.message);
  }
}

/**
 * Get admin user by UID
 * @param {string} uid - User UID
 * @returns {Promise<Object|null>} - User data or null
 */
export async function getAdminUserByUid(uid) {
  try {
    const q = query(
      collection(db, 'adminUsers'),
      where('uid', '==', uid),
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
    console.error('Error getting admin user: ', error);
    throw new Error('Failed to get user: ' + error.message);
  }
}

/**
 * Update admin user last login
 * @param {string} uid - User UID
 * @returns {Promise<void>}
 */
export async function updateAdminUserLastLogin(uid) {
  try {
    const userData = await getAdminUserByUid(uid);
    if (userData) {
      const userRef = doc(db, 'adminUsers', userData.id);
      await updateDoc(userRef, {
        lastLogin: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error updating last login: ', error);
  }
}

/**
 * Check if user has permission
 * @param {string} uid - User UID
 * @param {string} permission - Permission to check
 * @returns {Promise<boolean>} - Has permission
 */
export async function hasPermission(uid, permission) {
  try {
    const userData = await getAdminUserByUid(uid);
    return userData && userData.permissions && userData.permissions.includes(permission);
  } catch (error) {
    console.error('Error checking permission: ', error);
    return false;
  }
}

// ==================== PRODUCT MANAGEMENT ====================

/**
 * Add a new product (with seller association)
 * @param {Object} productData - Product data
 * @param {string} sellerUid - Seller UID
 * @returns {Promise<string>} - Product ID
 */
export async function addProduct(productData, sellerUid) {
  try {
    // Check permission
    if (!await hasPermission(sellerUid, PERMISSIONS.CREATE_PRODUCT)) {
      throw new Error('Insufficient permissions to create product');
    }
    
    const productWithMetadata = {
      ...productData,
      sellerId: sellerUid,
      status: 'active',
      views: 0,
      sales: 0,
      rating: 0,
      reviewCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'products'), productWithMetadata);
    
    console.log('Product added with ID: ', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding product: ', error);
    throw new Error('Failed to add product: ' + error.message);
  }
}

/**
 * Get products (filtered by seller if not admin/manager)
 * @param {string} userUid - User UID
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} - Array of products
 */
export async function getProducts(userUid, filters = {}) {
  try {
    const userData = await getAdminUserByUid(userUid);
    
    if (!userData || !await hasPermission(userUid, PERMISSIONS.READ_PRODUCT)) {
      throw new Error('Insufficient permissions to read products');
    }
    
    let q = collection(db, 'products');
    
    // If seller, only show their products
    if (userData.role === USER_ROLES.SELLER) {
      q = query(q, where('sellerId', '==', userUid));
    }
    
    // Apply additional filters
    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }
    
    if (filters.category) {
      q = query(q, where('category', '==', filters.category));
    }
    
    // Add ordering
    q = query(q, orderBy('createdAt', 'desc'));
    
    const querySnapshot = await getDocs(q);
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
 * Update product
 * @param {string} productId - Product ID
 * @param {Object} updateData - Update data
 * @param {string} userUid - User UID
 * @returns {Promise<void>}
 */
export async function updateProduct(productId, updateData, userUid) {
  try {
    if (!await hasPermission(userUid, PERMISSIONS.UPDATE_PRODUCT)) {
      throw new Error('Insufficient permissions to update product');
    }
    
    // Get product to check ownership (if seller)
    const productRef = doc(db, 'products', productId);
    const productSnap = await getDoc(productRef);
    
    if (!productSnap.exists()) {
      throw new Error('Product not found');
    }
    
    const productData = productSnap.data();
    const userData = await getAdminUserByUid(userUid);
    
    // Check if seller owns the product
    if (userData.role === USER_ROLES.SELLER && productData.sellerId !== userUid) {
      throw new Error('You can only update your own products');
    }
    
    const updateWithTimestamp = {
      ...updateData,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(productRef, updateWithTimestamp);
    
    console.log('Product updated successfully');
  } catch (error) {
    console.error('Error updating product: ', error);
    throw new Error('Failed to update product: ' + error.message);
  }
}

/**
 * Delete product
 * @param {string} productId - Product ID
 * @param {string} userUid - User UID
 * @returns {Promise<void>}
 */
export async function deleteProduct(productId, userUid) {
  try {
    if (!await hasPermission(userUid, PERMISSIONS.DELETE_PRODUCT)) {
      throw new Error('Insufficient permissions to delete product');
    }
    
    // Get product to check ownership (if seller)
    const productRef = doc(db, 'products', productId);
    const productSnap = await getDoc(productRef);
    
    if (!productSnap.exists()) {
      throw new Error('Product not found');
    }
    
    const productData = productSnap.data();
    const userData = await getAdminUserByUid(userUid);
    
    // Check if seller owns the product
    if (userData.role === USER_ROLES.SELLER && productData.sellerId !== userUid) {
      throw new Error('You can only delete your own products');
    }
    
    await deleteDoc(productRef);
    
    console.log('Product deleted successfully');
  } catch (error) {
    console.error('Error deleting product: ', error);
    throw new Error('Failed to delete product: ' + error.message);
  }
}

// ==================== ORDER MANAGEMENT ====================

/**
 * Get orders (filtered by seller if not admin/manager)
 * @param {string} userUid - User UID
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} - Array of orders
 */
export async function getOrders(userUid, filters = {}) {
  try {
    const userData = await getAdminUserByUid(userUid);
    
    if (!userData || !await hasPermission(userUid, PERMISSIONS.READ_ORDER)) {
      throw new Error('Insufficient permissions to read orders');
    }
    
    let q = collection(db, 'orders');
    
    // If seller, only show orders containing their products
    if (userData.role === USER_ROLES.SELLER) {
      // This requires a more complex query - we'll need to restructure order data
      // For now, we'll get all orders and filter in memory
      q = query(q, orderBy('createdAt', 'desc'));
    } else {
      // Apply filters for admin/manager
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }
      
      q = query(q, orderBy('createdAt', 'desc'));
    }
    
    const querySnapshot = await getDocs(q);
    const orders = [];
    
    querySnapshot.forEach((doc) => {
      const orderData = doc.data();
      
      // Filter for sellers - only show orders with their products
      if (userData.role === USER_ROLES.SELLER) {
        const hasSellerProducts = orderData.items && orderData.items.some(item => 
          item.sellerId === userUid
        );
        
        if (hasSellerProducts) {
          orders.push({
            id: doc.id,
            ...orderData
          });
        }
      } else {
        orders.push({
          id: doc.id,
          ...orderData
        });
      }
    });
    
    return orders;
  } catch (error) {
    console.error('Error getting orders: ', error);
    throw new Error('Failed to get orders: ' + error.message);
  }
}

/**
 * Update order status
 * @param {string} orderId - Order ID
 * @param {string} status - New status
 * @param {string} userUid - User UID
 * @returns {Promise<void>}
 */
export async function updateOrderStatus(orderId, status, userUid) {
  try {
    if (!await hasPermission(userUid, PERMISSIONS.UPDATE_ORDER)) {
      throw new Error('Insufficient permissions to update order');
    }
    
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (!orderSnap.exists()) {
      throw new Error('Order not found');
    }
    
    const orderData = orderSnap.data();
    const userData = await getAdminUserByUid(userUid);
    
    // Check if seller has products in this order
    if (userData.role === USER_ROLES.SELLER) {
      const hasSellerProducts = orderData.items && orderData.items.some(item => 
        item.sellerId === userUid
      );
      
      if (!hasSellerProducts) {
        throw new Error('You can only update orders containing your products');
      }
    }
    
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

// ==================== CUSTOMER MANAGEMENT ====================

/**
 * Get all customers (admin/manager only)
 * @param {string} userUid - User UID
 * @returns {Promise<Array>} - Array of customers
 */
export async function getCustomers(userUid) {
  try {
    if (!await hasPermission(userUid, PERMISSIONS.READ_USER)) {
      throw new Error('Insufficient permissions to read customers');
    }
    
    const querySnapshot = await getDocs(collection(db, 'users'));
    const customers = [];
    
    querySnapshot.forEach((doc) => {
      customers.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return customers;
  } catch (error) {
    console.error('Error getting customers: ', error);
    throw new Error('Failed to get customers: ' + error.message);
  }
}

// ==================== ANALYTICS ====================

/**
 * Get dashboard analytics
 * @param {string} userUid - User UID
 * @returns {Promise<Object>} - Analytics data
 */
export async function getDashboardAnalytics(userUid) {
  try {
    if (!await hasPermission(userUid, PERMISSIONS.READ_ANALYTICS)) {
      throw new Error('Insufficient permissions to read analytics');
    }
    
    const userData = await getAdminUserByUid(userUid);
    const analytics = {
      totalProducts: 0,
      totalOrders: 0,
      totalCustomers: 0,
      totalRevenue: 0,
      recentOrders: [],
      topProducts: []
    };
    
    // Get products count
    const products = await getProducts(userUid);
    analytics.totalProducts = products.length;
    
    // Get orders count and revenue
    const orders = await getOrders(userUid);
    analytics.totalOrders = orders.length;
    analytics.totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    
    // Get recent orders (last 5)
    analytics.recentOrders = orders.slice(0, 5);
    
    // Get top products (by sales)
    analytics.topProducts = products
      .sort((a, b) => (b.sales || 0) - (a.sales || 0))
      .slice(0, 5);
    
    // Get customers count (admin/manager only)
    if (userData.role === USER_ROLES.ADMIN || userData.role === USER_ROLES.MANAGER) {
      const customers = await getCustomers(userUid);
      analytics.totalCustomers = customers.length;
    }
    
    return analytics;
  } catch (error) {
    console.error('Error getting analytics: ', error);
    throw new Error('Failed to get analytics: ' + error.message);
  }
}

// ==================== FILE UPLOAD ====================

/**
 * Upload product image
 * @param {File} file - Image file
 * @param {string} productId - Product ID
 * @returns {Promise<string>} - Download URL
 */
export async function uploadProductImage(file, productId) {
  try {
    const fileName = `products/${productId}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, fileName);
    
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image: ', error);
    throw new Error('Failed to upload image: ' + error.message);
  }
}

/**
 * Delete product image
 * @param {string} imageUrl - Image URL
 * @returns {Promise<void>}
 */
export async function deleteProductImage(imageUrl) {
  try {
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
  } catch (error) {
    console.error('Error deleting image: ', error);
    throw new Error('Failed to delete image: ' + error.message);
  }
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Format currency
 * @param {number} amount - Amount to format
 * @returns {string} - Formatted currency
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount || 0);
}

/**
 * Format date
 * @param {Object} timestamp - Firebase timestamp
 * @returns {string} - Formatted date
 */
export function formatDate(timestamp) {
  if (!timestamp) return '';
  
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Generate unique ID
 * @returns {string} - Unique ID
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ==================== REAL-TIME LISTENERS ====================

/**
 * Listen to products updates
 * @param {string} userUid - User UID
 * @param {Function} callback - Callback function
 * @returns {Function} - Unsubscribe function
 */
export function listenToProducts(userUid, callback) {
  const userData = getAdminUserByUid(userUid);
  
  let q = collection(db, 'products');
  
  // If seller, only listen to their products
  userData.then(user => {
    if (user && user.role === USER_ROLES.SELLER) {
      q = query(q, where('sellerId', '==', userUid));
    }
    
    return onSnapshot(q, (querySnapshot) => {
      const products = [];
      querySnapshot.forEach((doc) => {
        products.push({
          id: doc.id,
          ...doc.data()
        });
      });
      callback(products);
    });
  });
}

/**
 * Listen to orders updates
 * @param {string} userUid - User UID
 * @param {Function} callback - Callback function
 * @returns {Function} - Unsubscribe function
 */
export function listenToOrders(userUid, callback) {
  const q = query(
    collection(db, 'orders'),
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

// Export auth instance for other modules
export { auth, db, storage };