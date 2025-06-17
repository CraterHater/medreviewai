// js/ui.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Account Modal Elements & Logic ---
    const accountBtn = document.getElementById('account-btn');
    const accountModal = document.getElementById('account-modal');
    const accountModalCloseBtn = document.getElementById('modal-close-btn');
    const accountForm = document.getElementById('account-form');
    const apiKeyInput = document.getElementById('openai-key');
    const testKeyBtn = document.getElementById('test-key-btn');
    const accountMessageDiv = document.getElementById('account-message');
    
    // --- Logout Modal Elements & Logic ---
    const logoutBtn = document.getElementById('logout-btn');
    const logoutModal = document.getElementById('logout-confirm-modal');
    const logoutCancelBtn = document.getElementById('logout-cancel-btn');
    
    // Shared Overlay
    const mainOverlay = document.getElementById('modal-overlay');

    const showAccountMessage = (message, type) => {
        if (accountMessageDiv) {
            accountMessageDiv.textContent = message;
            accountMessageDiv.className = `form-message ${type}`;
        }
    };

    const openAccountModal = async () => {
        if (accountMessageDiv) accountMessageDiv.className = 'form-message'; 
        
        try {
            // --- THE FIX: Add `credentials: 'include'` ---
            const res = await fetch(`${API_BASE_URL}/api/account`, { credentials: 'include' });
            if (!res.ok) throw new Error('Could not get account details.');
            const data = await res.json();
            if (data.openaiKey) {
                apiKeyInput.value = data.openaiKey;
            } else {
                apiKeyInput.value = '';
            }
        } catch (error) {
            console.error('Could not fetch account details:', error);
            showAccountMessage(error.message, 'error');
        }

        if(accountModal) accountModal.classList.add('show');
        if(mainOverlay) mainOverlay.classList.add('show');
    };

    const closeAccountModal = () => {
        if (accountModal) accountModal.classList.remove('show');
        if (mainOverlay) mainOverlay.classList.remove('show');
    };

    const openLogoutModal = () => {
        if(logoutModal) logoutModal.classList.add('show');
        if(mainOverlay) mainOverlay.classList.add('show');
    };

    const closeLogoutModal = () => {
        if(logoutModal) logoutModal.classList.remove('show');
        if(mainOverlay) mainOverlay.classList.remove('show');
    };

    if (accountBtn) {
        accountBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openAccountModal();
        });
    }

    if (accountModalCloseBtn) {
        accountModalCloseBtn.addEventListener('click', closeAccountModal);
    }

    if(logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openLogoutModal();
        });
    }

    if(logoutCancelBtn) {
        logoutCancelBtn.addEventListener('click', closeLogoutModal);
    }
    
    if (mainOverlay) {
        mainOverlay.addEventListener('click', () => {
            document.querySelectorAll('.modal.show').forEach(m => {
                m.classList.remove('show');
            });
            mainOverlay.classList.remove('show');
        });
    }

    if (accountForm) {
        accountForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const openaiKey = apiKeyInput.value.trim();

            try {
                // --- THE FIX: Add `credentials: 'include'` ---
                const res = await fetch(`${API_BASE_URL}/api/account`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ openaiKey }),
                    credentials: 'include'
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Failed to save key.');
                showAccountMessage('API Key saved successfully!', 'success');
            } catch (error) {
                showAccountMessage(error.message, 'error');
            }
        });
    }

    if (testKeyBtn) {
        testKeyBtn.addEventListener('click', async () => {
            const apiKey = apiKeyInput.value.trim();
            if (!apiKey) {
                showAccountMessage('Please enter an API key to test.', 'error');
                return;
            }

            const originalBtnText = testKeyBtn.textContent;
            testKeyBtn.textContent = 'Testing...';
            testKeyBtn.disabled = true;

            try {
                 // --- THE FIX: Add `credentials: 'include'` ---
                const res = await fetch(`${API_BASE_URL}/api/account/test-key`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ apiKey }),
                    credentials: 'include'
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Test failed.');
                showAccountMessage(data.message, 'success');
            } catch (error) {
                showAccountMessage(error.message, 'error');
            } finally {
                testKeyBtn.textContent = originalBtnText;
                testKeyBtn.disabled = false;
            }
        });
    }
});