// js/results.js

const API_BASE_URL = 'https://medreviewai.onrender.com';

import { renderAllResults, renderSummary, renderScore, renderInteractionMatrix } from './modules/resultsRenderer.js';
import { openMrpModal, openInterventionModal, closeModal } from './modules/modalManager.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. DOM Element Setup ---
    const elements = {
        grids: {
            mrpGrid: document.getElementById('mrp-grid'),
            interventionsGrid: document.getElementById('interventions-grid'),
            archivedMrpGrid: document.getElementById('archived-mrp-grid'),
            archivedInterventionsGrid: document.getElementById('archived-interventions-grid'),
            summaryGrid: document.getElementById('patient-summary-grid'),
            mrpCountSpan: document.getElementById('mrp-count'),
        },
        score: {
            scoreText: document.getElementById('score-text'),
            scoreCircle: document.getElementById('score-circle'),
            scoreRationale: document.getElementById('score-rationale'),
        },
        interactions: {
            container: document.getElementById('interaction-container'),
        },
        letter: {
            actionsContainer: document.getElementById('letter-actions-container'),
        },
        modals: {
            mrp: {
                modal: document.getElementById('mrp-detail-modal'),
                title: document.getElementById('modal-mrp-title'),
                assessment: document.getElementById('modal-mrp-assessment'),
                advice: document.getElementById('modal-mrp-advice'),
                closeBtn: document.getElementById('mrp-modal-close-btn'),
            },
            intervention: {
                modal: document.getElementById('intervention-detail-modal'),
                title: document.getElementById('modal-intervention-title'),
                explanation: document.getElementById('modal-intervention-explanation'),
                closeBtn: document.getElementById('intervention-modal-close-btn'),
            },
            addressee: {
                modal: document.getElementById('addressee-modal'),
                closeBtn: document.getElementById('addressee-close-btn'),
                cancelBtn: document.getElementById('addressee-cancel-btn'),
                generateBtn: document.getElementById('addressee-generate-btn'),
                nameInput: document.getElementById('addressee-name'),
                langSelect: document.getElementById('letter-language'),
            }
        },
        mainOverlay: document.getElementById('modal-overlay'),
        loadingOverlay: document.getElementById('loading-overlay'),
        resultsTitle: document.getElementById('results-title'),
        backToEditorBtn: document.getElementById('back-to-editor-btn'),
    };

    // --- 2. State Management ---
    const params = new URLSearchParams(window.location.search);
    const reviewId = params.get('id');
    let currentReviewData = {};
    let dismissedItems = { mrp: [], interventions: [] };

    if (!reviewId) {
        alert('No review ID found.');
        window.location.href = '/dashboard.html';
        return;
    }
    elements.backToEditorBtn.href = `/review-editor.html?id=${reviewId}`;
    
    // --- 3. Data Fetching and API Calls ---
    const loadReviewData = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/reviews/${reviewId}`);
            if (!res.ok) throw new Error('Failed to fetch review data.');
            currentReviewData = await res.json();
            
            if (currentReviewData.aiResponse && typeof currentReviewData.aiResponse === 'object') {
                elements.resultsTitle.textContent = `Analysis for: ${currentReviewData.title}`;
                dismissedItems = currentReviewData.dismissedItems || { mrp: [], interventions: [] };
                
                renderSummary(currentReviewData.aiResponse.patient_summary, elements.grids.summaryGrid);
                renderScore(currentReviewData.aiResponse.medication_score, elements.score);
                renderAllResults(currentReviewData, dismissedItems, elements.grids);

                if (currentReviewData.formalLetter) {
                    elements.letter.actionsContainer.innerHTML = `<a href="/letter-editor.html?id=${currentReviewData.id}" class="cta-button">View/Edit Letter</a>`;
                } else {
                    elements.letter.actionsContainer.innerHTML = `<button id="generate-letter-btn" class="cta-button">Generate Formal Letter</button>`;
                    document.getElementById('generate-letter-btn').addEventListener('click', openAddresseeModal);
                }

                if (currentReviewData.interactions) {
                    renderInteractionMatrix(currentReviewData.interactions, elements.interactions.container);
                } else {
                    elements.interactions.container.innerHTML = `<button id="generate-interactions-btn" class="cta-button">Check for Interactions</button>`;
                    document.getElementById('generate-interactions-btn').addEventListener('click', generateInteractions);
                }

            } else {
                alert('AI analysis must be run before viewing results. Redirecting to editor.');
                window.location.href = `/review-editor.html?id=${reviewId}`;
            }
        } catch (error) {
            console.error('Error loading results:', error);
            alert(error.message);
        }
    };
    
    const handleDismissClick = async (card) => {
        const itemData = JSON.parse(card.dataset.itemData);
        const itemType = card.dataset.itemType;
        try {
            const res = await fetch(`${API_BASE_URL}/api/reviews/${reviewId}/dismiss`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemId: itemData.id, itemType: itemType }),
            });
            if (!res.ok) throw new Error('Failed to update item status.');
            dismissedItems = await res.json();
            renderAllResults(currentReviewData, dismissedItems, elements.grids);
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    };

    const generateInteractions = async () => {
        elements.loadingOverlay.classList.add('show');
        try {
            const res = await fetch(`${API_BASE_URL}/api/reviews/${reviewId}/generate-interactions`, { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            currentReviewData.interactions = data;
            renderInteractionMatrix(data, elements.interactions.container);
        } catch (error) {
            alert(`Error generating interactions: ${error.message}`);
        } finally {
            elements.loadingOverlay.classList.remove('show');
        }
    };

    // --- 4. Modal Management & Event Listeners ---
    const openAddresseeModal = () => {
        elements.modals.addressee.modal.classList.add('show');
        elements.mainOverlay.classList.add('show');
    };
    const closeAllModals = () => closeModal({
        mrpModal: elements.modals.mrp.modal,
        interventionModal: elements.modals.intervention.modal,
        addresseeModal: elements.modals.addressee.modal,
        overlay: elements.mainOverlay
    });
    
    document.querySelector('.app-workspace').addEventListener('click', (e) => {
        const dismissBtn = e.target.closest('.dismiss-btn');
        const cardContent = e.target.closest('.card-content-wrapper');
        if (dismissBtn) {
            handleDismissClick(dismissBtn.parentElement);
        } else if (cardContent) {
            const card = cardContent.parentElement;
            if (card.dataset.itemType === 'mrp') {
                openMrpModal(JSON.parse(card.dataset.itemData), { ...elements.modals.mrp, overlay: elements.mainOverlay });
            } else if (card.dataset.itemType === 'intervention') {
                openInterventionModal(JSON.parse(card.dataset.itemData), { ...elements.modals.intervention, overlay: elements.mainOverlay });
            }
        }
    });

    elements.modals.mrp.closeBtn.addEventListener('click', closeAllModals);
    elements.modals.intervention.closeBtn.addEventListener('click', closeAllModals);
    elements.modals.addressee.closeBtn.addEventListener('click', closeAllModals);
    elements.modals.addressee.cancelBtn.addEventListener('click', closeAllModals);
    elements.mainOverlay.addEventListener('click', closeAllModals);

    elements.modals.addressee.generateBtn.addEventListener('click', async () => {
        const addressee = elements.modals.addressee.nameInput.value.trim();
        const language = elements.modals.addressee.langSelect.value;
        if (!addressee) {
            alert('Please enter a recipient.');
            return;
        }
        closeAllModals();
        elements.loadingOverlay.classList.add('show');
        try {
            const res = await fetch(`${API_BASE_URL}/api/reviews/${reviewId}/generate-letter`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ addressee, language }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            window.location.href = `/letter-editor.html?id=${reviewId}`;
        } catch (error) {
            elements.loadingOverlay.classList.remove('show');
            alert(`Error: ${error.message}`);
        }
    });

    // --- 5. Initial Load ---
    loadReviewData();
});