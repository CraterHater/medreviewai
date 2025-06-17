// js/editor.js

document.addEventListener('DOMContentLoaded', () => {
    // Form Elements
    const form = document.getElementById('review-form');
    const titleInput = document.getElementById('review-title');
    const problemsInput = document.getElementById('problems');
    const medicationInput = document.getElementById('medication');
    const labDataInput = document.getElementById('lab-data');
    const vitalDataInput = document.getElementById('vital-data');
    const historyInput = document.getElementById('history');
    const messageDiv = document.getElementById('form-message');
    
    // Action Elements
    const performReviewBtn = document.getElementById('perform-review-btn');
    const viewResultsBtn = document.getElementById('view-results-btn');
    const loadingOverlay = document.getElementById('loading-overlay');
    
    // Confirmation Modal Elements
    const confirmModal = document.getElementById('confirm-modal');
    const confirmCloseBtn = document.getElementById('confirm-close-btn');
    const confirmCancelBtn = document.getElementById('confirm-cancel-btn');
    const confirmActionBtn = document.getElementById('confirm-action-btn');
    const mainOverlay = document.getElementById('modal-overlay');

    const params = new URLSearchParams(window.location.search);
    const reviewId = params.get('id');

    if (!reviewId) {
        alert('No review specified. Redirecting to dashboard.');
        window.location.href = '/dashboard.html';
        return;
    }

    const showMessage = (message, type) => {
        messageDiv.textContent = message;
        messageDiv.className = `form-message ${type}`;
        setTimeout(() => {
            messageDiv.className = 'form-message'; // Hide after 3 seconds
        }, 3000);
    };

    const loadReviewData = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/reviews/${reviewId}`, { credentials: 'include' });
            if (res.status === 401) return window.location.href = '/login.html';
            if (!res.ok) {
                throw new Error('Could not fetch review data. It may not exist.');
            }
            const review = await res.json();
            
            titleInput.value = review.title || '';
            problemsInput.value = review.problems || '';
            medicationInput.value = review.medication || '';
            labDataInput.value = review.labData || '';
            vitalDataInput.value = review.vitalData || '';
            historyInput.value = review.history || '';

            if (review.aiResponse) {
                viewResultsBtn.style.display = 'inline-block';
                viewResultsBtn.href = `/results.html?id=${review.id}`;
            }

        } catch (error) {
            alert(error.message);
            window.location.href = '/dashboard.html';
        }
    };

    const saveChanges = async (suppressMessage = false) => {
        const reviewData = {
            title: titleInput.value,
            problems: problemsInput.value,
            medication: medicationInput.value,
            labData: labDataInput.value,
            vitalData: vitalDataInput.value,
            history: historyInput.value,
        };

        try {
            const res = await fetch(`${API_BASE_URL}/api/reviews/${reviewId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reviewData),
                credentials: 'include'
            });
            if (!res.ok) {
                throw new Error('Failed to save changes.');
            }
            if (!suppressMessage) {
                showMessage('Changes saved successfully!', 'success');
            }
            return true;
        } catch (error) {
            showMessage(error.message, 'error');
            return false;
        }
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveChanges();
    });

    performReviewBtn.addEventListener('click', () => {
        confirmModal.classList.add('show');
        mainOverlay.classList.add('show');
    });

    const closeConfirmModal = () => {
        confirmModal.classList.remove('show');
        mainOverlay.classList.remove('show');
    };

    if (confirmCloseBtn) confirmCloseBtn.addEventListener('click', closeConfirmModal);
    if (confirmCancelBtn) confirmCancelBtn.addEventListener('click', closeConfirmModal);

    if (confirmActionBtn) {
        confirmActionBtn.addEventListener('click', () => {
            closeConfirmModal();
            loadingOverlay.classList.add('show');
            setTimeout(async () => {
                try {
                    const saveSuccessful = await saveChanges(true);
                    if (!saveSuccessful) {
                        throw new Error("Could not save changes. Aborting AI review.");
                    }

                    const res = await fetch(`${API_BASE_URL}/api/reviews/${reviewId}/perform-review`, { method: 'POST', credentials: 'include' });
                    const data = await res.json();
                    
                    if (!res.ok) {
                        throw new Error(data.message || 'Failed to perform review.');
                    }
                    
                    window.location.href = `/results.html?id=${data.reviewId}`;

                } catch (error) {
                    loadingOverlay.classList.remove('show');
                    alert(`Error: ${error.message}`);
                }
            }, 50);
        });
    }
    
    loadReviewData();
});