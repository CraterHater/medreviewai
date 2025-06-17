// js/dashboard.js

document.addEventListener('DOMContentLoaded', () => {
    // Main elements
    const reviewsGrid = document.getElementById('reviews-grid');
    const noReviewsMessage = document.getElementById('no-reviews-message');
    const createReviewBtn = document.getElementById('create-review-btn');
    
    // Delete Modal Elements
    const deleteModal = document.getElementById('delete-confirm-modal');
    const deleteConfirmBtn = document.getElementById('delete-confirm-btn');
    const deleteCancelBtn1 = document.getElementById('delete-cancel-btn');
    const deleteCancelBtn2 = document.getElementById('delete-cancel-btn-2');
    const mainOverlay = document.getElementById('modal-overlay');

    let reviewIdToDelete = null;

    const createReviewCard = (review) => {
        // ... (this function does not need changes)
        const card = document.createElement('div');
        card.className = 'review-card';
        card.dataset.review = JSON.stringify(review); 

        const cardMain = document.createElement('div');
        cardMain.className = 'review-card-main';

        const title = document.createElement('h3');
        title.className = 'review-card-title';
        title.textContent = review.title;

        const miniGauge = document.createElement('div');
        miniGauge.className = 'mini-score-gauge';
        
        const scoreText = document.createElement('div');
        scoreText.className = 'mini-score-text';

        if (review.aiResponse && review.aiResponse.medication_score) {
            const score = review.aiResponse.medication_score.score;
            const mrpCount = review.aiResponse.medication_score.mrp_count;

            scoreText.innerHTML = `<strong>${mrpCount ?? '?'}</strong>`;
            miniGauge.title = `Score: ${score}%, MRPs: ${mrpCount ?? 'N/A'}`;

            const svgNS = "http://www.w3.org/2000/svg";
            const svg = document.createElementNS(svgNS, 'svg');
            svg.setAttribute('viewBox', '0 0 36 36');
            svg.classList.add('score-svg');
            
            const bgCircle = document.createElementNS(svgNS, 'path');
            bgCircle.setAttribute('class', 'score-circle-bg');
            bgCircle.setAttribute('d', 'M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831');
            
            const scoreCircle = document.createElementNS(svgNS, 'path');
            scoreCircle.setAttribute('class', 'score-circle');
            const circumference = 2 * Math.PI * 15.9155;
            const offset = circumference - (score / 100) * circumference;
            scoreCircle.setAttribute('stroke-dasharray', `${circumference - offset}, ${circumference}`);
            
            if (score < 40) scoreCircle.style.stroke = 'var(--severity-red)';
            else if (score < 70) scoreCircle.style.stroke = 'var(--severity-orange)';
            else scoreCircle.style.stroke = 'var(--severity-green)';

            scoreCircle.setAttribute('d', 'M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831');
            
            svg.appendChild(bgCircle);
            svg.appendChild(scoreCircle);
            miniGauge.appendChild(svg);
        } else {
            scoreText.textContent = '-';
            scoreText.classList.add('no-score');
        }
        miniGauge.appendChild(scoreText);

        cardMain.appendChild(title);
        cardMain.appendChild(miniGauge);

        const footer = document.createElement('div');
        footer.className = 'review-card-footer';
        const date = document.createElement('span');
        date.textContent = `Created: ${new Date(review.createdAt).toLocaleString()}`;
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '×';
        deleteBtn.dataset.id = review.id;
        footer.appendChild(date);
        footer.appendChild(deleteBtn);

        card.appendChild(cardMain);
        card.appendChild(footer);
        return card;
    };

    const loadReviews = async () => {
        try {
            // --- THE FIX: Add `credentials: 'include'` ---
            const res = await fetch(`${API_BASE_URL}/api/reviews`, { credentials: 'include' });
            if (res.status === 401 || res.status === 403) {
                window.location.href = '/login.html'; // Redirect if not authenticated
                return;
            }
            if (!res.ok) throw new Error('Failed to fetch reviews.');
            
            const reviews = await res.json();
            reviewsGrid.innerHTML = ''; 
            if (reviews.length === 0) {
                noReviewsMessage.style.display = 'block';
            } else {
                noReviewsMessage.style.display = 'none';
                reviews.forEach(review => {
                    const card = createReviewCard(review);
                    reviewsGrid.appendChild(card);
                });
            }
        } catch (error) {
            console.error('Error loading reviews:', error);
            reviewsGrid.innerHTML = '<p>Error loading reviews. Please try again later.</p>';
        }
    };

    createReviewBtn.addEventListener('click', async () => {
        try {
            // --- THE FIX: Add `credentials: 'include'` ---
            const res = await fetch(`${API_BASE_URL}/api/reviews`, { method: 'POST', credentials: 'include' });
            if (!res.ok) throw new Error('Failed to create review.');
            const newReview = await res.json();
            window.location.href = `/review-editor.html?id=${newReview.id}`;
        } catch (error) {
            console.error('Error creating review:', error);
            alert('Could not create a new review. Please try again.');
        }
    });

    const openDeleteModal = (reviewId) => {
        reviewIdToDelete = reviewId;
        deleteModal.classList.add('show');
        mainOverlay.classList.add('show');
    };

    const closeDeleteModal = () => {
        reviewIdToDelete = null;
        deleteModal.classList.remove('show');
        mainOverlay.classList.remove('show');
    };

    reviewsGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.review-card');
        if (!card) return;

        const review = JSON.parse(card.dataset.review);
        
        if (e.target.matches('.delete-btn')) {
            e.stopPropagation();
            openDeleteModal(review.id);
        } 
        else {
            if (review.aiResponse) {
                window.location.href = `/results.html?id=${review.id}`;
            } else {
                window.location.href = `/review-editor.html?id=${review.id}`;
            }
        }
    });

    deleteConfirmBtn.addEventListener('click', async () => {
        if (!reviewIdToDelete) return;
        try {
            // --- THE FIX: Add `credentials: 'include'` ---
            const res = await fetch(`${API_BASE_URL}/api/reviews/${reviewIdToDelete}`, { method: 'DELETE', credentials: 'include' });
            if (!res.ok) throw new Error('Failed to delete the review.');
            
            document.querySelector(`[data-review*='"id":${reviewIdToDelete}']`).remove();
            
            if (reviewsGrid.children.length === 0) {
                noReviewsMessage.style.display = 'block';
            }
        } catch (error) {
            console.error('Error deleting review:', error);
            alert('Could not delete the review. Please try again.');
        } finally {
            closeDeleteModal();
        }
    });

    deleteCancelBtn1.addEventListener('click', closeDeleteModal);
    deleteCancelBtn2.addEventListener('click', closeDeleteModal);

    loadReviews();
});