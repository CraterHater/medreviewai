// js/modules/modalManager.js

/**
 * Opens the MRP detail modal and populates it with data.
 * @param {object} mrpData - The data object for the specific MRP.
 * @param {object} elements - An object containing the modal's DOM elements.
 */
export function openMrpModal(mrpData, { modal, overlay, title, assessment, advice }) {
    title.textContent = mrpData.problem_summary;
    assessment.textContent = mrpData.detailed_assessment;
    advice.textContent = mrpData.advice;
    modal.classList.add('show');
    overlay.classList.add('show');
}

/**
 * Opens the Intervention detail modal and populates it.
 * @param {object} interventionData - The data object for the specific intervention.
 * @param {object} elements - An object containing the modal's DOM elements.
 */
export function openInterventionModal(interventionData, { modal, overlay, title, explanation }) {
    title.textContent = interventionData.intervention_summary;
    explanation.textContent = interventionData.detailed_explanation;
    modal.classList.add('show');
    overlay.classList.add('show');
}

/**
 * Closes all visible detail modals on the results page.
 * @param {object} elements - An object containing all modal DOM elements.
 */
export function closeModal({ mrpModal, interventionModal, overlay }) {
    mrpModal.classList.remove('show');
    interventionModal.classList.remove('show');
    overlay.classList.remove('show');
}