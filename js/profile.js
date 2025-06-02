// Profile page functionality for Farmers Web
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { collection, query, where, getDocs, updateDoc, doc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { showAlert, showNotification, getUserOrders, formatFirebaseTimestamp } from './firebase-service.js';

// Initialize profile functionality
export function initializeProfile() {
    document.addEventListener('DOMContentLoaded', function() {
        // Check if user is logged in
        onAuthStateChanged(auth, (user) => {
            if (!user) {
                // Redirect to login page if not logged in
                window.location.href = 'login.html';
                return;
            }
            
            // Initialize profile with user data
            initializeProfileData(user);
            
            // Store user reference for later use
            window.currentProfileUser = user;
        });
        
        // Initialize tab functionality
        initializeTabs();
        
        // Initialize form handlers
        initializeFormHandlers();
        
        // Initialize password functionality
        initializePasswordFunctionality();
    });
}

async function initializeProfileData(user) {
    try {
        // Populate basic user information from Firebase Auth
        const displayName = user.displayName || user.email.split('@')[0];
        
        // Update profile header
        const profileNameElement = document.getElementById('profile-name');
        const profileEmailElement = document.getElementById('profile-email');
        const fullnameInput = document.getElementById('fullname');
        const emailInput = document.getElementById('email');
        const profileAvatar = document.getElementById('profile-avatar');
        
        if (profileNameElement) profileNameElement.textContent = displayName;
        if (profileEmailElement) profileEmailElement.textContent = user.email;
        if (fullnameInput) fullnameInput.value = displayName;
        if (emailInput) emailInput.value = user.email;
        
        // Set avatar initials
        if (profileAvatar) {
            const initials = displayName.split(' ').map(name => name[0]).join('').toUpperCase();
            profileAvatar.innerHTML = initials;
        }
        
        // Try to get additional user data from Firestore
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('uid', '==', user.uid));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                const userData = querySnapshot.docs[0].data();
                const phoneInput = document.getElementById('phone');
                const addressInput = document.getElementById('address');
                
                if (userData.phone && phoneInput) {
                    phoneInput.value = userData.phone;
                }
                if (userData.address && addressInput) {
                    addressInput.value = userData.address;
                }
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    } catch (error) {
        console.error('Error initializing profile data:', error);
        showAlert('Error loading profile data. Please refresh the page.');
    }
}

export async function fetchAndDisplayOrders(user) {
    const ordersContainer = document.getElementById('orders');
    if (!ordersContainer) {
        console.error('Orders container not found!');
        return;
    }
    
    // Clear existing content
    ordersContainer.innerHTML = '<div style="text-align: center; padding: 20px;">Loading orders...</div>';
    
    try {
        const orders = await getUserOrders(user.uid);
        console.log('Retrieved orders:', orders.length, 'orders');
        
        if (orders.length === 0) {
            // Display "No Orders Yet" message
            ordersContainer.innerHTML = `
                <div class="no-orders">
                    <i class="fas fa-shopping-bag"></i>
                    <h3>No Orders Yet</h3>
                    <p>You haven't placed any orders yet. Start shopping to see your orders here.</p>
                    <a href="products.html" class="btn primary-btn">Shop Now</a>
                </div>
            `;
        } else {
            // Clear container and display orders
            ordersContainer.innerHTML = '';
            
            orders.forEach(order => {
                const orderCard = document.createElement('div');
                orderCard.className = 'order-card glass-effect';
                
                let itemsHtml = '';
                if (order.items && order.items.length > 0) {
                    order.items.forEach(item => {
                        const itemPrice = item.price || 0;
                        const itemQuantity = item.quantity || 1;
                        const itemTotal = itemPrice * itemQuantity;
                        itemsHtml += `<div class="order-item"><span>${item.name || 'Unknown Item'} (x${itemQuantity})</span><span>₹${itemTotal.toFixed(2)}</span></div>`;
                    });
                } else {
                    itemsHtml = '<div class="order-item"><span>No items found</span><span>₹0.00</span></div>';
                }
                
                // Get order date
                let orderDate = 'Unknown Date';
                if (order.createdAt) {
                    orderDate = formatFirebaseTimestamp(order.createdAt);
                } else if (order.orderDate) {
                    orderDate = new Date(order.orderDate).toLocaleDateString();
                } else if (order.date) {
                    orderDate = order.date;
                }
                
                // Get total amount
                const totalAmount = order.totalAmount || order.total || order.pricing?.total || 0;
                
                orderCard.innerHTML = `
                    <div class="order-header">
                        <h4>Order #${order.orderNumber || order.id || 'Unknown'}</h4>
                        <span class="order-status status-${order.status || 'pending'}">${(order.status || 'pending').charAt(0).toUpperCase() + (order.status || 'pending').slice(1)}</span>
                    </div>
                    <div class="order-items">
                        ${itemsHtml}
                    </div>
                    <div class="order-footer">
                        <span>Total: ₹${totalAmount.toFixed(2)}</span>
                        <span>Date: ${orderDate}</span>
                    </div>
                `;
                ordersContainer.appendChild(orderCard);
            });
        }
    } catch (error) {
        console.error('Error fetching user orders:', error);
        ordersContainer.innerHTML = `
            <div class="no-orders">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error Loading Orders</h3>
                <p>There was an error loading your orders. Please try again.</p>
                <button class="btn primary-btn" onclick="location.reload()">Refresh Page</button>
            </div>
        `;
    }
}

function initializeTabs() {
    // Tab switching functionality
    const profileTabs = document.querySelectorAll('.profile-tab');
    const profileContents = document.querySelectorAll('.profile-content');
    
    profileTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs and contents
            profileTabs.forEach(t => t.classList.remove('active'));
            profileContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Show corresponding content
            const tabName = this.getAttribute('data-tab');
            const targetContent = document.getElementById(tabName);
            if (targetContent) {
                targetContent.classList.add('active');
                
                // If switching to orders tab, load orders if not already loaded
                if (tabName === 'orders') {
                    const ordersContainer = document.getElementById('orders');
                    if (ordersContainer && !ordersContainer.dataset.ordersLoaded) {
                        const user = window.currentProfileUser || auth.currentUser;
                        if (user) {
                            ordersContainer.dataset.ordersLoaded = 'true';
                            fetchAndDisplayOrders(user);
                        }
                    }
                }
            }
        });
    });
}

function initializeFormHandlers() {
    // Personal info form submission
    const personalInfoForm = document.getElementById('personal-info-form');
    
    if (personalInfoForm) {
        personalInfoForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const user = auth.currentUser;
            if (!user) return;
            
            // Get form values
            const fullname = document.getElementById('fullname').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const address = document.getElementById('address').value.trim();
            const submitBtn = this.querySelector('button[type="submit"]');
            
            // Validate form
            if (!fullname) {
                showAlert('Please enter your full name');
                return;
            }
            
            if (phone && (phone.length !== 10 || !/^\d+$/.test(phone))) {
                showAlert('Please enter a valid 10-digit mobile number');
                return;
            }
            
            try {
                // Add loading state
                submitBtn.classList.add('loading');
                submitBtn.disabled = true;
                
                // Update Firebase Auth profile
                await updateProfile(user, {
                    displayName: fullname
                });
                
                // Update Firestore document
                const usersRef = collection(db, 'users');
                const q = query(usersRef, where('uid', '==', user.uid));
                const querySnapshot = await getDocs(q);
                
                if (!querySnapshot.empty) {
                    const userDocRef = doc(db, 'users', querySnapshot.docs[0].id);
                    await updateDoc(userDocRef, {
                        fullname: fullname,
                        phone: phone || null,
                        address: address || null,
                        updatedAt: new Date()
                    });
                }
                
                // Update profile header
                const profileNameElement = document.getElementById('profile-name');
                if (profileNameElement) {
                    profileNameElement.textContent = fullname;
                }
                
                // Update avatar initials
                const profileAvatar = document.getElementById('profile-avatar');
                if (profileAvatar) {
                    const initials = fullname.split(' ').map(name => name[0]).join('').toUpperCase();
                    profileAvatar.innerHTML = initials;
                }
                
                // Show success notification
                showNotification('Profile updated successfully');
                
            } catch (error) {
                console.error('Error updating profile:', error);
                showAlert('Failed to update profile. Please try again.');
            } finally {
                // Remove loading state
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
            }
        });
    }
    
    // Security form submission
    const securityForm = document.getElementById('security-form');
    
    if (securityForm) {
        securityForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const user = auth.currentUser;
            if (!user) return;
            
            // Get form values
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmNewPassword = document.getElementById('confirm-new-password').value;
            const submitBtn = this.querySelector('button[type="submit"]');
            
            // Validate form
            if (!currentPassword) {
                showAlert('Please enter your current password');
                return;
            }
            
            if (!newPassword) {
                showAlert('Please enter a new password');
                return;
            }
            
            if (newPassword.length < 6) {
                showAlert('New password must be at least 6 characters long');
                return;
            }
            
            const passwordStrength = checkPasswordStrength(newPassword);
            if (passwordStrength.score < 2) {
                showAlert('Please choose a stronger password');
                return;
            }
            
            if (newPassword !== confirmNewPassword) {
                showAlert('New passwords do not match');
                return;
            }
            
            try {
                // Add loading state
                submitBtn.classList.add('loading');
                submitBtn.disabled = true;
                
                // Re-authenticate user with current password
                const credential = EmailAuthProvider.credential(user.email, currentPassword);
                await reauthenticateWithCredential(user, credential);
                
                // Update password
                await updatePassword(user, newPassword);
                
                // Clear form
                this.reset();
                
                // Show success notification
                showNotification('Password updated successfully');
                
            } catch (error) {
                console.error('Error updating password:', error);
                let errorMessage = 'Failed to update password';
                
                switch (error.code) {
                    case 'auth/wrong-password':
                        errorMessage = 'Current password is incorrect';
                        break;
                    case 'auth/weak-password':
                        errorMessage = 'New password is too weak';
                        break;
                    case 'auth/requires-recent-login':
                        errorMessage = 'Please log out and log back in before changing your password';
                        break;
                    default:
                        errorMessage = error.message;
                }
                
                showAlert(errorMessage);
            } finally {
                // Remove loading state
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
            }
        });
    }
}

function initializePasswordFunctionality() {
    // Toggle password visibility
    const togglePasswordBtns = document.querySelectorAll('.toggle-password');
    
    togglePasswordBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const passwordInput = this.previousElementSibling;
            const icon = this.querySelector('i');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });
    
    // Password strength meter
    const newPasswordInput = document.getElementById('new-password');
    const strengthBar = document.getElementById('strength-bar');
    const strengthText = document.getElementById('strength-text');
    
    if (newPasswordInput && strengthBar && strengthText) {
        newPasswordInput.addEventListener('input', function() {
            const password = this.value;
            const strength = checkPasswordStrength(password);
            
            // Update strength bar
            strengthBar.style.width = strength.score * 25 + '%';
            strengthBar.className = 'strength-bar ' + strength.level;
            
            // Update strength text
            strengthText.textContent = strength.message;
        });
    }
}

// Function to check password strength
function checkPasswordStrength(password) {
    // Initialize score and feedback
    let score = 0;
    let level = '';
    let message = '';
    
    // Check length
    if (password.length < 6) {
        return { score: 0, level: 'very-weak', message: 'Very weak - Too short' };
    } else if (password.length >= 8) {
        score += 1;
    } else if (password.length >= 10) {
        score += 2;
    }
    
    // Check for mixed case
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) {
        score += 1;
    }
    
    // Check for numbers
    if (password.match(/\d/)) {
        score += 1;
    }
    
    // Check for special characters
    if (password.match(/[^a-zA-Z\d]/)) {
        score += 1;
    }
    
    // Determine strength level and message
    if (score < 2) {
        level = 'weak';
        message = 'Weak - Add numbers or symbols';
    } else if (score < 3) {
        level = 'medium';
        message = 'Medium - Add more variety';
    } else if (score < 4) {
        level = 'strong';
        message = 'Strong - Good job!';
    } else {
        level = 'very-strong';
        message = 'Very strong - Excellent!';
    }
    
    return { score, level, message };
}