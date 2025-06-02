// Firebase Authentication functionality for Farmers Web

import { 
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

import { auth } from './firebase-config.js';
import { signInUser, signOutUser, resetPassword } from './firebase-service.js';

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider();

document.addEventListener('DOMContentLoaded', function() {
    console.log('Auth.js loaded, Firebase auth:', auth);
    
    // Check authentication state
    onAuthStateChanged(auth, (user) => {
        console.log('Auth state changed:', user);
        if (user) {
            updateUIForLoggedInUser(user);
            // Store user info in localStorage for quick access
            localStorage.setItem('farmersWebUser', JSON.stringify({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL
            }));
        } else {
            updateUIForLoggedOutUser();
            // Clear user info from localStorage
            localStorage.removeItem('farmersWebUser');
        }
    });
    
    // Initialize UI immediately if user is already logged in
    if (auth.currentUser) {
        updateUIForLoggedInUser(auth.currentUser);
    } else {
        // Check localStorage for quick UI update
        const storedUser = localStorage.getItem('farmersWebUser');
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                // Quick UI update while waiting for auth state
                updateUIForLoggedInUser(userData);
            } catch (e) {
                console.error('Error parsing stored user data:', e);
                localStorage.removeItem('farmersWebUser');
            }
        }
    }
    
    // Google Sign-In
    const googleLoginBtn = document.getElementById('google-login-btn');
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', async function() {
            try {
                // Add loading state
                this.classList.add('loading');
                this.disabled = true;
                
                const result = await signInWithPopup(auth, googleProvider);
                const user = result.user;
                
                showNotification('Login successful! Redirecting...');
                
                // Redirect to home page after a short delay
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 1500);
                
            } catch (error) {
                console.error('Google sign-in error:', error);
                let errorMessage = 'Failed to sign in with Google';
                
                switch (error.code) {
                    case 'auth/popup-closed-by-user':
                        errorMessage = 'Sign-in was cancelled';
                        break;
                    case 'auth/popup-blocked':
                        errorMessage = 'Popup was blocked by browser';
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
    
    // Toggle password visibility
    const togglePasswordBtn = document.querySelector('.toggle-password');
    
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', function() {
            const passwordInput = document.getElementById('password');
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
    }
    
    // Email login form submission
    const emailLoginForm = document.getElementById('email-login-form');
    
    if (emailLoginForm) {
        emailLoginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const submitBtn = this.querySelector('button[type="submit"]');
            
            // Simple validation
            if (!email || !validateEmail(email)) {
                showAlert('Please enter a valid email address');
                return;
            }
            
            if (!password) {
                showAlert('Please enter your password');
                return;
            }
            
            try {
                // Add loading state
                submitBtn.classList.add('loading');
                submitBtn.disabled = true;
                
                // Sign in with Firebase
                await signInWithEmailAndPassword(auth, email, password);
                
                showNotification('Login successful! Redirecting...');
                
                // Redirect to home page after a short delay
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 1500);
                
            } catch (error) {
                console.error('Email sign-in error:', error);
                let errorMessage = 'Invalid email or password';
                
                switch (error.code) {
                    case 'auth/user-not-found':
                        errorMessage = 'No account found with this email';
                        break;
                    case 'auth/wrong-password':
                        errorMessage = 'Incorrect password';
                        break;
                    case 'auth/invalid-email':
                        errorMessage = 'Invalid email address';
                        break;
                    case 'auth/user-disabled':
                        errorMessage = 'This account has been disabled';
                        break;
                    case 'auth/too-many-requests':
                        errorMessage = 'Too many failed attempts. Please try again later';
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
    
    // Logout functionality
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            
            try {
                await signOut(auth);
                showNotification('You have been logged out');
                
                // Redirect to home page
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 1500);
            } catch (error) {
                console.error('Logout error:', error);
                showAlert('Failed to logout. Please try again.');
            }
        });
    }
    
    // Forgot password functionality
    const forgotPasswordLink = document.querySelector('.forgot-password');
    const forgotPasswordModal = document.getElementById('forgot-password-modal');
    const closeForgotModalBtn = document.getElementById('close-forgot-modal');
    const overlay = document.getElementById('overlay');
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    
    if (forgotPasswordLink && forgotPasswordModal) {
        // Open modal when clicking forgot password link
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Pre-fill email if it exists in the login form
            const loginEmail = document.getElementById('email').value.trim();
            const resetEmail = document.getElementById('reset-email');
            
            if (loginEmail && validateEmail(loginEmail) && resetEmail) {
                resetEmail.value = loginEmail;
            }
            
            // Show modal and overlay
            document.body.style.overflow = 'hidden'; // Prevent scrolling
            forgotPasswordModal.classList.add('active');
            if (overlay) overlay.style.display = 'block';
        });
        
        // Close modal when clicking the close button
        if (closeForgotModalBtn) {
            closeForgotModalBtn.addEventListener('click', function() {
                closeResetModal();
            });
        }
        
        // Close modal when clicking outside
        if (overlay) {
            overlay.addEventListener('click', function() {
                closeResetModal();
            });
        }
        
        // Close modal with ESC key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && forgotPasswordModal.classList.contains('active')) {
                closeResetModal();
            }
        });
        
        // Handle form submission
        if (forgotPasswordForm) {
            forgotPasswordForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const email = document.getElementById('reset-email').value.trim();
                
                if (!email || !validateEmail(email)) {
                    showAlert('Please enter a valid email address');
                    return;
                }
                
                const submitBtn = this.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;
                
                try {
                    // Show loading state
                    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
                    submitBtn.disabled = true;
                    
                    // Send password reset email using Firebase
                    await sendPasswordResetEmail(auth, email);
                    
                    // Close the modal
                    closeResetModal();
                    
                    // Show success notification
                    showNotification(`Password reset instructions sent to ${email}`);
                    
                } catch (error) {
                    console.error('Password reset error:', error);
                    let errorMessage = 'Failed to send reset email';
                    
                    switch (error.code) {
                        case 'auth/user-not-found':
                            errorMessage = 'No account found with this email';
                            break;
                        case 'auth/invalid-email':
                            errorMessage = 'Invalid email address';
                            break;
                        case 'auth/too-many-requests':
                            errorMessage = 'Too many requests. Please try again later';
                            break;
                        case 'auth/network-request-failed':
                            errorMessage = 'Network error. Please check your connection';
                            break;
                        default:
                            errorMessage = error.message;
                    }
                    
                    showAlert(errorMessage);
                } finally {
                    // Reset button state
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
            });
        }
        
        // Function to close the reset password modal
        function closeResetModal() {
            document.body.style.overflow = ''; // Re-enable scrolling
            forgotPasswordModal.classList.remove('active');
            if (overlay) overlay.style.display = 'none';
        }
    }
});

// Function to validate email format
function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

// Function to get current logged-in user
function getCurrentUser() {
    return auth.currentUser;
}

// Function to update UI for logged-in user
function updateUIForLoggedInUser(user) {
    const loginBtn = document.querySelector('.login-btn');
    if (loginBtn && !document.querySelector('.user-profile-btn')) {
        // Change class from login-btn to user-profile-btn
        loginBtn.classList.remove('login-btn');
        loginBtn.classList.add('user-profile-btn');
        
        // Use display name or email - extract first name only
        const fullName = user.displayName || user.email.split('@')[0];
        const firstName = extractFirstName(fullName);
        loginBtn.textContent = firstName;
        loginBtn.href = '#';
        
        // Create dropdown for user menu
        const dropdown = document.createElement('div');
        dropdown.className = 'user-dropdown';
        dropdown.style.cssText = `
            position: absolute;
            top: calc(100% + 8px);
            right: 0;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            min-width: 160px;
            z-index: 1100;
            display: none;
            border: 1px solid rgba(0, 0, 0, 0.1);
            overflow: hidden;
        `;
        
        // Determine correct paths based on current page location
        const isInPagesFolder = window.location.pathname.includes('/pages/');
        const profilePath = isInPagesFolder ? 'profile.html' : 'pages/profile.html';
        
        dropdown.innerHTML = `
            <div style="position: absolute; top: -8px; right: 20px; width: 16px; height: 16px; background: white; transform: rotate(45deg); border-top: 1px solid rgba(0, 0, 0, 0.1); border-left: 1px solid rgba(0, 0, 0, 0.1);"></div>
            <ul style="list-style: none; margin: 0; padding: 8px 0;">
                <li><a href="${profilePath}" style="display: block; padding: 12px 16px; text-decoration: none; color: #333; transition: background 0.3s; font-size: 14px; border-bottom: 1px solid #f0f0f0;"><i class="fas fa-user" style="margin-right: 8px; width: 16px;"></i>My Profile</a></li>
                <li><a href="#" id="logout-btn" style="display: block; padding: 12px 16px; text-decoration: none; color: #333; transition: background 0.3s; font-size: 14px;"><i class="fas fa-sign-out-alt" style="margin-right: 8px; width: 16px;"></i>Logout</a></li>
            </ul>
        `;
        
        // Add hover effects to dropdown items
        const dropdownLinks = dropdown.querySelectorAll('a');
        dropdownLinks.forEach(link => {
            link.addEventListener('mouseenter', () => {
                link.style.background = 'rgba(76, 175, 80, 0.1)';
            });
            link.addEventListener('mouseleave', () => {
                link.style.background = 'transparent';
            });
        });
        
        // Create a wrapper for the button and dropdown
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        wrapper.style.display = 'inline-block';
        
        // Insert wrapper before the login button
        loginBtn.parentNode.insertBefore(wrapper, loginBtn);
        
        // Move login button into wrapper
        wrapper.appendChild(loginBtn);
        
        // Add dropdown to wrapper
        wrapper.appendChild(dropdown);
        
        // Toggle dropdown on click
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const isVisible = dropdown.style.display === 'block';
            dropdown.style.display = isVisible ? 'none' : 'block';
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!wrapper.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });
        
        // Handle logout button click
        setTimeout(() => {
            const logoutBtn = dropdown.querySelector('#logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', async function(e) {
                    e.preventDefault();
                    
                    try {
                        await signOut(auth);
                        showNotification('You have been logged out');
                        
                        // Redirect to home page
                        setTimeout(() => {
                            if (isInPagesFolder) {
                                window.location.href = '../index.html';
                            } else {
                                window.location.href = 'index.html';
                            }
                        }, 1500);
                    } catch (error) {
                        console.error('Logout error:', error);
                        showAlert('Failed to logout. Please try again.');
                    }
                });
            }
        }, 100);
    }
}

// Function to update UI for logged-out user
function updateUIForLoggedOutUser() {
    const userProfileBtn = document.querySelector('.user-profile-btn');
    if (userProfileBtn) {
        // Remove the user dropdown
        const wrapper = userProfileBtn.parentElement;
        const dropdown = wrapper.querySelector('.user-dropdown');
        if (dropdown) {
            dropdown.remove();
        }
        
        // Change class back to login-btn
        userProfileBtn.classList.remove('user-profile-btn');
        userProfileBtn.classList.add('login-btn');
        
        // Reset text and href
        userProfileBtn.textContent = 'Login';
        
        // Set the correct href based on current page
        if (window.location.pathname.includes('/index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/Farmers Web/')) {
            userProfileBtn.href = 'pages/login.html';
        } else {
            userProfileBtn.href = 'login.html';
        }
        
        // Move button back to original location
        const navButtons = document.querySelector('.nav-buttons');
        if (navButtons && wrapper.parentElement === navButtons) {
            navButtons.insertBefore(userProfileBtn, wrapper);
            wrapper.remove();
        }
    }
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

// Function to extract first name from full name or email
function extractFirstName(fullName) {
    if (!fullName) return 'User';
    
    // Remove any extra whitespace
    fullName = fullName.trim();
    
    // If it's an email-like string (contains @), use the part before @
    if (fullName.includes('@')) {
        fullName = fullName.split('@')[0];
    }
    
    // Remove any numbers or special characters except spaces, hyphens, and apostrophes
    fullName = fullName.replace(/[^a-zA-Z\s\-']/g, '');
    
    // Split by space and take the first part
    const nameParts = fullName.split(' ').filter(part => part.length > 0);
    let firstName = nameParts[0] || 'User';
    
    // Handle different screen sizes with different truncation lengths
    const isMobile = window.innerWidth <= 768;
    const isSmallMobile = window.innerWidth <= 480;
    
    let maxLength;
    if (isSmallMobile) {
        maxLength = 6;
    } else if (isMobile) {
        maxLength = 8;
    } else {
        maxLength = 12;
    }
    
    // If first name is too long, truncate it
    if (firstName.length > maxLength) {
        firstName = firstName.substring(0, maxLength) + '...';
    }
    
    // Capitalize first letter and make rest lowercase
    firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
    
    return firstName;
}

// Export functions for use in other modules
export { getCurrentUser, updateUIForLoggedInUser, updateUIForLoggedOutUser, showAlert, showNotification };