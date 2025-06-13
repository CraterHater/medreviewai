// js/auth.js

document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.querySelector('#signup-form');
    const messageDiv = document.querySelector('#form-message');

    const showMessage = (message, type) => {
        if (messageDiv) {
            messageDiv.textContent = message;
            messageDiv.className = `form-message ${type}`;
        }
    };

    // --- SIGNUP LOGIC ---
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showMessage('', ''); // Reset message
            
            const email = signupForm.email.value;
            const password = signupForm.password.value;
            const passwordConfirm = signupForm.passwordConfirm.value;

            if (password !== passwordConfirm) {
                return showMessage('Passwords do not match.', 'error');
            }

            try {
                const res = await fetch('/api/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, passwordConfirm }),
                });

                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.message || 'Something went wrong');
                }
                // Show a success message and don't redirect
                showMessage(data.message, 'success');
                signupForm.reset();

            } catch (err) {
                showMessage(err.message, 'error');
            }
        });
    }

    // --- LOGIN LOGIC ---
    const loginForm = document.getElementById('login-form');
    const resendSection = document.getElementById('resend-verification-section');
    const resendMessage = document.getElementById('resend-message');
    const resendBtn = document.getElementById('resend-btn');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginForm.email.value;
            const password = loginForm.password.value;
            
            // Hide resend section on new attempt
            resendSection.style.display = 'none';
            showMessage('', ''); // Clear any previous messages

            try {
                const res = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });

                const data = await res.json();
                
                if (res.status === 403 && data.unverified) {
                    // Handle unverified user case specifically
                    resendMessage.textContent = data.message;
                    resendMessage.className = 'form-message error';
                    resendSection.style.display = 'block';
                } else if (!res.ok) {
                    // Handle all other errors
                    throw new Error(data.message || 'Failed to login');
                } else {
                    // Successful login
                    window.location.href = '/dashboard';
                }
            } catch (err) {
                showMessage(err.message, 'error');
            }
        });
    }

    if (resendBtn) {
        resendBtn.addEventListener('click', async () => {
            const email = loginForm.email.value;
            if (!email) {
                resendMessage.textContent = "Please enter your email in the field above before resending.";
                return;
            }

            const originalBtnText = resendBtn.textContent;
            resendBtn.textContent = 'Sending...';
            resendBtn.disabled = true;

            try {
                const res = await fetch('/api/resend-verification', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email }),
                });
                const data = await res.json();
                resendMessage.textContent = data.message;
                // Change message type to success on successful send
                resendMessage.className = 'form-message success';
            } catch (error) {
                resendMessage.textContent = 'An error occurred. Please try again.';
                resendMessage.className = 'form-message error';
            } finally {
                resendBtn.textContent = originalBtnText;
                resendBtn.disabled = false;
            }
        });
    }
});