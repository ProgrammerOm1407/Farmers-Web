// Authentication functionality for Farmers Web

document.addEventListener('DOMContentLoaded', function() {
    // Tab switching functionality
    const authTabs = document.querySelectorAll('.auth-tab');
    const authForms = document.querySelectorAll('.auth-form');
    
    if (authTabs.length > 0) {
        authTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                // Remove active class from all tabs and forms
                authTabs.forEach(t => t.classList.remove('active'));
                authForms.forEach(f => f.classList.remove('active'));
                
                // Add active class to clicked tab
                this.classList.add('active');
                
                // Show corresponding form
                const tabName = this.getAttribute('data-tab');
                
                if (tabName === 'phone') {
                    document.getElementById('phone-login-form').classList.add('active');
                } else if (tabName === 'email') {
                    document.getElementById('email-login-form').classList.add('active');
                }
            });
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
    
    // Phone login form submission
    const phoneLoginForm = document.getElementById('phone-login-form');
    const otpVerificationForm = document.getElementById('otp-verification-form');
    
    if (phoneLoginForm) {
        phoneLoginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const phoneNumber = document.getElementById('phone').value;
            
            if (phoneNumber.length !== 10 || !/^\d+$/.test(phoneNumber)) {
                showAlert('Please enter a valid 10-digit mobile number');
                return;
            }
            
            // In a real application, you would send an API request to send OTP
            // For demo purposes, we'll just show the OTP verification form
            
            // Hide phone login form and show OTP verification form
            phoneLoginForm.classList.remove('active');
            otpVerificationForm.classList.add('active');
            
            // Start OTP timer
            startOtpTimer();
            
            // Auto-focus first OTP input
            const otpInputs = document.querySelectorAll('.otp-inputs input');
            if (otpInputs.length > 0) {
                otpInputs[0].focus();
            }
            
            // Show a notification
            showNotification(`OTP sent to +91 ${phoneNumber}`);
        });
    }
    
    // OTP input functionality
    const otpInputs = document.querySelectorAll('.otp-inputs input');
    
    if (otpInputs.length > 0) {
        // Auto-tab between OTP inputs
        otpInputs.forEach((input, index) => {
            input.addEventListener('keyup', function(e) {
                // If input has a value, move to next input
                if (this.value.length === 1 && index < otpInputs.length - 1) {
                    otpInputs[index + 1].focus();
                }
                
                // If backspace is pressed and input is empty, move to previous input
                if (e.key === 'Backspace' && this.value.length === 0 && index > 0) {
                    otpInputs[index - 1].focus();
                }
            });
            
            // Prevent non-numeric input
            input.addEventListener('input', function() {
                this.value = this.value.replace(/[^0-9]/g, '');
            });
        });
    }
    
    // OTP verification form submission
    if (otpVerificationForm) {
        otpVerificationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get OTP from inputs
            let otp = '';
            otpInputs.forEach(input => {
                otp += input.value;
            });
            
            if (otp.length !== 6) {
                showAlert('Please enter a valid 6-digit OTP');
                return;
            }
            
            // In a real application, you would send an API request to verify OTP
            // For demo purposes, we'll just redirect to the home page
            
            // Show a notification
            showNotification('Login successful! Redirecting...');
            
            // Redirect to home page after a short delay
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 1500);
        });
    }
    
    // Resend OTP button
    const resendOtpBtn = document.getElementById('resend-otp');
    
    if (resendOtpBtn) {
        resendOtpBtn.addEventListener('click', function() {
            if (!this.disabled) {
                // In a real application, you would send an API request to resend OTP
                
                // Reset OTP inputs
                otpInputs.forEach(input => {
                    input.value = '';
                });
                
                // Focus first input
                otpInputs[0].focus();
                
                // Restart timer
                startOtpTimer();
                
                // Show a notification
                showNotification('OTP resent successfully');
            }
        });
    }
    
    // Email login form submission
    const emailLoginForm = document.getElementById('email-login-form');
    
    if (emailLoginForm) {
        emailLoginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            // In a real application, you would send an API request to verify credentials
            // For demo purposes, we'll just redirect to the home page
            
            // Show a notification
            showNotification('Login successful! Redirecting...');
            
            // Redirect to home page after a short delay
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 1500);
        });
    }
});

// Function to start OTP timer
function startOtpTimer() {
    const timerElement = document.getElementById('timer');
    const resendOtpBtn = document.getElementById('resend-otp');
    
    if (!timerElement || !resendOtpBtn) return;
    
    // Disable resend button
    resendOtpBtn.disabled = true;
    
    // Set timer for 60 seconds
    let seconds = 60;
    
    // Update timer every second
    const timerInterval = setInterval(() => {
        seconds--;
        
        // Format time as MM:SS
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        
        // If timer reaches 0, enable resend button and clear interval
        if (seconds <= 0) {
            clearInterval(timerInterval);
            resendOtpBtn.disabled = false;
        }
    }, 1000);
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