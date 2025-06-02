// Firebase Registration functionality for Farmers Web

import { 
    createUserWithEmailAndPassword,
    updateProfile,
    onAuthStateChanged,
    signInWithPopup,
    GoogleAuthProvider
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

import { 
    collection, 
    addDoc, 
    serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

import { auth, db } from './firebase-config.js';

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider();

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is already logged in, redirect to home
            window.location.href = '../index.html';
        }
    });
    
    // Google Sign-Up
    const googleRegisterBtn = document.getElementById('google-register-btn');
    if (googleRegisterBtn) {
        googleRegisterBtn.addEventListener('click', async function() {
            try {
                // Add loading state
                this.classList.add('loading');
                this.disabled = true;
                
                const result = await signInWithPopup(auth, googleProvider);
                const user = result.user;
                
                // Save additional user data to Firestore
                const userDocData = {
                    uid: user.uid,
                    fullname: user.displayName || 'Google User',
                    email: user.email,
                    phone: null,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                };
                
                await addDoc(collection(db, 'users'), userDocData);
                
                showNotification('Account created successfully! Redirecting...');
                
                // Redirect to home page after a short delay
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 1500);
                
            } catch (error) {
                console.error('Google sign-up error:', error);
                let errorMessage = 'Failed to sign up with Google';
                
                switch (error.code) {
                    case 'auth/popup-closed-by-user':
                        errorMessage = 'Sign-up was cancelled';
                        break;
                    case 'auth/popup-blocked':
                        errorMessage = 'Popup was blocked by browser';
                        break;
                    case 'auth/account-exists-with-different-credential':
                        errorMessage = 'An account already exists with this email';
                        break;
                    case 'auth/network-request-failed':
                        errorMessage = 'Network error. Please check your connection';
                        break;
                    default:
                        errorMessage = error.message;
                }
                
                showAlert(errorMessage);
            } finally {
                // Remove loading state
                this.classList.remove('loading');
                this.disabled = false;
            }
        });
    }
    // Toggle password visibility for both password fields
    const togglePasswordBtns = document.querySelectorAll('.toggle-password');
    
    if (togglePasswordBtns.length > 0) {
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
    }
    
    // Password strength meter
    const passwordInput = document.getElementById('password');
    const strengthBar = document.getElementById('strength-bar');
    const strengthText = document.getElementById('strength-text');
    
    if (passwordInput && strengthBar && strengthText) {
        passwordInput.addEventListener('input', function() {
            const password = this.value;
            const strength = checkPasswordStrength(password);
            
            // Update strength bar
            strengthBar.style.width = strength.score * 25 + '%';
            strengthBar.className = 'strength-bar ' + strength.level;
            
            // Update strength text
            strengthText.textContent = strength.message;
        });
    }
    
    // Registration form submission
    const registerForm = document.getElementById('register-form');
    
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get form values
            const fullname = document.getElementById('fullname').value.trim();
            const email = document.getElementById('email').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const termsChecked = document.getElementById('terms').checked;
            const submitBtn = this.querySelector('button[type="submit"]');
            
            // Validate form
            if (!fullname) {
                showAlert('Please enter your full name');
                return;
            }
            
            if (!email || !validateEmail(email)) {
                showAlert('Please enter a valid email address');
                return;
            }
            
            if (phone && (phone.length !== 10 || !/^\d+$/.test(phone))) {
                showAlert('Please enter a valid 10-digit mobile number');
                return;
            }
            
            if (!password || password.length < 6) {
                showAlert('Password must be at least 6 characters long');
                return;
            }
            
            const passwordStrength = checkPasswordStrength(password);
            if (passwordStrength.score < 2) {
                showAlert('Please choose a stronger password');
                return;
            }
            
            if (password !== confirmPassword) {
                showAlert('Passwords do not match');
                return;
            }
            
            if (!termsChecked) {
                showAlert('You must agree to the Terms of Service and Privacy Policy');
                return;
            }
            
            try {
                // Add loading state
                submitBtn.classList.add('loading');
                submitBtn.disabled = true;
                
                // Create user with Firebase Authentication
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                
                // Update user profile with display name
                await updateProfile(user, {
                    displayName: fullname
                });
                
                // Save additional user data to Firestore
                const userDocData = {
                    uid: user.uid,
                    fullname: fullname,
                    email: email,
                    phone: phone || null,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                };
                
                await addDoc(collection(db, 'users'), userDocData);
                
                // Show success notification
                showNotification('Account created successfully! Redirecting to home...');
                
                // Redirect to home page after a short delay
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 2000);
                
            } catch (error) {
                console.error('Registration error:', error);
                let errorMessage = 'Failed to create account';
                
                switch (error.code) {
                    case 'auth/email-already-in-use':
                        errorMessage = 'An account with this email already exists';
                        break;
                    case 'auth/invalid-email':
                        errorMessage = 'Invalid email address';
                        break;
                    case 'auth/weak-password':
                        errorMessage = 'Password is too weak';
                        break;
                    case 'auth/network-request-failed':
                        errorMessage = 'Network error. Please check your connection';
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
});

// Function to validate email format
function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
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



// Function to show alert
function showAlert(message) {
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