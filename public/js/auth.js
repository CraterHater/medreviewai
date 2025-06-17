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
                const res = await fetch(`${API_BASE_URL}/api/signup`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, passwordConfirm }),
                });

                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.message || 'Something went wrong');
                }
                
                // --- THE FIX: Redirect to dashboard on successful signup ---
                window.location.href = '/dashboard.html';

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
            
            resendSection.style.display = 'none';
            showMessage('', '');

            try {
                const res = await fetch(`${API_BASE_URL}/api/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });

                const data = await res.json();
                
                if (res.status === 403 && data.unverified) {
                    resendMessage.textContent = data.message;
                    resendMessage.className = 'form-message error';
                    resendSection.style.display = 'block';
                } else if (!res.ok) {
                    throw new Error(data.message || 'Failed to login');
                } else {
                    // Successful login
                    window.location.href = '/dashboard.html';
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
                const res = await fetch(`${API_BASE_URL}/api/resend-verification`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email }),
                });
                const data = await res.json();
                resendMessage.textContent = data.message;
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