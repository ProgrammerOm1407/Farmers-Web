// Authentication functionality for Farmers Web

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    const currentUser = getCurrentUser();
    if (currentUser) {
        // Update UI for logged-in user
        updateUIForLoggedInUser(currentUser);
    }
    
    // Make email tab active by default
    const authTabs = document.querySelectorAll('.auth-tab');
    const authForms = document.querySelectorAll('.auth-form');
    
    // Set email tab as active by default
    if (authTabs.length > 0) {
        // Remove active class from all tabs and forms
        authTabs.forEach(t => t.classList.remove('active'));
        authForms.forEach(f => f.classList.remove('active'));
        
        // Find and activate email tab
        const emailTab = document.querySelector('.auth-tab[data-tab="email"]');
        if (emailTab) {
            emailTab.classList.add('active');
        }
        
        // Show email form
        const emailForm = document.getElementById('email-login-form');
        if (emailForm) {
            emailForm.classList.add('active');
        }
        
        // Hide phone-related forms
        const phoneForm = document.getElementById('phone-login-form');
        const otpForm = document.getElementById('otp-verification-form');
        if (phoneForm) phoneForm.style.display = 'none';
        if (otpForm) otpForm.style.display = 'none';
        
        // Hide the phone tab
        const phoneTab = document.querySelector('.auth-tab[data-tab="phone"]');
        if (phoneTab) {
            phoneTab.style.display = 'none';
        }
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
        emailLoginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            
            // Simple validation
            if (!email || !validateEmail(email)) {
                showAlert('Please enter a valid email address');
                return;
            }
            
            if (!password) {
                showAlert('Please enter your password');
                return;
            }
            
            // Authenticate user
            const authenticated = authenticateUser(email, password);
            
            if (authenticated) {
                // Show a notification
                showNotification('Login successful! Redirecting...');
                
                // Redirect to home page after a short delay
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 1500);
            } else {
                showAlert('Invalid email or password');
            }
        });
    }
    
    // Logout functionality
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logoutUser();
            showNotification('You have been logged out');
            
            // Redirect to home page
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 1500);
        });
    }
    
    // Forgot password functionality
    const forgotPasswordLink = document.querySelector('.forgot-password');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value.trim();
            
            if (!email || !validateEmail(email)) {
                showAlert('Please enter your email address in the email field');
                return;
            }
            
            // In a real application, you would send a password reset email
            // For demo purposes, we'll just show a notification
            
            showNotification(`Password reset instructions sent to ${email}`);
        });
    }
});

// Function to validate email format
function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

// Function to authenticate user
function authenticateUser(email, password) {
    // Get users from localStorage
    const users = JSON.parse(localStorage.getItem('farmersWebUsers')) || [];
    
    // Find user with matching email
    const user = users.find(u => u.email === email);
    
    // If user not found or password doesn't match, return false
    if (!user || user.password !== hashPassword(password)) {
        return false;
    }
    
    // Set current user in localStorage (session)
    const sessionUser = {
        id: user.id || Date.now(),
        fullname: user.fullname,
        email: user.email,
        phone: user.phone,
        loggedInAt: new Date().toISOString()
    };
    
    localStorage.setItem('farmersWebCurrentUser', JSON.stringify(sessionUser));
    
    return true;
}

// Function to get current logged-in user
function getCurrentUser() {
    return JSON.parse(localStorage.getItem('farmersWebCurrentUser'));
}

// Function to update UI for logged-in user
function updateUIForLoggedInUser(user) {
    // Update login button to show user name
    const loginBtn = document.querySelector('.login-btn');
    if (loginBtn) {
        loginBtn.textContent = user.fullname.split(' ')[0]; // Show first name
        loginBtn.href = '#';
        
        // Create dropdown for user menu
        const dropdown = document.createElement('div');
        dropdown.className = 'user-dropdown';
        dropdown.innerHTML = `
            <ul>
                <li><a href="profile.html">My Profile</a></li>
                <li><a href="orders.html">My Orders</a></li>
                <li><a href="#" id="logout-btn">Logout</a></li>
            </ul>
        `;
        
        // Add dropdown to login button
        loginBtn.appendChild(dropdown);
        
        // Show dropdown on hover
        loginBtn.addEventListener('mouseenter', function() {
            dropdown.style.display = 'block';
        });
        
        loginBtn.addEventListener('mouseleave', function() {
            dropdown.style.display = 'none';
        });
    }
}

// Function to logout user
function logoutUser() {
    localStorage.removeItem('farmersWebCurrentUser');
}

// Function to hash password (for demo purposes only)
// In a real application, this would be done server-side
function hashPassword(password) {
    // This is NOT secure and is only for demonstration
    // In a real app, use a proper hashing algorithm on the server
    return btoa(password); // Base64 encoding (NOT secure for real use)
}

// Function to show alert
function showAlert(message) {
    alert(message);
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