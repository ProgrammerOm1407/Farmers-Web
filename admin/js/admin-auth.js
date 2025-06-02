// Admin Authentication JavaScript
import { 
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

import { auth } from '../js/firebase-config.js';
import { 
    registerAdminUser, 
    signInAdminUser, 
    getAdminUserByUid,
    USER_ROLES 
} from './admin-firebase-service.js';

// Global variables
let currentUser = null;
let currentUserData = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin Auth loaded');
    
    // Check if user is already authenticated
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                const userData = await getAdminUserByUid(user.uid);
                if (userData && userData.status === 'active') {
                    currentUser = user;
                    currentUserData = userData;
                    
                    // Store user info in localStorage
                    localStorage.setItem('adminUser', JSON.stringify({
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName,
                        role: userData.role,
                        permissions: userData.permissions,
                        businessName: userData.businessName
                    }));
                    
                    // Redirect to dashboard if on login page
                    if (window.location.pathname.includes('login.html')) {
                        window.location.href = 'index.html';
                    }
                } else {
                    // User not found in admin database or inactive
                    console.log('User not found in admin database or inactive');
                    await signOut(auth);
                    localStorage.removeItem('adminUser');
                    
                    if (!window.location.pathname.includes('login.html') && 
                        !window.location.pathname.includes('register.html')) {
                        window.location.href = 'login.html';
                    }
                }
            } catch (error) {
                console.error('Error checking user data:', error);
                await signOut(auth);
                localStorage.removeItem('adminUser');
                
                if (!window.location.pathname.includes('login.html') && 
                    !window.location.pathname.includes('register.html')) {
                    window.location.href = 'login.html';
                }
            }
        } else {
            // User not authenticated
            currentUser = null;
            currentUserData = null;
            localStorage.removeItem('adminUser');
            
            // Redirect to login if not on auth pages
            if (!window.location.pathname.includes('login.html') && 
                !window.location.pathname.includes('register.html')) {
                window.location.href = 'login.html';
            }
        }
    });
    
    // Initialize page-specific functionality
    initializeAuthPages();
});

function initializeAuthPages() {
    // Login page functionality
    if (window.location.pathname.includes('login.html')) {
        initializeLoginPage();
    }
    
    // Register page functionality
    if (window.location.pathname.includes('register.html')) {
        initializeRegisterPage();
    }
    
    // Dashboard pages functionality
    if (!window.location.pathname.includes('login.html') && 
        !window.location.pathname.includes('register.html')) {
        initializeDashboardPages();
    }
}

function initializeLoginPage() {
    const loginForm = document.getElementById('admin-login-form');
    const togglePasswordBtn = document.querySelector('.toggle-password');
    const forgotPasswordLink = document.querySelector('.forgot-password');
    const forgotPasswordOverlay = document.getElementById('forgot-password-overlay');
    const closeForgotModal = document.getElementById('close-forgot-modal');
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    
    // Toggle password visibility
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
    
    // Login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const submitBtn = this.querySelector('button[type="submit"]');
            
            // Validation
            if (!email || !validateEmail(email)) {
                showNotification('Please enter a valid email address', 'error');
                return;
            }
            
            if (!password) {
                showNotification('Please enter your password', 'error');
                return;
            }
            
            try {
                // Show loading state
                showLoadingOverlay('Signing you in...');
                submitBtn.classList.add('loading');
                
                // Sign in user
                const userData = await signInAdminUser(email, password);
                
                showNotification('Login successful! Redirecting...', 'success');
                
                // Redirect based on role
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
                
            } catch (error) {
                console.error('Login error:', error);
                let errorMessage = 'Invalid email or password';
                
                switch (error.code) {
                    case 'auth/user-not-found':
                        errorMessage = 'No account found with this email. Please use the Quick Admin Setup first.';
                        break;
                    case 'auth/wrong-password':
                    case 'auth/invalid-credential':
                        errorMessage = 'Incorrect password. Default password is: admin123456';
                        break;
                    case 'auth/invalid-email':
                        errorMessage = 'Invalid email address';
                        break;
                    case 'auth/user-disabled':
                        errorMessage = 'This account has been disabled';
                        break;
                    case 'admin/user-not-found':
                        errorMessage = 'User not found in admin database. Please run Quick Admin Setup first.';
                        break;
                        break;
                    case 'auth/too-many-requests':
                        errorMessage = 'Too many failed attempts. Please try again later';
                        break;
                    default:
                        errorMessage = error.message;
                }
                
                showNotification(errorMessage, 'error');
            } finally {
                hideLoadingOverlay();
                submitBtn.classList.remove('loading');
            }
        });
    }
    
    // Forgot password functionality
    if (forgotPasswordLink && forgotPasswordOverlay) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Pre-fill email if available
            const loginEmail = document.getElementById('email').value.trim();
            const resetEmail = document.getElementById('reset-email');
            
            if (loginEmail && validateEmail(loginEmail) && resetEmail) {
                resetEmail.value = loginEmail;
            }
            
            forgotPasswordOverlay.classList.add('active');
        });
        
        if (closeForgotModal) {
            closeForgotModal.addEventListener('click', function() {
                forgotPasswordOverlay.classList.remove('active');
            });
        }
        
        forgotPasswordOverlay.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
        
        if (forgotPasswordForm) {
            forgotPasswordForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const email = document.getElementById('reset-email').value.trim();
                
                if (!email || !validateEmail(email)) {
                    showNotification('Please enter a valid email address', 'error');
                    return;
                }
                
                const submitBtn = this.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;
                
                try {
                    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
                    submitBtn.disabled = true;
                    
                    await sendPasswordResetEmail(auth, email);
                    
                    forgotPasswordOverlay.classList.remove('active');
                    showNotification(`Password reset instructions sent to ${email}`, 'success');
                    
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
                        default:
                            errorMessage = error.message;
                    }
                    
                    showNotification(errorMessage, 'error');
                } finally {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
            });
        }
    }
}

function initializeRegisterPage() {
    const registerForm = document.getElementById('admin-register-form');
    const togglePasswordBtns = document.querySelectorAll('.toggle-password');
    const successModal = document.getElementById('success-modal');
    
    // Toggle password visibility
    togglePasswordBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const passwordInput = this.parentElement.querySelector('input');
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
    
    // Register form submission
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const userData = {
                firstName: formData.get('firstName').trim(),
                lastName: formData.get('lastName').trim(),
                email: formData.get('email').trim(),
                phone: formData.get('phone').trim(),
                role: formData.get('role'),
                businessName: formData.get('businessName').trim(),
                businessType: formData.get('businessType'),
                description: formData.get('description').trim(),
                password: formData.get('password'),
                confirmPassword: formData.get('confirmPassword')
            };
            
            // Validation
            if (!userData.firstName || !userData.lastName) {
                showNotification('Please enter your full name', 'error');
                return;
            }
            
            if (!userData.email || !validateEmail(userData.email)) {
                showNotification('Please enter a valid email address', 'error');
                return;
            }
            
            if (!userData.phone) {
                showNotification('Please enter your phone number', 'error');
                return;
            }
            
            if (!userData.role) {
                showNotification('Please select your role', 'error');
                return;
            }
            
            if (!userData.password || userData.password.length < 6) {
                showNotification('Password must be at least 6 characters long', 'error');
                return;
            }
            
            if (userData.password !== userData.confirmPassword) {
                showNotification('Passwords do not match', 'error');
                return;
            }
            
            if (!document.getElementById('terms-agreement').checked) {
                showNotification('Please agree to the Terms of Service', 'error');
                return;
            }
            
            const submitBtn = this.querySelector('button[type="submit"]');
            
            try {
                showLoadingOverlay('Creating your account...');
                submitBtn.classList.add('loading');
                
                // Register user
                const result = await registerAdminUser(userData);
                
                // Show success modal
                if (successModal) {
                    successModal.classList.add('active');
                }
                
                // Reset form
                this.reset();
                
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
                    default:
                        errorMessage = error.message;
                }
                
                showNotification(errorMessage, 'error');
            } finally {
                hideLoadingOverlay();
                submitBtn.classList.remove('loading');
            }
        });
    }
}

function initializeDashboardPages() {
    // Logout functionality
    const logoutBtn = document.getElementById('admin-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            
            try {
                await signOut(auth);
                localStorage.removeItem('adminUser');
                showNotification('You have been logged out', 'info');
                
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1000);
            } catch (error) {
                console.error('Logout error:', error);
                showNotification('Failed to logout. Please try again.', 'error');
            }
        });
    }
    
    // Update UI with user info
    updateDashboardUI();
    
    // Sidebar toggle functionality
    initializeSidebar();
}

function updateDashboardUI() {
    const storedUser = localStorage.getItem('adminUser');
    if (storedUser) {
        try {
            const userData = JSON.parse(storedUser);
            
            // Update user name and role
            const adminName = document.getElementById('admin-name');
            const adminRole = document.getElementById('admin-role');
            
            if (adminName) {
                adminName.textContent = userData.displayName || userData.email;
            }
            
            if (adminRole) {
                adminRole.textContent = userData.role.charAt(0).toUpperCase() + userData.role.slice(1);
            }
            
        } catch (error) {
            console.error('Error parsing stored user data:', error);
            localStorage.removeItem('adminUser');
        }
    }
}

function initializeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const mobileSidebarToggle = document.getElementById('mobile-sidebar-toggle');
    
    // Desktop sidebar toggle
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
        });
    }
    
    // Mobile sidebar toggle
    if (mobileSidebarToggle) {
        mobileSidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }
    
    // Restore sidebar state
    const sidebarCollapsed = localStorage.getItem('sidebarCollapsed');
    if (sidebarCollapsed === 'true') {
        sidebar.classList.add('collapsed');
    }
    
    // Close mobile sidebar when clicking outside
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && !mobileSidebarToggle.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        }
    });
}

// Utility Functions
function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

function showLoadingOverlay(message = 'Loading...') {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        const messageElement = overlay.querySelector('p');
        if (messageElement) {
            messageElement.textContent = message;
        }
        overlay.classList.add('active');
    }
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <p>${message}</p>
        </div>
    `;
    
    container.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
    
    // Remove on click
    notification.addEventListener('click', function() {
        if (this.parentNode) {
            this.parentNode.removeChild(this);
        }
    });
}

// Export functions for use in other modules
window.adminAuth = {
    getCurrentUser: () => currentUser,
    getCurrentUserData: () => currentUserData,
    showNotification,
    showLoadingOverlay,
    hideLoadingOverlay
};