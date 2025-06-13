// js/letter-editor.js

const { jsPDF } = window.jspdf;

document.addEventListener('DOMContentLoaded', () => {
    // Main elements
    const letterContentDiv = document.getElementById('letter-content');
    const saveBtn = document.getElementById('save-letter-btn');
    const downloadPdfBtn = document.getElementById('download-pdf-btn');
    const regenerateBtn = document.getElementById('regenerate-btn');
    const backToResultsBtn = document.getElementById('back-to-results-btn');
    const saveStatus = document.getElementById('save-status');
    
    // Modals and Overlays
    const addresseeModal = document.getElementById('addressee-modal');
    const addresseeCloseBtn = document.getElementById('addressee-close-btn');
    const addresseeCancelBtn = document.getElementById('addressee-cancel-btn');
    const addresseeGenerateBtn = document.getElementById('addressee-generate-btn');
    const addresseeNameInput = document.getElementById('addressee-name');
    const letterLanguageSelect = document.getElementById('letter-language');
    const loadingOverlay = document.getElementById('loading-overlay');
    const mainOverlay = document.getElementById('modal-overlay');

    const params = new URLSearchParams(window.location.search);
    const reviewId = params.get('id');
    let reviewTitle = 'Medication Review';

    if (!reviewId) {
        alert('No review ID specified.');
        window.location.href = '/dashboard';
        return;
    }
    
    backToResultsBtn.href = `/results.html?id=${reviewId}`;

    const showStatus = (message, type) => {
        saveStatus.textContent = message;
        saveStatus.className = `form-message ${type}`;
        setTimeout(() => saveStatus.className = 'form-message', 3000);
    };

    const loadLetter = async () => {
        try {
            const res = await fetch(`/api/reviews/${reviewId}`);
            if (!res.ok) throw new Error('Could not fetch review data.');
            const review = await res.json();
            reviewTitle = review.title;
            
            if (review.formalLetter) {
                letterContentDiv.innerHTML = review.formalLetter.replace(/\n/g, '<br>');
            } else {
                letterContentDiv.innerHTML = '<p>No letter has been generated for this review yet. Please go back to the results page to generate one.</p>';
                letterContentDiv.contentEditable = false;
            }
        } catch (error) {
            alert(error.message);
        }
    };

    const saveLetter = async () => {
        const letterHtml = letterContentDiv.innerHTML;
        const letterTextForStorage = letterHtml.replace(/<br\s*[\/]?>/gi, "\n").replace(/<p>/gi, "").replace(/<\/p>/gi, "\n");
        try {
            const res = await fetch(`/api/reviews/${reviewId}/letter`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ letterContent: letterTextForStorage }),
            });
            if (!res.ok) throw new Error('Failed to save letter.');
            showStatus('Changes saved!', 'success');
        } catch (error) {
            showStatus(error.message, 'error');
        }
    };

    const handleRegenerate = async () => {
        const addressee = addresseeNameInput.value.trim();
        const language = letterLanguageSelect.value;
        if (!addressee) {
            alert('Please enter a recipient.');
            return;
        }
        
        closeAddresseeModal();
        loadingOverlay.classList.add('show');
        
        try {
            const res = await fetch(`/api/reviews/${reviewId}/generate-letter`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ addressee, language }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            // Instead of redirecting, just reload the new letter content
            loadLetter(); 
        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            loadingOverlay.classList.remove('show');
        }
    };

    const openAddresseeModal = () => {
        addresseeModal.classList.add('show');
        mainOverlay.classList.add('show');
    };
    const closeAddresseeModal = () => {
        addresseeModal.classList.remove('show');
        mainOverlay.classList.remove('show');
    };

    // --- Event Listeners ---
    saveBtn.addEventListener('click', saveLetter);
    regenerateBtn.addEventListener('click', openAddresseeModal);
    addresseeGenerateBtn.addEventListener('click', handleRegenerate);
    addresseeCloseBtn.addEventListener('click', closeAddresseeModal);
    addresseeCancelBtn.addEventListener('click', closeAddresseeModal);

    downloadPdfBtn.addEventListener('click', () => {
        const doc = new jsPDF();
        const text = letterContentDiv.innerText;
        const splitText = doc.splitTextToSize(text, 180);
        doc.text(splitText, 15, 20);
        doc.save(`${reviewTitle.replace(/ /g, '_')}_Letter.pdf`);
    });

    // Initial Load
    loadLetter();
});