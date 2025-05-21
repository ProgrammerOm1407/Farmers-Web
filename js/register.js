// Registration functionality for Farmers Web

document.addEventListener('DOMContentLoaded', function() {
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
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const fullname = document.getElementById('fullname').value.trim();
            const email = document.getElementById('email').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const termsChecked = document.getElementById('terms').checked;
            
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
            
            if (!password || password.length < 8) {
                showAlert('Password must be at least 8 characters long');
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
            
            // Create user object
            const user = {
                fullname,
                email,
                phone: phone || null,
                password: hashPassword(password), // In a real app, this would be done server-side
                createdAt: new Date().toISOString()
            };
            
            // Save user to localStorage (in a real app, this would be sent to a server)
            saveUser(user);
            
            // Show success notification
            showNotification('Account created successfully! Redirecting to login...');
            
            // Redirect to login page after a short delay
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
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

// Function to hash password (for demo purposes only)
// In a real application, this would be done server-side
function hashPassword(password) {
    // This is NOT secure and is only for demonstration
    // In a real app, use a proper hashing algorithm on the server
    return btoa(password); // Base64 encoding (NOT secure for real use)
}

// Function to save user to localStorage
function saveUser(user) {
    // Get existing users or initialize empty array
    let users = JSON.parse(localStorage.getItem('farmersWebUsers')) || [];
    
    // Check if email already exists
    const emailExists = users.some(u => u.email === user.email);
    if (emailExists) {
        showAlert('An account with this email already exists');
        return false;
    }
    
    // Add new user
    users.push(user);
    
    // Save back to localStorage
    localStorage.setItem('farmersWebUsers', JSON.stringify(users));
    
    return true;
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